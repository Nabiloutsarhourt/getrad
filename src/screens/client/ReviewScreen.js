// Écran pour laisser un avis après une réservation — MD3
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../contexts/AuthContext';
import { createReview, hasReviewedBooking } from '../../services/reviewService';
import { getBookingById } from '../../services/bookingService';
import { getInterpreterById } from '../../services/searchService';

const LABELS = ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent !'];

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

const ReviewScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { user, userData } = useAuth();

  const [booking, setBooking] = useState(null);
  const [interpreter, setInterpreter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookingDetails();
  }, []);

  const loadBookingDetails = async () => {
    setLoading(true);

    const reviewCheck = await hasReviewedBooking(bookingId, user.uid);
    if (reviewCheck.hasReviewed) {
      Alert.alert('Avis déjà publié', 'Vous avez déjà laissé un avis pour cette réservation.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const bookingResult = await getBookingById(bookingId);
    if (!bookingResult.success) {
      Alert.alert('Erreur', 'Impossible de charger la réservation');
      navigation.goBack();
      return;
    }
    setBooking(bookingResult.booking);

    const interpreterResult = await getInterpreterById(bookingResult.booking.interpreterId);
    if (interpreterResult.success) setInterpreter(interpreterResult.interpreter);

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError('Veuillez sélectionner une note'); return; }
    if (!comment.trim()) { setError('Veuillez laisser un commentaire'); return; }
    if (comment.trim().length < 10) { setError('Minimum 10 caractères'); return; }

    setSubmitting(true);
    const result = await createReview({
      bookingId,
      clientId: user.uid,
      clientName: userData.displayName,
      interpreterId: booking.interpreterId,
      rating,
      comment: comment.trim(),
    });
    setSubmitting(false);

    if (result.success) {
      Alert.alert('Merci !', 'Votre avis a été publié.', [
        { text: 'OK', onPress: () => navigation.navigate('ClientBookingsTab') },
      ]);
    } else {
      Alert.alert('Erreur', result.error || "Impossible de publier l'avis");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Carte interprète */}
        <View style={[styles.interpreterCard, SHADOWS.card]}>
          {(() => {
            const avColor = getAvatarColor(interpreter?.firstName || 'A');
            return (
              <View style={[styles.avatar, { backgroundColor: avColor.bg }]}>
                <Text style={[styles.avatarText, { color: avColor.text }]}>
                  {(interpreter?.firstName?.[0] || '?').toUpperCase()}
                </Text>
              </View>
            );
          })()}
          <View style={{ flex: 1 }}>
            <Text style={styles.interpreterName}>
              {interpreter?.firstName} {interpreter?.lastName}
            </Text>
            <Text style={styles.bookingInfo}>
              {booking?.serviceType === 'interpretation' ? 'Interprétation' : 'Traduction'} · {booking?.date}
            </Text>
          </View>
        </View>

        {/* Étoiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre note</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setRating(i); setError(''); }}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={i <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={i <= rating ? '#F59E0B' : COLORS.outlineVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <View style={styles.ratingLabelWrap}>
              <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
            </View>
          )}
        </View>

        {/* Commentaire */}
        <View style={styles.section}>
          <Input
            label="Votre avis"
            placeholder="Partagez votre expérience avec ce prestataire..."
            value={comment}
            onChangeText={(t) => { setComment(t); setError(''); }}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Publier l'avis"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />

        <Text style={styles.helpText}>
          Votre avis sera visible publiquement sur le profil du prestataire.
        </Text>
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
    paddingBottom: 40,
    gap: 24,
  },

  // Interpreter card
  interpreterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    padding: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  interpreterName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 3,
  },
  bookingInfo: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // Stars
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabelWrap: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Comment
  charCount: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'right',
  },

  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ReviewScreen;
