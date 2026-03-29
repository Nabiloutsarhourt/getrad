// Service administration — GETRAD Web
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const getAllVerifications = async (status) => {
  try {
    let snap;
    try {
      snap = await getDocs(query(collection(db, 'verifications'), orderBy('submittedAt', 'desc')));
    } catch {
      snap = await getDocs(collection(db, 'verifications'));
    }
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (status) data = data.filter(v => v.status === status);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

export const approveVerification = async (uid) => {
  try {
    await updateDoc(doc(db, 'verifications', uid), {
      status: 'accepte',
      reviewedAt: new Date(),
      rejectionReason: null,
      rejectionComment: null,
    });
    await setDoc(doc(db, 'interpreters', uid), {
      verificationStatus: 'accepte',
      updatedAt: new Date(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const rejectVerification = async (uid, reason, comment) => {
  try {
    await updateDoc(doc(db, 'verifications', uid), {
      status: 'rejete',
      reviewedAt: new Date(),
      rejectionReason: reason,
      rejectionComment: comment || '',
    });
    await setDoc(doc(db, 'interpreters', uid), {
      verificationStatus: 'rejete',
      updatedAt: new Date(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const usersSnap = await getDocs(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    ).catch(() => getDocs(collection(db, 'users')));

    const interpretersSnap = await getDocs(collection(db, 'interpreters'))
      .catch(() => ({ docs: [] }));

    const interpreterMap = {};
    interpretersSnap.docs.forEach(d => { interpreterMap[d.id] = d.data(); });

    const users = usersSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      interpreterProfile: interpreterMap[d.id] || null,
    }));

    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

export const suspendUser = async (uid, suspended) => {
  try {
    await updateDoc(doc(db, 'users', uid), { suspended, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const PLAN_PRICES = { discovery: 19.99, professional: 39.99, premium: 69.99 };

export const getDashboardStats = async () => {
  try {
    const [usersSnap, missionsSnap, subsSnap, verifsSnap] = await Promise.all([
      getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'missions')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'subscriptions')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'verifications')).catch(() => ({ docs: [] })),
    ]);

    const users = usersSnap.docs.map(d => d.data());
    const missions = missionsSnap.docs.map(d => d.data());
    const subs = subsSnap.docs.map(d => d.data());
    const verifs = verifsSnap.docs.map(d => d.data());

    const activeSubs = subs.filter(s => s.status === 'active' || s.status === 'trialing');
    const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0);

    return {
      success: true,
      stats: {
        totalUsers: users.length,
        clients: users.filter(u => u.role === 'client').length,
        interpreters: users.filter(u => u.role === 'interpreter').length,
        pendingVerifications: verifs.filter(v => v.status === 'en_attente').length,
        acceptedVerifications: verifs.filter(v => v.status === 'accepte').length,
        rejectedVerifications: verifs.filter(v => v.status === 'rejete').length,
        activeSubscriptions: activeSubs.length,
        mrr,
        subscriptionsByPlan: {
          discovery: activeSubs.filter(s => s.plan === 'discovery').length,
          professional: activeSubs.filter(s => s.plan === 'professional').length,
          premium: activeSubs.filter(s => s.plan === 'premium').length,
        },
        missions: {
          total: missions.length,
          open: missions.filter(m => ['open', 'searching', 'offered'].includes(m.status)).length,
          accepted: missions.filter(m => m.status === 'accepted').length,
          completed: missions.filter(m => m.status === 'completed').length,
          cancelled: missions.filter(m => ['cancelled', 'no_match'].includes(m.status)).length,
        },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllSubscriptions = async () => {
  try {
    const snap = await getDocs(collection(db, 'subscriptions'));
    const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const withUsers = await Promise.all(
      subs.map(async (sub) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', sub.id));
          return { ...sub, user: userDoc.exists() ? userDoc.data() : null };
        } catch {
          return sub;
        }
      })
    );
    return { success: true, data: withUsers };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};
