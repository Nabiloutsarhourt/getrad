// Cloud Function : Déclenchée à la création d'une mission (API v2)
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.onMissionCreated = onDocumentCreated('missions/{missionId}', async (event) => {
  const snap = event.data;
  const mission = snap.data();
  const missionId = event.params.missionId;

  if (mission.status !== 'searching') return;

  try {
    // 1. Récupérer tous les prestataires avec abonnement actif
    const interpretersSnap = await db.collection('interpreters')
      .where('searchPriority', '>', 0)
      .get();

    const allInterpreters = [];
    interpretersSnap.forEach(doc => allInterpreters.push({ id: doc.id, ...doc.data() }));

    // 1b. Lire les abonnements en lot (chunks de 100)
    const subMap = {};
    const subRefs = allInterpreters.map(i => db.collection('subscriptions').doc(i.id));
    for (let i = 0; i < subRefs.length; i += 100) {
      const chunk = subRefs.slice(i, i + 100);
      const docs = await db.getAll(...chunk);
      docs.forEach(d => { if (d.exists) subMap[d.id] = d.data(); });
    }

    // 2. Filtrer par critères + quota + disponibilité
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // Convertit JS (0=dim) → (0=lun)
    const currentHour = now.getHours();

    const eligible = allInterpreters.filter(interp => {
      // ── Quota d'abonnement ──────────────────────────────────────────────
      const sub = subMap[interp.id];
      if (sub) {
        const limit = sub.missionsLimit ?? 0;
        if (limit !== -1 && (sub.missionsViewed || 0) >= limit) return false;
      }

      // ── Disponibilité ───────────────────────────────────────────────────
      const avail = interp.availability;
      if (avail) {
        // Statut général : busy/vacation → exclu
        if (avail.status === 'busy' || avail.status === 'vacation') return false;

        // Jours disponibles (si définis)
        if (avail.weekdays?.length > 0 && !avail.weekdays.includes(currentDay)) return false;

        // Horaires (si définis)
        if (avail.startHour != null && avail.endHour != null) {
          if (currentHour < avail.startHour || currentHour >= avail.endHour) return false;
        }

        // Type de mission : remote/onsite
        if (mission.location === 'À distance' && avail.acceptsRemote === false) return false;
        if (mission.location === 'En présentiel' && avail.acceptsOnsite === false) return false;
      }

      // ── Paires de langues ───────────────────────────────────────────────
      if (mission.languageFrom && mission.languageTo) {
        const hasLanguage = interp.languages?.some(lang =>
          lang.source === mission.languageFrom && lang.target === mission.languageTo
        );
        if (!hasLanguage) return false;
      }

      // ── Région ─────────────────────────────────────────────────────────
      if (mission.location !== 'À distance') {
        const hasRegion = interp.regions?.some(r => mission.region ? r === mission.region : true);
        if (interp.regions?.length > 0 && !hasRegion) return false;
      }

      return true;
    });

    if (eligible.length === 0) {
      await snap.ref.update({ status: 'no_match', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return;
    }

    // 3. Trier par priorité puis note
    eligible.sort((a, b) => {
      if (b.searchPriority !== a.searchPriority) return b.searchPriority - a.searchPriority;
      return (b.rating || 0) - (a.rating || 0);
    });

    const candidateQueue = eligible.map(i => i.id);
    const firstInterpreter = candidateQueue[0];
    const offerExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await snap.ref.update({
      status: 'offered',
      candidateQueue,
      currentQueueIndex: 0,
      currentOfferedTo: firstInterpreter,
      offerExpiresAt: admin.firestore.Timestamp.fromDate(offerExpiresAt),
      offerHistory: [{ userId: firstInterpreter, offeredAt: admin.firestore.Timestamp.now(), respondedAt: null, response: null }],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const langPair = mission.languageFrom && mission.languageTo ? `${mission.languageFrom} → ${mission.languageTo}` : '';
    await sendPush(
      firstInterpreter,
      '🎯 Nouvelle mission disponible !',
      `${mission.service || 'Interprétation'}${langPair ? ' — ' + langPair : ''} — Répondez sous 2 min`,
      { screen: 'IncomingOffer' },
    );

    console.log(`Mission ${missionId} offerte à ${firstInterpreter}`);
  } catch (error) {
    console.error('Erreur onMissionCreated:', error);
  }
});
