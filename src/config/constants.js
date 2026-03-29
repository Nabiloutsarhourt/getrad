// Constantes de l'application GETRAD

// Système de couleurs Material Design 3
export const COLORS = {
  // Primaires
  primary: '#004ac6',
  primaryContainer: '#2563eb',
  primaryFixed: '#dbe1ff',
  primaryFixedDim: '#b4c5ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#eeefff',

  // Secondaires (vert)
  secondary: '#006c49',
  secondaryFixed: '#c5f8e1',
  secondaryContainer: '#6cf8bb',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#00714d',

  // Surfaces
  surface: '#f8f9fa',
  surfaceBright: '#f8f9fa',
  surfaceContainer: '#edeeef',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1d',
  onSurfaceVariant: '#434655',

  // Erreurs
  danger: '#ba1a1a',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',

  // Contours
  outline: '#737686',
  outlineVariant: '#c3c6d7',

  // Legacy (compatibilité)
  background: '#f8f9fa',
  textPrimary: '#191c1d',
  textSecondary: '#434655',
  white: '#ffffff',
  black: '#000000',
  border: '#c3c6d7',
};

// Ombres réutilisables
export const SHADOWS = {
  card: {
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  deep: {
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
};

// Régions de France
export const REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
];

// Langues disponibles (tu peux en ajouter d'autres)
export const LANGUAGES = [
  'Français',
  'Anglais',
  'Espagnol',
  'Arabe',
  'Chinois (Mandarin)',
  'Allemand',
  'Italien',
  'Portugais',
  'Russe',
  'Japonais',
  'Coréen',
  'Turc',
  'Polonais',
  'Néerlandais',
  'Suédois',
  'Norvégien',
  'Danois',
  'Grec',
  'Hébreu',
  'Hindi',
  'Bengali',
  'Vietnamien',
  'Thaï',
  'Roumain',
  'Ukrainien',
  'Tchèque',
  'Hongrois',
  'Bulgare',
  'Serbe',
  'Croate',
];

// Spécialités d'interprétation/traduction
export const SPECIALTIES = [
  'Juridique',
  'Médical',
  'Financier',
  'Technique',
  'Commercial',
  'Conférence',
  'Littéraire',
  'Scientifique',
  'Diplomatique',
  'Audiovisuel',
  'Marketing',
  'IT / Logiciel',
  'Tourisme',
  'Éducation / Formation',
];

// Types de services
export const SERVICES = [
  { id: 'interpretation_simultanee',  label: 'Interprétation simultanée' },
  { id: 'interpretation_consecutive', label: 'Interprétation consécutive' },
  { id: 'interpretation_liaison',     label: 'Interprétation de liaison' },
  { id: 'interpretation_presentiel',  label: 'Interprétation en présentiel' },
  { id: 'interpretation_distance',    label: 'Interprétation à distance (visio / téléphone)' },
  { id: 'traduction_documents',       label: 'Traduction de documents' },
  { id: 'traduction_site_web',        label: 'Traduction de sites web / applications' },
  { id: 'localisation',              label: 'Localisation linguistique' },
  { id: 'traduction_assermentee',    label: 'Traduction assermentée' },
  { id: 'relecture_revision',        label: 'Relecture et révision' },
  { id: 'transcription',             label: 'Transcription audio' },
  { id: 'sous_titrage',              label: 'Sous-titrage' },
  { id: 'voice_over',                label: 'Voice-over / doublage' },
  { id: 'post_edition',              label: 'Post-édition (traduction automatique)' },
  { id: 'gestion_projet',            label: 'Gestion de projets linguistiques' },
  { id: 'guide_touristique',         label: 'Guide touristique multilingue' },
  { id: 'formation_langues',         label: 'Formation en langues' },
];

// Villes de France (principales communes, ordre alphabétique)
export const FRENCH_CITIES = [
  'Ajaccio', 'Aix-en-Provence', 'Amiens', 'Angers', 'Annecy', 'Antibes',
  'Argenteuil', 'Arles', 'Aubagne', 'Aulnay-sous-Bois', 'Avignon',
  'Besançon', 'Béziers', 'Bordeaux', 'Boulogne-Billancourt', 'Brest',
  'Caen', 'Cannes', 'Clermont-Ferrand', 'Colombes', 'Créteil',
  'Dijon', 'Dunkerque',
  'Fort-de-France', 'Grenoble',
  'La Rochelle', 'Le Havre', 'Le Mans', 'Lens', 'Limoges', 'Lille', 'Lyon',
  'Marseille', 'Metz', 'Montpellier', 'Montreuil', 'Mulhouse',
  'Nancy', 'Nantes', 'Nîmes', 'Nice', 'Noisy-le-Grand',
  'Orléans',
  'Paris', 'Paris 1er', 'Paris 2e', 'Paris 3e', 'Paris 4e', 'Paris 5e',
  'Paris 6e', 'Paris 7e', 'Paris 8e', 'Paris 9e', 'Paris 10e',
  'Paris 11e', 'Paris 12e', 'Paris 13e', 'Paris 14e', 'Paris 15e',
  'Paris 16e', 'Paris 17e', 'Paris 18e', 'Paris 19e', 'Paris 20e',
  'Pau', 'Perpignan', 'Pointe-à-Pitre', 'Poitiers',
  'Reims', 'Rennes', 'Rouen', 'Rueil-Malmaison',
  'Saint-Denis', 'Saint-Étienne', 'Saint-Paul', 'Strasbourg', 'Saint-Nazaire',
  'Toulon', 'Toulouse', 'Tours', 'Tourcoing', 'Troyes',
  'Valenciennes', 'Versailles', 'Villeurbanne',
];

// Statuts de réservation
export const BOOKING_STATUS = {
  PENDING: 'pending',       // En attente de réponse
  ACCEPTED: 'accepted',     // Acceptée par l'interprète
  REFUSED: 'refused',       // Refusée
  COMPLETED: 'completed',   // Terminée
  CANCELLED: 'cancelled',   // Annulée
};

// Labels en français pour les statuts
export const BOOKING_STATUS_LABELS = {
  pending: 'En attente',
  accepted: 'Acceptée',
  refused: 'Refusée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

// Rôles utilisateur
export const USER_ROLES = {
  CLIENT: 'client',
  INTERPRETER: 'interpreter',
};
