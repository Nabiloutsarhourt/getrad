// Cloud Function : Déclenchée à la création d'une réservation directe (API v2)
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const snap = event.data;
  const booking = snap.data();

  if (!booking.interpreterId || !booking.clientId) return;

  try {
    const clientDoc = await db.collection('users').doc(booking.clientId).get();
    const clientName = clientDoc.data()?.displayName || 'Un client';

    const serviceLabel = booking.serviceType === 'interpretation'
      ? 'Interprétation'
      : 'Traduction';

    await sendPush(
      booking.interpreterId,
      '📋 Nouvelle demande de réservation',
      `${clientName} vous demande une ${serviceLabel} le ${booking.date}`,
      { screen: 'InterpreterBookings' },
    );

    console.log(`Notification envoyée à ${booking.interpreterId} — nouvelle réservation`);
  } catch (error) {
    console.error('onBookingCreated push error:', error);
  }
});
