// Écran de soumission du dossier de vérification — GETRAD (interprète)
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { submitVerification, uploadVerificationDocument } from '../../services/verificationService';

const VerificationScreen = ({ existingData }) => {
  const { user, userData } = useAuth();
  const isRejected = existingData?.status === 'rejete';

  const [form, setForm] = useState({
    fullName:    existingData?.fullName    || userData?.displayName || '',
    phone:       existingData?.phone       || userData?.phone       || '',
    address:     existingData?.address     || '',
    siretNumber: existingData?.siretNumber || '',
    kbisURL:     existingData?.kbisURL     || '',
    identiteURL: existingData?.identiteURL || '',
  });
  const [uploading, setUploading] = useState({ kbis: false, identite: false });
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const pickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Kbis : PDF uniquement — Pièce d'identité : PDF ou image (carte, passeport)
        type: type === 'identite' ? ['application/pdf', 'image/*'] : 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setUploading(prev => ({ ...prev, [type]: true }));
        const uploadResult = await uploadVerificationDocument(user.uid, result.assets[0].uri, type);
        setUploading(prev => ({ ...prev, [type]: false }));
        if (uploadResult.success) {
          set(type === 'kbis' ? 'kbisURL' : 'identiteURL', uploadResult.url);
        } else {
          Alert.alert('Erreur', 'Impossible de télécharger le document.');
        }
      }
    } catch {
      setUploading(prev => ({ ...prev, [type]: false }));
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim())    return Alert.alert('Champ requis', 'Veuillez indiquer votre nom complet.');
    if (!form.phone.trim())       return Alert.alert('Champ requis', 'Veuillez indiquer votre numéro de téléphone.');
    if (!form.address.trim())     return Alert.alert('Champ requis', 'Veuillez indiquer votre adresse.');
    if (!form.siretNumber.trim()) return Alert.alert('Champ requis', 'Veuillez indiquer votre numéro SIRET.');
    if (!form.kbisURL)            return Alert.alert('Document requis', 'Veuillez télécharger votre Kbis.');
    if (!form.identiteURL)        return Alert.alert('Document requis', "Veuillez télécharger votre pièce d'identité.");

    setSubmitting(true);
    const result = await submitVerification(user.uid, form);
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Impossible de soumettre la demande.');
    }
    // En cas de succès, le listener AuthContext met à jour `verification`
    // → le composant parent re-rend automatiquement VerificationStatusScreen
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={styles.heroIconBox}>
          <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.white} />
        </View>
        <Text style={styles.heroTitle}>Vérification du compte</Text>
        <Text style={styles.heroSub}>
          Complétez votre dossier pour être visible sur la plateforme et recevoir des missions.
        </Text>
      </View>

      {/* Bandeau de rejet */}
      {isRejected && (
        <View style={[styles.rejectionBanner, SHADOWS.subtle]}>
          <Ionicons name="alert-circle" size={20} color={COLORS.error} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.rejectionTitle}>Dossier rejeté — corrigez et soumettez à nouveau</Text>
            {existingData?.rejectionReason ? (
              <Text style={styles.rejectionReason}>Motif : {existingData.rejectionReason}</Text>
            ) : null}
            {existingData?.rejectionComment ? (
              <Text style={styles.rejectionComment}>{existingData.rejectionComment}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Informations personnelles */}
      <View style={[styles.card, SHADOWS.subtle]}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <Input
          label="Nom complet *"
          placeholder="Prénom et nom de famille"
          value={form.fullName}
          onChangeText={v => set('fullName', v)}
        />
        <Input
          label="Téléphone *"
          placeholder="06 XX XX XX XX"
          value={form.phone}
          onChangeText={v => set('phone', v)}
          keyboardType="phone-pad"
        />
        <Input
          label="Adresse *"
          placeholder="Numéro, rue, code postal, ville"
          value={form.address}
          onChangeText={v => set('address', v)}
        />
        <Input
          label="Numéro SIRET *"
          placeholder="123 456 789 00012"
          value={form.siretNumber}
          onChangeText={v => set('siretNumber', v)}
          keyboardType="numeric"
        />
      </View>

      {/* Documents */}
      <View style={[styles.card, SHADOWS.subtle]}>
        <Text style={styles.sectionTitle}>Documents obligatoires</Text>

        <DocUploadBlock
          label="Kbis *"
          hint="Extrait Kbis de moins de 3 mois"
          uploaded={!!form.kbisURL}
          uploading={uploading.kbis}
          uploadedLabel="Kbis téléchargé"
          buttonLabel="Télécharger le Kbis (PDF)"
          onPick={() => pickDocument('kbis')}
        />

        <DocUploadBlock
          label="Pièce d'identité *"
          hint="Carte nationale d'identité ou passeport"
          uploaded={!!form.identiteURL}
          uploading={uploading.identite}
          uploadedLabel="Identité téléchargée"
          buttonLabel="Télécharger la pièce d'identité (PDF)"
          onPick={() => pickDocument('identite')}
        />
      </View>

      {/* Soumettre */}
      <Button
        title={isRejected ? 'Soumettre à nouveau' : 'Envoyer le dossier'}
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitBtn}
      />

      <Text style={styles.note}>
        Notre équipe examine les dossiers sous 48 h ouvrées.{'\n'}
        Vous serez notifié dès validation de votre compte.
      </Text>
    </ScrollView>
  );
};

// ── Bloc upload réutilisable ───────────────────────────────────────────────
const DocUploadBlock = ({ label, hint, uploaded, uploading, uploadedLabel, buttonLabel, onPick }) => (
  <View style={dStyles.block}>
    <Text style={dStyles.label}>{label}</Text>
    <Text style={dStyles.hint}>{hint}</Text>
    {uploaded ? (
      <View style={dStyles.uploadedRow}>
        <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
        <Text style={dStyles.uploadedText}>{uploadedLabel}</Text>
        <TouchableOpacity onPress={onPick}>
          <Text style={dStyles.changeText}>Changer</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Button
        title={uploading ? 'Téléchargement...' : buttonLabel}
        variant="outline"
        onPress={onPick}
        loading={uploading}
      />
    )}
  </View>
);

const dStyles = StyleSheet.create({
  block: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  hint: { fontSize: 11, color: COLORS.onSurfaceVariant },
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.secondaryFixed || '#D1FAE5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  uploadedText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.secondary },
  changeText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 20, paddingBottom: 48 },

  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -30 },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },

  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.errorContainer,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
  rejectionReason: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
  rejectionComment: {
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 18,
  },

  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  submitBtn: { marginTop: 4, marginBottom: 16 },
  note: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default VerificationScreen;
