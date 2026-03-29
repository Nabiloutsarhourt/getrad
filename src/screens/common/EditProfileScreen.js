// Écran de modification du profil client pour GETRAD
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FRENCH_CITIES } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Picker from '../../components/Picker';
import { updateUserProfile, uploadProfileImage } from '../../services/profileService';
import { logout } from '../../services/authService';

const EditProfileScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const isInterpreter = userData?.role === 'interpreter';

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    city: userData?.city || '',
    photoURL: userData?.photoURL || user?.photoURL || ''
  });
  const [errors, setErrors] = useState({});

  // Mettre à jour un champ
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Le nom est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Choisir une photo
  const pickImage = async () => {
    try {
      // Sur web, la permission est toujours accordée — on saute l'await
      // (l'await casse le contexte du geste utilisateur et le navigateur bloque le file picker)
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
          return;
        }
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        setImageError('');

        const uploadResult = await uploadProfileImage(user.uid, result.assets[0].uri);

        setUploadingImage(false);

        if (uploadResult.success) {
          setFormData(prev => ({ ...prev, photoURL: uploadResult.url }));
        } else {
          setImageError(uploadResult.error || 'Impossible de télécharger l\'image');
        }
      }
    } catch (error) {
      setUploadingImage(false);
      console.error('Erreur sélection image:', error);
      setImageError(error.message || 'Une erreur est survenue');
    }
  };

  // Sauvegarder le profil
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await updateUserProfile(user.uid, {
      displayName: formData.displayName.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
    });

    setLoading(false);

    if (result.success) {
      Alert.alert('Profil mis à jour', 'Vos informations ont été enregistrées avec succès.');
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Photo de profil */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {formData.photoURL ? (
              <Image
                source={{ uri: formData.photoURL }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {formData.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            )}

            <View style={styles.editPhotoButton}>
              <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changePhotoText}>Changer la photo</Text>
          </TouchableOpacity>
          {imageError ? <Text style={styles.imageErrorText}>{imageError}</Text> : null}
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Input
            label="Nom d'affichage *"
            placeholder="Votre nom"
            value={formData.displayName}
            onChangeText={(value) => updateField('displayName', value)}
            error={errors.displayName}
          />

          <Input
            label="Email"
            value={user?.email}
            editable={false}
            style={styles.disabledInput}
          />

          <Input
            label="Téléphone"
            placeholder="06 XX XX XX XX"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
          />

          <Picker
            label="Ville"
            value={formData.city}
            onValueChange={(value) => updateField('city', value)}
            options={FRENCH_CITIES}
            placeholder="Sélectionner une ville..."
          />

          <Button
            title="Enregistrer les modifications"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          {isInterpreter && (
            <TouchableOpacity
              style={styles.manageSubButton}
              onPress={() => navigation.navigate('ManageSubscription')}
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={18} color={COLORS.primary} />
              <Text style={styles.manageSubText}>Gérer mon abonnement</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
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
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.outlineVariant,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  imageErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    marginTop: 16,
  },
  disabledInput: { opacity: 0.6 },
  saveButton: { marginTop: 24 },
  manageSubButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primaryFixed,
  },
  manageSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageSubText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: COLORS.errorContainer + '55',
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '700',
  },
});

export default EditProfileScreen;
