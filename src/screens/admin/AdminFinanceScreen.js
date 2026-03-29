// Finance & Abonnements — Admin GETRAD
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { getAllSubscriptions, getDashboardStats } from '../../services/adminService';

const PLAN_PRICES = { discovery: 29, professional: 79, premium: 149 };

const PLANS = [
  { key: 'discovery',    label: 'Découverte',  price: 29,  color: '#F59E0B', icon: 'leaf-outline'    },
  { key: 'professional', label: 'Professionnel', price: 79, color: '#8B5CF6', icon: 'rocket-outline'  },
  { key: 'premium',      label: 'Premium',     price: 149, color: '#EF4444', icon: 'diamond-outline' },
];

const STATUS_LABELS = { active: 'Actif', trialing: 'Essai', past_due: 'En retard', canceled: 'Annulé', cancelled: 'Annulé' };
const STATUS_COLORS = { active: COLORS.secondary, trialing: '#F59E0B', past_due: COLORS.error, canceled: COLORS.outlineVariant, cancelled: COLORS.outlineVariant };

const FILTER_TABS = [
  { key: 'all',    label: 'Tous'     },
  { key: 'active', label: 'Actifs'   },
  { key: 'past_due', label: 'Retard' },
  { key: 'canceled', label: 'Annulés'},
];

const AdminFinanceScreen = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const [subsResult, statsResult] = await Promise.all([
      getAllSubscriptions(),
      getDashboardStats(),
    ]);
    if (subsResult.success) setSubscriptions(subsResult.data);
    if (statsResult.success) setStats(statsResult.stats);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = subscriptions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'active') return s.status === 'active' || s.status === 'trialing';
    if (filter === 'canceled') return s.status === 'canceled' || s.status === 'cancelled';
    return s.status === filter;
  });

  const renderSub = ({ item }) => {
    const plan = PLANS.find(p => p.key === item.plan) || { label: item.plan, color: COLORS.primary, price: 0, icon: 'card-outline' };
    const statusColor = STATUS_COLORS[item.status] || COLORS.onSurfaceVariant;
    const statusLabel = STATUS_LABELS[item.status] || item.status;
    const nextBilling = item.currentPeriodEnd?.toDate?.()?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) || '—';
    const userName = item.user?.displayName || item.user?.email || item.id?.slice(0, 8) + '...';

    return (
      <View style={[styles.subCard, SHADOWS.subtle]}>
        <View style={[styles.subPlanIcon, { backgroundColor: plan.color + '18' }]}>
          <Ionicons name={plan.icon} size={16} color={plan.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.subHeader}>
            <Text style={styles.subName} numberOfLines={1}>{userName}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.subPlan}>{plan.label} · {plan.price} €/mois</Text>
          <Text style={styles.subBilling}>Prochain paiement : {nextBilling}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  const mrr = stats?.mrr || 0;
  const planCounts = stats?.subscriptionsByPlan || {};
  const totalActive = stats?.activeSubscriptions || 0;
  const arr = mrr * 12;

  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* MRR + ARR */}
          <View style={styles.revenueRow}>
            <View style={[styles.revenueCard, SHADOWS.card, { flex: 1.2 }]}>
              <Text style={styles.revenueLabel}>MRR</Text>
              <Text style={styles.revenueValue}>{mrr.toLocaleString('fr-FR')} €</Text>
              <Text style={styles.revenueSub}>Revenu mensuel récurrent</Text>
            </View>
            <View style={[styles.revenueCard, SHADOWS.subtle]}>
              <Text style={styles.revenueLabel}>ARR</Text>
              <Text style={[styles.revenueValue, { fontSize: 22, color: COLORS.secondary }]}>{arr.toLocaleString('fr-FR')} €</Text>
              <Text style={styles.revenueSub}>Annualisé</Text>
            </View>
          </View>

          {/* Plans breakdown */}
          <Text style={styles.sectionTitle}>Répartition par plan</Text>
          {PLANS.map(plan => {
            const count = planCounts[plan.key] || 0;
            const revenue = count * plan.price;
            const pct = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
            return (
              <View key={plan.key} style={[styles.planCard, SHADOWS.subtle]}>
                <View style={[styles.planIcon, { backgroundColor: plan.color + '18' }]}>
                  <Ionicons name={plan.icon} size={18} color={plan.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.planRow}>
                    <Text style={styles.planName}>{plan.label}</Text>
                    <Text style={styles.planRevenue}>{revenue.toLocaleString('fr-FR')} €/mois</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: plan.color }]} />
                  </View>
                  <Text style={styles.planCount}>{count} abonné{count !== 1 ? 's' : ''} · {pct}%</Text>
                </View>
              </View>
            );
          })}

          {/* Filter tabs */}
          <Text style={styles.sectionTitle}>Abonnements</Text>
          <View style={styles.filterRow}>
            {FILTER_TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.filterTab, filter === t.key && styles.filterTabActive]}
                onPress={() => setFilter(t.key)}
              >
                <Text style={[styles.filterText, filter === t.key && styles.filterTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      renderItem={renderSub}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="card-outline" size={40} color={COLORS.outlineVariant} />
          <Text style={styles.emptyText}>Aucun abonnement dans cette catégorie</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.surface },
  header: { marginBottom: 4 },

  revenueRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  revenueCard: {
    flex: 1, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 20, padding: 18, gap: 4,
  },
  revenueLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  revenueValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  revenueSub: { fontSize: 11, color: COLORS.onSurfaceVariant, lineHeight: 14 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.onSurface, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },

  planCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14, padding: 14, marginBottom: 8 },
  planIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  planName: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  planRevenue: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  barTrack: { height: 6, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 3, marginBottom: 4 },
  barFill: { height: 6, borderRadius: 3 },
  planCount: { fontSize: 12, color: COLORS.onSurfaceVariant },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surfaceContainerLow, borderWidth: 1, borderColor: COLORS.outlineVariant },
  filterTabActive: { backgroundColor: COLORS.primaryFixed, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },

  subCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14, padding: 14, marginBottom: 8 },
  subPlanIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  subName: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  subPlan: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  subBilling: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant },
});

export default AdminFinanceScreen;
