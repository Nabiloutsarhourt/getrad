// Écran de liste des réservations + missions pour les clients — MD3
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { getClientBookings } from '../../services/bookingService';
import { subscribeClientMissions, MISSION_STATUS_LABELS, MISSION_STATUS_COLORS } from '../../services/missionService';

const BOOKING_STATUS = {
  pending:   { label: 'En attente',  color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmée',   color: '#006c49', bg: '#dcfce7' },
  cancelled: { label: 'Annulée',     color: COLORS.error, bg: COLORS.errorContainer },
  rejected:  { label: 'Refusée',     color: COLORS.error, bg: COLORS.errorContainer },
  completed: { label: 'Terminée',    color: COLORS.onSurfaceVariant, bg: COLORS.surfaceContainerHigh },
};

const TABS = [
  { key: 'bookings', label: 'Réservations', icon: 'receipt-outline' },
  { key: 'missions', label: 'Missions',     icon: 'flash-outline'   },
];

const ClientBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  // Écouter les missions en temps réel
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeClientMissions(user.uid, (data) => setMissions(data));
    return () => unsub();
  }, [user?.uid]);

  const loadBookings = async () => {
    setLoading(true);
    const result = await getClientBookings(user.uid);
    if (result.success) setBookings(result.bookings);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  // ── Rendu d'une réservation directe ─────────────────────────────────────
  const renderBooking = ({ item }) => {
    const s = BOOKING_STATUS[item.status] || BOOKING_STATUS.pending;
    const isInterpretation = item.serviceType === 'interpretation';
    return (
      <TouchableOpacity
        style={[styles.card, SHADOWS.card, { borderLeftColor: s.color }]}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceRow}>
            <View style={styles.serviceIconBox}>
              <Ionicons
                name={isInterpretation ? 'mic-outline' : 'document-text-outline'}
                size={18}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.service}>
              {isInterpretation ? 'Interprétation' : 'Traduction'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.date} à {item.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.onSurfaceVariant} />
            <Text style={styles.metaText}>
              {item.duration} {isInterpretation ? 'h' : 'page(s)'}
            </Text>
          </View>
          {item.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.onSurfaceVariant} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>{item.estimatedPrice}€</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
        </View>
      </TouchableOpacity>
    );
  };

  // ── Rendu d'une mission auto-assignée ────────────────────────────────────
  const renderMission = ({ item }) => {
    const statusColor = MISSION_STATUS_COLORS[item.status] || COLORS.onSurfaceVariant;
    const statusLabel = MISSION_STATUS_LABELS[item.status] || item.status;
    const isActive = ['searching', 'offered'].includes(item.status);
    const isAccepted = item.status === 'accepted';
    const langPair = item.languageFrom && item.languageTo
      ? `${item.languageFrom} → ${item.languageTo}`
      : null;
    const formattedDate = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

    return (
      <TouchableOpacity
        style={[styles.card, SHADOWS.card, { borderLeftColor: statusColor }]}
        onPress={() => navigation.navigate('MissionTracking', { missionId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.serviceRow, { flex: 1 }]}>
            <View style={[styles.serviceIconBox, isActive && { backgroundColor: '#FEF3C7' }]}>
              <Ionicons
                name={isActive ? 'search-outline' : isAccepted ? 'checkmark-circle-outline' : 'flash-outline'}
                size={18}
                color={isActive ? '#B45309' : isAccepted ? COLORS.secondary : COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.service} numberOfLines={1}>
                {item.title || item.service || 'Mission'}
              </Text>
              {langPair ? (
                <Text style={styles.langPair}>{langPair}</Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          {item.date ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.onSurfaceVariant} />
              <Text style={styles.metaText}>{item.date}</Text>
            </View>
          ) : null}
          {item.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.onSurfaceVariant} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          ) : null}
          {formattedDate ? (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={COLORS.onSurfaceVariant} />
              <Text style={styles.metaText}>Postée le {formattedDate}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.missionFooterLeft}>
            {isActive && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>En cours</Text>
              </View>
            )}
            {item.budget ? (
              <Text style={styles.budget}>Budget : {item.budget}€</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyBookings = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="receipt-outline" size={32} color={COLORS.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>Aucune réservation</Text>
      <Text style={styles.emptyText}>
        Recherchez un prestataire et envoyez une demande !
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('InterpretersListTab')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyBtnText}>Explorer les prestataires</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyMissions = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="flash-outline" size={32} color={COLORS.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>Aucune mission postée</Text>
      <Text style={styles.emptyText}>
        Postez une mission et recevez des offres de prestataires qualifiés.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('PostMission')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyBtnText}>Poster une mission</Text>
      </TouchableOpacity>
    </View>
  );

  const activeMissionsCount = missions.filter(m => ['searching', 'offered'].includes(m.status)).length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Text style={styles.heroTitle}>Mes demandes</Text>
        <Text style={styles.heroSub}>Suivez vos réservations et missions</Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => {
          const isActive = tab === t.key;
          const hasBadge = t.key === 'missions' && activeMissionsCount > 0;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <View style={styles.tabInner}>
                <Ionicons
                  name={t.icon}
                  size={16}
                  color={isActive ? COLORS.primary : COLORS.onSurfaceVariant}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {t.label}
                </Text>
                {hasBadge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{activeMissionsCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Liste */}
      {tab === 'bookings' ? (
        <FlatList
          style={{ flex: 1 }}
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyBookings}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={missions}
          renderItem={renderMission}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyMissions}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },

  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    overflow: 'hidden',
    gap: 4,
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white },

  listContent: { padding: 16, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  service: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  langPair: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { gap: 4, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 12,
  },
  price: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  missionFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' },
  liveText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
  budget: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 8 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});

export default ClientBookingsScreen;
