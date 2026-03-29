// Écran de formulaire de réservation pour GETRAD
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Picker from '../../components/Picker';
import { useAuth } from '../../contexts/AuthContext';
import { createBooking } from '../../services/bookingService';
import { getInterpreterById } from '../../services/searchService';

const BookingFormScreen = ({ route, navigation }) => {
  const { interpreterId } = route.params;
  const { user } = useAuth();

  const [interpreter, setInterpreter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    serviceType: 'interpretation',
    date: '',
    time: '',
    duration: '1',
    location: '',
    description: '',
    estimatedPrice: 0
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInterpreter();
  }, []);

  useEffect(() => {
    if (!interpreter) return;
    const duration = parseFloat(formData.duration) || 0;
    const price = formData.serviceType === 'interpretation'
      ? (interpreter.hourlyRate || 0) * duration
      : (interpreter.translationRate || 0) * duration;
    setFormData(prev => ({ ...prev, estimatedPrice: price }));
  }, [formData.serviceType, formData.duration, interpreter]);

  const loadInterpreter = async () => {
    const result = await getInterpreterById(interpreterId);
    if (result.success) {
      setInterpreter(result.interpreter);
    }
    setLoading(false);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date.trim()) {
      newErrors.date = 'La date est requise';
    }

    if (!formData.time.trim()) {
      newErrors.time = 'L\'heure est requise';
    }

    const duration = parseFloat(formData.duration);
    if (!duration || duration <= 0) {
      newErrors.duration = 'La durée doit être supérieure à 0';
    }

    if (formData.serviceType === 'interpretation' && !formData.location.trim()) {
      newErrors.location = 'Le lieu est requis pour l\'interprétation';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Veuillez décrire votre besoin';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'La description doit contenir au moins 20 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const bookingData = {
      clientId: user.uid,
      interpreterId: interpreterId,
      serviceType: formData.serviceType,
      date: formData.date,
      time: formData.time,
      duration: parseFloat(formData.duration),
      location: formData.location,
      description: formData.description,
      estimatedPrice: formData.estimatedPrice
    };

    const result = await createBooking(bookingData);
    setSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Demande envoyée !',
        'Votre demande de réservation a été envoyée au prestataire. Vous recevrez une réponse prochainement.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClientBookingsTab')
          }
        ]
      );
    } else {
      Alert.alert('Erreur', result.error || 'Impossible d\'envoyer la demande');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Informations du prestataire */}
        <View style={styles.interpreterCard}>
          <View style={styles.interpreterAvatar}>
            <Text style={styles.interpreterAvatarText}>
              {(interpreter?.firstName?.[0] || '?').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.interpreterLabel}>Prestataire sélectionné</Text>
            <Text style={styles.interpreterName}>
              {interpreter?.firstName} {interpreter?.lastName}
            </Text>
            {interpreter?.city ? (
              <View style={styles.interpreterCity}>
                <Ionicons name="location-outline" size={13} color={COLORS.onSurfaceVariant} />
                <Text style={styles.interpreterCityText}>{interpreter.city}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>

          <Picker
            label="Type de service *"
            value={formData.serviceType}
            onValueChange={(value) => updateField('serviceType', value)}
            options={[
              { label: 'Interprétation', value: 'interpretation' },
              { label: 'Traduction', value: 'translation' }
            ]}
          />

          <Input
            label="Date souhaitée *"
            placeholder="JJ/MM/AAAA"
            value={formData.date}
            onChangeText={(value) => updateField('date', value)}
            error={errors.date}
          />

          <Input
            label="Heure souhaitée *"
            placeholder="HH:MM"
            value={formData.time}
            onChangeText={(value) => updateField('time', value)}
            error={errors.time}
          />

          <Input
            label={formData.serviceType === 'interpretation' ? 'Durée (heures) *' : 'Nombre de pages *'}
            placeholder={formData.serviceType === 'interpretation' ? '1, 2, 3...' : '1, 5, 10...'}
            value={formData.duration}
            onChangeText={(value) => updateField('duration', value)}
            keyboardType="numeric"
            error={errors.duration}
          />

          {formData.serviceType === 'interpretation' && (
            <Input
              label="Lieu *"
              placeholder="Adresse du rendez-vous"
              value={formData.location}
              onChangeText={(value) => updateField('location', value)}
              error={errors.location}
            />
          )}

          <Input
            label="Description de votre besoin *"
            placeholder="Décrivez en détail votre besoin, le contexte, les langues concernées..."
            value={formData.description}
            onChangeText={(value) => updateField('description', value)}
            multiline
            numberOfLines={4}
            error={errors.description}
          />

          {/* Prix estimé */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Prix estimé :</Text>
            <Text style={styles.priceValue}>{formData.estimatedPrice.toFixed(2)}€</Text>
            <Text style={styles.priceNote}>
              Prix indicatif. Le tarif final sera confirmé par le prestataire.
            </Text>
          </View>

          {/* Bouton de soumission */}
          <Button
            title="Envoyer la demande"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitButton}
          />

          <Text style={styles.helpText}>
            En envoyant cette demande, vous acceptez que vos coordonnées soient transmises au prestataire.
          </Text>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 20,
  },
  interpreterCard: {
    ...SHADOWS.card,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  interpreterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  interpreterAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  interpreterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  interpreterName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  interpreterCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  interpreterCityText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  form: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  priceCard: {
    backgroundColor: COLORS.primaryFixed,
    padding: 18,
    borderRadius: 18,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  priceNote: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 2,
  },
  submitButton: {
    marginBottom: 16,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default BookingFormScreen;
