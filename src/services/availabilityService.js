// Service — demandes de disponibilité GETRAD
import {
  collection, addDoc, doc, onSnapshot,
  updateDoc, query, where, Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

// ─── Créer une demande de disponibilité ───────────────────────────────────
export const createAvailabilityRequest = async (clientId, interpreterId, message = '') => {
  try {
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000));
    const docRef = await addDoc(collection(db, 'availabilityRequests'), {
      clientId,
      interpreterId,
      message,
      status: 'pending',
      expiresAt,
      conversationId: null,
      createdAt: serverTimestamp(),
    });
    return { success: true, requestId: docRef.id };
  } catch (error) {
    console.error('createAvailabilityRequest error:', error);
    return { success: false, error: error.message };
  }
};

// ─── Écouter une demande en temps réel (côté client) ──────────────────────
export const subscribeAvailabilityRequest = (requestId, callback) => {
  return onSnapshot(
    doc(db, 'availabilityRequests', requestId),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (error) => {
      console.error('subscribeAvailabilityRequest error:', error);
      callback(null);
    }
  );
};

// ─── Écouter les demandes entrantes pour un interprète ────────────────────
export const subscribeIncomingAvailabilityRequest = (interpreterId, callback) => {
  const q = query(
    collection(db, 'availabilityRequests'),
    where('interpreterId', '==', interpreterId),
    where('status', '==', 'pending'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
  }, (error) => {
    console.error('subscribeIncomingAvailabilityRequest error:', error);
    callback(null);
  });
};

// ─── Répondre à une demande (appelé par l'interprète) ────────────────────
export const respondToAvailabilityRequest = async (requestId, response) => {
  try {
    const fn = httpsCallable(functions, 'respondToAvailabilityRequest');
    const result = await fn({ requestId, response });
    return { success: true, ...result.data };
  } catch (error) {
    console.error('respondToAvailabilityRequest error:', error);
    return { success: false, error: error.message };
  }
};

// ─── Annuler une demande (côté client) ────────────────────────────────────
export const cancelAvailabilityRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, 'availabilityRequests', requestId), {
      status: 'cancelled',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
