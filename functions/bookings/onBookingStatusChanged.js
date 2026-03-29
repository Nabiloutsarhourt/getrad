// Cloud Function : Déclenchée lors du changement de statut d'une réservation (API v2)
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.onBookingStatusChanged = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const bookingId = event.params.bookingId;

  if (before.status === after.status) return;

  try {
    switch (after.status) {
      case 'confirmed':
        await handleConfirmed(after, bookingId);
        break;

      case 'rejected':
        await sendPush(
          after.clientId,
          '❌ Demande refusée',
          "L'interprète n'est pas disponible pour cette date.",
          { screen: 'ClientBookings' },
        );
        break;

      case 'cancelled':
        if (before.status === 'confirmed') {
          await sendPush(
            after.interpreterId,
            '🚫 Réservation annulée',
            `La réservation du ${after.date} a été annulée par le client.`,
            { screen: 'InterpreterBookings' },
          );
        }
        break;

      case 'completed':
        await sendPush(
          after.clientId,
          '⭐ Mission terminée — laissez un avis',
          "Comment s'est passée votre prestation ? Évaluez l'interprète.",
          { screen: 'Review', params: { bookingId } },
        );
        break;
    }
  } catch (error) {
    console.error('onBookingStatusChanged error:', error);
  }
});

async function handleConfirmed(booking, bookingId) {
  await sendPush(
    booking.clientId,
    '✅ Réservation confirmée !',
    "Votre demande a été acceptée. Les coordonnées ont été partagées.",
    { screen: 'BookingDetail', params: { bookingId } },
  );
  await revealContactInConversation(booking.clientId, booking.interpreterId, bookingId);
}

async function revealContactInConversation(clientId, interpreterId, bookingId) {
  const convSnap = await db.collection('conversations')
    .where('participants', 'array-contains', clientId)
    .get();

  let existingRef = null;
  convSnap.forEach(doc => {
    const data = doc.data();
    if (data.participants?.includes(interpreterId)) {
      existingRef = doc.ref;
    }
  });

  const systemMsg = {
    senderId: 'system',
    text: '✅ Réservation confirmée. Vos coordonnées ont été partagées.',
    type: 'system',
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (existingRef) {
    await existingRef.update({
      contactRevealed: true,
      bookingId,
      lastMessage: systemMsg.text,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      [`unreadCount.${clientId}`]: admin.firestore.FieldValue.increment(1),
    });
    await existingRef.collection('messages').add(systemMsg);
  } else {
    const newConvRef = db.collection('conversations').doc();
    await newConvRef.set({
      participants: [clientId, interpreterId],
      bookingId,
      missionId: null,
      lastMessage: systemMsg.text,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      contactRevealed: true,
      unreadCount: { [clientId]: 1, [interpreterId]: 0 },
      participantsData: {
        [clientId]: { displayName: 'Client', role: 'client' },
        [interpreterId]: { displayName: 'Interprète', role: 'interpreter' },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await newConvRef.collection('messages').add(systemMsg);
  }
}
