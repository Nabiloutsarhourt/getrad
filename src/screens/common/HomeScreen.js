// Tableau de bord Interprète - GETRAD
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';
import { getInterpreterBookings, confirmBooking, rejectBooking } from '../../services/bookingService';
import { subscribeIncomingOffer } from '../../services/missionService';
import {
  subscribeIncomingAvailabilityRequest,
  respondToAvailabilityRequest,
} from '../../services/availabilityService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const HomeScreen = ({ navigation }) => {
  const { user, userData, hasActiveSubscription, hasCguAccepted } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingAvailRequest, setIncomingAvailRequest] = useState(null);
  const [availResponding, setAvailResponding] = useState(null);
  const [interpreterProfile, setInterpreterProfile] = useState(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeIncomingOffer(user.uid, (mission) => {
      setIncomingOffer(mission);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeIncomingAvailabilityRequest(user.uid, (req) => {
      setIncomingAvailRequest(req);
    });
    return () => unsub();
  }, [user]);

  const handleAvailResponse = async (response) => {
    if (!incomingAvailRequest) return;
    setAvailResponding(response);
    const result = await respondToAvailabilityRequest(incomingAvailRequest.id, response);
    setAvailResponding(null);
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Impossible de répondre.');
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      const [bookingResult, profileDoc] = await Promise.all([
        getInterpreterBookings(user.uid),
        getDoc(doc(db, 'interpreters', user.uid)),
      ]);
      if (bookingResult.success) setBookings(bookingResult.bookings);
      if (profileDoc.exists()) setInterpreterProfile(profileDoc.data());
    } catch (error) {
      console.error('HomeScreen loadData error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAccept = async (bookingId) => {
    const result = await confirmBooking(bookingId);
    if (result.success) {
      loadData();
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleDecline = (bookingId) => {
    Alert.alert('Décliner la mission', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Décliner',
        style: 'destructive',
        onPress: async () => {
          await rejectBooking(bookingId);
          loadData();
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');

  const now = new Date();
  const thisMonth = completed.filter(b => {
    const d = b.createdAt?.toDate?.() || new Date(b.date || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const estimatedRevenue = thisMonth.reduce((sum, b) => sum + (b.estimatedPrice || 0), 0);
  const rating = interpreterProfile?.rating || 0;
  const reviewCount = interpreterProfile?.reviewCount || 0;

  const firstName = userData?.displayName?.split(' ')[0] || 'Jean';

  const getServiceLabel = (type) =>
    type === 'interpretation' ? 'Interprétation' : 'Traduction';

  const getServiceIcon = (type) =>
    type === 'interpretation' ? 'mic-outline' : 'document-text-outline';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
    >
      {/* Banner : offre de mission entrante */}
      {incomingOffer && (
        <TouchableOpacity
          style={styles.offerBanner}
          onPress={() => navigation.navigate('IncomingOffer', { mission: incomingOffer })}
          activeOpacity={0.85}
        >
          <View style={styles.offerBannerIconBox}>
            <Ionicons name="notifications" size={18} color={COLORS.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerBannerTitle}>Nouvelle mission disponible</Text>
            <Text style={styles.offerBannerSub}>
              {incomingOffer.languageFrom} → {incomingOffer.languageTo} · {incomingOffer.location}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={COLORS.onPrimary} />
        </TouchableOpacity>
      )}

      {/* Banner : demande de disponibilité entrante */}
      {incomingAvailRequest && (
        <View style={styles.availBanner}>
          <View style={styles.availBannerLeft}>
            <View style={styles.availBannerIconBox}>
              <Ionicons name="radio-button-on" size={18} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.availBannerTitle}>Demande de disponibilité</Text>
              <Text style={styles.availBannerSub}>Un client demande votre disponibilité — 2 min</Text>
            </View>
          </View>
          <View style={styles.availBannerActions}>
            <TouchableOpacity
              style={styles.availRefuseBtn}
              onPress={() => handleAvailResponse('refused')}
              disabled={!!availResponding}
              activeOpacity={0.8}
            >
              {availResponding === 'refused'
                ? <ActivityIndicator size="small" color={COLORS.error} />
                : <Ionicons name="close" size={18} color={COLORS.error} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.availAcceptBtn}
              onPress={() => handleAvailResponse('accepted')}
              disabled={!!availResponding}
              activeOpacity={0.85}
            >
              {availResponding === 'accepted'
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.availAcceptText}>Confirmer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Banner : abonnement requis */}
      {!hasActiveSubscription && (
        <TouchableOpacity
          style={styles.paywallBanner}
          onPress={() => navigation.navigate(hasCguAccepted ? 'Subscription' : 'CGU')}
          activeOpacity={0.85}
        >
          <Ionicons name="alert-circle-outline" size={18} color="#92400E" />
          <Text style={styles.paywallBannerText}>
            Activez votre abonnement pour recevoir des missions
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#92400E" />
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        {/* Decorative circles */}
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />

        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>BIENVENUE 👋</Text>
            <Text style={styles.headerTitle}>{firstName},{'\n'}bonne journée.</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.statusBadge,
                interpreterProfile?.availability?.status === 'busy' && styles.statusBadgeBusy,
                interpreterProfile?.availability?.status === 'vacation' && styles.statusBadgeVacation,
              ]}
              onPress={() => navigation.navigate('Availability')}
            >
              <View style={[
                styles.statusDot,
                interpreterProfile?.availability?.status === 'busy' && { backgroundColor: '#F59E0B' },
                interpreterProfile?.availability?.status === 'vacation' && { backgroundColor: COLORS.error },
              ]} />
              <Text style={styles.statusText}>
                {interpreterProfile?.availability?.status === 'busy'
                  ? 'Occupé(e)'
                  : interpreterProfile?.availability?.status === 'vacation'
                  ? 'En congés'
                  : 'Disponible'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerAvatar}
              onPress={() => navigation.navigate('ProfilTab')}
            >
              <Text style={styles.headerAvatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats Bento Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCardLarge, SHADOWS.card]}>
            <Text style={styles.statLargeLabel}>Missions ce mois</Text>
            <Text style={styles.statLargeValue}>{completed.length + confirmed.length}</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={14} color={COLORS.secondary} />
              <Text style={styles.statTrendText}>
                {pending.length} demande{pending.length > 1 ? 's' : ''} en attente
              </Text>
            </View>
            <TouchableOpacity
              style={styles.statButton}
              onPress={() => navigation.navigate('MissionsTab')}
            >
              <Text style={styles.statButtonText}>Voir toutes les missions</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statCardsColumn}>
            <View style={[styles.statCardSmall, SHADOWS.subtle]}>
              <View style={styles.statCardSmallRow}>
                <View>
                  <Text style={styles.statSmallLabel}>Terminées</Text>
                  <Text style={styles.statSmallValue}>{completed.length}</Text>
                </View>
                <View style={styles.statIconBadge}>
                  <Ionicons name="checkmark" size={16} color={COLORS.secondary} />
                </View>
              </View>
            </View>
            <View style={[styles.statCardSmall, styles.statCardSmallAccent, SHADOWS.subtle]}>
              <View style={styles.statCardSmallRow}>
                <View>
                  <Text style={styles.statSmallLabelLight}>Confirmées</Text>
                  <Text style={styles.statSmallValueLight}>{confirmed.length}</Text>
                </View>
                <View style={styles.statIconBadgePrimary}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Revenus & Note */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, SHADOWS.subtle]}>
            <Text style={styles.metricLabel}>Revenus ce mois</Text>
            <Text style={styles.metricValue}>
              {estimatedRevenue > 0 ? `${estimatedRevenue}€` : '—'}
            </Text>
            <Text style={styles.metricSub}>{thisMonth.length} mission{thisMonth.length !== 1 ? 's' : ''} terminée{thisMonth.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.metricCard, SHADOWS.subtle]}>
            <Text style={styles.metricLabel}>Note moyenne</Text>
            <View style={styles.ratingDisplay}>
              {rating > 0 && <Ionicons name="star" size={16} color="#F59E0B" />}
              <Text style={styles.metricValue}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={styles.metricSub}>{reviewCount} avis</Text>
          </View>
        </View>

        {/* Nouvelles demandes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
              {pending.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pending.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MissionsTab')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {pending.length === 0 ? (
            <View style={[styles.emptyCard, SHADOWS.subtle]}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="clipboard-outline" size={28} color={COLORS.onSurfaceVariant} />
              </View>
              <Text style={styles.emptyText}>Aucune nouvelle demande</Text>
            </View>
          ) : (
            pending.slice(0, 3).map((booking) => (
              <View key={booking.id} style={[styles.requestCard, SHADOWS.card]}>
                <View style={styles.requestCardHeader}>
                  <View style={styles.requestIconBox}>
                    <Ionicons name={getServiceIcon(booking.serviceType)} size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestType}>{getServiceLabel(booking.serviceType)}</Text>
                    <Text style={styles.requestMeta}>{booking.date} · {booking.time}</Text>
                  </View>
                  <View style={styles.requestPriceBox}>
                    <Text style={styles.requestPrice}>{booking.estimatedPrice}€</Text>
                    <Text style={styles.requestDuration}>{booking.duration}h</Text>
                  </View>
                </View>

                {booking.location ? (
                  <View style={styles.requestLocation}>
                    <Ionicons name="location-outline" size={13} color={COLORS.onSurfaceVariant} />
                    <Text style={styles.locationText}>{booking.location}</Text>
                  </View>
                ) : null}

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(booking.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accepter la mission</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(booking.id)}
                  >
                    <Text style={styles.declineButtonText}>Décliner</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Prochaines missions */}
        {confirmed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prochaines missions</Text>
            <View style={[styles.agendaCard, SHADOWS.card]}>
              {confirmed.slice(0, 3).map((booking, index) => (
                <TouchableOpacity
                  key={booking.id}
                  style={[
                    styles.agendaItem,
                    index < confirmed.length - 1 && styles.agendaItemBorder,
                  ]}
                  onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
                >
                  <View style={[styles.agendaDot, index === 0 && styles.agendaDotActive]} />
                  <View style={styles.agendaContent}>
                    <Text style={[styles.agendaDate, index === 0 && styles.agendaDateActive]}>
                      {booking.date} · {booking.time}
                    </Text>
                    <Text style={styles.agendaType}>{getServiceLabel(booking.serviceType)}</Text>
                    {booking.location && (
                      <Text style={styles.agendaLocation}>{booking.location}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, SHADOWS.subtle]}
            onPress={() => navigation.navigate('InterpreterStats')}
          >
            <Ionicons name="bar-chart-outline" size={22} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Statistiques</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, SHADOWS.subtle]}
            onPress={() => navigation.navigate('ManageSubscription')}
          >
            <Ionicons name="card-outline" size={22} color={COLORS.onSurface} />
            <Text style={styles.quickActionText}>Abonnement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, SHADOWS.subtle]}
            onPress={() => navigation.navigate('ProfilTab')}
          >
            <Ionicons name="person-outline" size={22} color={COLORS.onSurface} />
            <Text style={styles.quickActionText}>Mon profil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, SHADOWS.subtle]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            <Text style={[styles.quickActionText, { color: COLORS.error }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Offer banner
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  offerBannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  offerBannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 2,
  },

  // Availability request banner
  availBanner: {
    backgroundColor: COLORS.secondaryFixed,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  availBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availBannerIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  availBannerTitle: {
    fontSize: 14, fontWeight: '800', color: COLORS.secondary,
  },
  availBannerSub: {
    fontSize: 12, color: COLORS.onSecondaryContainer, fontWeight: '500', marginTop: 1,
  },
  availBannerActions: {
    flexDirection: 'row', gap: 8, marginTop: 8, paddingLeft: 44,
  },
  availRefuseBtn: {
    width: 44, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.error,
  },
  availAcceptBtn: {
    flex: 1, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  availAcceptText: {
    fontSize: 14, fontWeight: '700', color: COLORS.white,
  },

  // Paywall banner
  paywallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  paywallBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  headerDecor2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -50,
    left: -30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeBusy: { backgroundColor: '#FEF3C7' },
  statusBadgeVacation: { backgroundColor: COLORS.errorContainer },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSecondaryContainer,
  },

  content: {
    padding: 20,
    gap: 24,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardLarge: {
    flex: 1.3,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  statLargeLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statLargeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 56,
    marginTop: 4,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 14,
  },
  statTrendText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  statButton: {
    backgroundColor: COLORS.primaryFixed,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  statButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statCardsColumn: {
    flex: 1,
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
  },
  statCardSmallAccent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  statCardSmallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statSmallLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statSmallLabelLight: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statSmallValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  statSmallValueLight: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBadgePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 18,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Request card
  requestCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 3,
  },
  requestMeta: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  requestPriceBox: {
    alignItems: 'flex-end',
  },
  requestPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  requestDuration: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  declineButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },

  // Agenda
  agendaCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  agendaItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  agendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.outlineVariant,
    flexShrink: 0,
  },
  agendaDotActive: {
    backgroundColor: COLORS.primary,
  },
  agendaContent: {
    flex: 1,
    gap: 2,
  },
  agendaDate: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agendaDateActive: {
    color: COLORS.primary,
  },
  agendaType: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  agendaLocation: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // Empty
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
});

export default HomeScreen;
