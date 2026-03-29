// Écran de réinitialisation de mot de passe pour GETRAD
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { resetPassword } from '../../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) { setError("L'email est requis"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email invalide'); return false; }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);
    if (result.success) {
      setEmailSent(true);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="mail-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>Email envoyé</Text>
          <Text style={styles.successText}>
            Un lien de réinitialisation a été envoyé à
          </Text>
          <Text style={styles.successEmail}>{email}</Text>
          <Text style={styles.successInfo}>
            Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
          </Text>

          <Button
            title="Retour à la connexion"
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
          />

          <TouchableOpacity onPress={() => setEmailSent(false)} style={styles.resendButton}>
            <Text style={styles.resendText}>Renvoyer l'email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={(value) => { setEmail(value); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />

          <Button
            title="Envoyer le lien"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backLinkText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  headerDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  headerDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Form
  form: { marginBottom: 24 },
  submitButton: { marginTop: 8 },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },

  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  successText: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  successEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  successInfo: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backButton: {
    width: '100%',
    marginBottom: 8,
  },
  resendButton: { padding: 12 },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
