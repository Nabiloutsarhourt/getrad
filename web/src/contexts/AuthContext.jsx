'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { subscribeToSubscription, isSubscriptionActive } from '../services/subscriptionService';
import { subscribeToVerification } from '../services/verificationService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [verification, setVerification] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSubscription = null;
    let unsubscribeVerification = null;
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeSubscription) { unsubscribeSubscription(); unsubscribeSubscription = null; }
      if (unsubscribeVerification) { unsubscribeVerification(); unsubscribeVerification = null; }
      if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }

      if (firebaseUser) {
        setUser(firebaseUser);

        unsubscribeUser = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData(data);

              if (data.role === 'interpreter') {
                if (!unsubscribeSubscription) {
                  unsubscribeSubscription = subscribeToSubscription(
                    firebaseUser.uid,
                    (sub) => setSubscription(sub)
                  );
                }
                if (!unsubscribeVerification) {
                  unsubscribeVerification = subscribeToVerification(
                    firebaseUser.uid,
                    (verif) => setVerification(verif)
                  );
                }
              } else {
                setSubscription(null);
                setVerification(null);
              }
            } else {
              setUserData(null);
              setVerification(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('User doc listener error:', error);
            setUserData(null);
            setVerification(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserData(null);
        setSubscription(null);
        setVerification(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSubscription) unsubscribeSubscription();
      if (unsubscribeVerification) unsubscribeVerification();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const value = {
    user,
    userData,
    subscription,
    verification,
    loading,
    isAuthenticated: !!user,
    isClient: userData?.role === 'client',
    isInterpreter: userData?.role === 'interpreter',
    isAdmin: userData?.role === 'admin',
    phoneVerified: userData?.phoneVerified !== false,
    hasActiveSubscription: isSubscriptionActive(subscription),
    isVerified: verification?.status === 'accepte',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
