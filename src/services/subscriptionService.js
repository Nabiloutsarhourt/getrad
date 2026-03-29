// Service d'abonnement Stripe pour GETRAD
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { Linking } from 'react-native';

// ─── Écouter l'abonnement en temps réel ───────────────────────────────────
export const subscribeToSubscription = (uid, callback) => {
  const subRef = doc(db, 'subscriptions', uid);
  return onSnapshot(
    subRef,
    (snap) => {
      callback(snap.exists() ? snap.data() : null);
    },
    (error) => {
      console.error('subscribeToSubscription error:', error.code, error.message);
      callback(null);
    }
  );
};

// ─── Vérifier si l'abonnement est actif ───────────────────────────────────
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  return ['active', 'trialing'].includes(subscription.status);
};

// ─── Vérifier si l'interprète peut voir plus de missions ──────────────────
export const canViewMission = (subscription) => {
  if (!isSubscriptionActive(subscription)) return false;
  if (subscription.missionsLimit === -1) return true; // Illimité (Premium)
  return (subscription.missionsViewed || 0) < subscription.missionsLimit;
};

// ─── Lancer le paiement Stripe ─────────────────────────────────────────────
// plan: "discovery" | "professional" | "premium"
export const startCheckout = async (plan) => {
  try {
    const createSession = httpsCallable(functions, 'createCheckoutSession');
    const result = await createSession({ plan });
    const { url } = result.data;

    if (url) {
      await Linking.openURL(url);
      return { success: true };
    }
    return { success: false, error: 'URL de paiement manquante' };
  } catch (error) {
    console.error('Erreur startCheckout:', error);
    return { success: false, error: error.message };
  }
};

// ─── Ouvrir le portail Stripe (gérer / résilier l'abonnement) ─────────────
export const openCustomerPortal = async () => {
  try {
    const createPortal = httpsCallable(functions, 'createCustomerPortal');
    const result = await createPortal({});
    const { url } = result.data;

    if (url) {
      await Linking.openURL(url);
      return { success: true };
    }
    return { success: false, error: 'URL du portail manquante' };
  } catch (error) {
    console.error('Erreur openCustomerPortal:', error);
    return { success: false, error: error.message };
  }
};

// ─── Labels des plans ─────────────────────────────────────────────────────
export const PLAN_LABELS = {
  discovery: 'Découverte',
  professional: 'Professionnel',
  premium: 'Premium',
};

export const PLAN_COLORS = {
  discovery: '#434655',
  professional: '#004ac6',
  premium: '#F59E0B',
};
