// Cloud Function : Accepter / refuser une demande de disponibilité (API v2)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.respondToAvailabilityRequest = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');

  const { requestId, response } = request.data;
  const interpreterId = request.auth.uid;

  if (!['accepted', 'refused'].includes(response)) {
    throw new HttpsError('invalid-argument', 'Réponse invalide.');
  }

  const reqRef = db.collection('availabilityRequests').doc(requestId);

  try {
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) throw new HttpsError('not-found', 'Demande introuvable.');

    const reqData = reqDoc.data();

    if (reqData.interpreterId !== interpreterId) {
      throw new HttpsError('permission-denied', "Cette demande ne vous est pas destinée.");
    }
    if (reqData.status !== 'pending') {
      throw new HttpsError('failed-precondition', "Cette demande n'est plus active.");
    }

    if (response === 'refused') {
      await reqRef.update({
        status: 'refused',
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendPush(
        reqData.clientId,
        '❌ Demande refusée',
        "L'interprète n'est pas disponible pour l'instant.",
        { screen: 'InterpretersListTab' },
      );

      return { success: true, message: 'Demande refusée.' };
    }

    // ── ACCEPTÉE : créer la conversation + révéler les coordonnées ────────────
    const [clientDoc, interpreterUserDoc, privateDoc] = await Promise.all([
      db.collection('users').doc(reqData.clientId).get(),
      db.collection('users').doc(interpreterId).get(),
      db.collection('interpreters').doc(interpreterId)
        .collection('private').doc('contactInfo').get(),
    ]);

    const clientName = clientDoc.data()?.displayName || 'Client';
    const interpreterName = interpreterUserDoc.data()?.displayName || 'Interprète';
    const contactInfo = privateDoc.exists ? privateDoc.data() : {};

    const contactLines = [
      contactInfo.phone && `📞 ${contactInfo.phone}`,
      contactInfo.email && `✉️ ${contactInfo.email}`,
      contactInfo.address && `📍 ${contactInfo.address}`,
    ].filter(Boolean);

    const contactText = contactLines.length > 0
      ? contactLines.join('\n')
      : 'Coordonnées non renseignées — contactez via la messagerie.';

    // Créer la conversation
    const convRef = db.collection('conversations').doc();
    await convRef.set({
      participants: [reqData.clientId, interpreterId],
      availabilityRequestId: requestId,
      bookingId: null,
      missionId: null,
      lastMessage: '✅ Disponibilité confirmée — conversation ouverte',
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      contactRevealed: true,
      unreadCount: { [reqData.clientId]: 1, [interpreterId]: 0 },
      participantsData: {
        [reqData.clientId]: { displayName: clientName, role: 'client' },
        [interpreterId]: { displayName: interpreterName, role: 'interpreter' },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await convRef.collection('messages').add({
      senderId: 'system',
      text: `✅ Disponibilité confirmée.\n\n${contactText}`,
      type: 'system',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mettre à jour la demande
    await reqRef.update({
      status: 'accepted',
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      conversationId: convRef.id,
    });

    // Notifier le client
    await sendPush(
      reqData.clientId,
      '✅ Disponibilité confirmée !',
      `${interpreterName} est disponible. Ouvrez la conversation.`,
      { screen: 'Chat', params: { conversationId: convRef.id } },
    );

    return { success: true, conversationId: convRef.id };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('respondToAvailabilityRequest error:', error);
    throw new HttpsError('internal', error.message);
  }
});
