// Cloud Function : Expire les demandes de disponibilité après 2 minutes (API v2)
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.checkAvailabilityRequestTimeout = onSchedule(
  { schedule: 'every 1 minutes', region: 'europe-west1' },
  async () => {
    const now = admin.firestore.Timestamp.now();

    const pendingSnap = await db.collection('availabilityRequests')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now)
      .get();

    if (pendingSnap.empty) return;

    const batch = db.batch();
    const pushPromises = [];

    pendingSnap.forEach(docSnap => {
      const data = docSnap.data();
      batch.update(docSnap.ref, {
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      pushPromises.push(
        sendPush(
          data.clientId,
          '⏱ Demande expirée',
          "L'interprète n'a pas répondu à temps. Essayez un autre profil.",
          { screen: 'InterpretersListTab' },
        )
      );
    });

    await batch.commit();
    await Promise.all(pushPromises);
    console.log(`${pendingSnap.size} demande(s) de disponibilité expirée(s)`);
  }
);
