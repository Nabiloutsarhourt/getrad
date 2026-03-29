// Service de gestion des profils pour GETRAD
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

// Mettre à jour le profil utilisateur (données de base)
export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date()
    });

    // Mettre à jour aussi le displayName dans Firebase Auth si fourni
    if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour le profil interprète (setDoc merge = sécurisé si doc absent)
export const updateInterpreterProfile = async (userId, data) => {
  try {
    const interpreterRef = doc(db, 'interpreters', userId);
    await setDoc(interpreterRef, {
      ...data,
      updatedAt: new Date()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour profil interprète:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer le profil interprète
export const getInterpreterProfile = async (userId) => {
  try {
    const interpreterRef = doc(db, 'interpreters', userId);
    const interpreterDoc = await getDoc(interpreterRef);

    if (interpreterDoc.exists()) {
      return { success: true, data: interpreterDoc.data() };
    } else {
      return { success: false, error: 'Profil interprète non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération profil interprète:', error);
    return { success: false, error: error.message };
  }
};

// Upload d'image (photo de profil)
export const uploadProfileImage = async (userId, imageUri) => {
  try {
    // Convertir l'URI en blob pour l'upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Référence vers le fichier dans Firebase Storage
    const imageRef = ref(storage, `profiles/${userId}/photo.jpg`);

    // Upload du fichier
    await uploadBytes(imageRef, blob);

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(imageRef);

    // Mettre à jour le profil utilisateur avec l'URL de la photo
    await updateUserProfile(userId, { photoURL: downloadURL });

    // Mettre à jour aussi Firebase Auth
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
    }

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Erreur upload image:', error);
    return { success: false, error: error.message };
  }
};

// Upload de document (CV, diplôme)
export const uploadDocument = async (userId, fileUri, type) => {
  try {
    // type peut être 'cv' ou 'diploma'
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Référence vers le fichier
    const extension = fileUri.split('.').pop() || 'pdf';
    const docRef = ref(storage, `interpreters/${userId}/${type}.${extension}`);

    // Upload du fichier
    await uploadBytes(docRef, blob);

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(docRef);

    // Mettre à jour le profil interprète
    const updateData = {};
    if (type === 'cv') {
      updateData.cvURL = downloadURL;
    } else if (type === 'kbis') {
      updateData.kbisURL = downloadURL;
    } else if (type === 'identite') {
      updateData.identiteURL = downloadURL;
    }

    await updateInterpreterProfile(userId, updateData);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Erreur upload document:', error);
    return { success: false, error: error.message };
  }
};

// Ajouter une langue au profil interprète
export const addLanguage = async (userId, language) => {
  try {
    const interpreterRef = doc(db, 'interpreters', userId);
    const interpreterDoc = await getDoc(interpreterRef);

    if (interpreterDoc.exists()) {
      const currentLanguages = interpreterDoc.data().languages || [];
      currentLanguages.push(language);

      await updateDoc(interpreterRef, {
        languages: currentLanguages,
        updatedAt: new Date()
      });

      return { success: true };
    } else {
      return { success: false, error: 'Profil interprète non trouvé' };
    }
  } catch (error) {
    console.error('Erreur ajout langue:', error);
    return { success: false, error: error.message };
  }
};

// Supprimer une langue du profil interprète
export const removeLanguage = async (userId, languageIndex) => {
  try {
    const interpreterRef = doc(db, 'interpreters', userId);
    const interpreterDoc = await getDoc(interpreterRef);

    if (interpreterDoc.exists()) {
      const currentLanguages = interpreterDoc.data().languages || [];
      currentLanguages.splice(languageIndex, 1);

      await updateDoc(interpreterRef, {
        languages: currentLanguages,
        updatedAt: new Date()
      });

      return { success: true };
    } else {
      return { success: false, error: 'Profil interprète non trouvé' };
    }
  } catch (error) {
    console.error('Erreur suppression langue:', error);
    return { success: false, error: error.message };
  }
};
