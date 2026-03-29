// Service de messagerie pour GETRAD
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Obtenir ou créer une conversation entre deux utilisateurs
export const getOrCreateConversation = async (userId1, userId2, user1Data, user2Data) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId1)
    );

    const querySnapshot = await getDocs(q);
    let existingConversation = null;

    querySnapshot.forEach((d) => {
      const data = d.data();
      if (data.participants.includes(userId2)) {
        existingConversation = { id: d.id, ...data };
      }
    });

    if (existingConversation) {
      return { success: true, conversation: existingConversation };
    }

    const conversationData = {
      participants: [userId1, userId2],
      participantsData: {
        [userId1]: {
          displayName: user1Data.displayName || '',
          photoURL: user1Data.photoURL || '',
          role: user1Data.role,
        },
        [userId2]: {
          displayName: user2Data.displayName || '',
          photoURL: user2Data.photoURL || '',
          role: user2Data.role,
        },
      },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCount: { [userId1]: 0, [userId2]: 0 },
      contactRevealed: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);

    return {
      success: true,
      conversation: { id: docRef.id, ...conversationData },
    };
  } catch (error) {
    console.error('Erreur getOrCreateConversation:', error);
    return { success: false, error: error.message };
  }
};

// Écouter les conversations en temps réel (ordonnées par dernier message)
export const subscribeToConversations = (userId, callback) => {
  let q;
  try {
    q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
  } catch {
    q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
  }

  return onSnapshot(
    q,
    (snap) => {
      const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(conversations);
    },
    (error) => {
      console.error('subscribeToConversations error:', error.code);
      callback([]);
    }
  );
};

// Envoyer un message (sous-collection conversations/{id}/messages)
export const sendMessage = async (conversationId, senderId, text) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');

    await addDoc(messagesRef, {
      senderId,
      text,
      type: 'text',
      read: false,
      createdAt: serverTimestamp(),
    });

    // Mettre à jour les métadonnées de la conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (conversationDoc.exists()) {
      const data = conversationDoc.data();
      const otherUserId = data.participants.find((id) => id !== senderId);

      await updateDoc(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: (data.unreadCount?.[otherUserId] || 0) + 1,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    return { success: false, error: error.message };
  }
};

// Écouter les messages d'une conversation en temps réel (sous-collection)
export const subscribeToMessages = (conversationId, callback) => {
  let q;
  try {
    q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  } catch {
    q = collection(db, 'conversations', conversationId, 'messages');
  }

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => ({
        id: d.id,
        // Normalise le champ timestamp pour l'affichage (CF utilise createdAt)
        timestamp: d.data().createdAt,
        ...d.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error('subscribeToMessages error:', error.code);
      callback([]);
    }
  );
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCount.${userId}`]: 0,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur markMessagesAsRead:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les conversations d'un utilisateur (one-shot)
export const getUserConversations = async (userId) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    const snap = await getDocs(q);
    return {
      success: true,
      conversations: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  } catch (error) {
    console.error('Erreur getUserConversations:', error);
    return { success: false, error: error.message, conversations: [] };
  }
};
