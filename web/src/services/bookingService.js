// Service de gestion des réservations — GETRAD Web
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createBooking = async (bookingData) => {
  try {
    const booking = {
      ...bookingData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'bookings'), booking);
    return { success: true, bookingId: docRef.id, message: 'Demande de réservation envoyée avec succès' };
  } catch (error) {
    console.error('Erreur création réservation:', error);
    return { success: false, error: error.message };
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
    if (!bookingDoc.exists()) return { success: false, error: 'Réservation non trouvée' };
    return { success: true, booking: { id: bookingDoc.id, ...bookingDoc.data() } };
  } catch (error) {
    console.error('Erreur récupération réservation:', error);
    return { success: false, error: error.message };
  }
};

export const getClientBookings = async (clientId) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(q);
    return { success: true, bookings: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    console.error('Erreur réservations client:', error);
    return { success: false, error: error.message, bookings: [] };
  }
};

export const getInterpreterBookings = async (interpreterId) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('interpreterId', '==', interpreterId),
      orderBy('createdAt', 'desc')
    );
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(q);
    return { success: true, bookings: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    console.error('Erreur réservations interprète:', error);
    return { success: false, error: error.message, bookings: [] };
  }
};

export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return { success: false, error: error.message };
  }
};

export const cancelBooking = async (bookingId, cancelReason = '') => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'cancelled',
      cancelReason,
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    return { success: false, error: error.message };
  }
};

export const confirmBooking = async (bookingId) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'confirmed',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur confirmation réservation:', error);
    return { success: false, error: error.message };
  }
};

export const rejectBooking = async (bookingId, rejectReason = '') => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'rejected',
      rejectReason,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur refus réservation:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeClientBookings = (clientId, callback) => {
  const q = query(
    collection(db, 'bookings'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (error) => { console.error('subscribeClientBookings error:', error); callback([]); }
  );
};

export const subscribeInterpreterBookings = (interpreterId, callback) => {
  const q = query(
    collection(db, 'bookings'),
    where('interpreterId', '==', interpreterId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (error) => { console.error('subscribeInterpreterBookings error:', error); callback([]); }
  );
};
