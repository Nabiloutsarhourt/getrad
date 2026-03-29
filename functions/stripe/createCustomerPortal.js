// Cloud Function : Portail Stripe (API v2)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (admin.apps.length === 0) admin.initializeApp();

exports.createCustomerPortal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté.');
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const uid = request.auth.uid;

  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new HttpsError('not-found', 'Aucun compte Stripe trouvé.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: 'https://getrad.app/profile',
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erreur createCustomerPortal:', error);
    throw new HttpsError('internal', 'Erreur lors de la création du portail.');
  }
});
