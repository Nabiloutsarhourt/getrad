// Cloud Function : Acceptation/refus d'une offre de mission (API v2)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

exports.processOffer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connexion requise.');
  }

  const { missionId, response } = request.data;
  const interpreterId = request.auth.uid;

  if (!['accepted', 'refused'].includes(response)) {
    throw new HttpsError('invalid-argument', 'Réponse invalide.');
  }

  const missionRef = db.collection('missions').doc(missionId);

  try {
    const missionDoc = await missionRef.get();
    if (!missionDoc.exists) throw new HttpsError('not-found', 'Mission introuvable.');

    const mission = missionDoc.data();

    if (mission.currentOfferedTo !== interpreterId) {
      throw new HttpsError('permission-denied', "Cette offre ne vous est pas destinée.");
    }
    if (mission.status !== 'offered') {
      throw new HttpsError('failed-precondition', "Cette offre n'est plus active.");
    }

    const updatedHistory = mission.offerHistory.map(h => {
      if (h.userId === interpreterId && !h.respondedAt) {
        return { ...h, respondedAt: admin.firestore.Timestamp.now(), response };
      }
      return h;
    });

    if (response === 'accepted') {
      await missionRef.update({
        status: 'accepted',
        assignedTo: interpreterId,
        currentOfferedTo: null,
        offerExpiresAt: null,
        offerHistory: updatedHistory,
        contactRevealed: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection('subscriptions').doc(interpreterId).update({
        missionsViewed: admin.firestore.FieldValue.increment(1),
      }).catch(() => {});

      const convRef = db.collection('conversations').doc();
      await convRef.set({
        participants: [mission.clientId, interpreterId],
        missionId,
        bookingId: null,
        lastMessage: 'Mission acceptée — conversation ouverte',
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        contactRevealed: true,
        unreadCount: { [mission.clientId]: 1 },
        participantsData: {
          [interpreterId]: { displayName: 'Prestataire', role: 'interpreter' },
          [mission.clientId]: { displayName: 'Client', role: 'client' },
        },
      });

      await convRef.collection('messages').add({
        senderId: 'system',
        text: '✅ Mission acceptée. Vos coordonnées ont été partagées.',
        type: 'system',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendPush(
        mission.clientId,
        '✅ Mission acceptée !',
        'Un prestataire a accepté votre mission.',
        { screen: 'MissionTracking', params: { missionId } },
      );

      return { success: true, message: 'Mission acceptée !' };
    } else {
      await passToNextInterpreter(missionRef, mission, updatedHistory, 'refused');
      return { success: true, message: 'Offre refusée.' };
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Erreur processOffer:', error);
    throw new HttpsError('internal', error.message);
  }
});

async function passToNextInterpreter(missionRef, mission, updatedHistory, reason) {
  const nextIndex = (mission.currentQueueIndex || 0) + 1;

  if (!mission.candidateQueue || nextIndex >= mission.candidateQueue.length) {
    await missionRef.update({
      status: 'no_match',
      currentOfferedTo: null,
      offerExpiresAt: null,
      offerHistory: updatedHistory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const nextInterpreter = mission.candidateQueue[nextIndex];
  const offerExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

  await missionRef.update({
    status: 'offered',
    currentQueueIndex: nextIndex,
    currentOfferedTo: nextInterpreter,
    offerExpiresAt: admin.firestore.Timestamp.fromDate(offerExpiresAt),
    offerHistory: [...updatedHistory, {
      userId: nextInterpreter,
      offeredAt: admin.firestore.Timestamp.now(),
      respondedAt: null,
      response: null,
    }],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await sendPush(nextInterpreter, '🎯 Nouvelle mission disponible !', 'Une mission vous est proposée — Répondez sous 2 min', { screen: 'IncomingOffer' });
}

exports.passToNextInterpreter = passToNextInterpreter;
