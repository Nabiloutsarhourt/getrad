// Service de gestion des missions — GETRAD Web
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';

export const createMission = async (missionData, clientId) => {
  try {
    const docRef = await addDoc(collection(db, 'missions'), {
      clientId,
      title: missionData.title || '',
      description: missionData.description || '',
      service: missionData.service,
      languageFrom: missionData.languageFrom,
      languageTo: missionData.languageTo,
      date: missionData.date,
      startTime: missionData.startTime || '',
      endTime: missionData.endTime || '',
      location: missionData.location || 'À distance',
      region: missionData.region || null,
      budget: missionData.budget || null,
      status: 'searching',
      currentOfferedTo: null,
      offerExpiresAt: null,
      assignedTo: null,
      candidateQueue: [],
      currentQueueIndex: 0,
      offerHistory: [],
      retryCount: 0,
      maxRetries: 48,
      contactRevealed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, missionId: docRef.id };
  } catch (error) {
    console.error('Erreur createMission:', error);
    return { success: false, error: error.message };
  }
};

export const getMission = async (missionId) => {
  try {
    const snap = await getDoc(doc(db, 'missions', missionId));
    if (!snap.exists()) return { success: false, error: 'Mission introuvable' };
    return { success: true, mission: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeMission = (missionId, callback) => {
  return onSnapshot(
    doc(db, 'missions', missionId),
    (snap) => { if (snap.exists()) callback({ id: snap.id, ...snap.data() }); },
    (error) => console.error('subscribeMission error:', error.code)
  );
};

export const subscribeIncomingOffer = (userId, callback) => {
  const q = query(
    collection(db, 'missions'),
    where('currentOfferedTo', '==', userId),
    where('status', '==', 'offered')
  );
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } else {
      callback(null);
    }
  });
};

export const respondToOffer = async (missionId, response) => {
  try {
    const processOffer = httpsCallable(functions, 'processOffer');
    const result = await processOffer({ missionId, response });
    return { success: true, ...result.data };
  } catch (error) {
    console.error('Erreur respondToOffer:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeClientMissions = (clientId, callback) => {
  const q = query(
    collection(db, 'missions'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (error) => { console.error('subscribeClientMissions error:', error.code); callback([]); }
  );
};

export const subscribeInterpreterMissions = (interpreterId, callback) => {
  const q = query(
    collection(db, 'missions'),
    where('assignedTo', '==', interpreterId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (error) => { console.error('subscribeInterpreterMissions error:', error.code); callback([]); }
  );
};

export const cancelMission = async (missionId) => {
  try {
    await updateDoc(doc(db, 'missions', missionId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const MISSION_STATUS_LABELS = {
  searching: 'Recherche en cours...',
  offered: 'Offre envoyée',
  accepted: 'Acceptée',
  no_match: 'Aucun prestataire disponible',
  expired: 'Expirée',
  cancelled: 'Annulée',
  completed: 'Terminée',
};

export const MISSION_STATUS_COLORS = {
  searching: '#F59E0B',
  offered: '#3B82F6',
  accepted: '#10B981',
  no_match: '#EF4444',
  expired: '#9CA3AF',
  cancelled: '#9CA3AF',
  completed: '#6B7280',
};

export const MISSION_STATUS_TAILWIND = {
  searching: 'bg-yellow-100 text-yellow-800',
  offered: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  no_match: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-gray-100 text-gray-700',
};
