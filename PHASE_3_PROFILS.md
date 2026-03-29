# 👤 Phase 3 : Profils - TERMINÉE ✅

## ✅ Ce qui a été développé

### 1. Service de gestion des profils
- ✅ [src/services/profileService.js](src/services/profileService.js)
  - Mise à jour des profils utilisateurs
  - Mise à jour des profils interprètes
  - Upload de photos de profil
  - Upload de documents (CV, diplômes)
  - Gestion des paires de langues

### 2. Composants de sélection
- ✅ [src/components/MultiSelect.js](src/components/MultiSelect.js) - Sélection multiple (spécialités, services, régions)
- ✅ [src/components/LanguagePairSelector.js](src/components/LanguagePairSelector.js) - Ajout de paires de langues
- ✅ [src/components/Picker.js](src/components/Picker.js) - Sélecteur personnalisé

### 3. Écrans de profil
- ✅ [src/screens/common/EditProfileScreen.js](src/screens/common/EditProfileScreen.js) - Profil client
- ✅ [src/screens/interpreter/EditInterpreterProfileScreen.js](src/screens/interpreter/EditInterpreterProfileScreen.js) - Profil interprète complet

### 4. Navigation mise à jour
- ✅ [src/navigation/MainNavigator.js](src/navigation/MainNavigator.js) - Ajout des écrans de profil
- ✅ [src/screens/common/HomeScreen.js](src/screens/common/HomeScreen.js) - Bouton "Modifier mon profil"

---

## 🎯 Fonctionnalités pour les CLIENTS

### Informations modifiables
- ✅ Nom d'affichage
- ✅ Téléphone
- ✅ Ville
- ✅ Photo de profil

### Comment modifier son profil
1. **Sur l'écran d'accueil**, clique sur **"✏️ Modifier mon profil"**
2. **Change** les informations que tu veux
3. **Clique** sur la photo pour changer l'image
4. **Clique** sur "Enregistrer les modifications"

---

## 💼 Fonctionnalités pour les INTERPRÈTES

### Section 1 : Informations personnelles
- ✅ Prénom *
- ✅ Nom *
- ✅ Nom d'affichage *
- ✅ Email (lecture seule)
- ✅ Téléphone
- ✅ Ville *
- ✅ Biographie (présentation)
- ✅ Photo de profil

### Section 2 : Langues pratiquées *
- ✅ Ajout de paires de langues (source → cible)
- ✅ Niveau : Natif, Bilingue, Certifié, Professionnel
- ✅ Suppression de langues

**Exemple** : Français → Arabe (Certifié)

### Section 3 : Spécialités
- ✅ Juridique
- ✅ Médical
- ✅ Technique
- ✅ Commercial
- ✅ Conférence
- ✅ Littéraire
- ✅ Scientifique
- ✅ Diplomatique
- ✅ Audiovisuel
- ✅ Marketing

### Section 4 : Services proposés *
- ✅ Interprétation en présentiel
- ✅ Interprétation à distance
- ✅ Traduction de documents
- ✅ Interprétation assermentée

### Section 5 : Tarifs
- ✅ Tarif horaire (€)
- ✅ Tarif traduction par page (€)

### Section 6 : Régions d'intervention
- ✅ Sélection multiple parmi les 13 régions de France

### Section 7 : Statut professionnel
- ✅ Interprète/Traducteur assermenté (case à cocher)
- ✅ Numéro SIRET
- ✅ Upload CV (PDF)
- ✅ Upload Diplômes (PDF)

---

## 🧪 Comment tester la Phase 3

### Test 1 : Profil client

1. **Connecte-toi** avec ton compte client (BAS)
2. **Clique** sur "✏️ Modifier mon profil"
3. **Change** ton nom : `BAS Mohamed`
4. **Ajoute** un téléphone : `0612345678`
5. **Ajoute** une ville : `Paris`
6. **Clique** sur la photo pour changer (choisis une image)
7. **Enregistre**
8. **Résultat** : Tu reviens à l'écran d'accueil avec les nouvelles infos

### Test 2 : Créer un compte interprète

1. **Déconnecte-toi**
2. **Inscris-toi** avec un nouveau compte en tant qu'**Interprète**
   - Email : `interprete@test.com`
   - Mot de passe : `test123`
   - Prénom : `Marie`
   - Nom : `Dupont`
   - Ville : `Lyon`

### Test 3 : Compléter le profil interprète

1. **Clique** sur "✏️ Modifier mon profil"
2. **Remplis** toutes les sections :

   **Informations** :
   - Biographie : "Interprète et traductrice professionnelle avec 10 ans d'expérience"

   **Langues** (clique sur "+ Ajouter une langue") :
   - Français → Arabe (Certifié)
   - Français → Anglais (Bilingue)

   **Spécialités** (clique sur les tags) :
   - Juridique
   - Médical

   **Services** :
   - Interprétation en présentiel
   - Traduction de documents

   **Tarifs** :
   - Tarif horaire : 60 €
   - Tarif traduction : 40 € / page

   **Régions** :
   - Auvergne-Rhône-Alpes
   - Provence-Alpes-Côte d'Azur

   **Statut** :
   - ✓ Interprète assermenté
   - SIRET : 12345678900012

3. **Enregistre**

### Test 4 : Upload de documents

1. **Sur l'écran de profil interprète**
2. **Clique** sur "📄 Télécharger mon CV"
3. **Choisis** un fichier PDF
4. **Attends** le téléchargement
5. **Résultat** : "✓ CV téléchargé"

---

## 📊 Structure des données mises à jour

### Profil client dans Firestore

**Collection : `users/{userId}`**
```json
{
  "displayName": "BAS Mohamed",
  "phone": "0612345678",
  "city": "Paris",
  "photoURL": "https://firebasestorage.googleapis.com/...",
  "updatedAt": "2026-03-25T23:45:00Z"
}
```

### Profil interprète dans Firestore

**Collection : `interpreters/{userId}`**
```json
{
  "firstName": "Marie",
  "lastName": "Dupont",
  "bio": "Interprète et traductrice professionnelle...",
  "languages": [
    {
      "source": "Français",
      "target": "Arabe",
      "level": "certifié"
    },
    {
      "source": "Français",
      "target": "Anglais",
      "level": "bilingue"
    }
  ],
  "specialties": ["Juridique", "Médical"],
  "services": ["interpretation_presentiel", "traduction"],
  "hourlyRate": 60,
  "translationRate": 40,
  "city": "Lyon",
  "regions": ["Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d'Azur"],
  "assermente": true,
  "siretNumber": "12345678900012",
  "cvURL": "https://firebasestorage.googleapis.com/.../cv.pdf",
  "diplomaURL": "https://firebasestorage.googleapis.com/.../diploma.pdf",
  "updatedAt": "2026-03-25T23:50:00Z"
}
```

---

## 🔥 Permissions Firebase Storage

Pour que l'upload de fichiers fonctionne, configure les règles Storage dans Firebase Console :

1. **Va sur** : https://console.firebase.google.com/
2. **Sélectionne** ton projet `getrad-9430b`
3. **Clique** sur "Storage" → "Rules"
4. **Remplace** par :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Photos de profil
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Documents interprètes
    match /interpreters/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. **Clique** sur "Publish"

---

## 🎨 Nouveaux composants créés

### MultiSelect
Permet de sélectionner plusieurs options (spécialités, services, régions).

**Utilisation** :
```jsx
<MultiSelect
  label="Spécialités"
  options={SPECIALTIES}
  selectedValues={selectedSpecialties}
  onSelect={(values) => setSelectedSpecialties(values)}
/>
```

### LanguagePairSelector
Permet d'ajouter des paires de langues avec niveau.

**Utilisation** :
```jsx
<LanguagePairSelector
  languages={languages}
  onAdd={(language) => addLanguage(language)}
  onRemove={(index) => removeLanguage(index)}
/>
```

### Picker
Sélecteur personnalisé pour choisir une valeur unique.

**Utilisation** :
```jsx
<Picker
  label="Ville"
  value={city}
  onValueChange={setCity}
  options={CITIES}
  placeholder="Sélectionner une ville"
/>
```

---

## 🚧 Erreurs courantes et solutions

### Erreur : "Permission denied" lors de l'upload
**Solution** : Configure les règles Firebase Storage (voir ci-dessus)

### Erreur : "Document picker failed"
**Solution** : Sur le web, seuls les PDF sont supportés. Sur mobile, ça fonctionne mieux.

### L'image ne se télécharge pas
**Solution** : Vérifie que :
1. Firebase Storage est activé dans la console
2. Les règles de sécurité sont configurées
3. Tu as une connexion internet

### Le profil ne se sauvegarde pas
**Solution** : Vérifie que tous les champs marqués * sont remplis

---

## 🎯 Prochaine étape : Phase 4 - Recherche et Consultation

Dans la Phase 4, on va créer :

### Pour les **Clients** :
- 🔍 **Recherche d'interprètes** avec filtres avancés
  - Par langue
  - Par ville
  - Par spécialité
  - Par type de service
  - Par tarif
- 📋 **Consultation des profils** détaillés
- ⭐ **Système d'avis** et de notes
- ❤️ **Favoris**

### Pour les **Interprètes** :
- 📊 **Tableau de bord** avec statistiques
- 👁️ **Voir son profil** comme le voient les clients
- 📈 **Statistiques** de consultation

---

**Teste d'abord les profils et dis-moi si tout fonctionne ! 🚀**
