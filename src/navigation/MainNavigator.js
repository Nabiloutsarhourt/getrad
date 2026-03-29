// Navigateur principal — tabs + écrans modaux/détail
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../config/constants';

// ── Onglets ──────────────────────────────────────────────────────────────────
import ClientTabs from './ClientTabs';
import InterpreterTabs from './InterpreterTabs';
import AdminTabs from './AdminTabs';

// ── Écrans détail / modal ────────────────────────────────────────────────────
import InterpreterDetailScreen from '../screens/client/InterpreterDetailScreen';
import BookingFormScreen from '../screens/client/BookingFormScreen';
import BookingDetailScreen from '../screens/common/BookingDetailScreen';
import PostMissionScreen from '../screens/client/PostMissionScreen';
import MissionTrackingScreen from '../screens/client/MissionTrackingScreen';
import ChatScreen from '../screens/common/ChatScreen';
import ReviewScreen from '../screens/client/ReviewScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';

// ── Écrans interprète — vérification ────────────────────────────────────────
import VerificationScreen from '../screens/interpreter/VerificationScreen';
import VerificationStatusScreen from '../screens/interpreter/VerificationStatusScreen';

// ── Écrans interprète ────────────────────────────────────────────────────────
import CGUScreen from '../screens/interpreter/CGUScreen';
import SubscriptionScreen from '../screens/interpreter/SubscriptionScreen';
import PaywallScreen from '../screens/interpreter/PaywallScreen';
import ManageSubscriptionScreen from '../screens/interpreter/ManageSubscriptionScreen';
import IncomingOfferScreen from '../screens/interpreter/IncomingOfferScreen';
import AvailabilityRequestScreen from '../screens/client/AvailabilityRequestScreen';
import SuggestedProfilesScreen from '../screens/client/SuggestedProfilesScreen';
import AvailabilityScreen from '../screens/interpreter/AvailabilityScreen';
import InterpreterStatsScreen from '../screens/interpreter/InterpreterStatsScreen';

const Stack = createStackNavigator();

// Header MD3
const headerOptions = {
  headerStyle: {
    backgroundColor: COLORS.surfaceContainerLowest,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  headerTintColor: COLORS.primary,
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 17,
    color: COLORS.onSurface,
  },
  headerBackTitleVisible: false,
};

// Écran de chargement pendant userData
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, gap: 16 }}>
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      <View style={{ width: 5, height: 14, borderRadius: 3, backgroundColor: COLORS.primaryFixedDim }} />
      <View style={{ width: 5, height: 24, borderRadius: 3, backgroundColor: COLORS.primary }} />
      <View style={{ width: 5, height: 14, borderRadius: 3, backgroundColor: COLORS.primaryFixedDim }} />
    </View>
    <ActivityIndicator color={COLORS.primary} />
  </View>
);

// Sélecteur d'onglets selon le rôle + statut de vérification
const RoleTabs = (props) => {
  const { userData, loading, verification } = useAuth();

  if (loading || !userData) return <LoadingScreen />;

  // Admin → panneau admin dédié (pas de vérification requise)
  if (userData.role === 'admin') return <AdminTabs {...props} />;

  if (userData.role === 'interpreter') {
    // undefined = listener pas encore chargé
    if (verification === undefined) return <LoadingScreen />;
    // Pas de dossier soumis ou dossier rejeté → formulaire
    if (!verification || verification.status === 'rejete') {
      return <VerificationScreen existingData={verification} />;
    }
    // Dossier en attente → écran d'attente
    if (verification.status === 'en_attente') {
      return <VerificationStatusScreen />;
    }
    // verification.status === 'accepte' → accès normal
  }

  return userData.role === 'client'
    ? <ClientTabs {...props} />
    : <InterpreterTabs {...props} />;
};

const MainNavigator = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    {/* ── Onglets principaux (pas de header) ── */}
    <Stack.Screen
      name="Tabs"
      component={RoleTabs}
      options={{ headerShown: false }}
    />

    {/* ── Écrans partagés ── */}
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ title: 'Mon profil' }}
    />
    <Stack.Screen
      name="BookingDetail"
      component={BookingDetailScreen}
      options={{ title: 'Détail réservation' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }) => ({
        title: route.params?.otherUserData?.displayName || 'Discussion',
      })}
    />
    <Stack.Screen
      name="Review"
      component={ReviewScreen}
      options={{ title: 'Laisser un avis' }}
    />

    {/* ── Écrans client ── */}
    <Stack.Screen
      name="InterpreterDetail"
      component={InterpreterDetailScreen}
      options={{ title: 'Profil', headerTransparent: true, headerTintColor: COLORS.onPrimary }}
    />
    <Stack.Screen
      name="BookingForm"
      component={BookingFormScreen}
      options={{ title: 'Demander une réservation' }}
    />
    <Stack.Screen
      name="PostMission"
      component={PostMissionScreen}
      options={{ title: 'Poster une mission' }}
    />
    <Stack.Screen
      name="MissionTracking"
      component={MissionTrackingScreen}
      options={{ title: 'Suivi de mission', headerLeft: () => null }}
    />

    {/* ── Écrans interprète — abonnement ── */}
    <Stack.Screen
      name="CGU"
      component={CGUScreen}
      options={{ title: "Conditions d'utilisation" }}
    />
    <Stack.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={{ title: 'Abonnement GETRAD' }}
    />
    <Stack.Screen
      name="Paywall"
      component={PaywallScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ManageSubscription"
      component={ManageSubscriptionScreen}
      options={{ title: 'Mon abonnement' }}
    />
    <Stack.Screen
      name="IncomingOffer"
      component={IncomingOfferScreen}
      options={{ headerShown: false }}
    />

    {/* ── Phase 6 — recherche directe ── */}
    <Stack.Screen
      name="AvailabilityRequest"
      component={AvailabilityRequestScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="SuggestedProfiles"
      component={SuggestedProfilesScreen}
      options={{ title: 'Prestataires suggérés' }}
    />
    <Stack.Screen
      name="Availability"
      component={AvailabilityScreen}
      options={{ title: 'Mes disponibilités' }}
    />
    <Stack.Screen
      name="InterpreterStats"
      component={InterpreterStatsScreen}
      options={{ title: 'Mes statistiques' }}
    />
  </Stack.Navigator>
);

export default MainNavigator;
