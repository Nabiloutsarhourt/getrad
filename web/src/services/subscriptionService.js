// Service d'abonnement Stripe — GETRAD Web
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';

export const subscribeToSubscription = (uid, callback) => {
  const subRef = doc(db, 'subscriptions', uid);
  return onSnapshot(
    subRef,
    (snap) => callback(snap.exists() ? snap.data() : null),
    (error) => {
      console.error('subscribeToSubscription error:', error.code, error.message);
      callback(null);
    }
  );
};

export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  return ['active', 'trialing'].includes(subscription.status);
};

export const canViewMission = (subscription) => {
  if (!isSubscriptionActive(subscription)) return false;
  if (subscription.missionsLimit === -1) return true;
  return (subscription.missionsViewed || 0) < subscription.missionsLimit;
};

// plan: "discovery" | "professional" | "premium"
export const startCheckout = async (plan) => {
  try {
    const createSession = httpsCallable(functions, 'createCheckoutSession');
    const result = await createSession({ plan });
    const { url } = result.data;
    if (url) {
      window.location.href = url;
      return { success: true };
    }
    return { success: false, error: 'URL de paiement manquante' };
  } catch (error) {
    console.error('Erreur startCheckout:', error);
    return { success: false, error: error.message };
  }
};

export const openCustomerPortal = async () => {
  try {
    const createPortal = httpsCallable(functions, 'createCustomerPortal');
    const result = await createPortal({});
    const { url } = result.data;
    if (url) {
      window.location.href = url;
      return { success: true };
    }
    return { success: false, error: 'URL du portail manquante' };
  } catch (error) {
    console.error('Erreur openCustomerPortal:', error);
    return { success: false, error: error.message };
  }
};

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

export const PLAN_FEATURES = {
  discovery: {
    price: '19,99€/mois',
    missions: '5 missions / mois',
    candidatures: '3 candidatures',
    trial: '7 jours d\'essai gratuit',
    badge: false,
    priority: 'Priorité de recherche standard',
  },
  professional: {
    price: '39,99€/mois',
    missions: '20 missions / mois',
    candidatures: '15 candidatures',
    trial: '14 jours d\'essai gratuit',
    badge: true,
    priority: 'Priorité de recherche élevée',
  },
  premium: {
    price: '69,99€/mois',
    missions: 'Missions illimitées',
    candidatures: 'Candidatures illimitées',
    trial: '14 jours d\'essai gratuit',
    badge: true,
    priority: 'Top priorité de recherche',
  },
};
