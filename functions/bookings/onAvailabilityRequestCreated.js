// Cloud Function : Notification à l'interprète lors d'une demande de disponibilité (API v2)
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.onAvailabilityRequestCreated = onDocumentCreated(
  'availabilityRequests/{requestId}',
  async (event) => {
    const snap = event.data;
    const request = snap.data();
    const requestId = event.params.requestId;

    if (request.status !== 'pending') return;

    try {
      const clientDoc = await db.collection('users').doc(request.clientId).get();
      const clientName = clientDoc.data()?.displayName || 'Un client';

      await sendPush(
        request.interpreterId,
        '📬 Demande de disponibilité',
        `${clientName} demande votre disponibilité — Répondez sous 2 min`,
        { screen: 'IncomingAvailabilityRequest', params: { requestId } },
      );

      console.log(`Demande de disponibilité ${requestId} notifiée à ${request.interpreterId}`);
    } catch (error) {
      console.error('onAvailabilityRequestCreated error:', error);
    }
  }
);
