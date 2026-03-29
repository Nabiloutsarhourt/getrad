// Navigateur racine — bascule Auth / PhoneVerif / Main + ref de navigation pour les notifications
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import { COLORS } from '../config/constants';
import { setupNotificationHandlers } from '../services/notificationService';

// Ref exportée pour permettre la navigation depuis les services (ex: notifications)
export const navigationRef = React.createRef();

const RootNavigator = () => {
  const { isAuthenticated, loading, userData, phoneVerified } = useAuth();

  useEffect(() => {
    const cleanup = setupNotificationHandlers(navigationRef);
    return cleanup;
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Authenticated but phone not yet verified → show verification gate
  // Only gate users who explicitly have phoneVerified: false (newly registered)
  // Users without the field (old accounts) pass through
  if (isAuthenticated && userData && userData.phoneVerified === false) {
    return <PhoneVerificationScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
});

export default RootNavigator;
