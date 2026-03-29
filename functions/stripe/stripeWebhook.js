// Cloud Function : Webhooks Stripe (API v2)
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (admin.apps.length === 0) admin.initializeApp();

const PLAN_LIMITS = {
  discovery:    { missionsLimit: 5,  candidaturesLimit: 3,  searchPriority: 1 },
  professional: { missionsLimit: 20, candidaturesLimit: 15, searchPriority: 2 },
  premium:      { missionsLimit: -1, candidaturesLimit: -1, searchPriority: 3 },
};

exports.stripeWebhook = onRequest(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const uid = subscription.metadata?.firebaseUID;
        if (!uid) break;
        await activateSubscription(uid, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const uid = subscription.metadata?.firebaseUID;
        if (!uid) break;
        await activateSubscription(uid, subscription);
        await admin.firestore().collection('subscriptions').doc(uid).update({
          missionsViewed: 0,
          candidaturesSent: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const uid = subscription.metadata?.firebaseUID;
        if (!uid) break;
        await admin.firestore().collection('subscriptions').doc(uid).update({
          status: 'past_due',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await admin.firestore().collection('interpreters').doc(uid).update({ searchPriority: 0 });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const uid = subscription.metadata?.firebaseUID;
        if (!uid) break;
        await activateSubscription(uid, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const uid = subscription.metadata?.firebaseUID;
        if (!uid) break;
        await admin.firestore().collection('subscriptions').doc(uid).update({
          status: 'canceled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await admin.firestore().collection('interpreters').doc(uid).update({ searchPriority: 0 });
        break;
      }

      default:
        console.log(`Événement non géré : ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).send('Erreur serveur');
  }
});

async function activateSubscription(uid, stripeSubscription) {
  const plan = stripeSubscription.metadata?.plan || 'discovery';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.discovery;
  const priceId = stripeSubscription.items.data[0]?.price?.id;

  await admin.firestore().collection('subscriptions').doc(uid).set({
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: priceId,
    plan,
    status: stripeSubscription.status,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    missionsLimit: limits.missionsLimit,
    candidaturesLimit: limits.candidaturesLimit,
    trialEnd: stripeSubscription.trial_end
      ? admin.firestore.Timestamp.fromMillis(stripeSubscription.trial_end * 1000)
      : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await admin.firestore().collection('interpreters').doc(uid).update({
    searchPriority: limits.searchPriority,
    verified: plan !== 'discovery',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
