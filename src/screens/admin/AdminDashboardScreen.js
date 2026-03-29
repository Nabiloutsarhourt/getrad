// Tableau de bord admin — GETRAD
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { getDashboardStats } from '../../services/adminService';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const result = await getDashboardStats();
    if (result.success) setStats(result.stats);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const s = stats || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View>
          <Text style={styles.heroTitle}>Admin GETRAD</Text>
          <Text style={styles.heroSub}>Vue d'ensemble de la plateforme</Text>
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          <Text style={styles.heroBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Alerte validations en attente */}
      {s.pendingVerifications > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, SHADOWS.subtle]}
          onPress={() => navigation.navigate('AdminValidations')}
          activeOpacity={0.8}
        >
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>
            {s.pendingVerifications} dossier{s.pendingVerifications > 1 ? 's' : ''} en attente de validation
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.error} />
        </TouchableOpacity>
      )}

      {/* KPI — Utilisateurs */}
      <SectionTitle title="Utilisateurs" icon="people-outline" />
      <View style={styles.kpiGrid}>
        <KpiCard label="Total" value={s.totalUsers || 0} icon="person-outline" color={COLORS.primary} />
        <KpiCard label="Clients" value={s.clients || 0} icon="briefcase-outline" color="#6366F1" />
        <KpiCard label="Prestataires" value={s.interpreters || 0} icon="mic-outline" color="#0EA5E9" />
        <KpiCard label="Validés" value={s.acceptedVerifications || 0} icon="checkmark-circle-outline" color={COLORS.secondary} />
      </View>

      {/* KPI — Finance */}
      <SectionTitle title="Finance" icon="card-outline" />
      <View style={[styles.mrrCard, SHADOWS.card]}>
        <View>
          <Text style={styles.mrrLabel}>MRR estimé</Text>
          <Text style={styles.mrrValue}>{(s.mrr || 0).toLocaleString('fr-FR')} €</Text>
          <Text style={styles.mrrSub}>{s.activeSubscriptions || 0} abonnements actifs</Text>
        </View>
        <View style={styles.mrrIcon}>
          <Ionicons name="trending-up" size={28} color={COLORS.secondary} />
        </View>
      </View>
      <View style={styles.kpiGrid}>
        <KpiCard label="Découverte" value={s.subscriptionsByPlan?.discovery || 0} icon="leaf-outline" color="#F59E0B" small />
        <KpiCard label="Pro" value={s.subscriptionsByPlan?.professional || 0} icon="rocket-outline" color="#8B5CF6" small />
        <KpiCard label="Premium" value={s.subscriptionsByPlan?.premium || 0} icon="diamond-outline" color="#EF4444" small />
      </View>

      {/* KPI — Missions */}
      <SectionTitle title="Missions" icon="receipt-outline" />
      <View style={[styles.missionsCard, SHADOWS.subtle]}>
        <MissionRow label="Total" value={s.missions?.total || 0} />
        <MissionRow label="En recherche" value={s.missions?.open || 0} color="#F59E0B" />
        <MissionRow label="En cours" value={s.missions?.accepted || 0} color={COLORS.primary} />
        <MissionRow label="Terminées" value={s.missions?.completed || 0} color={COLORS.secondary} />
        <MissionRow label="Annulées" value={s.missions?.cancelled || 0} color={COLORS.error} last />
      </View>

      {/* KPI — Demandes de disponibilité */}
      <SectionTitle title="Demandes de disponibilité" icon="radio-button-on-outline" />
      <View style={[styles.missionsCard, SHADOWS.subtle]}>
        <MissionRow label="Total" value={s.availabilityRequests?.total || 0} />
        <MissionRow label="En attente" value={s.availabilityRequests?.pending || 0} color="#F59E0B" />
        <MissionRow label="Acceptées" value={s.availabilityRequests?.accepted || 0} color={COLORS.secondary} />
        <MissionRow label="Refusées" value={s.availabilityRequests?.refused || 0} color="#6366F1" />
        <MissionRow label="Expirées" value={s.availabilityRequests?.expired || 0} color={COLORS.error} last />
      </View>

      {/* Liens rapides */}
      <SectionTitle title="Accès rapide" icon="grid-outline" />
      <View style={styles.quickGrid}>
        <QuickLink icon="shield-checkmark-outline" label="Validations" badge={s.pendingVerifications} color={COLORS.error} onPress={() => navigation.navigate('AdminValidations')} />
        <QuickLink icon="people-outline" label="Utilisateurs" color={COLORS.primary} onPress={() => navigation.navigate('AdminUsers')} />
        <QuickLink icon="card-outline" label="Finance" color={COLORS.secondary} onPress={() => navigation.navigate('AdminFinance')} />
        <QuickLink icon="person-outline" label="RH" color="#8B5CF6" onPress={() => navigation.navigate('AdminUsers')} />
      </View>
    </ScrollView>
  );
};

// ── Composants ─────────────────────────────────────────────────────────────

const SectionTitle = ({ title, icon }) => (
  <View style={cmp.sectionRow}>
    <Ionicons name={icon} size={16} color={COLORS.onSurfaceVariant} />
    <Text style={cmp.sectionTitle}>{title}</Text>
  </View>
);

const KpiCard = ({ label, value, icon, color, small }) => (
  <View style={[cmp.kpi, small && cmp.kpiSmall, SHADOWS.subtle]}>
    <View style={[cmp.kpiIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={small ? 16 : 20} color={color} />
    </View>
    <Text style={[cmp.kpiValue, small && cmp.kpiValueSmall]}>{value}</Text>
    <Text style={cmp.kpiLabel}>{label}</Text>
  </View>
);

const MissionRow = ({ label, value, color, last }) => (
  <View style={[cmp.mRow, !last && cmp.mRowBorder]}>
    <Text style={cmp.mLabel}>{label}</Text>
    <Text style={[cmp.mValue, color && { color }]}>{value}</Text>
  </View>
);

const QuickLink = ({ icon, label, badge, color, onPress }) => (
  <TouchableOpacity style={[cmp.quick, SHADOWS.subtle]} onPress={onPress} activeOpacity={0.8}>
    <View style={[cmp.quickIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    {badge > 0 && <View style={cmp.badge}><Text style={cmp.badgeText}>{badge}</Text></View>}
    <Text style={cmp.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const cmp = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },

  kpi: { flex: 1, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  kpiSmall: { padding: 12 },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  kpiValueSmall: { fontSize: 20 },
  kpiLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center' },

  mRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  mRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant },
  mLabel: { fontSize: 14, color: COLORS.onSurface, fontWeight: '500' },
  mValue: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },

  quick: { flex: 1, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, position: 'relative' },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.error, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, marginBottom: 16,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -50 },
  heroDecor2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  heroSub: { fontSize: 12, color: COLORS.primaryFixedDim, marginTop: 2 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryFixed, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  heroBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.errorContainer, borderRadius: 14,
    padding: 14, marginBottom: 16,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.error },

  kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  mrrCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 20, padding: 20, marginBottom: 10,
  },
  mrrLabel: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  mrrValue: { fontSize: 32, fontWeight: '800', color: COLORS.primary, marginVertical: 2 },
  mrrSub: { fontSize: 12, color: COLORS.onSurfaceVariant },
  mrrIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.secondaryFixed, alignItems: 'center', justifyContent: 'center' },

  missionsCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
});

export default AdminDashboardScreen;
