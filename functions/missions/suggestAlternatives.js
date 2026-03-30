// Cloud Function : Suggérer des interprètes alternatifs quand aucune correspondance (API v2)
// Déclenché quand missions/{missionId}.status passe à 'no_match'
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.suggestAlternatives = onDocumentUpdated('missions/{missionId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only react when status first becomes 'no_match'
  if (before.status === 'no_match' || after.status !== 'no_match') return;

  const missionId = event.params.missionId;
  const missionRef = event.data.after.ref;

  try {
    const interpretersSnap = await db.collection('interpreters')
      .where('searchPriority', '>', 0)
      .get();

    const allInterpreters = [];
    interpretersSnap.forEach(d => allInterpreters.push({ id: d.id, ...d.data() }));

    // ── Pass 1: same language pair, any region / availability ────────────────
    let suggestions = allInterpreters.filter(interp => {
      if (after.languageFrom && after.languageTo) {
        return interp.languages?.some(
          lang => lang.source === after.languageFrom && lang.target === after.languageTo
        );
      }
      return true;
    });

    // ── Pass 2: if still nothing, match on source language only ─────────────
    if (suggestions.length === 0 && after.languageFrom) {
      suggestions = allInterpreters.filter(interp =>
        interp.languages?.some(lang => lang.source === after.languageFrom)
      );
    }

    // ── Pass 3: same specialty / service type if still nothing ───────────────
    if (suggestions.length === 0 && after.service) {
      suggestions = allInterpreters.filter(interp =>
        interp.specialties?.some(s =>
          s.toLowerCase().includes(after.service.toLowerCase()) ||
          after.service.toLowerCase().includes(s.toLowerCase())
        )
      );
    }

    // Exclude anyone who was already offered (they already refused / didn't respond)
    const alreadyContacted = new Set((after.offerHistory || []).map(h => h.userId));
    suggestions = suggestions.filter(i => !alreadyContacted.has(i.id));

    // Sort by subscription priority then rating
    suggestions.sort((a, b) => {
      if (b.searchPriority !== a.searchPriority) return b.searchPriority - a.searchPriority;
      return (b.rating || 0) - (a.rating || 0);
    });

    const topSuggestions = suggestions.slice(0, 5).map(i => i.id);

    // Persist suggestion list on the mission doc
    await missionRef.update({
      suggestedInterpreters: topSuggestions,
      suggestionsGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify client
    if (after.clientId) {
      if (topSuggestions.length > 0) {
        await sendPush(
          after.clientId,
          'Aucun interprète disponible',
          `Nous n'avons pas trouvé de correspondance automatique. ${topSuggestions.length} profil${topSuggestions.length > 1 ? 's' : ''} similaire${topSuggestions.length > 1 ? 's' : ''} vous sont suggérés.`,
          { screen: 'MissionTracking', params: { missionId } }
        );
      } else {
        await sendPush(
          after.clientId,
          'Mission non pourvue',
          'Aucun interprète disponible pour cette mission pour le moment. Essayez de publier à nouveau.',
          { screen: 'MissionTracking', params: { missionId } }
        );
      }
    }

    console.log(`suggestAlternatives: mission ${missionId} → ${topSuggestions.length} suggestion(s)`);
  } catch (err) {
    console.error(`suggestAlternatives: erreur mission ${missionId}:`, err.message);
  }
});
