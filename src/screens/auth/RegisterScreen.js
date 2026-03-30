// Écran d'inscription pour GETRAD
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, USER_ROLES } from '../../config/constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { registerWithEmail } from '../../services/authService';
import { trackSignUp, setUserRole } from '../../services/analyticsService';

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('client');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (role === 'interpreter') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Le prénom est requis';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Le nom de famille est requis';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'La ville est requise';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setErrors({});
    if (!validateForm()) return;
    setLoading(true);
    const userData = {
      displayName: formData.displayName.trim(),
      role,
      phone: formData.phone.trim(),
      city: formData.city.trim(),
    };
    if (role === 'interpreter') {
      userData.firstName = formData.firstName.trim();
      userData.lastName = formData.lastName.trim();
    }
    const result = await registerWithEmail(
      formData.email.trim(),
      formData.password,
      userData
    );
    setLoading(false);
    if (result.success) {
      trackSignUp(role);
      setUserRole(role);
      Alert.alert('Inscription réussie', 'Votre compte a été créé avec succès.', [{ text: 'OK' }]);
    } else {
      Alert.alert('Erreur d\'inscription', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>GETRAD</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la plateforme de référence</Text>
        </View>

        {/* Sélecteur de rôle */}
        <View style={styles.roleSelector}>
          <Text style={styles.roleLabel}>Je suis</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
              onPress={() => setRole('client')}
              activeOpacity={0.85}
            >
              {role === 'client' && (
                <View style={styles.roleCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                </View>
              )}
              <View style={[styles.roleIconBox, role === 'client' && styles.roleIconBoxActive]}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={role === 'client' ? COLORS.primary : COLORS.onSurfaceVariant}
                />
              </View>
              <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>
                Client
              </Text>
              <Text style={styles.roleButtonSubtext}>Je cherche un prestataire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'interpreter' && styles.roleButtonActive]}
              onPress={() => setRole('interpreter')}
              activeOpacity={0.85}
            >
              {role === 'interpreter' && (
                <View style={styles.roleCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                </View>
              )}
              <View style={[styles.roleIconBox, role === 'interpreter' && styles.roleIconBoxActive]}>
                <Ionicons
                  name="briefcase-outline"
                  size={24}
                  color={role === 'interpreter' ? COLORS.primary : COLORS.onSurfaceVariant}
                />
              </View>
              <Text style={[styles.roleButtonText, role === 'interpreter' && styles.roleButtonTextActive]}>
                Prestataire
              </Text>
              <Text style={styles.roleButtonSubtext}>Je propose mes services</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {role === 'interpreter' && (
            <>
              <Input
                label="Prénom *"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                error={errors.firstName}
              />
              <Input
                label="Nom *"
                placeholder="Votre nom de famille"
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                error={errors.lastName}
              />
            </>
          )}

          <Input
            label="Nom d'affichage *"
            placeholder="Comment souhaitez-vous être appelé ?"
            value={formData.displayName}
            onChangeText={(value) => updateField('displayName', value)}
            error={errors.displayName}
          />
          <Input
            label="Email *"
            placeholder="votre@email.com"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Mot de passe *"
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            error={errors.password}
          />
          <Input
            label="Confirmer le mot de passe *"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            secureTextEntry
            error={errors.confirmPassword}
          />
          <Input
            label="Téléphone (optionnel)"
            placeholder="06 XX XX XX XX"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
          />
          <Input
            label={role === 'interpreter' ? 'Ville *' : 'Ville (optionnel)'}
            placeholder="Paris, Lyon, Marseille..."
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
            error={errors.city}
          />

          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
        </View>

        {/* Lien vers connexion */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
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
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  headerDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  headerDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  logo: {
    width: 100,
    height: 50,
    marginBottom: 12,
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 4,
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  // Role selector
  roleSelector: {
    marginBottom: 32,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryFixed,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  roleCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxActive: {
    backgroundColor: COLORS.primaryFixedDim,
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  roleButtonTextActive: {
    color: COLORS.primary,
  },
  roleButtonSubtext: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Form
  form: {
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  footerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RegisterScreen;
