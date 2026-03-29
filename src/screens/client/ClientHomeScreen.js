// Écran d'accueil Client - GETRAD
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { getRecommendedInterpreters } from '../../services/searchService';

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

const CATEGORIES = [
  { id: 'juridique',  label: 'Juridique',  icon: 'document-text-outline', specialty: 'Juridique' },
  { id: 'medical',    label: 'Médical',    icon: 'medkit-outline',         specialty: 'Médical' },
  { id: 'conference', label: 'Conférence', icon: 'mic-outline',            specialty: 'Conférence' },
  { id: 'commercial', label: 'Commercial', icon: 'briefcase-outline',      specialty: 'Commercial' },
];

const ClientHomeScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommended();
  }, []);

  const loadRecommended = async () => {
    const result = await getRecommendedInterpreters();
    if (result.success) {
      setInterpreters(result.interpreters.slice(0, 5));
    }
    setLoading(false);
  };

  const firstName = userData?.displayName?.split(' ')[0] || 'vous';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        {/* Éléments décoratifs */}
        <View style={styles.headerDecorCircle1} />
        <View style={styles.headerDecorCircle2} />

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>
            <Text style={styles.headerTitle}>De quoi avez-vous{'\n'}besoin aujourd'hui ?</Text>
          </View>
          <TouchableOpacity
            style={styles.headerProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerProfileText}>
              {userData?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={[styles.searchBar, SHADOWS.card]}
        onPress={() => navigation.navigate('InterpretersListTab')}
        activeOpacity={0.85}
      >
        <Ionicons name="search-outline" size={18} color={COLORS.onSurfaceVariant} />
        <Text style={styles.searchPlaceholder}>Rechercher un prestataire...</Text>
        <View style={styles.searchFilter}>
          <Ionicons name="options-outline" size={16} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickActionCard, styles.quickActionPrimary, SHADOWS.card]}
          onPress={() => navigation.navigate('PostMission')}
          activeOpacity={0.85}
        >
          <View style={styles.quickActionIconBox}>
            <Ionicons name="clipboard-outline" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionLabelPrimary}>Mission</Text>
          <Text style={styles.quickActionSubLabel}>Poster une demande</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, SHADOWS.card]}
          onPress={() => navigation.navigate('InterpretersListTab')}
          activeOpacity={0.85}
        >
          <View style={styles.quickActionIconBox}>
            <Ionicons name="search-outline" size={22} color={COLORS.onSurface} />
          </View>
          <Text style={styles.quickActionLabel}>Explorer</Text>
          <Text style={styles.quickActionSubLabel}>Tous les prestataires</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, SHADOWS.card]}
          onPress={() => navigation.navigate('MessagesTab')}
          activeOpacity={0.85}
        >
          <View style={styles.quickActionIconBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={COLORS.onSurface} />
          </View>
          <Text style={styles.quickActionLabel}>Messages</Text>
          <Text style={styles.quickActionSubLabel}>Conversations</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services populaires</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, SHADOWS.subtle]}
              onPress={() => navigation.navigate('InterpretersListTab', { specialty: cat.specialty })}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={26} color={COLORS.primary} />
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recommended Interpreters */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prestataires recommandés</Text>
          <TouchableOpacity onPress={() => navigation.navigate('InterpretersListTab')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : interpreters.length === 0 ? (
          <View style={[styles.emptyCard, SHADOWS.subtle]}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun prestataire pour l'instant</Text>
            <Text style={styles.emptyText}>
              Soyez le premier à rejoindre la plateforme.
            </Text>
          </View>
        ) : (
          interpreters.map((interpreter) => {
            const avColor = getAvatarColor(interpreter.firstName);
            return (
            <TouchableOpacity
              key={interpreter.id}
              style={[styles.interpreterCard, SHADOWS.card]}
              onPress={() => navigation.navigate('InterpreterDetail', { interpreterId: interpreter.id })}
              activeOpacity={0.85}
            >
              {/* Avatar */}
              <View style={[styles.interpreterAvatar, { backgroundColor: avColor.bg }]}>
                <Text style={[styles.interpreterAvatarText, { color: avColor.text }]}>
                  {(interpreter.firstName?.[0] || '?').toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.interpreterInfo}>
                <Text style={styles.interpreterName}>
                  {interpreter.firstName} {interpreter.lastName}
                </Text>
                <Text style={styles.interpreterSpecialty}>
                  {interpreter.specialties?.slice(0, 2).join(' · ') || 'Prestataire'}
                </Text>
                <View style={styles.interpreterMeta}>
                  {interpreter.city ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={11} color={COLORS.onSurfaceVariant} />
                      <Text style={styles.interpreterLocation}>{interpreter.city}</Text>
                    </View>
                  ) : null}
                  {interpreter.rating > 0 ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text style={styles.interpreterRating}>{interpreter.rating}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Rate + CTA */}
              <View style={styles.interpreterRight}>
                {interpreter.hourlyRate > 0 ? (
                  <>
                    <Text style={styles.interpreterRate}>{interpreter.hourlyRate}€</Text>
                    <Text style={styles.interpreterRateLabel}>/h</Text>
                  </>
                ) : null}
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} style={styles.interpreterArrow} />
              </View>
            </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Comment ça marche */}
      <View style={[styles.howItWorks, SHADOWS.subtle]}>
        <Text style={styles.howTitle}>Comment ça marche</Text>
        {[
          { step: '1', text: 'Recherchez un prestataire selon vos besoins' },
          { step: '2', text: 'Consultez son profil et ses avis' },
          { step: '3', text: 'Envoyez une demande de réservation' },
          { step: '4', text: 'Recevez la confirmation et profitez du service' },
        ].map((item) => (
          <View key={item.step} style={styles.howStep}>
            <View style={styles.howStepNumber}>
              <Text style={styles.howStepNumberText}>{item.step}</Text>
            </View>
            <Text style={styles.howStepText}>{item.text}</Text>
          </View>
        ))}
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
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 44,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  headerDecorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -50,
  },
  headerDecorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerProfileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerProfileText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryFixedDim,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    marginHorizontal: 20,
    marginTop: -22,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  searchFilter: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickActionPrimary: {
    backgroundColor: COLORS.primaryFixed,
  },
  quickActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabelPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  quickActionSubLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Categories
  categoriesScroll: {
    gap: 10,
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    minWidth: 84,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  // Loading
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },

  // Interpreter card
  interpreterCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  interpreterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interpreterAvatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  interpreterInfo: {
    flex: 1,
    gap: 3,
  },
  interpreterName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  interpreterSpecialty: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  interpreterMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  interpreterLocation: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  interpreterRating: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  interpreterRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  interpreterRate: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  interpreterRateLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  interpreterArrow: {
    marginTop: 4,
  },

  // Empty
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },

  // How it works
  howItWorks: {
    margin: 20,
    marginTop: 28,
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  howTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  howStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  howStepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  howStepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 20,
    fontWeight: '500',
    paddingTop: 4,
  },
});

export default ClientHomeScreen;
