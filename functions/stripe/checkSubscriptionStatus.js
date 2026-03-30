// Cloud Function : Synchronisation quotidienne des abonnements Stripe — GETRAD
// Filet de sécurité si un webhook échoue : revalide les abonnements suspects
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { sendPush } = require('../notifications/sendPush');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const PLAN_LIMITS = {
  discovery:    { missionsLimit: 5,  candidaturesLimit: 3,  searchPriority: 1 },
  professional: { missionsLimit: 20, candidaturesLimit: 15, searchPriority: 2 },
  premium:      { missionsLimit: -1, candidaturesLimit: -1, searchPriority: 3 },
};

exports.checkSubscriptionStatus = onSchedule('every 24 hours', async () => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const now = admin.firestore.Timestamp.now();

  // Fetch subscriptions that may have lapsed or recovered
  // 1. Active/trialing but period end is in the past (webhook may have missed the renewal)
  // 2. past_due (check if payment recovered)
  const [expiredSnap, pastDueSnap] = await Promise.all([
    db.collection('subscriptions')
      .where('status', 'in', ['active', 'trialing'])
      .where('currentPeriodEnd', '<', now)
      .get(),
    db.collection('subscriptions')
      .where('status', '==', 'past_due')
      .get(),
  ]);

  const docsToCheck = [
    ...expiredSnap.docs,
    ...pastDueSnap.docs,
  ];

  if (docsToCheck.length === 0) {
    console.log('checkSubscriptionStatus: aucun abonnement à vérifier.');
    return;
  }

  console.log(`checkSubscriptionStatus: ${docsToCheck.length} abonnement(s) à vérifier.`);

  let updated = 0;
  let errors = 0;

  await Promise.all(docsToCheck.map(async (docSnap) => {
    const uid = docSnap.id;
    const local = docSnap.data();

    if (!local.stripeSubscriptionId) return;

    try {
      const stripeSub = await stripe.subscriptions.retrieve(local.stripeSubscriptionId);
      const stripeStatus = stripeSub.status;

      // No change needed
      if (stripeStatus === local.status) return;

      console.log(`checkSubscriptionStatus: uid=${uid} ${local.status} → ${stripeStatus}`);

      const plan = stripeSub.metadata?.plan || local.plan || 'discovery';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.discovery;

      const isActive = stripeStatus === 'active' || stripeStatus === 'trialing';

      // Update Firestore subscription doc
      await db.collection('subscriptions').doc(uid).update({
        status: stripeStatus,
        plan,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(stripeSub.current_period_start * 1000),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(stripeSub.trial_end ? {
          trialEnd: admin.firestore.Timestamp.fromMillis(stripeSub.trial_end * 1000),
        } : {}),
      });

      // Update interpreter searchPriority
      await db.collection('interpreters').doc(uid).update({
        searchPriority: isActive ? limits.searchPriority : 0,
        verified: isActive && plan !== 'discovery',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify interpreter of status change
      if (!isActive && local.status !== 'canceled') {
        await sendPush(
          uid,
          'Abonnement expiré',
          'Votre abonnement GETRAD a expiré. Renouvelez-le pour continuer à recevoir des missions.',
          { screen: 'Subscription' }
        );
      } else if (isActive && (local.status === 'past_due' || local.status === 'canceled')) {
        await sendPush(
          uid,
          'Abonnement réactivé',
          'Votre abonnement GETRAD est de nouveau actif. Vous pouvez recevoir des missions.',
          { screen: 'Home' }
        );
      }

      updated++;
    } catch (err) {
      console.error(`checkSubscriptionStatus: erreur uid=${uid}:`, err.message);
      errors++;
    }
  }));

  console.log(`checkSubscriptionStatus terminé: ${updated} mis à jour, ${errors} erreur(s).`);
});
