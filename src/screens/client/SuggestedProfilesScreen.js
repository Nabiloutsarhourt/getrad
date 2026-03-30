// Profils suggérés après échec d'attribution automatique - GETRAD
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { searchInterpreters, getInterpretersByIds } from '../../services/searchService';

const AVATAR_COLORS = [
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FFEDD5', text: '#9A3412' },
];
const getAvatarColor = (name) =>
  AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

const StarRow = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={12} color="#F59E0B" />
      ))}
      {half && <Ionicons name="star-half" size={12} color="#F59E0B" />}
    </View>
  );
};

const SuggestedProfilesScreen = ({ route, navigation }) => {
  const { mission } = route.params;
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggested();
  }, []);

  const loadSuggested = async () => {
    // Priorité 1 : IDs calculés par la Cloud Function suggestAlternatives
    if (mission?.suggestedInterpreters?.length > 0) {
      const result = await getInterpretersByIds(mission.suggestedInterpreters);
      if (result.success && result.interpreters.length > 0) {
        setInterpreters(result.interpreters);
        setLoading(false);
        return;
      }
    }

    // Fallback : recherche générale par critères de la mission
    const result = await searchInterpreters({
      languageFrom: mission?.languageFrom,
      languageTo: mission?.languageTo,
      region: mission?.region || undefined,
      sortBy: 'rating',
      limit: 10,
    });

    if (result.success) {
      const sorted = result.interpreters
        .sort((a, b) => {
          if ((b.searchPriority || 1) !== (a.searchPriority || 1))
            return (b.searchPriority || 1) - (a.searchPriority || 1);
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, 5);
      setInterpreters(sorted);
    }
    setLoading(false);
  };

  const handleViewProfile = (interpreterId) => {
    navigation.navigate('InterpreterDetail', { interpreterId });
  };

  const handleSearchAll = () => {
    navigation.navigate('InterpretersListTab');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerIconBox}>
          <Ionicons name="people-outline" size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Prestataires disponibles</Text>
        <Text style={styles.headerSub}>
          Aucun prestataire n'a répondu automatiquement.{'\n'}
          Voici les profils correspondant à votre mission.
        </Text>
        {/* Tags mission */}
        {(mission?.languageFrom || mission?.languageTo) && (
          <View style={styles.tagsRow}>
            {mission.languageFrom && (
              <View style={styles.tag}>
                <Ionicons name="language-outline" size={13} color={COLORS.primary} />
                <Text style={styles.tagText}>{mission.languageFrom} → {mission.languageTo}</Text>
              </View>
            )}
            {mission.service && (
              <View style={styles.tag}>
                <Ionicons name="briefcase-outline" size={13} color={COLORS.primary} />
                <Text style={styles.tagText}>{mission.service.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {interpreters.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="search-outline" size={40} color={COLORS.outlineVariant} />
          <Text style={styles.emptyTitle}>Aucun prestataire trouvé</Text>
          <Text style={styles.emptySub}>
            Essayez de modifier les critères de votre mission ou consultez tous les prestataires.
          </Text>
          <TouchableOpacity style={[styles.allBtn, SHADOWS.card]} onPress={handleSearchAll} activeOpacity={0.85}>
            <Text style={styles.allBtnText}>Voir tous les prestataires</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={interpreters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={() => (
            <TouchableOpacity style={styles.moreBtn} onPress={handleSearchAll} activeOpacity={0.7}>
              <Ionicons name="search-outline" size={15} color={COLORS.primary} />
              <Text style={styles.moreBtnText}>Voir tous les prestataires</Text>
            </TouchableOpacity>
          )}
          renderItem={({ item }) => {
            const avatarColor = getAvatarColor(item.firstName);
            const initials = `${item.firstName?.charAt(0) || ''}${item.lastName?.charAt(0) || ''}`.toUpperCase();
            const langPair = item.languages?.[0];
            const planBadge = item.searchPriority === 3
              ? { label: 'Premium', color: '#F59E0B' }
              : item.searchPriority === 2
              ? { label: 'Pro', color: COLORS.primary }
              : null;

            return (
              <TouchableOpacity
                style={[styles.card, SHADOWS.card]}
                onPress={() => handleViewProfile(item.id)}
                activeOpacity={0.85}
              >
                {/* Avatar */}
                <View style={[styles.cardAvatar, { backgroundColor: avatarColor.bg }]}>
                  <Text style={[styles.cardAvatarText, { color: avatarColor.text }]}>{initials || '?'}</Text>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{item.firstName} {item.lastName}</Text>
                    {item.assermente && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={12} color={COLORS.secondary} />
                        <Text style={styles.verifiedText}>Assermenté</Text>
                      </View>
                    )}
                    {planBadge && (
                      <View style={[styles.planBadge, { borderColor: planBadge.color }]}>
                        <Text style={[styles.planBadgeText, { color: planBadge.color }]}>{planBadge.label}</Text>
                      </View>
                    )}
                  </View>

                  {item.city && (
                    <View style={styles.cardRow}>
                      <Ionicons name="location-outline" size={12} color={COLORS.onSurfaceVariant} />
                      <Text style={styles.cardMeta}>{item.city}</Text>
                    </View>
                  )}

                  {langPair && (
                    <View style={styles.cardRow}>
                      <Ionicons name="language-outline" size={12} color={COLORS.onSurfaceVariant} />
                      <Text style={styles.cardMeta}>{langPair.source} → {langPair.target}</Text>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    {item.rating > 0 && (
                      <View style={styles.cardRow}>
                        <StarRow rating={item.rating} />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    {item.hourlyRate && (
                      <Text style={styles.rateText}>{item.hourlyRate}€/h</Text>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={COLORS.outlineVariant} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 20,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: COLORS.primaryFixed, top: -60, right: -40,
  },
  headerDecor2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryFixed, bottom: -40, left: -20,
  },
  headerIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20, fontWeight: '800', color: COLORS.onSurface,
    textAlign: 'center', letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13, color: COLORS.onSurfaceVariant,
    textAlign: 'center', lineHeight: 19,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18, padding: 14, gap: 12,
  },
  cardAvatar: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 20, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  cardName: { fontSize: 15, fontWeight: '800', color: COLORS.onSurface },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: COLORS.secondary },
  planBadge: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  planBadgeText: { fontSize: 10, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMeta: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  rateText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  moreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16, paddingVertical: 12,
  },
  moreBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  emptySub: { fontSize: 13, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 19 },
  allBtn: {
    backgroundColor: COLORS.primary, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 28, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  allBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default SuggestedProfilesScreen;
