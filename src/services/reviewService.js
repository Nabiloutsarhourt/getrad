// Service de gestion des avis pour GETRAD
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
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Créer un avis
export const createReview = async (reviewData) => {
  try {
    const review = {
      ...reviewData,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'reviews'), review);

    // Mettre à jour la note moyenne de l'interprète
    await updateInterpreterRating(reviewData.interpreterId);

    return {
      success: true,
      reviewId: docRef.id,
      message: 'Avis publié avec succès'
    };
  } catch (error) {
    console.error('Erreur création avis:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir les avis d'un interprète
export const getInterpreterReviews = async (interpreterId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('interpreterId', '==', interpreterId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reviews = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      reviews
    };
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return {
      success: false,
      error: error.message,
      reviews: []
    };
  }
};

// Vérifier si un client a déjà laissé un avis pour une réservation
export const hasReviewedBooking = async (bookingId, clientId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('bookingId', '==', bookingId),
      where('clientId', '==', clientId)
    );

    const querySnapshot = await getDocs(q);
    return {
      success: true,
      hasReviewed: !querySnapshot.empty
    };
  } catch (error) {
    console.error('Erreur vérification avis:', error);
    return {
      success: false,
      hasReviewed: false,
      error: error.message
    };
  }
};

// Mettre à jour la note moyenne d'un interprète
const updateInterpreterRating = async (interpreterId) => {
  try {
    const reviewsResult = await getInterpreterReviews(interpreterId);

    if (!reviewsResult.success || reviewsResult.reviews.length === 0) {
      return;
    }

    const reviews = reviewsResult.reviews;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const interpreterRef = doc(db, 'interpreters', interpreterId);
    await updateDoc(interpreterRef, {
      rating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length,
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      rating: averageRating,
      reviewCount: reviews.length
    };
  } catch (error) {
    console.error('Erreur mise à jour note:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
