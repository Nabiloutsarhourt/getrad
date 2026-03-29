// Service de vérification des prestataires — GETRAD
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Soumettre (ou re-soumettre) une demande de vérification
export const submitVerification = async (uid, data) => {
  try {
    await setDoc(doc(db, 'verifications', uid), {
      uid,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      siretNumber: data.siretNumber,
      kbisURL: data.kbisURL || '',
      identiteURL: data.identiteURL || '',
      status: 'en_attente',
      submittedAt: new Date(),
      reviewedAt: null,
      rejectionReason: null,
      rejectionComment: null,
    });

    // Miroir sur le doc interprète (setDoc merge = crée si absent)
    await setDoc(doc(db, 'interpreters', uid), {
      verificationStatus: 'en_attente',
      updatedAt: new Date(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Erreur soumission vérification:', error);
    return { success: false, error: error.message };
  }
};

// Écouter le statut de vérification en temps réel
export const subscribeToVerification = (uid, callback) => {
  return onSnapshot(
    doc(db, 'verifications', uid),
    (snap) => callback(snap.exists() ? snap.data() : null),
    (error) => {
      console.error('subscribeToVerification error:', error.code, error.message);
      callback(null); // Fallback : traiter comme "pas de dossier soumis"
    }
  );
};

// Upload d'un document de vérification (kbis ou identite)
export const uploadVerificationDocument = async (uid, fileUri, type) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const extension = fileUri.split('.').pop() || 'pdf';
    // Stocké sous interpreters/{uid}/verifications/ → couvert par la règle Storage interpreters/**
    const storageRef = ref(storage, `interpreters/${uid}/verifications/${type}.${extension}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Erreur upload document vérification:', error);
    return { success: false, error: error.message };
  }
};
