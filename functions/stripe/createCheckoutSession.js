// Cloud Function : Créer une session de paiement Stripe (API v2)
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (admin.apps.length === 0) admin.initializeApp();

const PLANS = {
  discovery: {
    priceId: process.env.STRIPE_PRICE_DISCOVERY,
    name: 'Découverte',
    missionsLimit: 5,
    candidaturesLimit: 3,
    searchPriority: 1,
  },
  professional: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL,
    name: 'Professionnel',
    missionsLimit: 20,
    candidaturesLimit: 15,
    searchPriority: 2,
  },
  premium: {
    priceId: process.env.STRIPE_PRICE_PREMIUM,
    name: 'Premium',
    missionsLimit: -1,
    candidaturesLimit: -1,
    searchPriority: 3,
  },
};

exports.createCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté.');
  }

  const { plan } = request.data;
  const uid = request.auth.uid;
  const email = request.auth.token.email;

  if (!PLANS[plan]) {
    throw new HttpsError('invalid-argument', 'Plan invalide.');
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const planData = PLANS[plan];

  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUID: uid },
      });
      stripeCustomerId = customer.id;
      await admin.firestore().collection('users').doc(uid).update({ stripeCustomerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: planData.priceId, quantity: 1 }],
      success_url: 'https://getrad.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://getrad.app/cancel',
      subscription_data: {
        trial_period_days: plan === 'discovery' ? 7 : 14,
        metadata: {
          firebaseUID: uid,
          plan,
          missionsLimit: planData.missionsLimit,
          candidaturesLimit: planData.candidaturesLimit,
          searchPriority: planData.searchPriority,
        },
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erreur createCheckoutSession:', error);
    throw new HttpsError('internal', error.message);
  }
});
