// Service de gestion des réservations pour GETRAD
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Créer une nouvelle réservation
export const createBooking = async (bookingData) => {
  try {
    const booking = {
      ...bookingData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'bookings'), booking);

    return {
      success: true,
      bookingId: docRef.id,
      message: 'Demande de réservation envoyée avec succès'
    };
  } catch (error) {
    console.error('Erreur création réservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir une réservation par ID
export const getBookingById = async (bookingId) => {
  try {
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));

    if (!bookingDoc.exists()) {
      return {
        success: false,
        error: 'Réservation non trouvée'
      };
    }

    return {
      success: true,
      booking: {
        id: bookingDoc.id,
        ...bookingDoc.data()
      }
    };
  } catch (error) {
    console.error('Erreur récupération réservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir les réservations d'un client
export const getClientBookings = async (clientId) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      bookings
    };
  } catch (error) {
    console.error('Erreur récupération réservations client:', error);
    return {
      success: false,
      error: error.message,
      bookings: []
    };
  }
};

// Obtenir les réservations d'un interprète
export const getInterpreterBookings = async (interpreterId) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('interpreterId', '==', interpreterId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      bookings
    };
  } catch (error) {
    console.error('Erreur récupération réservations interprète:', error);
    return {
      success: false,
      error: error.message,
      bookings: []
    };
  }
};

// Mettre à jour le statut d'une réservation
export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    await updateDoc(bookingRef, {
      status: newStatus,
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      message: 'Statut de la réservation mis à jour'
    };
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Annuler une réservation
export const cancelBooking = async (bookingId, cancelReason = '') => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelReason,
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      message: 'Réservation annulée'
    };
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Confirmer une réservation (pour l'interprète)
export const confirmBooking = async (bookingId) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    await updateDoc(bookingRef, {
      status: 'confirmed',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      message: 'Réservation confirmée'
    };
  } catch (error) {
    console.error('Erreur confirmation réservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Refuser une réservation (pour l'interprète)
export const rejectBooking = async (bookingId, rejectReason = '') => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    await updateDoc(bookingRef, {
      status: 'rejected',
      rejectReason,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      message: 'Réservation refusée'
    };
  } catch (error) {
    console.error('Erreur refus réservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Marquer une réservation comme terminée
export const completeBooking = async (bookingId) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    await updateDoc(bookingRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      message: 'Réservation marquée comme terminée'
    };
  } catch (error) {
    console.error('Erreur complétion réservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
