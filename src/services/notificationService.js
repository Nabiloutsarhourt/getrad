// Service de notifications push pour GETRAD
// Utilise expo-notifications + Expo Push API
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

let Constants = null;
try { Constants = require('expo-constants').default; } catch (_) {}

// Chargement dynamique d'expo-notifications (évite crash sur web)
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (_) {}

/**
 * Configure le comportement des notifications quand l'app est au premier plan
 */
export const configureNotifications = () => {
  if (!Notifications || Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Demande la permission et enregistre le token Expo Push dans Firestore
 * @param {string} userId — UID Firebase de l'utilisateur connecté
 * @returns {string|null} — token Expo Push ou null
 */
export const registerForPushNotifications = async (userId) => {
  if (!Notifications || Platform.OS === 'web') return null;

  try {
    // Vérifier / demander la permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission push refusée par l\'utilisateur');
      return null;
    }

    // Obtenir le token Expo Push (projectId requis en SDK 46+)
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResult.data;

    if (token) {
      await updateDoc(doc(db, 'users', userId), { expoPushToken: token });
    }

    // Sur Android, créer le canal par défaut
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'GETRAD',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#004ac6',
      });
    }

    return token;
  } catch (error) {
    console.error('registerForPushNotifications error:', error.message);
    return null;
  }
};

/**
 * Installe les listeners de navigation sur tap d'une notification
 * @param {object} navigationRef — ref React Navigation
 * @returns {function} — cleanup function
 */
export const setupNotificationHandlers = (navigationRef) => {
  if (!Notifications || Platform.OS === 'web') return () => {};

  // Tap sur notification (app en arrière-plan ou fermée)
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.screen && navigationRef?.current) {
        navigationRef.current.navigate(data.screen, data.params || {});
      }
    },
  );

  return () => {
    Notifications.removeNotificationSubscription(responseListener);
  };
};
