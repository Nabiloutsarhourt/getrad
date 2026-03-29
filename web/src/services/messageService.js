// Service de messagerie — GETRAD Web
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
import { db } from '../lib/firebase';

export const getOrCreateConversation = async (userId1, userId2, user1Data, user2Data) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId1)
    );
    const snap = await getDocs(q);
    let existing = null;
    snap.forEach((d) => {
      const data = d.data();
      if (data.participants.includes(userId2)) existing = { id: d.id, ...data };
    });
    if (existing) return { success: true, conversation: existing };

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
    return { success: true, conversation: { id: docRef.id, ...conversationData } };
  } catch (error) {
    console.error('Erreur getOrCreateConversation:', error);
    return { success: false, error: error.message };
  }
};

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
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (error) => { console.error('subscribeToConversations error:', error.code); callback([]); }
  );
};

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

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    if (conversationDoc.exists()) {
      const data = conversationDoc.data();
      const otherUserId = data.participants.find(id => id !== senderId);
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
    (snap) => callback(snap.docs.map(d => ({ id: d.id, timestamp: d.data().createdAt, ...d.data() }))),
    (error) => { console.error('subscribeToMessages error:', error.code); callback([]); }
  );
};

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
