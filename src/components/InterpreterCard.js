// Composant carte d'interprète pour afficher dans une liste
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/constants';

const InterpreterCard = ({ interpreter, onPress }) => {
  const {
    firstName,
    lastName,
    city,
    languages,
    specialties,
    hourlyRate,
    rating,
    reviewCount,
    assermente,
    user
  } = interpreter;

  const photoURL = user?.photoURL;
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;

  const displayLanguages = languages?.slice(0, 2).map(lang =>
    `${lang.source} → ${lang.target}`
  ).join(', ') || 'Non spécifié';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        {/* Photo / Initials */}
        <View style={styles.photoContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Main info */}
        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{firstName} {lastName}</Text>
            {assermente && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={10} color={COLORS.onPrimary} />
                <Text style={styles.badgeText}>Assermenté</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.onSurfaceVariant} />
            <Text style={styles.city}>{city || '—'}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.rating}>{rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.reviewCount}>({reviewCount || 0} avis)</Text>
          </View>
        </View>
      </View>

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Langues</Text>
        <Text style={styles.sectionValue} numberOfLines={1}>
          {displayLanguages}
          {languages?.length > 2 && ` +${languages.length - 2}`}
        </Text>
      </View>

      {/* Specialties */}
      {specialties && specialties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Spécialités</Text>
          <View style={styles.tags}>
            {specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{specialty}</Text>
              </View>
            ))}
            {specialties.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{specialties.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.rate}>
          À partir de <Text style={styles.rateValue}>{hourlyRate || 0}€</Text>/h
        </Text>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color={COLORS.onPrimary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  photoContainer: {
    marginRight: 14,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onPrimary,
    letterSpacing: 0.5,
  },
  mainInfo: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: -0.2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  section: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  sectionValue: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  rate: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  rateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InterpreterCard;
