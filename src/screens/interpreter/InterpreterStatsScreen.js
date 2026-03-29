// Statistiques détaillées — vue interprète (GETRAD)
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SHADOWS } from '../../config/constants';
import { PLAN_LABELS } from '../../services/subscriptionService';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// ── Helpers ─────────────────────────────────────────────────────────────────
function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS_FR[d.getMonth()] });
  }
  return months;
}

function groupByMonth(items, dateField, valueField) {
  const months = getLast6Months();
  return months.map(({ year, month, label }) => {
    const filtered = items.filter(item => {
      const d = item[dateField]?.toDate?.();
      return d && d.getFullYear() === year && d.getMonth() === month;
    });
    const value = filtered.reduce((sum, item) => sum + (item[valueField] || 0), 0);
    return { label, count: filtered.length, value };
  });
}

// ── Composants réutilisables ─────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, color = COLORS.primary }) => (
  <View style={[card.wrap, SHADOWS.subtle]}>
    <View style={[card.iconBox, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={card.value}>{value}</Text>
    <Text style={card.label}>{label}</Text>
    {sub ? <Text style={card.sub}>{sub}</Text> : null}
  </View>
);

const BarChart = ({ data, maxValue, valuePrefix = '', valueSuffix = '' }) => {
  if (!data || data.length === 0) return null;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <View style={chart.container}>
      {data.map((item, i) => {
        const height = Math.max(4, (item.value / max) * 80);
        return (
          <View key={i} style={chart.barWrap}>
            {item.value > 0 && (
              <Text style={chart.barValue}>
                {valuePrefix}{item.value > 999 ? Math.round(item.value / 100) / 10 + 'k' : item.value}{valueSuffix}
              </Text>
            )}
            <View style={[chart.bar, { height }]} />
            <Text style={chart.barLabel}>{item.label}</Text>
            {item.count > 0 && (
              <View style={chart.barBadge}>
                <Text style={chart.barBadgeText}>{item.count}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const ProgressBar = ({ value, max, color = COLORS.primary }) => {
  const pct = max > 0 ? Math.min(value / max, 1) : 1;
  const isUnlimited = max === -1;
  return (
    <View style={progress.bg}>
      <View style={[progress.fill, {
        width: isUnlimited ? '100%' : `${pct * 100}%`,
        backgroundColor: isUnlimited ? COLORS.secondary : pct > 0.85 ? COLORS.error : color,
      }]} />
    </View>
  );
};

// ── Écran principal ──────────────────────────────────────────────────────────
const InterpreterStatsScreen = ({ navigation }) => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [missions, setMissions] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [profSnap, bSnap, mSnap] = await Promise.all([
        getDoc(doc(db, 'interpreters', user.uid)),
        getDocs(query(
          collection(db, 'bookings'),
          where('interpreterId', '==', user.uid),
        )),
        getDocs(query(
          collection(db, 'missions'),
          where('assignedTo', '==', user.uid),
        )),
      ]);

      if (profSnap.exists()) setProfile(profSnap.data());
      setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMissions(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('InterpreterStatsScreen loadAll error:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => { setRefreshing(true); loadAll(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Calcul des métriques ──────────────────────────────────────────────────
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.estimatedPrice || 0), 0);

  const offerHistory = missions.flatMap(m => m.offerHistory || []).filter(h => h.userId === user.uid);
  const totalOffers = offerHistory.length;
  const acceptedOffers = offerHistory.filter(h => h.response === 'accepted').length;
  const refusedOffers = offerHistory.filter(h => h.response === 'refused').length;
  const acceptanceRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : null;

  const totalMissions = missions.filter(m => m.status === 'accepted' || m.status === 'completed').length;
  const rating = profile?.rating || 0;
  const reviewCount = profile?.reviewCount || 0;

  // ── Données par mois ──────────────────────────────────────────────────────
  const earningsByMonth = groupByMonth(completedBookings, 'completedAt', 'estimatedPrice');
  const missionsByMonth = groupByMonth(
    missions.filter(m => ['accepted', 'completed'].includes(m.status)),
    'updatedAt', // date d'acceptation
    'budget' // valeur non pertinente ici, on compte juste le count
  );

  const maxEarnings = Math.max(...earningsByMonth.map(e => e.value), 1);

  // ── Abonnement ────────────────────────────────────────────────────────────
  const missionsViewed = subscription?.missionsViewed || 0;
  const missionsLimit = subscription?.missionsLimit ?? 5;
  const planLabel = PLAN_LABELS[subscription?.plan] || '—';
  const isActive = ['active', 'trialing'].includes(subscription?.status);
  const isUnlimited = missionsLimit === -1;

  const now = new Date();
  const thisMonth = completedBookings.filter(b => {
    const d = b.completedAt?.toDate?.() || b.createdAt?.toDate?.();
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenueThisMonth = thisMonth.reduce((s, b) => s + (b.estimatedPrice || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View>
          <Text style={styles.heroTitle}>Mes statistiques</Text>
          <Text style={styles.heroSub}>Activité et revenus — {now.getFullYear()}</Text>
        </View>
        <View style={[styles.heroBadge, !isActive && styles.heroBadgeInactive]}>
          <Ionicons
            name={isActive ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color={isActive ? COLORS.secondary : '#F59E0B'}
          />
          <Text style={[styles.heroBadgeText, !isActive && { color: '#F59E0B' }]}>
            {isActive ? planLabel : 'Abonnement inactif'}
          </Text>
        </View>
      </View>

      {/* KPI rapides */}
      <View style={styles.kpiRow}>
        <StatCard
          label="Missions"
          value={totalMissions}
          sub="acceptées"
          icon="flash-outline"
          color={COLORS.primary}
        />
        <StatCard
          label="Revenus"
          value={`${totalRevenue}€`}
          sub="cumulés"
          icon="wallet-outline"
          color={COLORS.secondary}
        />
        <StatCard
          label="Ce mois"
          value={`${revenueThisMonth}€`}
          sub={`${thisMonth.length} mission${thisMonth.length > 1 ? 's' : ''}`}
          icon="calendar-outline"
          color="#8B5CF6"
        />
        <StatCard
          label="Note"
          value={rating > 0 ? rating.toFixed(1) : '—'}
          sub={`${reviewCount} avis`}
          icon="star-outline"
          color="#F59E0B"
        />
      </View>

      {/* Revenus mensuels */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Revenus mensuels</Text>
          <Text style={styles.sectionSub}>{totalRevenue > 0 ? `${totalRevenue}€ total` : 'Aucun revenu enregistré'}</Text>
        </View>
        {totalRevenue > 0 ? (
          <BarChart data={earningsByMonth} maxValue={maxEarnings} valueSuffix="€" />
        ) : (
          <Text style={styles.emptyText}>Les revenus s'afficheront après vos premières missions terminées.</Text>
        )}
      </View>

      {/* Missions par mois */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={16} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Missions par mois</Text>
          <Text style={styles.sectionSub}>{totalMissions} total</Text>
        </View>
        <BarChart data={missionsByMonth.map(m => ({ ...m, value: m.count }))} />
      </View>

      {/* Taux d'acceptation */}
      {totalOffers > 0 && (
        <View style={[styles.section, SHADOWS.subtle]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Taux d'acceptation</Text>
          </View>
          <View style={styles.rateRow}>
            <View style={styles.rateCircle}>
              <Text style={styles.rateCircleValue}>{acceptanceRate}%</Text>
              <Text style={styles.rateCircleSub}>accepté</Text>
            </View>
            <View style={styles.rateDetails}>
              <View style={styles.rateDetailRow}>
                <View style={[styles.rateDot, { backgroundColor: COLORS.secondary }]} />
                <Text style={styles.rateDetailText}>{acceptedOffers} offre{acceptedOffers > 1 ? 's' : ''} acceptée{acceptedOffers > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.rateDetailRow}>
                <View style={[styles.rateDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.rateDetailText}>{refusedOffers} offre{refusedOffers > 1 ? 's' : ''} refusée{refusedOffers > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.rateDetailRow}>
                <View style={[styles.rateDot, { backgroundColor: COLORS.outlineVariant }]} />
                <Text style={styles.rateDetailText}>{totalOffers} total proposées</Text>
              </View>
            </View>
          </View>
          <Text style={styles.rateHint}>
            Un taux élevé améliore votre position dans les résultats de recherche.
          </Text>
        </View>
      )}

      {/* Abonnement & quotas */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="ribbon-outline" size={16} color={isActive ? COLORS.secondary : '#F59E0B'} />
          <Text style={styles.sectionTitle}>Abonnement — {planLabel}</Text>
        </View>

        <View style={styles.quotaRow}>
          <View style={styles.quotaLeft}>
            <Text style={styles.quotaLabel}>Missions vues ce mois</Text>
            <Text style={styles.quotaValue}>
              {missionsViewed} / {isUnlimited ? '∞' : missionsLimit}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('ManageSubscription')}
            activeOpacity={0.8}
          >
            <Text style={styles.manageBtnText}>Gérer</Text>
          </TouchableOpacity>
        </View>
        <ProgressBar value={missionsViewed} max={missionsLimit} />

        {!isUnlimited && missionsLimit > 0 && (
          <Text style={[
            styles.quotaHint,
            missionsViewed / missionsLimit > 0.85 && { color: COLORS.error },
          ]}>
            {missionsViewed >= missionsLimit
              ? 'Quota atteint — passez à un plan supérieur pour voir plus de missions.'
              : `${missionsLimit - missionsViewed} mission${missionsLimit - missionsViewed > 1 ? 's' : ''} restante${missionsLimit - missionsViewed > 1 ? 's' : ''} ce mois.`}
          </Text>
        )}

        {isUnlimited && (
          <Text style={[styles.quotaHint, { color: COLORS.secondary }]}>
            Missions illimitées — plan Premium actif.
          </Text>
        )}
      </View>

      {/* Note et avis */}
      {reviewCount > 0 && (
        <View style={[styles.section, SHADOWS.subtle]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Réputation</Text>
          </View>
          <View style={styles.ratingDisplay}>
            <Text style={styles.ratingBig}>{rating.toFixed(1)}</Text>
            <View style={styles.ratingStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(rating) ? 'star' : 'star-outline'}
                  size={20}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.reviewCount}>{reviewCount} avis</Text>
            </View>
            <Text style={styles.ratingHint}>
              {rating >= 4.5
                ? 'Excellent — vous êtes parmi les mieux notés !'
                : rating >= 4.0
                ? 'Très bien — continuez à offrir un service de qualité.'
                : 'Améliorer votre note augmentera votre visibilité.'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ── Styles utilitaires ───────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
    minWidth: 80,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  value: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, textAlign: 'center' },
  sub: { fontSize: 10, color: COLORS.onSurfaceVariant, textAlign: 'center' },
});

const chart = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    paddingTop: 8, paddingBottom: 4,
  },
  barWrap: {
    flex: 1, alignItems: 'center', gap: 4, position: 'relative',
  },
  bar: {
    width: '100%', borderRadius: 6,
    backgroundColor: COLORS.primaryFixed,
    minHeight: 4,
  },
  barLabel: { fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  barValue: { fontSize: 10, color: COLORS.primary, fontWeight: '800' },
  barBadge: {
    position: 'absolute', top: -4, right: 2,
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  barBadgeText: { fontSize: 8, color: COLORS.white, fontWeight: '800' },
});

const progress = StyleSheet.create({
  bg: {
    height: 8, backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 4, overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 24, padding: 22,
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -40,
  },
  heroDecor2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  heroBadgeInactive: { backgroundColor: '#FEF3C7' },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.secondary },

  kpiRow: { flexDirection: 'row', gap: 8 },

  section: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20, padding: 18, gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.onSurface, flex: 1 },
  sectionSub: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },

  emptyText: { fontSize: 13, color: COLORS.onSurfaceVariant, fontStyle: 'italic', lineHeight: 19 },

  // Taux d'acceptation
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  rateCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: COLORS.primary,
  },
  rateCircleValue: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  rateCircleSub: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  rateDetails: { flex: 1, gap: 8 },
  rateDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateDot: { width: 10, height: 10, borderRadius: 5 },
  rateDetailText: { fontSize: 13, color: COLORS.onSurface, fontWeight: '500' },
  rateHint: { fontSize: 12, color: COLORS.onSurfaceVariant, fontStyle: 'italic', lineHeight: 18 },

  // Quota
  quotaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quotaLeft: { gap: 2 },
  quotaLabel: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  quotaValue: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  manageBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.primaryFixed,
  },
  manageBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  quotaHint: { fontSize: 12, color: COLORS.onSurfaceVariant, lineHeight: 18 },

  // Rating
  ratingDisplay: { gap: 10 },
  ratingBig: { fontSize: 52, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -2 },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCount: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '600', marginLeft: 6 },
  ratingHint: { fontSize: 13, color: COLORS.onSurfaceVariant, fontStyle: 'italic', lineHeight: 19 },
});

export default InterpreterStatsScreen;
