// Onglets principaux pour les CLIENTS — MD3
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToConversations } from '../services/messageService';
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import InterpretersListScreen from '../screens/client/InterpretersListScreen';
import ClientBookingsScreen from '../screens/client/ClientBookingsScreen';
import ConversationsListScreen from '../screens/common/ConversationsListScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
  Home:                { active: 'home',                  inactive: 'home-outline',                  label: 'Accueil' },
  InterpretersListTab: { active: 'search',                inactive: 'search-outline',                label: 'Explorer' },
  ClientBookingsTab:   { active: 'receipt',               inactive: 'receipt-outline',               label: 'Réservations' },
  MessagesTab:         { active: 'chatbubble-ellipses',   inactive: 'chatbubble-ellipses-outline',   label: 'Messages' },
};

function TabIcon({ name, focused, badge }) {
  const { active, inactive, label } = TAB_CONFIG[name];
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <View>
        <Ionicons
          name={focused ? active : inactive}
          size={21}
          color={focused ? COLORS.primary : COLORS.onSurfaceVariant}
        />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

const ClientTabs = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      const total = convs.reduce((sum, c) => sum + (c.unreadCount?.[user.uid] || 0), 0);
      setUnreadCount(total);
    });
    return () => unsub();
  }, [user?.uid]);

  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ focused }) => (
        <TabIcon
          name={route.name}
          focused={focused}
          badge={route.name === 'MessagesTab' ? unreadCount : 0}
        />
      ),
    })}
  >
    <Tab.Screen name="Home" component={ClientHomeScreen} />
    <Tab.Screen name="InterpretersListTab" component={InterpretersListScreen} />
    <Tab.Screen name="ClientBookingsTab" component={ClientBookingsScreen} />
    <Tab.Screen name="MessagesTab" component={ConversationsListScreen} />
  </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 60,
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryFixed,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
});

export default ClientTabs;
