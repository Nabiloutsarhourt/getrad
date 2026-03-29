// Gestion des disponibilités — vue interprète (GETRAD)
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SHADOWS } from '../../config/constants';

const DAYS = [
  { key: 0, short: 'Lun', full: 'Lundi' },
  { key: 1, short: 'Mar', full: 'Mardi' },
  { key: 2, short: 'Mer', full: 'Mercredi' },
  { key: 3, short: 'Jeu', full: 'Jeudi' },
  { key: 4, short: 'Ven', full: 'Vendredi' },
  { key: 5, short: 'Sam', full: 'Samedi' },
  { key: 6, short: 'Dim', full: 'Dimanche' },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h → 22h

const STATUS_OPTIONS = [
  {
    key: 'available',
    label: 'Disponible',
    sub: 'Je reçois des missions et demandes',
    icon: 'checkmark-circle',
    color: COLORS.secondary,
    bg: COLORS.secondaryFixed,
  },
  {
    key: 'busy',
    label: 'Occupé(e)',
    sub: 'Je ne reçois pas de nouvelles missions',
    icon: 'time-outline',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    key: 'vacation',
    label: 'En congés',
    sub: 'Indisponible jusqu\'à nouvel ordre',
    icon: 'airplane-outline',
    color: COLORS.error,
    bg: COLORS.errorContainer,
  },
];

const DEFAULT_AVAILABILITY = {
  status: 'available',
  weekdays: [0, 1, 2, 3, 4], // Lun-Ven par défaut
  startHour: 8,
  endHour: 18,
  acceptsRemote: true,
  acceptsOnsite: true,
};

const AvailabilityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avail, setAvail] = useState(DEFAULT_AVAILABILITY);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const snap = await getDoc(doc(db, 'interpreters', user.uid));
      if (snap.exists() && snap.data().availability) {
        setAvail({ ...DEFAULT_AVAILABILITY, ...snap.data().availability });
      }
    } catch (error) {
      console.error('loadAvailability error:', error);
    }
    setLoading(false);
  };

  const toggleDay = (dayKey) => {
    setAvail(prev => {
      const days = prev.weekdays.includes(dayKey)
        ? prev.weekdays.filter(d => d !== dayKey)
        : [...prev.weekdays, dayKey].sort();
      return { ...prev, weekdays: days };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'interpreters', user.uid), {
        availability: avail,
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Enregistré', 'Vos disponibilités ont été mises à jour.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer. Réessayez.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.key === avail.status) || STATUS_OPTIONS[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.bg }]}>
          <Ionicons name={currentStatus.icon} size={18} color={currentStatus.color} />
          <Text style={[styles.statusBadgeText, { color: currentStatus.color }]}>
            {currentStatus.label}
          </Text>
        </View>
        <Text style={styles.headerTitle}>Mes disponibilités</Text>
        <Text style={styles.headerSub}>
          Gérez votre agenda pour recevoir des missions adaptées à votre planning.
        </Text>
      </View>

      {/* Statut général */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <Text style={styles.sectionTitle}>Statut général</Text>
        {STATUS_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.statusOption,
              avail.status === opt.key && styles.statusOptionActive,
              avail.status === opt.key && { borderColor: opt.color, backgroundColor: opt.bg },
            ]}
            onPress={() => setAvail(prev => ({ ...prev, status: opt.key }))}
            activeOpacity={0.8}
          >
            <View style={[styles.statusOptionIcon, { backgroundColor: opt.bg }]}>
              <Ionicons name={opt.icon} size={20} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusOptionLabel, avail.status === opt.key && { color: opt.color }]}>
                {opt.label}
              </Text>
              <Text style={styles.statusOptionSub}>{opt.sub}</Text>
            </View>
            {avail.status === opt.key && (
              <Ionicons name="checkmark-circle" size={20} color={opt.color} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Jours disponibles */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <Text style={styles.sectionTitle}>Jours travaillés</Text>
        <View style={styles.daysGrid}>
          {DAYS.map(day => {
            const active = avail.weekdays.includes(day.key);
            return (
              <TouchableOpacity
                key={day.key}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleDay(day.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayShort, active && styles.dayShortActive]}>{day.short}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Horaires */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <Text style={styles.sectionTitle}>Horaires habituels</Text>
        <View style={styles.hoursRow}>
          {/* Début */}
          <View style={styles.hourPicker}>
            <Text style={styles.hourLabel}>Début</Text>
            <View style={styles.hourControls}>
              <TouchableOpacity
                style={styles.hourBtn}
                onPress={() => setAvail(prev => ({ ...prev, startHour: Math.max(6, prev.startHour - 1) }))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.hourValue}>{avail.startHour}:00</Text>
              <TouchableOpacity
                style={styles.hourBtn}
                onPress={() => setAvail(prev => ({
                  ...prev,
                  startHour: Math.min(prev.endHour - 1, prev.startHour + 1),
                }))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Ionicons name="arrow-forward" size={18} color={COLORS.outlineVariant} style={{ marginTop: 28 }} />

          {/* Fin */}
          <View style={styles.hourPicker}>
            <Text style={styles.hourLabel}>Fin</Text>
            <View style={styles.hourControls}>
              <TouchableOpacity
                style={styles.hourBtn}
                onPress={() => setAvail(prev => ({
                  ...prev,
                  endHour: Math.max(prev.startHour + 1, prev.endHour - 1),
                }))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.hourValue}>{avail.endHour}:00</Text>
              <TouchableOpacity
                style={styles.hourBtn}
                onPress={() => setAvail(prev => ({ ...prev, endHour: Math.min(22, prev.endHour + 1) }))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Type de mission acceptées */}
      <View style={[styles.section, SHADOWS.subtle]}>
        <Text style={styles.sectionTitle}>Type de missions acceptées</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Ionicons name="videocam-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.switchLabel}>À distance</Text>
              <Text style={styles.switchSub}>Visioconférence, téléphone</Text>
            </View>
          </View>
          <Switch
            value={avail.acceptsRemote}
            onValueChange={v => setAvail(prev => ({ ...prev, acceptsRemote: v }))}
            trackColor={{ false: COLORS.outlineVariant, true: COLORS.primaryFixed }}
            thumbColor={avail.acceptsRemote ? COLORS.primary : COLORS.outline}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Ionicons name="business-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.switchLabel}>En présentiel</Text>
              <Text style={styles.switchSub}>Déplacements sur site</Text>
            </View>
          </View>
          <Switch
            value={avail.acceptsOnsite}
            onValueChange={v => setAvail(prev => ({ ...prev, acceptsOnsite: v }))}
            trackColor={{ false: COLORS.outlineVariant, true: COLORS.primaryFixed }}
            thumbColor={avail.acceptsOnsite ? COLORS.primary : COLORS.outline}
          />
        </View>
      </View>

      {/* Bouton sauvegarder */}
      <TouchableOpacity
        style={[styles.saveBtn, SHADOWS.card, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.saveBtnText}>Enregistrer les disponibilités</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 22,
    gap: 8,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -40,
  },
  headerDecor2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '800' },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: COLORS.white,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 19,
  },

  section: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20, padding: 18, gap: 12,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: COLORS.onSurface, marginBottom: 2,
  },

  // Status options
  statusOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.outlineVariant,
  },
  statusOptionActive: { borderWidth: 2 },
  statusOptionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statusOptionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  statusOptionSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },

  // Days
  daysGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dayChip: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1.5, borderColor: COLORS.outlineVariant,
  },
  dayChipActive: {
    backgroundColor: COLORS.primaryFixed,
    borderColor: COLORS.primary,
  },
  dayShort: { fontSize: 13, fontWeight: '700', color: COLORS.onSurfaceVariant },
  dayShortActive: { color: COLORS.primary },

  // Hours
  hoursRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  hourPicker: { flex: 1, gap: 6 },
  hourLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  hourControls: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14, overflow: 'hidden',
  },
  hourBtn: {
    width: 44, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  hourValue: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '800', color: COLORS.primary,
  },

  // Switches
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  switchLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  switchSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.outlineVariant },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 28,
    paddingVertical: 18, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});

export default AvailabilityScreen;
