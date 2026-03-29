# Architecture de GETRAD

## Stack technique

| Couche | Technologie |
|--------|-------------|
| App mobile | React Native 0.83 + Expo SDK 55 |
| Framework UI | Material Design 3 (palette dynamique, MD3 tokens) |
| Auth | Firebase Auth |
| Base de données | Cloud Firestore |
| Stockage fichiers | Firebase Storage |
| Backend | Cloud Functions v2 (Node.js 22, region: europe-west1) |
| Paiements | Stripe (Checkout + Customer Portal + Webhooks) |
| Notifications push | Expo Notifications + Expo Push API |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| Builds | EAS Build (dev APK, preview APK, production AAB) |
| OTA updates | EAS Update (`eas update --branch production`) |

---

## État d'avancement des phases

| Phase | Description | Statut |
|-------|-------------|--------|
| 1 | Auth, profils, navigation de base | ✅ Terminé |
| 2 | Réservations directes (bookings) | ✅ Terminé |
| 3 | Messagerie, avis, profil interprète | ✅ Terminé |
| 4 | Stripe (abonnements, webhook, paywall) | ✅ Terminé |
| 5 | PostMission + auto-assignment cascade | ✅ Terminé |
| 6 | Recherche directe + demandes de disponibilité | ✅ Terminé |
| 7 | Contact reveal via Cloud Functions + messaging | ✅ Terminé |
| 8 | Règles Firestore prod + disponibilités interprète | ✅ Terminé |
| 9 | Dashboard stats interprète + admin availability stats | ✅ Terminé |

---

## Structure des fichiers

```
getrad/
│
├── App.js                          # Entrée : GestureHandlerRootView > SafeAreaProvider > AuthProvider
├── index.js                        # registerRootComponent (Expo)
├── app.json                        # Config Expo (bundle ID, notifications, EAS updates, plugins)
├── eas.json                        # Profils EAS Build (dev APK, preview APK, production AAB)
├── firestore.rules                 # Règles de sécurité Firestore (production)
├── firestore.indexes.json          # Index composites Firestore
├── storage.rules                   # Règles Firebase Storage
├── firebase.json                   # Config déploiement Firebase
│
├── src/
│   ├── config/
│   │   ├── firebase.js             # Initialisation Firebase (Auth, Firestore, Storage, Functions)
│   │   └── constants.js            # COLORS (MD3), SHADOWS, FRENCH_CITIES, LANGUAGES,
│   │                               # SPECIALTIES, SERVICES, REGIONS, BOOKING_STATUS
│   │
│   ├── components/
│   │   ├── Button.js               # Bouton pill (borderRadius: 28), 4 variants
│   │   ├── Input.js                # Champ texte avec label, erreur, icône
│   │   ├── Picker.js               # Picker modal custom
│   │   ├── MultiSelect.js          # Sélection multiple avec chips
│   │   ├── LanguagePairSelector.js # Sélecteur paires de langues {source, target, level}
│   │   └── InterpreterCard.js      # Carte interprète réutilisable
│   │
│   ├── contexts/
│   │   └── AuthContext.js          # État global : user, userData, verification, subscription
│   │                               # Exports : hasActiveSubscription, hasCguAccepted
│   │
│   ├── navigation/
│   │   ├── RootNavigator.js        # Bascule Auth/Main + ref navigation pour notifications
│   │   ├── AuthNavigator.js        # Login, Register, ForgotPassword, SeedData
│   │   ├── MainNavigator.js        # Stack principal + RoleTabs (dispatching par rôle)
│   │   ├── ClientTabs.js           # Tabs client : Accueil, Explorer, Réservations, Messages
│   │   ├── InterpreterTabs.js      # Tabs interprète : Dashboard, Missions, Messages, Profil
│   │   └── AdminTabs.js            # Tabs admin : Dashboard, Validations, Utilisateurs, Finance
│   │
│   ├── services/
│   │   ├── authService.js          # registerWithEmail, loginWithEmail, logout, resetPassword
│   │   ├── profileService.js       # updateUserProfile, updateInterpreterProfile, uploadProfileImage
│   │   ├── bookingService.js       # CRUD bookings, confirmBooking, rejectBooking, completeBooking
│   │   ├── reviewService.js        # createReview, getInterpreterReviews
│   │   ├── searchService.js        # searchInterpreters (filtres langues, spécialités, région, ville)
│   │   ├── missionService.js       # createMission, subscribeMission, cancelMission, respondToOffer
│   │   ├── messageService.js       # getOrCreateConversation, subscribeToMessages, sendMessage
│   │   ├── verificationService.js  # submitVerification, uploadVerificationDocument
│   │   ├── subscriptionService.js  # subscribeToSubscription, openCustomerPortal, PLAN_LABELS
│   │   ├── availabilityService.js  # createAvailabilityRequest, respondToAvailabilityRequest,
│   │   │                           # subscribeIncomingAvailabilityRequest, cancelAvailabilityRequest
│   │   ├── adminService.js         # getDashboardStats, getAllUsers, getAllVerifications, suspendUser
│   │   └── notificationService.js  # configureNotifications, registerForPushNotifications
│   │
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   └── ForgotPasswordScreen.js
│       │
│       ├── client/
│       │   ├── ClientHomeScreen.js             # Accueil client : interprètes en vedette, actions rapides
│       │   ├── InterpretersListScreen.js       # Recherche avec filtres langues/spécialité/région
│       │   ├── InterpreterDetailScreen.js      # Profil complet + bouton disponibilité + réserver
│       │   ├── BookingFormScreen.js            # Formulaire de réservation directe
│       │   ├── ClientBookingsScreen.js         # Liste des réservations client
│       │   ├── PostMissionScreen.js            # Poster une mission (auto-assignment)
│       │   ├── MissionTrackingScreen.js        # Suivi temps réel de la mission
│       │   ├── AvailabilityRequestScreen.js    # Attente réponse demande de disponibilité (timer 2min)
│       │   ├── SuggestedProfilesScreen.js      # Profils suggérés quand mission = no_match
│       │   └── ReviewScreen.js                # Laisser un avis après mission
│       │
│       ├── interpreter/
│       │   ├── VerificationScreen.js           # Soumission dossier de vérification (KBIS, CNI)
│       │   ├── VerificationStatusScreen.js     # Attente de validation admin
│       │   ├── CGUScreen.js                   # Acceptation des CGU
│       │   ├── SubscriptionScreen.js           # Choix du plan Stripe
│       │   ├── PaywallScreen.js               # Mur d'accès sans abonnement actif
│       │   ├── ManageSubscriptionScreen.js     # Gestion abonnement + portail Stripe
│       │   ├── IncomingOfferScreen.js          # Offre de mission entrante (timer 2min animé)
│       │   ├── InterpreterBookingsScreen.js    # Liste des missions/réservations (tabs)
│       │   ├── EditInterpreterProfileScreen.js # Profil pro complet (7 sections)
│       │   ├── AvailabilityScreen.js           # Gestion des disponibilités (statut, jours, horaires)
│       │   └── InterpreterStatsScreen.js       # Dashboard stats (revenus, missions, note, quotas)
│       │
│       ├── common/
│       │   ├── HomeScreen.js                  # Dashboard interprète (bento grid, actions rapides)
│       │   ├── EditProfileScreen.js           # Modification profil (client & interprète)
│       │   ├── ConversationsListScreen.js     # Liste des conversations
│       │   ├── ChatScreen.js                  # Chat temps réel + bannière contact révélé
│       │   └── BookingDetailScreen.js         # Détail réservation (actions selon rôle)
│       │
│       ├── admin/
│       │   ├── AdminDashboardScreen.js        # Stats globales (users, revenus, missions, availabilityRequests)
│       │   ├── AdminVerificationsScreen.js    # Validation dossiers interprètes
│       │   ├── AdminUsersScreen.js            # Liste et gestion des utilisateurs
│       │   └── AdminFinanceScreen.js          # Tableau abonnements actifs
│       │
│       └── dev/
│           └── SeedDataScreen.js             # Données de démonstration (2 clients, 4 interprètes)
│
└── functions/
    ├── index.js                        # Exports de toutes les Cloud Functions
    ├── stripe/
    │   ├── createCheckoutSession.js    # Crée session Stripe Checkout (callable)
    │   ├── stripeWebhook.js           # Webhook Stripe → mise à jour subscriptions/{uid}
    │   └── createCustomerPortal.js    # Ouvre portail client Stripe (callable)
    ├── missions/
    │   ├── onMissionCreated.js        # Trigger Firestore → filtre disponibilités + tri + 1ère offre
    │   ├── processOffer.js            # Callable : accepter/refuser, reveal contact, créer conversation
    │   ├── checkOfferTimeout.js       # Scheduled (1 min) : timeout offres expirées
    │   └── retryUnmatched.js          # Scheduled (30 min) : relance missions sans match (max 48)
    ├── bookings/
    │   ├── onBookingCreated.js              # Notification interprète à la création
    │   ├── onBookingStatusChanged.js        # Notification client au changement de statut
    │   ├── onAvailabilityRequestCreated.js  # Notification interprète + timer 2min
    │   ├── respondToAvailabilityRequest.js  # Callable : accepter/refuser, reveal contact, créer conversation
    │   └── checkAvailabilityRequestTimeout.js # Scheduled (1 min) : expire demandes pendantes
    └── notifications/
        └── sendPush.js                # Envoi notifications Expo Push (via exp.host API)
```

---

## Flux d'authentification & routage

```
App.js
└── AuthProvider (AuthContext)
    └── RootNavigator
        ├── [non connecté] → AuthNavigator
        │   ├── LoginScreen
        │   ├── RegisterScreen
        │   ├── ForgotPasswordScreen
        │   └── SeedDataScreen (démo)
        │
        └── [connecté] → MainNavigator (Stack)
            ├── Tabs (RoleTabs)
            │   ├── role = 'admin'       → AdminTabs
            │   ├── role = 'interpreter'
            │   │   ├── verification undefined → LoadingScreen
            │   │   ├── !verification || rejete → VerificationScreen
            │   │   ├── status = 'en_attente'  → VerificationStatusScreen
            │   │   └── status = 'accepte'     → InterpreterTabs
            │   └── role = 'client'      → ClientTabs
            │
            └── Écrans Stack (partagés + spécifiques)
                ├── Partagés : EditProfile, BookingDetail, Chat, Review
                ├── Client   : InterpreterDetail, BookingForm, PostMission, MissionTracking
                │              AvailabilityRequest, SuggestedProfiles
                └── Interprète : CGU, Subscription, Paywall, ManageSubscription,
                                 IncomingOffer, Availability, InterpreterStats
```

---

## Schéma Firestore

```
users/{uid}
  email, displayName, role ('client'|'interpreter'|'admin')
  phone, city, photoURL
  cguAccepted, cguAcceptedAt
  expoPushToken
  suspended: boolean
  createdAt, updatedAt

interpreters/{uid}
  firstName, lastName, bio
  languages: [{source, target, level}]
  specialties: string[], services: string[]
  hourlyRate, translationRate
  city, regions: string[]
  availability: {
    status: 'available'|'busy'|'vacation'
    weekdays: number[]         // 0=Lun … 6=Dim
    startHour, endHour: number // ex: 8, 18
    acceptsRemote: boolean
    acceptsOnsite: boolean
  }
  rating, reviewCount
  verificationStatus: 'en_attente'|'accepte'|'rejete'
  searchPriority: 1|2|3       // lié au plan d'abonnement
  cvURL, kbisURL, identiteURL
  assermente: boolean
  siretNumber: string
  createdAt, updatedAt

  private/contactInfo   ← sous-collection (lecture CF Admin SDK uniquement)
    email, phone, address

verifications/{uid}
  fullName, phone, address, siretNumber
  kbisURL, identiteURL
  status: 'en_attente'|'accepte'|'rejete'
  rejectionReason, rejectionComment
  submittedAt, reviewedAt

subscriptions/{uid}
  stripeCustomerId, stripeSubscriptionId
  plan: 'discovery'|'professional'|'premium'
  status: 'active'|'trialing'|'past_due'|'canceled'
  trialEnd, currentPeriodEnd
  cancelAtPeriodEnd: boolean
  missionsLimit: number (-1 = illimité)
  missionsViewed: number
  candidaturesLimit: number (-1 = illimité)
  candidaturesSent: number

missions/{id}
  clientId, service, languageFrom, languageTo
  date, startTime, endTime, location, budget, description
  status: 'searching'|'offered'|'accepted'|'no_match'|'expired'|'cancelled'
  assignedTo, offeredTo
  offerExpiresAt: Timestamp
  retryCount: number
  createdAt

bookings/{id}
  clientId, interpreterId
  serviceType: 'interpretation'|'translation'
  date, time, duration, location, notes
  estimatedPrice
  status: 'pending'|'confirmed'|'rejected'|'completed'|'cancelled'
  createdAt, updatedAt

availabilityRequests/{id}
  clientId, interpreterId
  message: string
  status: 'pending'|'accepted'|'refused'|'expired'|'cancelled'
  expiresAt: Timestamp        // createdAt + 2 min
  conversationId: string      // rempli après acceptation
  createdAt

conversations/{id}
  participants: [uid1, uid2]
  participantsData: {uid: {displayName, photoURL, role}}
  lastMessage, lastMessageAt
  unreadCount: {uid1: n, uid2: n}
  contactRevealed: boolean

  messages/{msgId}            ← sous-collection
    senderId, text
    type: 'text'|'system'
    timestamp, read: boolean

reviews/{id}
  bookingId, clientId, interpreterId
  rating: 1-5, comment
  createdAt
```

---

## Système de design MD3

### Tokens de couleur (COLORS)
```js
primary, onPrimary, primaryFixed, primaryFixedDim
secondary, onSecondary, onSecondaryContainer, secondaryFixed, secondaryContainer
surface, onSurface
surfaceContainerLowest / surfaceContainerLow / surfaceContainerHigh / surfaceContainerHighest
onSurfaceVariant, outline, outlineVariant
error, onError, errorContainer, onErrorContainer
white, black
```

### Ombres (SHADOWS)
```js
SHADOWS.card    // elevation légère pour les cartes
SHADOWS.deep    // elevation forte pour modaux/footers
SHADOWS.subtle  // très légère, pour sections et listes
```

### Conventions visuelles
- **Boutons pill** : `borderRadius: 28`, `paddingVertical: 15`
- **Hero sections fond primaire** : `backgroundColor: COLORS.primary`, `overflow: 'hidden'`, 2 cercles décoratifs translucides (`rgba(255,255,255,0.07)` et `rgba(255,255,255,0.05)`)
- **Cercles décor** : `heroDecor1` → `w:200 h:200 top:-60 right:-60`, `heroDecor2` → `w:130 h:130 bottom:-40 left:-20`
- **Icône hero frosted glass** : `bg: rgba(255,255,255,0.18)`, `border: rgba(255,255,255,0.25)`
- **Avatars dynamiques** : 7 palettes, index = `name.charCodeAt(0) % 7`
- **Badges non lus** : rouge (`COLORS.error`), position absolue

---

## Flux Stripe (abonnements)

```
InterpreterTabs (vérifié)
  └── [!hasActiveSubscription] → banner → CGUScreen
        └── [accepté] → SubscriptionScreen
              └── [choix plan] → createCheckoutSession (CF callable)
                    └── Stripe Checkout (navigateur web)
                          └── checkout.session.completed (webhook)
                                └── stripeWebhook (CF) → subscriptions/{uid}
                                      └── AuthContext listener → accès débloqué

ManageSubscriptionScreen
  └── [Gérer] → createCustomerPortal (CF callable) → portail Stripe
```

---

## Flux missions (auto-assignment)

```
PostMissionScreen → createMission()
  └── missions/{id} créé (status: 'searching')
        └── onMissionCreated (CF trigger)
              └── filtre interprètes :
                    - verificationStatus === 'accepte'
                    - langues compatibles
                    - disponibilité (status, weekdays, heures, remote/onsite)
                    - tri : searchPriority DESC, rating DESC
                    └── offre au #1 (status: 'offered', offerExpiresAt: +2min)
                          ├── accepté → processOffer (CF callable)
                          │     └── status: 'accepted'
                          │           reveal contact → conversations/{id} (msg système)
                          └── refusé / timeout → checkOfferTimeout (scheduled 1min)
                                └── offre au #2, #3...
                                      └── [épuisé] → status: 'no_match'
                                            └── retryUnmatched (cron 30min, max 48)
```

---

## Flux recherche directe (demandes de disponibilité)

```
InterpreterDetailScreen → handleAvailabilityRequest()
  └── availabilityRequests/{id} créé (status: 'pending', expiresAt: +2min)
        └── onAvailabilityRequestCreated (CF trigger)
              └── notification push à l'interprète
                    └── HomeScreen interprète : banner "Demande de disponibilité"
                          ├── Accepter → respondToAvailabilityRequest (CF callable)
                          │     └── lit interpreters/{uid}/private/contactInfo (Admin SDK)
                          │           → conversations/{id} créé (msg système avec contacts)
                          │                 └── AvailabilityRequestScreen → navigate Chat
                          └── Refuser / timeout → checkAvailabilityRequestTimeout (1min)
                                └── status: 'refused'|'expired', notification client
```

---

## Règles de sécurité Firestore (résumé)

| Collection | Lecture | Écriture |
|------------|---------|----------|
| `users/{uid}` | Auth (propre doc) ou admin | Propre doc uniquement |
| `interpreters/{uid}` | Authentifié (profil public) | Propre doc ou admin |
| `interpreters/{uid}/private` | `false` (CF Admin SDK only) | `false` |
| `verifications/{uid}` | Propre doc ou admin | Propre doc (création) ou admin |
| `subscriptions/{uid}` | Propre doc | `false` (CF uniquement) |
| `missions/{id}` | clientId ou assignedTo ou admin | Client (création) ou admin (CF) |
| `bookings/{id}` | clientId ou interpreterId | Client (création) ou interprète (update status) |
| `availabilityRequests/{id}` | clientId ou interpreterId ou admin | Client (création + cancel) ou CF |
| `conversations/{id}` | participants | CF (création) ou participants (update) |
| `messages/{id}` | conversation participants | Participants |
| `reviews/{id}` | Authentifié | clientId (création) |

---

## Déploiement

### 1 — Secrets Firebase (une seule fois)
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRICE_DISCOVERY
firebase functions:secrets:set STRIPE_PRICE_PROFESSIONAL
firebase functions:secrets:set STRIPE_PRICE_PREMIUM
```

### 2 — Déployer Firestore + Functions
```bash
firebase deploy --only firestore          # Règles
firebase deploy --only firestore:indexes  # Index composites
firebase deploy --only functions          # Cloud Functions
firebase deploy --only storage            # Règles Storage
```

### 3 — Build natif (EAS)
```bash
# Développement (APK debug)
eas build --platform android --profile development

# Preview (APK release interne)
eas build --platform android --profile preview

# Production (AAB → Play Store)
eas build --platform android --profile production
eas submit --platform android --profile production
```

### 4 — Mise à jour OTA (JS uniquement, sans rebuild)
```bash
eas update --branch production --message "Fix: ..."
```

### 5 — Webhook Stripe (à configurer dans le Dashboard)
- URL : `https://europe-west1-getrad-e4944.cloudfunctions.net/stripeWebhook`
- Événements : `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copier le Signing Secret → `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`
