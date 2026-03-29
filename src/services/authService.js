// Service d'authentification Firebase pour GETRAD
// Ce fichier contient toutes les fonctions pour gérer l'authentification

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Inscription avec email et mot de passe
export const registerWithEmail = async (email, password, userData) => {
  try {
    // 1. Créer le compte Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Mettre à jour le profil avec le nom
    await updateProfile(user, {
      displayName: userData.displayName
    });

    // 3. Créer le document dans Firestore (collection "users")
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: userData.displayName,
      role: userData.role, // 'client' ou 'interpreter'
      phone: userData.phone || '',
      city: userData.city || '',
      photoURL: '',
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. Si c'est un interprète, créer aussi le profil interprète
    if (userData.role === 'interpreter') {
      await setDoc(doc(db, 'interpreters', user.uid), {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        bio: '',
        languages: [],
        specialties: [],
        services: [],
        hourlyRate: 0,
        translationRate: 0,
        city: userData.city || '',
        regions: [],
        availability: {},
        rating: 0,
        reviewCount: 0,
        verified: false,
        cvURL: '',
        kbisURL: '',
        identiteURL: '',
        assermente: false,
        siretNumber: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return { success: true, user };
  } catch (error) {
    console.error('Erreur inscription:', error);
    return { success: false, error: error.message };
  }
};

// Connexion avec email et mot de passe
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Erreur connexion:', error);
    let errorMessage = 'Erreur de connexion';

    // Messages d'erreur en français
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Aucun compte avec cet email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Mot de passe incorrect';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email invalide';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Email ou mot de passe incorrect';
    }

    return { success: false, error: errorMessage };
  }
};

// Déconnexion
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return { success: false, error: error.message };
  }
};

// Réinitialisation de mot de passe
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    let errorMessage = 'Erreur lors de l\'envoi de l\'email';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Aucun compte avec cet email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email invalide';
    }

    return { success: false, error: errorMessage };
  }
};

// Récupérer les données utilisateur depuis Firestore
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'Utilisateur non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération données:', error);
    return { success: false, error: error.message };
  }
};
