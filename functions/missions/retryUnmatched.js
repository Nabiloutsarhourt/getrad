// Cloud Function : Relancer les missions sans correspondance — cron 30 min (API v2)
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.retryUnmatched = onSchedule('every 30 minutes', async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

  const unmatchedSnap = await db.collection('missions')
    .where('status', '==', 'no_match')
    .where('createdAt', '>=', cutoff)
    .where('retryCount', '<', 48)
    .get();

  if (unmatchedSnap.empty) {
    console.log('Aucune mission à relancer.');
    return;
  }

  const promises = unmatchedSnap.docs.map(async (docSnap) => {
    const mission = docSnap.data();
    const missionRef = docSnap.ref;

    try {
      const interpretersSnap = await db.collection('interpreters')
        .where('searchPriority', '>', 0)
        .get();

      const allInterpreters = [];
      interpretersSnap.forEach(d => allInterpreters.push({ id: d.id, ...d.data() }));

      const alreadyContacted = new Set((mission.offerHistory || []).map(h => h.userId));

      const eligible = allInterpreters.filter(interp => {
        if (alreadyContacted.has(interp.id)) return false;
        if (mission.languageFrom && mission.languageTo) {
          const hasLanguage = interp.languages?.some(lang =>
            lang.source === mission.languageFrom && lang.target === mission.languageTo
          );
          if (!hasLanguage) return false;
        }
        if (mission.location !== 'À distance') {
          const hasRegion = interp.regions?.some(r => mission.region ? r === mission.region : true);
          if (interp.regions?.length > 0 && !hasRegion) return false;
        }
        return true;
      });

      if (eligible.length === 0) {
        await missionRef.update({
          retryCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      eligible.sort((a, b) => {
        if (b.searchPriority !== a.searchPriority) return b.searchPriority - a.searchPriority;
        return (b.rating || 0) - (a.rating || 0);
      });

      const newCandidates = eligible.map(i => i.id);
      const firstInterpreter = newCandidates[0];

      await missionRef.update({
        status: 'offered',
        candidateQueue: [...(mission.candidateQueue || []), ...newCandidates],
        currentQueueIndex: (mission.candidateQueue || []).length,
        currentOfferedTo: firstInterpreter,
        offerExpiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000)),
        retryCount: admin.firestore.FieldValue.increment(1),
        offerHistory: [...(mission.offerHistory || []), {
          userId: firstInterpreter,
          offeredAt: admin.firestore.Timestamp.now(),
          respondedAt: null,
          response: null,
        }],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendPush(firstInterpreter, '🎯 Mission disponible !', `${mission.service || 'Interprétation'} — Répondez sous 2 min`, { screen: 'IncomingOffer' });
      console.log(`Mission ${docSnap.id} relancée → ${firstInterpreter}`);
    } catch (err) {
      console.error(`Erreur relance mission ${docSnap.id}:`, err);
    }
  });

  await Promise.all(promises);
  console.log(`${unmatchedSnap.size} mission(s) relancée(s).`);
});
