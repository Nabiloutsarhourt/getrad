// Cloud Functions GETRAD — Point d'entrée (API v2)
const { setGlobalOptions } = require('firebase-functions/v2');

setGlobalOptions({ maxInstances: 10, region: 'europe-west1' });

// ── Stripe ──────────────────────────────────────────────────────────────────
const { createCheckoutSession } = require('./stripe/createCheckoutSession');
const { createCustomerPortal } = require('./stripe/createCustomerPortal');
const { stripeWebhook } = require('./stripe/stripeWebhook');

// ── Missions ─────────────────────────────────────────────────────────────────
const { onMissionCreated } = require('./missions/onMissionCreated');
const { processOffer } = require('./missions/processOffer');
const { checkOfferTimeout } = require('./missions/checkOfferTimeout');
const { retryUnmatched } = require('./missions/retryUnmatched');

// ── Réservations ─────────────────────────────────────────────────────────────
const { onBookingCreated } = require('./bookings/onBookingCreated');
const { onBookingStatusChanged } = require('./bookings/onBookingStatusChanged');

// ── Disponibilité (recherche directe) ────────────────────────────────────────
const { onAvailabilityRequestCreated } = require('./bookings/onAvailabilityRequestCreated');
const { respondToAvailabilityRequest } = require('./bookings/respondToAvailabilityRequest');
const { checkAvailabilityRequestTimeout } = require('./bookings/checkAvailabilityRequestTimeout');

exports.createCheckoutSession = createCheckoutSession;
exports.createCustomerPortal = createCustomerPortal;
exports.stripeWebhook = stripeWebhook;
exports.onMissionCreated = onMissionCreated;
exports.processOffer = processOffer;
exports.checkOfferTimeout = checkOfferTimeout;
exports.retryUnmatched = retryUnmatched;
exports.onBookingCreated = onBookingCreated;
exports.onBookingStatusChanged = onBookingStatusChanged;
exports.onAvailabilityRequestCreated = onAvailabilityRequestCreated;
exports.respondToAvailabilityRequest = respondToAvailabilityRequest;
exports.checkAvailabilityRequestTimeout = checkAvailabilityRequestTimeout;
