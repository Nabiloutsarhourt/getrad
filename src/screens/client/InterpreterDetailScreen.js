// Profil Interprète (vue client) - GETRAD
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { getInterpreterById } from '../../services/searchService';
import { getInterpreterReviews } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { createAvailabilityRequest } from '../../services/availabilityService';

const SPECIALTY_ICONS = {
  'Juridique': 'scale-outline',
  'Médical': 'medkit-outline',
  'Financier': 'trending-up-outline',
  'Technique': 'construct-outline',
  'Commercial': 'briefcase-outline',
  'Conférence': 'mic-outline',
  'Littéraire': 'book-outline',
  'Scientifique': 'flask-outline',
  'Diplomatique': 'globe-outline',
  'Audiovisuel': 'film-outline',
  'Marketing': 'megaphone-outline',
  'IT / Logiciel': 'code-slash-outline',
  'Tourisme': 'map-outline',
  'Éducation / Formation': 'school-outline',
};

const StarRow = ({ rating, size = 14 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color="#F59E0B" />
      ))}
      {half ? <Ionicons name="star-half" size={size} color="#F59E0B" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons key={`e${i}`} name="star-outline" size={size} color="#F59E0B" />
      ))}
    </View>
  );
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

const InterpreterDetailScreen = ({ route, navigation }) => {
  const { interpreterId } = route.params;
  const { user } = useAuth();
  const [interpreter, setInterpreter] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingAvailability, setRequestingAvailability] = useState(false);

  useEffect(() => {
    loadInterpreter();
  }, []);

  const loadInterpreter = async () => {
    setLoading(true);
    const [interpreterResult, reviewsResult] = await Promise.all([
      getInterpreterById(interpreterId),
      getInterpreterReviews(interpreterId),
    ]);

    if (interpreterResult.success) {
      setInterpreter(interpreterResult.interpreter);
    } else {
      Alert.alert('Erreur', "Impossible de charger le profil du prestataire");
      navigation.goBack();
    }

    if (reviewsResult.success) {
      setReviews(reviewsResult.reviews);
    }

    setLoading(false);
  };

  const handleBooking = () => {
    navigation.navigate('BookingForm', { interpreterId });
  };

  const handleAvailabilityRequest = async () => {
    if (!user) return;
    setRequestingAvailability(true);
    const result = await createAvailabilityRequest(user.uid, interpreterId);
    setRequestingAvailability(false);
    if (result.success) {
      navigation.navigate('AvailabilityRequest', {
        requestId: result.requestId,
        interpreterId,
        interpreterName: `${interpreter.firstName} ${interpreter.lastName}`,
        interpreterPhoto: interpreter.user?.photoURL || null,
      });
    } else {
      Alert.alert('Erreur', result.error || 'Impossible d\'envoyer la demande.');
    }
  };

  const handleOpenDocument = (url, type) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Erreur', `Impossible d'ouvrir le ${type}`);
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!interpreter) return null;

  const {
    firstName,
    lastName,
    bio,
    city,
    languages,
    specialties,
    services,
    hourlyRate,
    translationRate,
    regions,
    rating,
    reviewCount,
    assermente,
    cvURL,
    kbisURL,
    identiteURL,
    user: interpreterUser, // renommé pour éviter conflit
  } = interpreter;

  const photoURL = interpreterUser?.photoURL;
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  const langCount = languages?.length || 0;
  const avatarColor = getAvatarColor(firstName || 'A');

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* Decorative circles */}
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          {/* Avatar */}
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.heroPhoto} />
          ) : (
            <View style={[styles.heroAvatar, { backgroundColor: avatarColor.bg }]}>
              <Text style={[styles.heroInitials, { color: avatarColor.text }]}>{initials || '?'}</Text>
            </View>
          )}

          {/* Name */}
          <Text style={styles.heroName}>{firstName} {lastName}</Text>

          {/* Verified badge */}
          {assermente && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.white} />
              <Text style={styles.verifiedText}>Assermenté</Text>
            </View>
          )}

          {/* Meta chips */}
          <View style={styles.metaRow}>
            {city ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={12} color={COLORS.white} />
                <Text style={styles.metaChipText}>{city}</Text>
              </View>
            ) : null}
            {rating > 0 ? (
              <View style={styles.metaChip}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.metaChipText}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {langCount > 0 ? (
              <View style={styles.metaChip}>
                <Ionicons name="language-outline" size={12} color={COLORS.white} />
                <Text style={styles.metaChipText}>{langCount} langue{langCount > 1 ? 's' : ''}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Tarifs highlight ── */}
        <View style={styles.ratesRow}>
          <View style={[styles.rateBox, SHADOWS.subtle]}>
            <Text style={styles.rateValue}>{hourlyRate || '—'}€</Text>
            <Text style={styles.rateLabel}>/ heure</Text>
          </View>
          <View style={[styles.rateBox, SHADOWS.subtle]}>
            <Text style={styles.rateValue}>{translationRate || '—'}€</Text>
            <Text style={styles.rateLabel}>/ page</Text>
          </View>
          <View style={[styles.rateBox, SHADOWS.subtle]}>
            <Text style={styles.rateValue}>{reviewCount || 0}</Text>
            <Text style={styles.rateLabel}>avis</Text>
          </View>
        </View>

        {/* ── À propos ── */}
        {bio ? (
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.cardTitle}>À propos</Text>
            <Text style={styles.bioText}>{bio}</Text>
          </View>
        ) : null}

        {/* ── Langues ── */}
        {languages && languages.length > 0 ? (
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.cardTitle}>Langues pratiquées</Text>
            {languages.map((lang, i) => (
              <View key={i} style={styles.langRow}>
                <Text style={styles.langPair}>
                  {lang.source} <Text style={styles.langArrow}>→</Text> {lang.target}
                </Text>
                <View style={styles.levelPill}>
                  <Text style={styles.levelText}>{lang.level}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Spécialités ── */}
        {specialties && specialties.length > 0 ? (
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.cardTitle}>Spécialités</Text>
            <View style={styles.tagsWrap}>
              {specialties.map((s, i) => (
                <View key={i} style={styles.specialtyChip}>
                  <Ionicons name={SPECIALTY_ICONS[s] || 'bookmark-outline'} size={14} color={COLORS.primary} />
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Services ── */}
        {services && services.length > 0 ? (
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.cardTitle}>Services proposés</Text>
            {services.map((svc, i) => (
              <View key={i} style={styles.serviceRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.secondary} />
                <Text style={styles.serviceText}>{svc.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Régions ── */}
        {regions && regions.length > 0 ? (
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.cardTitle}>Régions d'intervention</Text>
            <View style={styles.tagsWrap}>
              {regions.map((r, i) => (
                <View key={i} style={styles.regionChip}>
                  <Text style={styles.regionText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Documents ── */}
        {(cvURL || kbisURL || identiteURL) ? (
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.cardTitle}>Documents</Text>
            {cvURL ? (
              <TouchableOpacity
                style={styles.docRow}
                onPress={() => handleOpenDocument(cvURL, 'CV')}
                activeOpacity={0.75}
              >
                <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                <Text style={styles.docLabel}>Voir le CV</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
            {kbisURL ? (
              <TouchableOpacity
                style={styles.docRow}
                onPress={() => handleOpenDocument(kbisURL, 'Kbis')}
                activeOpacity={0.75}
              >
                <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                <Text style={styles.docLabel}>Voir le Kbis</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
            {identiteURL ? (
              <TouchableOpacity
                style={styles.docRow}
                onPress={() => handleOpenDocument(identiteURL, "pièce d'identité")}
                activeOpacity={0.75}
              >
                <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                <Text style={styles.docLabel}>Voir la pièce d'identité</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── Avis ── */}
        <View style={[styles.card, SHADOWS.subtle]}>
          <Text style={styles.cardTitle}>Avis clients ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Aucun avis pour l'instant.</Text>
          ) : (
            reviews.map((review) => {
              const rAv = getAvatarColor(review.clientName || '?');
              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    {/* Avatar initials */}
                    <View style={[styles.reviewAvatar, { backgroundColor: rAv.bg }]}>
                      <Text style={[styles.reviewAvatarText, { color: rAv.text }]}>
                        {(review.clientName?.[0] || '?').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewAuthor}>{review.clientName || 'Client'}</Text>
                      <StarRow rating={review.rating} size={12} />
                    </View>
                    <Text style={styles.reviewDate}>
                      {review.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      }) ?? ''}
                    </Text>
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewComment}>"{review.comment}"</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={[styles.bottomBar, SHADOWS.deep]}>
        <TouchableOpacity
          style={[styles.btnOutline, requestingAvailability && styles.btnDisabled]}
          onPress={handleAvailabilityRequest}
          disabled={requestingAvailability}
          activeOpacity={0.8}
        >
          {requestingAvailability ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="radio-button-on-outline" size={16} color={COLORS.primary} />
              <Text style={styles.btnOutlineText}>Disponibilité</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnFilled}
          onPress={handleBooking}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
          <Text style={styles.btnFilledText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  loaderText: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  heroDecor1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -60,
  },
  heroDecor2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -40,
  },
  heroPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroInitials: {
    fontSize: 38,
    fontWeight: '800',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },

  // ── Rates row ──
  ratesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rateBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  rateValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  rateLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // ── Cards ──
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  // Bio
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
  },

  // Languages
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  langPair: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  langArrow: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  levelPill: {
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Specialties
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  // Services
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Regions
  regionChip: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  regionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },

  // Documents
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
  },
  docLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  // Reviews
  emptyText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
  },
  reviewCard: {
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingLeft: 46,
  },

  // ── Bottom bar ──
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  btnFilled: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  btnFilledText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  btnDisabled: { opacity: 0.6 },
});

export default InterpreterDetailScreen;
