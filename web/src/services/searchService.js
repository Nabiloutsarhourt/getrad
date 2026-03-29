// Service de recherche d'interprètes — GETRAD Web
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const getAllInterpreters = async (filters = {}) => {
  try {
    let interpretersQuery = collection(db, 'interpreters');
    const constraints = [];

    if (filters.city) constraints.push(where('city', '==', filters.city));
    if (filters.region) constraints.push(where('regions', 'array-contains', filters.region));
    if (filters.specialty) constraints.push(where('specialties', 'array-contains', filters.specialty));
    if (filters.service) constraints.push(where('services', 'array-contains', filters.service));
    if (filters.assermente === true) constraints.push(where('assermente', '==', true));
    if (filters.minRating) constraints.push(where('rating', '>=', parseFloat(filters.minRating)));
    if (filters.sortBy === 'rating') constraints.push(orderBy('rating', 'desc'));
    else if (filters.sortBy === 'reviewCount') constraints.push(orderBy('reviewCount', 'desc'));
    if (filters.limit) constraints.push(limit(filters.limit));

    if (constraints.length > 0) {
      interpretersQuery = query(interpretersQuery, ...constraints);
    }

    const snap = await getDocs(interpretersQuery);
    let interpreters = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Client-side filters
    interpreters = interpreters.filter(i => i.verificationStatus === 'accepte');

    if (filters.languageFrom || filters.languageTo) {
      interpreters = interpreters.filter(interpreter => {
        if (!interpreter.languages || interpreter.languages.length === 0) return false;
        return interpreter.languages.some(lang => {
          const matchFrom = !filters.languageFrom || lang.source === filters.languageFrom;
          const matchTo = !filters.languageTo || lang.target === filters.languageTo;
          return matchFrom && matchTo;
        });
      });
    }

    if (filters.maxHourlyRate) {
      interpreters = interpreters.filter(i => i.hourlyRate <= parseFloat(filters.maxHourlyRate));
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      interpreters = interpreters.filter(i =>
        (i.firstName || '').toLowerCase().includes(s) ||
        (i.lastName || '').toLowerCase().includes(s) ||
        (i.bio || '').toLowerCase().includes(s) ||
        (i.city || '').toLowerCase().includes(s)
      );
    }

    return { success: true, interpreters };
  } catch (error) {
    console.error('Erreur recherche interprètes:', error);
    return { success: false, error: error.message, interpreters: [] };
  }
};

export const getInterpreterById = async (interpreterId) => {
  try {
    const interpreterDoc = await getDoc(doc(db, 'interpreters', interpreterId));
    if (!interpreterDoc.exists()) return { success: false, error: 'Interprète non trouvé' };
    const userDoc = await getDoc(doc(db, 'users', interpreterId));
    const interpreterData = {
      id: interpreterDoc.id,
      ...interpreterDoc.data(),
      user: userDoc.exists() ? userDoc.data() : {},
    };
    return { success: true, interpreter: interpreterData };
  } catch (error) {
    console.error('Erreur récupération interprète:', error);
    return { success: false, error: error.message };
  }
};

export const getRecommendedInterpreters = async (limitCount = 6) => {
  return getAllInterpreters({ sortBy: 'rating', limit: limitCount });
};
