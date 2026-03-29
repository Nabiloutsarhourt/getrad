// Écran de détail d'une réservation pour GETRAD — MD3
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  getBookingById,
  cancelBooking,
  confirmBooking,
  rejectBooking,
  completeBooking,
} from '../../services/bookingService';
import { getUserData } from '../../services/authService';
import { getInterpreterById } from '../../services/searchService';

const STATUS_CONFIG = {
  pending:   { label: 'En attente de confirmation', color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  confirmed: { label: 'Confirmée',                  color: '#006c49', bg: '#dcfce7', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Annulée',                    color: COLORS.error, bg: COLORS.errorContainer, icon: 'close-circle-outline' },
  rejected:  { label: 'Refusée',                    color: COLORS.error, bg: COLORS.errorContainer, icon: 'close-circle-outline' },
  completed: { label: 'Terminée',                   color: COLORS.onSurfaceVariant, bg: COLORS.surfaceContainerHigh, icon: 'checkmark-done-outline' },
};

const AVATAR_COLORS = [
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FFEDD5', text: '#9A3412' },
];
const getAvatarColor = (name) => AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

const BookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { user, userData } = useAuth();

  const [booking, setBooking] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isClient = userData?.role === 'client';
  const isInterpreter = userData?.role === 'interpreter';

  useEffect(() => {
    loadBookingDetails();
  }, []);

  const loadBookingDetails = async () => {
    setLoading(true);
    const bookingResult = await getBookingById(bookingId);
    if (!bookingResult.success) {
      Alert.alert('Erreur', 'Impossible de charger la réservation');
      navigation.goBack();
      return;
    }
    setBooking(bookingResult.booking);

    if (isClient) {
      const r = await getInterpreterById(bookingResult.booking.interpreterId);
      if (r.success) setOtherUser(r.interpreter);
    } else {
      const r = await getUserData(bookingResult.booking.clientId);
      if (r.success) setOtherUser(r.data);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    Alert.alert('Annuler la réservation', 'Êtes-vous sûr ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler', style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const r = await cancelBooking(bookingId);
          setActionLoading(false);
          if (r.success) {
            Alert.alert('Succès', 'Réservation annulée', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } else {
            Alert.alert('Erreur', r.error);
          }
        },
      },
    ]);
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    const r = await confirmBooking(bookingId);
    setActionLoading(false);
    if (r.success) { Alert.alert('Succès', 'Réservation confirmée !'); loadBookingDetails(); }
    else Alert.alert('Erreur', r.error);
  };

  const handleReject = () => {
    Alert.alert('Refuser la réservation', 'Êtes-vous sûr ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, refuser', style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const r = await rejectBooking(bookingId);
          setActionLoading(false);
          if (r.success) loadBookingDetails();
          else Alert.alert('Erreur', r.error);
        },
      },
    ]);
  };

  const handleComplete = async () => {
    setActionLoading(true);
    const r = await completeBooking(bookingId);
    setActionLoading(false);
    if (r.success) { Alert.alert('Succès', 'Marquée comme terminée'); loadBookingDetails(); }
    else Alert.alert('Erreur', r.error);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const s = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const otherName = isClient
    ? `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`
    : otherUser?.displayName || 'Client';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: s.bg }]}>
          <Ionicons name={s.icon} size={18} color={s.color} />
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>

        {/* Autre partie */}
        {(() => {
          const avColor = getAvatarColor(otherName);
          return (
            <View style={[styles.card, SHADOWS.card]}>
              <View style={styles.userCardRow}>
                <View style={[styles.userAvatar, { backgroundColor: avColor.bg }]}>
                  <Text style={[styles.userAvatarText, { color: avColor.text }]}>
                    {(otherName?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{isClient ? 'Prestataire' : 'Client'}</Text>
                  <Text style={styles.cardUser}>{otherName}</Text>
                  {otherUser?.city ? (
                    <View style={styles.cardMeta}>
                      <Ionicons name="location-outline" size={13} color={COLORS.onSurfaceVariant} />
                      <Text style={styles.cardMetaText}>{otherUser.city}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })()}

        {/* Détails prestation */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.cardTitle}>Détails de la prestation</Text>
          {[
            ['Service', booking.serviceType === 'interpretation' ? 'Interprétation' : 'Traduction'],
            ['Date', booking.date],
            ['Heure', booking.time],
            ['Durée', `${booking.duration} ${booking.serviceType === 'interpretation' ? 'heure(s)' : 'page(s)'}`],
            booking.location ? ['Lieu', booking.location] : null,
          ].filter(Boolean).map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.priceHighlight}>
            <Text style={styles.detailLabel}>Prix estimé</Text>
            <Text style={styles.priceValue}>{booking.estimatedPrice}€</Text>
          </View>
        </View>

        {/* Description */}
        {booking.description ? (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.description}>{booking.description}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {isClient && booking.status === 'pending' && (
            <Button title="Annuler la demande" variant="danger" onPress={handleCancel} loading={actionLoading} />
          )}
          {isClient && booking.status === 'confirmed' && (
            <>
              <Button title="Marquer comme terminée" variant="secondary" onPress={handleComplete} loading={actionLoading} style={styles.actionGap} />
              <Button title="Annuler" variant="outline" onPress={handleCancel} loading={actionLoading} />
            </>
          )}
          {isInterpreter && booking.status === 'pending' && (
            <>
              <Button title="Accepter la demande" variant="secondary" onPress={handleConfirm} loading={actionLoading} style={styles.actionGap} />
              <Button title="Refuser" variant="danger" onPress={handleReject} loading={actionLoading} />
            </>
          )}
          {isInterpreter && booking.status === 'confirmed' && (
            <Button title="Marquer comme terminée" variant="secondary" onPress={handleComplete} loading={actionLoading} />
          )}
          {isClient && booking.status === 'completed' && (
            <Button title="Laisser un avis" variant="outline" onPress={() => navigation.navigate('Review', { bookingId })} style={styles.actionGap} />
          )}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },

  // Status banner
  statusBanner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Cards
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    padding: 20,
    gap: 4,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardUser: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  cardMetaText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  priceHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 22,
  },

  // Actions
  actions: {
    gap: 10,
    marginTop: 4,
  },
  actionGap: {
    marginBottom: 4,
  },
});

export default BookingDetailScreen;
