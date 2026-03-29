// Écran de modification du profil interprète pour GETRAD
import { useState, useEffect } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SHADOWS, SPECIALTIES, SERVICES, REGIONS, FRENCH_CITIES } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Picker from '../../components/Picker';
import MultiSelect from '../../components/MultiSelect';
import LanguagePairSelector from '../../components/LanguagePairSelector';
import {
  updateUserProfile,
  updateInterpreterProfile,
  getInterpreterProfile,
  uploadProfileImage,
  uploadDocument
} from '../../services/profileService';
import { logout } from '../../services/authService';

const EditInterpreterProfileScreen = ({ navigation }) => {
  const { user, userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({ cv: false, kbis: false, identite: false });

  const [userFormData, setUserFormData] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    city: userData?.city || '',
    photoURL: userData?.photoURL || user?.photoURL || ''
  });

  const [interpreterData, setInterpreterData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    languages: [],
    specialties: [],
    services: [],
    hourlyRate: '',
    translationRate: '',
    city: userData?.city || '',
    regions: [],
    assermente: false,
    siretNumber: '',
    cvURL: '',
    kbisURL: '',
    identiteURL: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInterpreterProfile();
  }, []);

  const loadInterpreterProfile = async () => {
    setLoading(true);
    const result = await getInterpreterProfile(user.uid);
    if (result.success) {
      setInterpreterData(prev => ({ ...prev, ...result.data }));
    }
    setLoading(false);
  };

  const updateUserField = (field, value) => {
    setUserFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateInterpreterField = (field, value) => {
    setInterpreterData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!userFormData.displayName.trim()) newErrors.displayName = 'Le nom est requis';
    if (!interpreterData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!interpreterData.lastName.trim()) newErrors.lastName = 'Le nom de famille est requis';
    if (!interpreterData.city) newErrors.city = 'La ville est requise';
    if (interpreterData.languages.length === 0) newErrors.languages = 'Au moins une paire de langues est requise';
    if (interpreterData.services.length === 0) newErrors.services = 'Au moins un service est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Permission nécessaire pour accéder aux photos.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const uploadResult = await uploadProfileImage(user.uid, result.assets[0].uri);
        setUploadingImage(false);
        if (uploadResult.success) {
          setUserFormData(prev => ({ ...prev, photoURL: uploadResult.url }));
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } else {
          Alert.alert('Erreur', "Impossible de télécharger l'image");
        }
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const pickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (result.canceled === false && result.assets[0]) {
        setUploadingDoc(prev => ({ ...prev, [type]: true }));
        const uploadResult = await uploadDocument(user.uid, result.assets[0].uri, type);
        setUploadingDoc(prev => ({ ...prev, [type]: false }));
        if (uploadResult.success) {
          const fieldMap = { cv: 'cvURL', kbis: 'kbisURL', identite: 'identiteURL' };
          const labelMap = { cv: 'CV', kbis: 'Kbis', identite: "Pièce d'identité" };
          setInterpreterData(prev => ({ ...prev, [fieldMap[type]]: uploadResult.url }));
          Alert.alert('Succès', `${labelMap[type]} téléchargé !`);
        } else {
          Alert.alert('Erreur', 'Impossible de télécharger le document');
        }
      }
    } catch (error) {
      setUploadingDoc(prev => ({ ...prev, [type]: false }));
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    const userResult = await updateUserProfile(user.uid, {
      displayName: userFormData.displayName.trim(),
      phone: userFormData.phone.trim(),
      city: interpreterData.city,
    });
    const interpreterResult = await updateInterpreterProfile(user.uid, {
      firstName: interpreterData.firstName.trim(),
      lastName: interpreterData.lastName.trim(),
      bio: interpreterData.bio.trim(),
      languages: interpreterData.languages,
      specialties: interpreterData.specialties,
      services: interpreterData.services,
      hourlyRate: parseFloat(interpreterData.hourlyRate) || 0,
      translationRate: parseFloat(interpreterData.translationRate) || 0,
      city: interpreterData.city,
      regions: interpreterData.regions,
      assermente: interpreterData.assermente,
      siretNumber: interpreterData.siretNumber.trim(),
      cvURL: interpreterData.cvURL,
      kbisURL: interpreterData.kbisURL,
      identiteURL: interpreterData.identiteURL
    });
    setSaving(false);
    if (userResult.success && interpreterResult.success) {
      Alert.alert('Profil mis à jour', 'Votre profil professionnel a été enregistré avec succès.');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Text style={styles.heroTitle}>Mon profil</Text>
        <Text style={styles.heroSub}>Informations professionnelles & documents</Text>
      </View>

      <View style={styles.content}>

        {/* Photo de profil */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {userFormData.photoURL ? (
              <Image source={{ uri: userFormData.photoURL }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {userFormData.displayName.charAt(0).toUpperCase() || '?'}
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
        </View>

        {/* Liens rapides */}
        <View style={[styles.quickLinks, SHADOWS.subtle]}>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={() => navigation.navigate('ManageSubscription')}
          >
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickLinkText}>Gérer mon abonnement</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* SECTION 1 : Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <Input
            label="Prénom *"
            placeholder="Votre prénom"
            value={interpreterData.firstName}
            onChangeText={(value) => updateInterpreterField('firstName', value)}
            error={errors.firstName}
          />
          <Input
            label="Nom *"
            placeholder="Votre nom de famille"
            value={interpreterData.lastName}
            onChangeText={(value) => updateInterpreterField('lastName', value)}
            error={errors.lastName}
          />
          <Input
            label="Nom d'affichage *"
            placeholder="Comment voulez-vous être appelé ?"
            value={userFormData.displayName}
            onChangeText={(value) => updateUserField('displayName', value)}
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
            value={userFormData.phone}
            onChangeText={(value) => updateUserField('phone', value)}
            keyboardType="phone-pad"
          />
          <Picker
            label="Ville *"
            value={interpreterData.city}
            onValueChange={(value) => updateInterpreterField('city', value)}
            options={FRENCH_CITIES}
            placeholder="Sélectionner une ville..."
            error={errors.city}
          />
          <Input
            label="Biographie"
            placeholder="Présentez-vous en quelques mots..."
            value={interpreterData.bio}
            onChangeText={(value) => updateInterpreterField('bio', value)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* SECTION 2 : Langues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langues pratiquées *</Text>
          <LanguagePairSelector
            languages={interpreterData.languages}
            onAdd={(language) => updateInterpreterField('languages', [...interpreterData.languages, language])}
            onRemove={(index) => {
              const newLanguages = [...interpreterData.languages];
              newLanguages.splice(index, 1);
              updateInterpreterField('languages', newLanguages);
            }}
          />
          {errors.languages && <Text style={styles.errorText}>{errors.languages}</Text>}
        </View>

        {/* SECTION 3 : Spécialités */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spécialités</Text>
          <MultiSelect
            options={SPECIALTIES}
            selectedValues={interpreterData.specialties}
            onSelect={(values) => updateInterpreterField('specialties', values)}
          />
        </View>

        {/* SECTION 4 : Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services proposés *</Text>
          <MultiSelect
            options={SERVICES}
            selectedValues={interpreterData.services}
            onSelect={(values) => updateInterpreterField('services', values)}
            error={errors.services}
          />
        </View>

        {/* SECTION 5 : Tarifs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarifs</Text>
          <Input
            label="Tarif horaire (€)"
            placeholder="Ex: 50"
            value={interpreterData.hourlyRate.toString()}
            onChangeText={(value) => updateInterpreterField('hourlyRate', value)}
            keyboardType="numeric"
          />
          <Input
            label="Tarif traduction par page (€)"
            placeholder="Ex: 30"
            value={interpreterData.translationRate.toString()}
            onChangeText={(value) => updateInterpreterField('translationRate', value)}
            keyboardType="numeric"
          />
        </View>

        {/* SECTION 6 : Régions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Régions d'intervention</Text>
          <MultiSelect
            options={REGIONS}
            selectedValues={interpreterData.regions}
            onSelect={(values) => updateInterpreterField('regions', values)}
          />
        </View>

        {/* SECTION 7 : Statut professionnel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut professionnel</Text>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => updateInterpreterField('assermente', !interpreterData.assermente)}
          >
            <View style={[styles.checkbox, interpreterData.assermente && styles.checkboxChecked]}>
              {interpreterData.assermente && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
            </View>
            <Text style={styles.checkboxLabel}>Interprète/Traducteur assermenté</Text>
          </TouchableOpacity>

          <Input
            label="Numéro SIRET (optionnel)"
            placeholder="123 456 789 00012"
            value={interpreterData.siretNumber}
            onChangeText={(value) => updateInterpreterField('siretNumber', value)}
            keyboardType="numeric"
          />

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>CV (PDF)</Text>
            {interpreterData.cvURL ? (
              <View style={styles.documentUploaded}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                <Text style={styles.documentUploadedText}>CV téléchargé</Text>
                <TouchableOpacity onPress={() => pickDocument('cv')}>
                  <Text style={styles.documentChangeText}>Changer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title={uploadingDoc.cv ? 'Téléchargement...' : 'Télécharger mon CV'}
                variant="outline"
                onPress={() => pickDocument('cv')}
                loading={uploadingDoc.cv}
              />
            )}
          </View>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Kbis (PDF)</Text>
            {interpreterData.kbisURL ? (
              <View style={styles.documentUploaded}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                <Text style={styles.documentUploadedText}>Kbis téléchargé</Text>
                <TouchableOpacity onPress={() => pickDocument('kbis')}>
                  <Text style={styles.documentChangeText}>Changer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title={uploadingDoc.kbis ? 'Téléchargement...' : 'Télécharger le Kbis'}
                variant="outline"
                onPress={() => pickDocument('kbis')}
                loading={uploadingDoc.kbis}
              />
            )}
          </View>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Pièce d'identité (PDF)</Text>
            {interpreterData.identiteURL ? (
              <View style={styles.documentUploaded}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                <Text style={styles.documentUploadedText}>Identité téléchargée</Text>
                <TouchableOpacity onPress={() => pickDocument('identite')}>
                  <Text style={styles.documentChangeText}>Changer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title={uploadingDoc.identite ? 'Téléchargement...' : "Télécharger la pièce d'identité"}
                variant="outline"
                onPress={() => pickDocument('identite')}
                loading={uploadingDoc.identite}
              />
            )}
          </View>
        </View>

        {/* Enregistrer */}
        <Button
          title="Enregistrer mon profil"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />

        {/* Disponibilités */}
        <TouchableOpacity
          style={styles.availBtn}
          onPress={() => navigation.navigate('Availability')}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.availBtnText}>Gérer mes disponibilités</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Abonnement */}
        <TouchableOpacity
          style={styles.availBtn}
          onPress={() => navigation.navigate('ManageSubscription')}
          activeOpacity={0.8}
        >
          <Ionicons name="ribbon-outline" size={16} color={COLORS.primary} />
          <Text style={styles.availBtnText}>Mon abonnement</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },

  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    overflow: 'hidden',
    gap: 4,
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },

  // Photo
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
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

  // Quick links
  quickLinks: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  quickLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 14,
  },
  disabledInput: { opacity: 0.6 },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    color: COLORS.onSurface,
  },

  // Documents
  documentSection: { marginTop: 16 },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  documentUploaded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.secondaryFixed || '#D1FAE5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  documentUploadedText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  documentChangeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Actions
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  availBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 14,
    marginBottom: 10,
  },
  availBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.errorContainer + '55',
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default EditInterpreterProfileScreen;
