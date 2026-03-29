// Service de gestion des missions - GETRAD
import {
  collection, doc, addDoc, getDoc, updateDoc,
  query, where, onSnapshot, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

// ─── Créer une nouvelle mission ────────────────────────────────────────────
// La Cloud Function onMissionCreated se déclenchera automatiquement
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
      // Statut initial : la Cloud Function prendra le relais
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

// ─── Récupérer une mission par son ID ─────────────────────────────────────
export const getMission = async (missionId) => {
  try {
    const snap = await getDoc(doc(db, 'missions', missionId));
    if (!snap.exists()) return { success: false, error: 'Mission introuvable' };
    return { success: true, mission: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── Écouter une mission en temps réel ────────────────────────────────────
export const subscribeMission = (missionId, callback) => {
  return onSnapshot(
    doc(db, 'missions', missionId),
    (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    },
    (error) => {
      console.error('subscribeMission error:', error.code, error.message);
    }
  );
};

// ─── Écouter les offres entrantes pour un interprète ─────────────────────
// Retourne les missions où currentOfferedTo == userId et status == "offered"
export const subscribeIncomingOffer = (userId, callback) => {
  const q = query(
    collection(db, 'missions'),
    where('currentOfferedTo', '==', userId),
    where('status', '==', 'offered')
  );
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      const mission = { id: snap.docs[0].id, ...snap.docs[0].data() };
      callback(mission);
    } else {
      callback(null);
    }
  });
};

// ─── Accepter ou refuser une offre (appel Cloud Function) ─────────────────
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

// ─── Liste des missions d'un client ───────────────────────────────────────
export const subscribeClientMissions = (clientId, callback) => {
  const q = query(
    collection(db, 'missions'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const missions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(missions);
  });
};

// ─── Liste des missions acceptées par un interprète ──────────────────────
export const subscribeInterpreterMissions = (interpreterId, callback) => {
  const q = query(
    collection(db, 'missions'),
    where('assignedTo', '==', interpreterId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const missions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(missions);
  }, (error) => {
    console.error('subscribeInterpreterMissions error:', error.code, error.message);
  });
};

// ─── Annuler une mission ───────────────────────────────────────────────────
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

// ─── Labels et couleurs des statuts ──────────────────────────────────────
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
