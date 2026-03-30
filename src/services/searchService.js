// Service de recherche d'interprètes pour GETRAD
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

// Rechercher des interprètes avec filtres
export const searchInterpreters = async (filters = {}) => {
  try {
    let interpretersQuery = collection(db, 'interpreters');
    const constraints = [];

    // Filtre par ville
    if (filters.city) {
      constraints.push(where('city', '==', filters.city));
    }

    // Filtre par région
    if (filters.region) {
      constraints.push(where('regions', 'array-contains', filters.region));
    }

    // Filtre par spécialité
    if (filters.specialty) {
      constraints.push(where('specialties', 'array-contains', filters.specialty));
    }

    // Filtre par service
    if (filters.service) {
      constraints.push(where('services', 'array-contains', filters.service));
    }

    // Filtre interprète assermenté
    if (filters.assermente === true) {
      constraints.push(where('assermente', '==', true));
    }

    // Filtre par note minimale
    if (filters.minRating) {
      constraints.push(where('rating', '>=', parseFloat(filters.minRating)));
    }

    // Tri par note (décroissant par défaut)
    if (filters.sortBy === 'rating') {
      constraints.push(orderBy('rating', 'desc'));
    } else if (filters.sortBy === 'reviewCount') {
      constraints.push(orderBy('reviewCount', 'desc'));
    }

    // Limiter le nombre de résultats
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    // Construire la requête
    if (constraints.length > 0) {
      interpretersQuery = query(interpretersQuery, ...constraints);
    }

    // Exécuter la requête
    const querySnapshot = await getDocs(interpretersQuery);

    const interpreters = [];
    querySnapshot.forEach((doc) => {
      interpreters.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Filtres côté client
    // 1. Uniquement les interprètes validés par l'admin
    let filteredInterpreters = interpreters.filter(i => i.verificationStatus === 'accepte');

    if (filters.languageFrom || filters.languageTo) {
      filteredInterpreters = filteredInterpreters.filter(interpreter => {
        if (!interpreter.languages || interpreter.languages.length === 0) return false;

        return interpreter.languages.some(lang => {
          const matchFrom = !filters.languageFrom || lang.source === filters.languageFrom;
          const matchTo = !filters.languageTo || lang.target === filters.languageTo;
          return matchFrom && matchTo;
        });
      });
    }

    // Filtre par tarif maximum (côté client)
    if (filters.maxHourlyRate) {
      filteredInterpreters = filteredInterpreters.filter(interpreter =>
        interpreter.hourlyRate <= parseFloat(filters.maxHourlyRate)
      );
    }

    return { success: true, interpreters: filteredInterpreters };
  } catch (error) {
    console.error('Erreur recherche interprètes:', error);
    return { success: false, error: error.message, interpreters: [] };
  }
};

// Récupérer tous les interprètes (sans filtre)
export const getAllInterpreters = async () => {
  return await searchInterpreters({ sortBy: 'rating' });
};

// Récupérer les interprètes recommandés (meilleurs notes)
export const getRecommendedInterpreters = async () => {
  return await searchInterpreters({
    minRating: 4.0,
    sortBy: 'rating',
    limit: 10
  });
};

// Récupérer le profil complet d'un interprète
export const getInterpretersByIds = async (ids) => {
  if (!ids || ids.length === 0) return { success: true, interpreters: [] };
  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        const [interpDoc, userDoc] = await Promise.all([
          getDoc(doc(db, 'interpreters', id)),
          getDoc(doc(db, 'users', id)),
        ]);
        if (!interpDoc.exists()) return null;
        return { id: interpDoc.id, ...interpDoc.data(), user: userDoc.exists() ? userDoc.data() : {} };
      })
    );
    return { success: true, interpreters: results.filter(Boolean) };
  } catch (error) {
    return { success: false, error: error.message, interpreters: [] };
  }
};

export const getInterpreterById = async (interpreterId) => {
  try {
    // Récupérer le profil interprète
    const interpreterDoc = await getDoc(doc(db, 'interpreters', interpreterId));

    if (!interpreterDoc.exists()) {
      return { success: false, error: 'Interprète non trouvé' };
    }

    // Récupérer aussi les infos utilisateur
    const userDoc = await getDoc(doc(db, 'users', interpreterId));

    const interpreterData = {
      id: interpreterDoc.id,
      ...interpreterDoc.data(),
      user: userDoc.exists() ? userDoc.data() : {}
    };

    return { success: true, interpreter: interpreterData };
  } catch (error) {
    console.error('Erreur récupération interprète:', error);
    return { success: false, error: error.message };
  }
};

// Rechercher par texte libre (nom, bio)
export const searchByText = async (searchText) => {
  try {
    // Note: Pour une vraie recherche textuelle, il faudrait utiliser Algolia ou ElasticSearch
    // Ici on fait une recherche simple côté client

    const allInterpreters = await getAllInterpreters();

    if (!allInterpreters.success) {
      return allInterpreters;
    }

    const searchLower = searchText.toLowerCase();

    const filtered = allInterpreters.interpreters.filter(interpreter => {
      const firstName = (interpreter.firstName || '').toLowerCase();
      const lastName = (interpreter.lastName || '').toLowerCase();
      const bio = (interpreter.bio || '').toLowerCase();
      const city = (interpreter.city || '').toLowerCase();

      return firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             bio.includes(searchLower) ||
             city.includes(searchLower);
    });

    return { success: true, interpreters: filtered };
  } catch (error) {
    console.error('Erreur recherche texte:', error);
    return { success: false, error: error.message, interpreters: [] };
  }
};
