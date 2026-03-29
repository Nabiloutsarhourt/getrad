// Service de gestion des profils — GETRAD Web
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';

export const updateUserProfile = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: new Date() });
    if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return { success: false, error: error.message };
  }
};

export const updateInterpreterProfile = async (userId, data) => {
  try {
    await setDoc(doc(db, 'interpreters', userId), { ...data, updatedAt: new Date() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour profil interprète:', error);
    return { success: false, error: error.message };
  }
};

export const getInterpreterProfile = async (userId) => {
  try {
    const interpreterDoc = await getDoc(doc(db, 'interpreters', userId));
    if (interpreterDoc.exists()) return { success: true, data: interpreterDoc.data() };
    return { success: false, error: 'Profil interprète non trouvé' };
  } catch (error) {
    console.error('Erreur récupération profil interprète:', error);
    return { success: false, error: error.message };
  }
};

// Accepts File object (web)
export const uploadProfileImage = async (userId, file) => {
  try {
    const imageRef = ref(storage, `profiles/${userId}/photo.jpg`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    await updateUserProfile(userId, { photoURL: downloadURL });
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    }
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Erreur upload image:', error);
    return { success: false, error: error.message };
  }
};

// type: 'cv' | 'kbis' | 'identite'
export const uploadDocument = async (userId, type, file) => {
  try {
    const extension = file.name ? file.name.split('.').pop() : 'pdf';
    const docRef = ref(storage, `interpreters/${userId}/${type}.${extension}`);
    await uploadBytes(docRef, file);
    const downloadURL = await getDownloadURL(docRef);

    const updateData = {};
    if (type === 'cv') updateData.cvURL = downloadURL;
    else if (type === 'kbis') updateData.kbisURL = downloadURL;
    else if (type === 'identite') updateData.identiteURL = downloadURL;

    await updateInterpreterProfile(userId, updateData);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Erreur upload document:', error);
    return { success: false, error: error.message };
  }
};
