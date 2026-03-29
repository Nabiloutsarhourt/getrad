# GETRAD

Application mobile de mise en relation entre clients et interprètes/traducteurs certifiés en France.

## Technologies

- **React Native** avec Expo SDK 55
- **Firebase** (Auth, Firestore, Storage, Cloud Functions)
- **React Navigation** (Stack + Bottom Tabs)
- **Stripe** (abonnements mensuels via Checkout + Customer Portal)

## Installation

### 1. Dépendances app mobile
```bash
npm install
```

### 2. Configurer Firebase
1. Va sur https://console.firebase.google.com/
2. Sélectionne le projet `getrad-9430b`
3. Modifie `src/config/firebase.js` avec tes clés

### 3. Lancer l'application
```bash
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS (Mac uniquement)
```

### 4. Cloud Functions (Stripe + Missions)
```bash
cd functions
npm install
firebase deploy --only functions
```

## Structure du projet

```
src/
├── components/         # Composants réutilisables (Button, etc.)
├── config/             # Firebase, constantes (COLORS, SHADOWS)
├── contexts/           # AuthContext (user, subscription, verification)
├── navigation/         # ClientTabs, InterpreterTabs, AdminTabs, MainNavigator
├── screens/
│   ├── auth/           # Login, Register, ForgotPassword
│   ├── client/         # Home, InterpretersList, InterpreterDetail,
│   │                   # BookingForm, ClientBookings, PostMission,
│   │                   # MissionTracking, Review
│   ├── interpreter/    # Home (dashboard), InterpreterBookings,
│   │                   # EditInterpreterProfile, Verification,
│   │                   # VerificationStatus, CGU, Subscription,
│   │                   # Paywall, ManageSubscription, IncomingOffer
│   ├── admin/          # Dashboard, Verifications, Users, Finance
│   └── common/         # BookingDetail, Chat, ConversationsList,
│                       # EditProfile
├── services/           # Firebase services (auth, search, booking,
│                       # mission, message, review, subscription,
│                       # verification, admin, notification, profile)
└── utils/

functions/
├── stripe/             # createCheckoutSession, stripeWebhook, createCustomerPortal
├── missions/           # onMissionCreated, processOffer, checkOfferTimeout, retryUnmatched
├── bookings/           # onBookingCreated, onBookingStatusChanged
└── notifications/      # sendPush
```

## Couleurs de la marque

- Primaire : `#2563EB` (bleu)
- Secondaire : `#10B981` (vert)
- Erreur : `#EF4444` (rouge)

---

## État d'avancement

- [x] **Phase 1** : Installation et configuration
- [x] **Phase 2** : Authentification
- [x] **Phase 3** : Profils + Vérification prestataires + Panneau admin
- [x] **Phase 4** : Recherche et consultation
- [x] **Phase 5** : Réservation
- [x] **Phase 6** : Messagerie
- [x] **Phase 7** : Missions automatiques + Abonnements Stripe

---

### Phase 2 — Authentification
- Inscription (client / interprète)
- Connexion email/mot de passe
- Réinitialisation de mot de passe
- Persistance de session Firebase

### Phase 3 — Profils + Vérification + Admin

**Clients** :
- Modification du profil (nom, téléphone, ville)
- Upload photo de profil

**Interprètes** :
- Profil professionnel complet (langues, spécialités, services, tarifs, zones)
- Statut assermenté
- Upload CV, Kbis (PDF), Pièce d'identité (PDF)
- Dossier de vérification : soumission → attente → accepté/rejeté
- Écran de statut en temps réel (onSnapshot)

**Vérification admin** :
- Formulaire Kbis + Identité obligatoire avant accès à la plateforme
- Gate dans la navigation : rejeté → re-soumission avec motif, en attente → écran d'attente, accepté → accès normal

**Panneau Admin** (`role === 'admin'`) :
- Dashboard KPIs (utilisateurs, MRR, missions, validations en attente)
- Onglet Validations : approuver / rejeter les dossiers avec motif
- Onglet Utilisateurs : liste + fiche RH + suspension
- Onglet Finance : MRR, ARR, répartition des abonnements
- Badge dynamique sur l'onglet Validations

### Phase 4 — Recherche et consultation
- Liste des interprètes avec filtres (langue, spécialité, ville, tarif)
- Recherche textuelle
- Tri par pertinence / note / tarif
- Fiche profil interprète : langues, spécialités, avis, documents
- Filtre automatique : seuls les interprètes `verificationStatus === 'accepte'` apparaissent

### Phase 5 — Réservation
- Formulaire de réservation (service, langue, date, lieu, durée)
- Estimation de prix automatique
- Tableau des réservations client et interprète
- Détail réservation avec statuts (en attente / confirmée / complétée / annulée)
- Confirmation / refus par l'interprète
- Système d'avis client (note + commentaire) après prestation

### Phase 6 — Messagerie
- Conversations en temps réel (onSnapshot)
- Liste des conversations avec dernier message et badge non lus
- Création automatique de conversation lors d'une réservation ou mission acceptée

### Phase 7 — Missions automatiques + Abonnements

**Missions automatiques** :
- Client poste une mission (service, langues, date, lieu, description, budget)
- Algorithme de cascade : interprètes triés par priorité d'abonnement puis par note
- Offre envoyée au premier interprète → timer 2 min → refus / timeout → suivant
- Écran `MissionTracking` : suivi en temps réel avec animations
- Écran `IncomingOffer` : countdown animé, accepter / refuser
- Cloud Functions : `onMissionCreated`, `processOffer`, `checkOfferTimeout`, `retryUnmatched`
- Push notifications (Expo) à chaque étape

**Abonnements Stripe** :
- Plans : Découverte (29€/mois), Professionnel (79€/mois), Premium (149€/mois)
- CGU obligatoires avant abonnement
- Stripe Checkout (lien navigateur)
- Stripe Customer Portal (gérer / annuler l'abonnement)
- Webhook Stripe → mise à jour Firestore `subscriptions/{uid}`
- Paywall si abonnement inactif
- Priorité de recherche selon le plan (`searchPriority` sur `interpreters/{uid}`)

---

## Firestore — Collections principales

| Collection | Description |
|---|---|
| `users` | Profil commun (role, displayName, email, suspended) |
| `interpreters` | Profil pro (langues, spécialités, tarifs, verificationStatus, searchPriority) |
| `verifications` | Dossiers de vérification (status, kbisURL, identiteURL) |
| `subscriptions` | Abonnements Stripe (plan, status, stripeCustomerId) |
| `missions` | Missions auto (status, candidateQueue, currentOfferedTo, offerExpiresAt) |
| `bookings` | Réservations directes (status, clientId, interpreterId) |
| `conversations` | Fil de discussion (participants, lastMessage) |
| `reviews` | Avis clients (rating, comment, bookingId) |

---

Développé avec React Native + Expo + Firebase pour faciliter la communication multilingue en France.
