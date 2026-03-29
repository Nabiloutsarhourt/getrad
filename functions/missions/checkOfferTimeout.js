// Cloud Function : Vérifier les offres expirées — cron toutes les minutes (API v2)
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.checkOfferTimeout = onSchedule('every 1 minutes', async () => {
  const now = admin.firestore.Timestamp.now();

  const expiredSnap = await db.collection('missions')
    .where('status', '==', 'offered')
    .where('offerExpiresAt', '<=', now)
    .get();

  if (expiredSnap.empty) return;

  const { passToNextInterpreter } = require('./processOffer');

  const promises = expiredSnap.docs.map(async (doc) => {
    const mission = doc.data();
    const updatedHistory = (mission.offerHistory || []).map(h => {
      if (h.userId === mission.currentOfferedTo && !h.respondedAt) {
        return { ...h, respondedAt: admin.firestore.Timestamp.now(), response: 'timeout' };
      }
      return h;
    });
    console.log(`Timeout mission ${doc.id} pour ${mission.currentOfferedTo}`);
    await passToNextInterpreter(doc.ref, mission, updatedHistory, 'timeout');
  });

  await Promise.all(promises);
  console.log(`${expiredSnap.size} offre(s) expirée(s) traitée(s)`);
});
