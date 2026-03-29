// Service de gestion des avis — GETRAD Web
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createReview = async (reviewData) => {
  try {
    const review = { ...reviewData, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, 'reviews'), review);
    await updateInterpreterRating(reviewData.interpreterId);
    return { success: true, reviewId: docRef.id, message: 'Avis publié avec succès' };
  } catch (error) {
    console.error('Erreur création avis:', error);
    return { success: false, error: error.message };
  }
};

export const getInterpreterReviews = async (interpreterId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('interpreterId', '==', interpreterId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return { success: true, reviews: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return { success: false, error: error.message, reviews: [] };
  }
};

export const hasReviewedBooking = async (bookingId, clientId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('bookingId', '==', bookingId),
      where('clientId', '==', clientId)
    );
    const snap = await getDocs(q);
    return { success: true, hasReviewed: !snap.empty };
  } catch (error) {
    return { success: false, hasReviewed: false, error: error.message };
  }
};

const updateInterpreterRating = async (interpreterId) => {
  try {
    const result = await getInterpreterReviews(interpreterId);
    if (!result.success || result.reviews.length === 0) return;
    const reviews = result.reviews;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;
    await updateDoc(doc(db, 'interpreters', interpreterId), {
      rating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erreur mise à jour note:', error);
  }
};
