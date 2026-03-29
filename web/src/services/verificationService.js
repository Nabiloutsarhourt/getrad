// Service de vérification — GETRAD Web
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

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

export const subscribeToVerification = (uid, callback) => {
  return onSnapshot(
    doc(db, 'verifications', uid),
    (snap) => callback(snap.exists() ? snap.data() : null),
    (error) => {
      console.error('subscribeToVerification error:', error.code, error.message);
      callback(null);
    }
  );
};

// Accepts File object (web)
export const uploadVerificationDocument = async (uid, type, file) => {
  try {
    const extension = file.name ? file.name.split('.').pop() : 'pdf';
    const storageRef = ref(storage, `interpreters/${uid}/verifications/${type}.${extension}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Erreur upload document vérification:', error);
    return { success: false, error: error.message };
  }
};
