// Analytics helper — GETRAD Web
// Wraps Firebase Analytics logEvent with safe SSR fallbacks
import { logEvent } from 'firebase/analytics';
import { getAppAnalytics } from './firebase';

const log = (name, params = {}) => {
  try {
    const analytics = getAppAnalytics();
    if (analytics) logEvent(analytics, name, params);
  } catch (_) {
    // Never throw due to analytics
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const trackSignUp = (role) => log('sign_up', { method: 'email', role });
export const trackLogin = () => log('login', { method: 'email' });

// ── Subscription ─────────────────────────────────────────────────────────────
export const trackSubscriptionStarted = (plan) => log('subscription_started', { plan });
export const trackSubscriptionManaged = () => log('subscription_managed');

// ── Missions ─────────────────────────────────────────────────────────────────
export const trackMissionCreated = (serviceType) => log('mission_created', { service_type: serviceType });
export const trackMissionCancelled = (missionId) => log('mission_cancelled', { mission_id: missionId });

// ── Bookings ─────────────────────────────────────────────────────────────────
export const trackBookingCreated = (serviceType, interpreterId) =>
  log('booking_created', { service_type: serviceType, interpreter_id: interpreterId });

// ── Profiles ─────────────────────────────────────────────────────────────────
export const trackProfileViewed = (interpreterId) =>
  log('profile_viewed', { interpreter_id: interpreterId });

// ── Verification ─────────────────────────────────────────────────────────────
export const trackVerificationSubmitted = () => log('verification_submitted');

// ── Reviews ──────────────────────────────────────────────────────────────────
export const trackReviewLeft = (rating) => log('review_left', { rating });
