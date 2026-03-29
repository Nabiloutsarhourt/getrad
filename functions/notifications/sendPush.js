// Helper : Envoyer une push notification via l'API Expo
// Utilise le token stocké dans users/{uid}.expoPushToken
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Récupère le token push Expo d'un utilisateur
 */
async function getUserPushToken(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists ? userDoc.data()?.expoPushToken : null;
}

/**
 * Envoie une notification push à un utilisateur via Expo Push API
 * @param {string} userId   UID Firebase de la cible
 * @param {string} title    Titre de la notification
 * @param {string} body     Corps de la notification
 * @param {object} data     Données supplémentaires (screen, params)
 */
async function sendPush(userId, title, body, data = {}) {
  try {
    const token = await getUserPushToken(userId);
    if (!token || !token.startsWith('ExponentPushToken')) {
      return; // Pas de token valide
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }),
    });

    const result = await response.json();
    if (result?.data?.status === 'error') {
      console.warn(`Push error for ${userId}:`, result.data.message);
    }
  } catch (error) {
    // Ne jamais faire échouer une CF à cause d'une notification manquée
    console.error('sendPush error:', error.message);
  }
}

/**
 * Envoie des notifications push à plusieurs utilisateurs en parallèle
 */
async function sendPushToMany(userIds, title, body, data = {}) {
  await Promise.all(userIds.map(uid => sendPush(uid, title, body, data)));
}

module.exports = { sendPush, sendPushToMany };
