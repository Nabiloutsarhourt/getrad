// Onglets admin — GETRAD
import { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS } from '../config/constants';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminFinanceScreen from '../screens/admin/AdminFinanceScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
  AdminDashboard:   { active: 'home',             inactive: 'home-outline',             label: 'Dashboard'    },
  AdminValidations: { active: 'shield-checkmark', inactive: 'shield-checkmark-outline', label: 'Validations'  },
  AdminUsers:       { active: 'people',           inactive: 'people-outline',           label: 'Utilisateurs' },
  AdminFinance:     { active: 'card',             inactive: 'card-outline',             label: 'Finance'      },
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

const AdminTabs = () => {
  const [pendingCount, setPendingCount] = useState(0);

  // Charge le nombre de dossiers en attente au montage
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'verifications'), where('status', '==', 'en_attente'))
        );
        setPendingCount(snap.size);
      } catch {
        setPendingCount(0);
      }
    };
    fetchPending();
  }, []);

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
            badge={route.name === 'AdminValidations' ? pendingCount : 0}
          />
        ),
      })}
      // Listener pour rafraîchir le badge quand on change d'onglet
      screenListeners={{
        tabPress: async () => {
          try {
            const snap = await getDocs(
              query(collection(db, 'verifications'), where('status', '==', 'en_attente'))
            );
            setPendingCount(snap.size);
          } catch { /* silencieux */ }
        },
      }}
    >
      <Tab.Screen name="AdminDashboard"   component={AdminDashboardScreen}    />
      <Tab.Screen name="AdminValidations" component={AdminVerificationsScreen} />
      <Tab.Screen name="AdminUsers"       component={AdminUsersScreen}         />
      <Tab.Screen name="AdminFinance"     component={AdminFinanceScreen}       />
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 60,
  },
  iconWrapActive: { backgroundColor: COLORS.primaryFixed },
  label: { fontSize: 10, fontWeight: '600', color: COLORS.onSurfaceVariant, letterSpacing: 0.2 },
  labelActive: { color: COLORS.primary, fontWeight: '800' },
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

export default AdminTabs;
