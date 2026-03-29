// Vérification du numéro de téléphone par SMS — GETRAD
// Utilise @react-native-firebase/auth (SDK natif) qui gère le reCAPTCHA automatiquement via SafetyNet/Play Integrity
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import nativeAuth from '@react-native-firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';

// Convertit un numéro français en format E.164 (+33...)
const toE164 = (raw) => {
  const cleaned = raw.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return '+' + cleaned.slice(2);
  if (cleaned.startsWith('0')) return '+33' + cleaned.slice(1);
  return '+33' + cleaned;
};

const PhoneVerificationScreen = () => {
  const { user, userData } = useAuth();

  const [phone, setPhone]             = useState(userData?.phone || '');
  const [confirmation, setConfirmation] = useState(null);
  const [code, setCode]               = useState('');
  const [sending, setSending]         = useState(false);
  const [verifying, setVerifying]     = useState(false);

  // ── Envoyer le code SMS via SDK natif ──────────────────────────────────────
  const handleSend = async () => {
    const e164 = toE164(phone.trim());
    if (!/^\+\d{8,15}$/.test(e164)) {
      Alert.alert('Numéro invalide', 'Vérifiez votre numéro (ex: 06 12 34 56 78 ou +33612345678).');
      return;
    }

    setSending(true);
    try {
      const result = await nativeAuth().signInWithPhoneNumber(e164);
      setConfirmation(result);
    } catch (error) {
      Alert.alert(
        'Erreur envoi',
        error.code === 'auth/too-many-requests'
          ? 'Trop de tentatives. Réessayez dans quelques minutes.'
          : error.code === 'auth/invalid-phone-number'
          ? 'Numéro de téléphone invalide.'
          : error.message || 'Impossible d\'envoyer le code.',
      );
    }
    setSending(false);
  };

  // ── Vérifier le code reçu ──────────────────────────────────────────────────
  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Code invalide', 'Le code comporte 6 chiffres.');
      return;
    }

    setVerifying(true);
    try {
      await confirmation.confirm(code);

      // Déconnecter la session native (on utilise le SDK JS pour l'auth principale)
      await nativeAuth().signOut();

      // Marquer le téléphone comme vérifié dans Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        phoneVerified: true,
        phone: toE164(phone.trim()),
        phoneVerifiedAt: new Date(),
      });
      // AuthContext réagit au changement → gate se lève automatiquement

    } catch (error) {
      Alert.alert(
        'Code incorrect',
        error.code === 'auth/invalid-verification-code'
          ? 'Le code est incorrect. Vérifiez et réessayez.'
          : error.code === 'auth/code-expired'
          ? 'Le code a expiré. Renvoyez un nouveau code.'
          : error.message || 'Vérification impossible.',
      );
    }
    setVerifying(false);
  };

  // ── Déconnexion ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroIconBox}>
            <Ionicons name="phone-portrait-outline" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>
            {confirmation ? 'Entrez votre code' : 'Vérifiez votre numéro'}
          </Text>
          <Text style={styles.heroSub}>
            {confirmation
              ? `Code envoyé au ${phone}`
              : 'Un SMS de vérification vous sera envoyé'}
          </Text>
        </View>

        <View style={styles.card}>
          {!confirmation ? (
            /* ── Étape 1 : saisie du numéro ── */
            <>
              <Text style={styles.stepLabel}>
                <Text style={styles.stepNumber}>1 </Text>
                Numéro de téléphone
              </Text>
              <View style={styles.inputRow}>
                <View style={styles.flagBox}>
                  <Text style={styles.flag}>🇫🇷 +33</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="6 12 34 56 78"
                  placeholderTextColor={COLORS.onSurfaceVariant}
                  returnKeyType="done"
                  onSubmitEditing={handleSend}
                />
              </View>
              <Text style={styles.hint}>
                Format accepté : 06... · 07... · +336...
              </Text>

              <TouchableOpacity
                style={[styles.btn, sending && styles.btnDisabled]}
                onPress={handleSend}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color={COLORS.white} />
                  : <>
                      <Ionicons name="send-outline" size={16} color={COLORS.white} />
                      <Text style={styles.btnText}>Envoyer le code SMS</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          ) : (
            /* ── Étape 2 : saisie du code OTP ── */
            <>
              <Text style={styles.stepLabel}>
                <Text style={styles.stepNumber}>2 </Text>
                Code reçu par SMS
              </Text>
              <TextInput
                style={styles.otpInput}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="— — — — — —"
                placeholderTextColor={COLORS.onSurfaceVariant}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                autoFocus
              />
              <Text style={styles.hint}>
                Code à 6 chiffres · Valable 10 minutes
              </Text>

              <TouchableOpacity
                style={[styles.btn, (verifying || code.length !== 6) && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={verifying || code.length !== 6}
                activeOpacity={0.85}
              >
                {verifying
                  ? <ActivityIndicator color={COLORS.white} />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                      <Text style={styles.btnText}>Valider le compte</Text>
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => { setConfirmation(null); setCode(''); }}
              >
                <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
                <Text style={styles.resendText}>Renvoyer un nouveau code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },

  card: {
    margin: 20,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    ...SHADOWS.card,
  },
  stepLabel: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  stepNumber: { fontSize: 13, color: COLORS.primary, fontWeight: '800' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.outline,
    borderRadius: 14,
    overflow: 'hidden',
  },
  flagBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRightWidth: 1,
    borderRightColor: COLORS.outlineVariant,
  },
  flag: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },

  otpInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: COLORS.primaryFixed,
  },

  hint: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: -8 },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resendText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
});

export default PhoneVerificationScreen;
