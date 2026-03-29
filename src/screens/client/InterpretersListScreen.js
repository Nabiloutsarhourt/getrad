// Écran de liste des interprètes pour GETRAD — MD3
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, LANGUAGES, SPECIALTIES, REGIONS } from '../../config/constants';
import { searchInterpreters, getAllInterpreters } from '../../services/searchService';
import Picker from '../../components/Picker';
import Button from '../../components/Button';

// Plan badge label
const PLAN_LABEL = { 3: 'TOP', 2: 'PRO', 1: '' };

const InterpretersListScreen = ({ navigation, route }) => {
  const [interpreters, setInterpreters] = useState([]);
  const [filteredInterpreters, setFilteredInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    languageFrom: '',
    languageTo: '',
    city: '',
    specialty: route?.params?.specialty || '',
    region: '',
    minRating: '',
    maxHourlyRate: '',
  });

  const hasActiveFilters =
    filters.languageFrom || filters.languageTo || filters.specialty ||
    filters.region || filters.city || filters.minRating || filters.maxHourlyRate;

  useEffect(() => {
    if (route?.params?.specialty) {
      handleApplyFilters({ ...filters, specialty: route.params.specialty });
    } else {
      loadInterpreters();
    }
  }, []);

  useEffect(() => {
    applyLocalSearch();
  }, [searchText, interpreters]);

  const loadInterpreters = async () => {
    setLoading(true);
    const result = await getAllInterpreters();
    if (result.success) {
      const sorted = sortByPriority(result.interpreters);
      setInterpreters(sorted);
      setFilteredInterpreters(sorted);
    }
    setLoading(false);
  };

  const sortByPriority = (list) =>
    [...list].sort((a, b) => {
      const pa = b.searchPriority || 0;
      const pb = a.searchPriority || 0;
      if (pa !== pb) return pa - pb;
      return (b.rating || 0) - (a.rating || 0);
    });

  const applyLocalSearch = () => {
    if (!searchText.trim()) {
      setFilteredInterpreters(interpreters);
      return;
    }
    const q = searchText.toLowerCase();
    setFilteredInterpreters(
      interpreters.filter(
        (i) =>
          (i.firstName || '').toLowerCase().includes(q) ||
          (i.lastName || '').toLowerCase().includes(q) ||
          (i.city || '').toLowerCase().includes(q),
      ),
    );
  };

  const handleApplyFilters = async (overrideFilters) => {
    setShowFilters(false);
    setLoading(true);
    const activeFilters = overrideFilters || filters;
    const result = await searchInterpreters(activeFilters);
    if (result.success) {
      const sorted = sortByPriority(result.interpreters);
      setInterpreters(sorted);
      setFilteredInterpreters(sorted);
    }
    setLoading(false);
  };

  const handleResetFilters = () => {
    const empty = {
      languageFrom: '', languageTo: '', city: '',
      specialty: '', region: '', minRating: '', maxHourlyRate: '',
    };
    setFilters(empty);
    loadInterpreters();
    setShowFilters(false);
  };

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const AVATAR_COLORS = [
    { bg: '#E0E7FF', text: '#3730A3' },
    { bg: '#FCE7F3', text: '#9D174D' },
    { bg: '#D1FAE5', text: '#065F46' },
    { bg: '#FEF3C7', text: '#92400E' },
    { bg: '#DBEAFE', text: '#1E40AF' },
    { bg: '#F3E8FF', text: '#6B21A8' },
    { bg: '#FFEDD5', text: '#9A3412' },
  ];

  const getAvatarColor = (name) => {
    const code = (name || 'A').charCodeAt(0);
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
  };

  const renderInterpreter = ({ item }) => {
    const planLabel = PLAN_LABEL[item.searchPriority] || '';
    const initials = ((item.firstName?.[0] || '') + (item.lastName?.[0] || '')).toUpperCase() || '?';
    const avatarColor = getAvatarColor(item.firstName);

    return (
      <TouchableOpacity
        style={[styles.card, SHADOWS.card]}
        onPress={() => navigation.navigate('InterpreterDetail', { interpreterId: item.id })}
        activeOpacity={0.85}
      >
        {/* Avatar */}
        <View style={[styles.cardAvatar, { backgroundColor: avatarColor.bg }]}>
          <Text style={[styles.cardAvatarText, { color: avatarColor.text }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>
            {planLabel ? (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{planLabel}</Text>
              </View>
            ) : null}
            {item.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={10} color={COLORS.secondary} />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            ) : null}
          </View>

          {item.specialties?.length > 0 && (
            <Text style={styles.cardSpecialty} numberOfLines={1}>
              {item.specialties.slice(0, 2).join(' · ')}
            </Text>
          )}

          <View style={styles.cardMeta}>
            {item.city ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={11} color={COLORS.onSurfaceVariant} />
                <Text style={styles.cardMetaText}>{item.city}</Text>
              </View>
            ) : null}
            {item.rating > 0 ? (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.cardMetaText}>{item.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {item.languages?.length > 0 ? (
              <View style={styles.metaItem}>
                <Ionicons name="language-outline" size={11} color={COLORS.onSurfaceVariant} />
                <Text style={styles.cardMetaText} numberOfLines={1}>
                  {item.languages.slice(0, 2).map(l => `${l.source}→${l.target}`).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tarif */}
        <View style={styles.cardRight}>
          {item.hourlyRate > 0 ? (
            <>
              <Text style={styles.cardRate}>{item.hourlyRate}€</Text>
              <Text style={styles.cardRateLabel}>/h</Text>
            </>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} style={styles.cardArrow} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="search-outline" size={32} color={COLORS.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>Aucun prestataire trouvé</Text>
      <Text style={styles.emptyText}>Essayez de modifier vos critères</Text>
      <Button
        title="Réinitialiser les filtres"
        variant="outline"
        onPress={handleResetFilters}
        style={{ marginTop: 16 }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Text style={styles.heroTitle}>Explorer</Text>
        <Text style={styles.heroSub}>Trouvez le prestataire idéal</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={16} color={COLORS.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nom, ville..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? COLORS.primary : COLORS.onSurfaceVariant}
          />
          {hasActiveFilters ? <View style={styles.filterDot} /> : null}
        </TouchableOpacity>
      </View>

      {/* Compteur résultats */}
      {!loading && (
        <Text style={styles.resultsCount}>
          {filteredInterpreters.length} prestataire{filteredInterpreters.length !== 1 ? 's' : ''}
          {hasActiveFilters ? ' · filtré' : ''}
        </Text>
      )}

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredInterpreters}
          renderItem={renderInterpreter}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom sheet filtres */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filtres</Text>
            <TouchableOpacity onPress={handleResetFilters}>
              <Text style={styles.sheetReset}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <Picker
              label="Langue source"
              value={filters.languageFrom}
              onValueChange={(v) => updateFilter('languageFrom', v)}
              options={LANGUAGES}
              placeholder="Toutes les langues"
            />
            <Picker
              label="Langue cible"
              value={filters.languageTo}
              onValueChange={(v) => updateFilter('languageTo', v)}
              options={LANGUAGES}
              placeholder="Toutes les langues"
            />
            <Picker
              label="Spécialité"
              value={filters.specialty}
              onValueChange={(v) => updateFilter('specialty', v)}
              options={SPECIALTIES}
              placeholder="Toutes les spécialités"
            />
            <Picker
              label="Région"
              value={filters.region}
              onValueChange={(v) => updateFilter('region', v)}
              options={REGIONS}
              placeholder="Toutes les régions"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Ville"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={filters.city}
              onChangeText={(v) => updateFilter('city', v)}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Tarif max (€/h)"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={filters.maxHourlyRate}
              onChangeText={(v) => updateFilter('maxHourlyRate', v)}
              keyboardType="numeric"
            />
            <Picker
              label="Note minimale"
              value={filters.minRating}
              onValueChange={(v) => updateFilter('minRating', v)}
              options={[
                { label: 'Toutes les notes', value: '' },
                { label: '5 étoiles', value: '5' },
                { label: '4+ étoiles', value: '4' },
                { label: '3+ étoiles', value: '3' },
              ]}
              placeholder="Toutes les notes"
            />
          </ScrollView>

          <View style={styles.sheetActions}>
            <Button title="Appliquer les filtres" onPress={() => handleApplyFilters()} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },

  // Hero
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
    overflow: 'hidden',
    gap: 4,
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primaryFixed,
    borderColor: COLORS.primary,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    letterSpacing: 0.3,
  },

  listContent: {
    padding: 16,
    gap: 10,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  planBadge: {
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.secondaryFixed,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  cardSpecialty: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMetaText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  cardRate: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardRateLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  cardArrow: {
    marginTop: 4,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },

  // Bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  sheetReset: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sheetBody: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  sheetActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
});

export default InterpretersListScreen;
