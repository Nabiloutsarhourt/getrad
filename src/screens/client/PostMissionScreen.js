// Poster une mission - GETRAD (vue client)
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { createMission } from '../../services/missionService';
import { trackMissionCreated } from '../../services/analyticsService';

const SERVICES = [
  { id: 'interpretation_simultanee',  label: 'Interprétation simultanée',             icon: 'headset-outline' },
  { id: 'interpretation_consecutive', label: 'Interprétation consécutive',            icon: 'mic-outline' },
  { id: 'interpretation_liaison',     label: 'Interprétation de liaison',             icon: 'people-outline' },
  { id: 'interpretation_presentiel',  label: 'Interprétation en présentiel',          icon: 'business-outline' },
  { id: 'interpretation_distance',    label: 'Interprétation à distance',             icon: 'videocam-outline' },
  { id: 'traduction_documents',       label: 'Traduction de documents',               icon: 'document-text-outline' },
  { id: 'traduction_site_web',        label: 'Traduction de sites web / apps',        icon: 'globe-outline' },
  { id: 'localisation',              label: 'Localisation linguistique',             icon: 'language-outline' },
  { id: 'traduction_assermentee',    label: 'Traduction assermentée',               icon: 'scale-outline' },
  { id: 'relecture_revision',        label: 'Relecture et révision',                icon: 'create-outline' },
  { id: 'transcription',             label: 'Transcription audio',                  icon: 'musical-notes-outline' },
  { id: 'sous_titrage',              label: 'Sous-titrage',                         icon: 'closed-captioning-outline' },
  { id: 'voice_over',                label: 'Voice-over / doublage',               icon: 'volume-high-outline' },
  { id: 'post_edition',              label: 'Post-édition (traduction auto)',       icon: 'robot-outline' },
  { id: 'gestion_projet',            label: 'Gestion de projets linguistiques',    icon: 'briefcase-outline' },
  { id: 'guide_touristique',         label: 'Guide touristique multilingue',        icon: 'map-outline' },
  { id: 'formation_langues',         label: 'Formation en langues',                icon: 'school-outline' },
];

const PostMissionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    service: '',
    languageFrom: '',
    languageTo: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    region: '',
    budget: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!form.service) return 'Choisissez un type de service.';
    if (!form.languageFrom || !form.languageTo) return 'Indiquez les langues source et cible.';
    if (!form.date) return 'Indiquez la date souhaitée.';
    if (!form.description || form.description.trim().length < 20)
      return 'La description doit comporter au moins 20 caractères.';
    if (!form.location) return 'Indiquez le lieu ou "À distance".';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Champ manquant', error);
      return;
    }

    setLoading(true);
    const result = await createMission({
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
    }, user.uid);

    if (result.success) {
      trackMissionCreated(form.serviceType, `${form.sourceLanguage}-${form.targetLanguage}`);
      navigation.replace('MissionTracking', { missionId: result.missionId });
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de publier la mission.');
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.heroHeader}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Text style={styles.heroTitle}>Poster une mission</Text>
        <Text style={styles.heroSub}>
          Décrivez votre besoin — notre algorithme trouve le bon prestataire automatiquement.
        </Text>
      </View>

      {/* Service */}
      <SectionCard title="Type de service *">
        <View style={styles.serviceGrid}>
          {SERVICES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.serviceChip, form.service === s.id && styles.serviceChipActive]}
              onPress={() => set('service', s.id)}
              activeOpacity={0.75}
            >
              <Ionicons name={s.icon} size={24} color={form.service === s.id ? COLORS.primary : COLORS.onSurfaceVariant} />
              <Text style={[styles.serviceLabel, form.service === s.id && styles.serviceLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>

      {/* Langues */}
      <SectionCard title="Langues *">
        <View style={styles.langRow}>
          <View style={styles.langPicker}>
            <Text style={styles.inputLabel}>Langue source</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pillsRow}>
                {['Français', 'Anglais', 'Arabe', 'Espagnol', 'Chinois (Mandarin)'].map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.pill, form.languageFrom === l && styles.pillActive]}
                    onPress={() => set('languageFrom', l)}
                  >
                    <Text style={[styles.pillText, form.languageFrom === l && styles.pillTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Autre langue..."
              value={!['Français','Anglais','Arabe','Espagnol','Chinois (Mandarin)'].includes(form.languageFrom) ? form.languageFrom : ''}
              onChangeText={v => set('languageFrom', v)}
              placeholderTextColor={COLORS.onSurfaceVariant}
            />
          </View>

          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} style={{ marginTop: 28 }} />

          <View style={styles.langPicker}>
            <Text style={styles.inputLabel}>Langue cible</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pillsRow}>
                {['Français', 'Anglais', 'Arabe', 'Espagnol', 'Chinois (Mandarin)'].map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.pill, form.languageTo === l && styles.pillActive]}
                    onPress={() => set('languageTo', l)}
                  >
                    <Text style={[styles.pillText, form.languageTo === l && styles.pillTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Autre langue..."
              value={!['Français','Anglais','Arabe','Espagnol','Chinois (Mandarin)'].includes(form.languageTo) ? form.languageTo : ''}
              onChangeText={v => set('languageTo', v)}
              placeholderTextColor={COLORS.onSurfaceVariant}
            />
          </View>
        </View>
      </SectionCard>

      {/* Date et créneau */}
      <SectionCard title="Date et créneau *">
        <Field label="Date (ex: 15/04/2025)" value={form.date} onChange={v => set('date', v)} placeholder="JJ/MM/AAAA" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Heure de début" value={form.startTime} onChange={v => set('startTime', v)} placeholder="09:00" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Heure de fin" value={form.endTime} onChange={v => set('endTime', v)} placeholder="12:00" />
          </View>
        </View>
      </SectionCard>

      {/* Lieu */}
      <SectionCard title="Lieu *">
        <View style={styles.pillsRow}>
          {['À distance', 'En présentiel'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, form.location === opt && styles.pillActive]}
              onPress={() => set('location', opt)}
            >
              <Text style={[styles.pillText, form.location === opt && styles.pillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {form.location === 'En présentiel' && (
          <Field label="Ville / adresse" value={form.region} onChange={v => set('region', v)} placeholder="Ex: Paris 8e" />
        )}
      </SectionCard>

      {/* Description */}
      <SectionCard title="Description *">
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={5}
          placeholder="Décrivez votre besoin : contexte, sujet, audience, contraintes particulières... (min. 20 caractères)"
          value={form.description}
          onChangeText={v => set('description', v)}
          placeholderTextColor={COLORS.onSurfaceVariant}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{form.description.length} / min. 20 car.</Text>
      </SectionCard>

      {/* Budget (optionnel) */}
      <SectionCard title="Budget estimé (optionnel)">
        <Field
          label="Budget en € (indicatif)"
          value={form.budget}
          onChange={v => set('budget', v)}
          placeholder="Ex: 150"
          keyboard="numeric"
        />
      </SectionCard>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, SHADOWS.card, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} />
          : <><Text style={styles.submitText}>Publier la mission</Text><Ionicons name="arrow-forward" size={18} color={COLORS.white} /></>
        }
      </TouchableOpacity>

      <Text style={styles.note}>
        Notre algorithme contactera automatiquement les prestataires disponibles dans l'ordre de priorité.
      </Text>
    </ScrollView>
  );
};

// ── Composants utilitaires ────────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <View style={[sCard.card, SHADOWS.subtle]}>
    <Text style={sCard.title}>{title}</Text>
    {children}
  </View>
);

const Field = ({ label, value, onChange, placeholder, keyboard }) => (
  <View style={sField.wrap}>
    <Text style={sField.label}>{label}</Text>
    <TextInput
      style={sField.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={COLORS.onSurfaceVariant}
      keyboardType={keyboard || 'default'}
    />
  </View>
);

const sCard = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
});

const sField = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.onSurface,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 40 },

  heroHeader: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    gap: 6,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -40,
  },
  heroDecor2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.primaryFixedDim,
    lineHeight: 18,
  },

  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    width: '48%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  serviceChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryFixed,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  serviceLabelActive: { color: COLORS.primary },

  langRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  langPicker: { flex: 1, gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  pillActive: {
    backgroundColor: COLORS.primaryFixed,
    borderColor: COLORS.primary,
  },
  pillText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  pillTextActive: { color: COLORS.primary, fontWeight: '700' },

  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.onSurface,
    marginTop: 4,
  },

  row: { flexDirection: 'row', gap: 10 },

  textArea: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: COLORS.onSurface,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    textAlign: 'right',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  note: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PostMissionScreen;
