// Service Analytics — GETRAD Mobile
// Wraps @react-native-firebase/analytics with safe fallbacks
import { Platform } from 'react-native';

let analytics = null;
try {
  analytics = require('@react-native-firebase/analytics').default;
} catch (_) {}

const log = async (name, params = {}) => {
  if (!analytics || Platform.OS === 'web') return;
  try {
    await analytics().logEvent(name, params);
  } catch (e) {
    // Never crash the app because of analytics
    if (__DEV__) console.warn('[Analytics]', name, e.message);
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const trackSignUp = (role) =>
  log('sign_up', { method: 'email', role });

export const trackLogin = () =>
  log('login', { method: 'email' });

export const trackLogout = () =>
  log('logout');

// ── Subscription ─────────────────────────────────────────────────────────────

export const trackSubscriptionStarted = (plan) =>
  log('subscription_started', { plan });

export const trackSubscriptionManaged = () =>
  log('subscription_managed');

// ── Missions ─────────────────────────────────────────────────────────────────

export const trackMissionCreated = (serviceType, languagePair) =>
  log('mission_created', { service_type: serviceType, language_pair: languagePair });

export const trackMissionCancelled = (missionId) =>
  log('mission_cancelled', { mission_id: missionId });

export const trackOfferAccepted = (missionId) =>
  log('offer_accepted', { mission_id: missionId });

export const trackOfferRefused = (missionId) =>
  log('offer_refused', { mission_id: missionId });

// ── Bookings ─────────────────────────────────────────────────────────────────

export const trackBookingCreated = (serviceType, interpreterId) =>
  log('booking_created', { service_type: serviceType, interpreter_id: interpreterId });

export const trackBookingAccepted = (bookingId) =>
  log('booking_accepted', { booking_id: bookingId });

export const trackBookingCancelled = (bookingId) =>
  log('booking_cancelled', { booking_id: bookingId });

// ── Availability requests ────────────────────────────────────────────────────

export const trackAvailabilityRequested = (interpreterId) =>
  log('availability_requested', { interpreter_id: interpreterId });

export const trackAvailabilityAccepted = () =>
  log('availability_accepted');

export const trackAvailabilityRefused = () =>
  log('availability_refused');

// ── Profiles ─────────────────────────────────────────────────────────────────

export const trackProfileViewed = (interpreterId) =>
  log('profile_viewed', { interpreter_id: interpreterId });

export const trackContactRevealed = (source) =>
  log('contact_revealed', { source }); // source: 'mission' | 'booking' | 'availability'

// ── Verification ─────────────────────────────────────────────────────────────

export const trackVerificationSubmitted = () =>
  log('verification_submitted');

// ── Reviews ──────────────────────────────────────────────────────────────────

export const trackReviewLeft = (rating) =>
  log('review_left', { rating });

// ── User properties ───────────────────────────────────────────────────────────

export const setUserRole = async (role) => {
  if (!analytics || Platform.OS === 'web') return;
  try {
    await analytics().setUserProperties({ role });
  } catch (_) {}
};
