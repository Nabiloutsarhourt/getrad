// 🌱 Écran de seed de données de démo - GETRAD
// Accessible uniquement en développement depuis l'écran de connexion
// Crée de faux utilisateurs, interprètes, réservations et avis pour tester l'app
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc, setDoc, addDoc, collection, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { COLORS, SHADOWS } from '../../config/constants';

// ── Données de démo ─────────────────────────────────────────────────────────

const TEST_USERS = [
  // Clients
  {
    email: 'client1@test.com',
    password: 'Test1234!',
    role: 'client',
    displayName: 'Marie Dupont',
    phone: '06 12 34 56 78',
    city: 'Paris',
  },
  {
    email: 'client2@test.com',
    password: 'Test1234!',
    role: 'client',
    displayName: 'Thomas Bernard',
    phone: '06 23 45 67 89',
    city: 'Lyon',
  },
  // Interprètes
  {
    email: 'ahmed@test.com',
    password: 'Test1234!',
    role: 'interpreter',
    displayName: 'Ahmed Benali',
    phone: '06 34 56 78 90',
    city: 'Paris',
    profile: {
      firstName: 'Ahmed',
      lastName: 'Benali',
      bio: 'Interprète judiciaire assermenté avec 12 ans d\'expérience. Spécialisé en droit pénal, procédures civiles et arbitrage international. Ancien expert auprès des tribunaux de Paris.',
      languages: [
        { source: 'Arabe', target: 'Français', level: 'Certifié' },
        { source: 'Français', target: 'Arabe', level: 'Certifié' },
        { source: 'Anglais', target: 'Français', level: 'Courant' },
      ],
      specialties: ['Juridique', 'Diplomatique'],
      services: ['interpretation_presentiel', 'interpretation_distance', 'assermente'],
      hourlyRate: 95,
      translationRate: 35,
      city: 'Paris',
      regions: ['Île-de-France', 'Hauts-de-France'],
      rating: 4.8,
      reviewCount: 24,
      assermente: true,
      verified: true,
      searchPriority: 3,
    },
    subscription: {
      plan: 'premium',
      status: 'active',
      missionsLimit: -1,
      candidaturesLimit: -1,
      missionsViewed: 3,
      candidaturesSent: 1,
    },
  },
  {
    email: 'elena@test.com',
    password: 'Test1234!',
    role: 'interpreter',
    displayName: 'Elena Petrov',
    phone: '06 45 67 89 01',
    city: 'Lyon',
    profile: {
      firstName: 'Elena',
      lastName: 'Petrov',
      bio: 'Interprète médicale et scientifique russo-française. Diplômée en médecine et en langues. Expérience en oncologie, psychiatrie et essais cliniques internationaux.',
      languages: [
        { source: 'Russe', target: 'Français', level: 'Natif' },
        { source: 'Français', target: 'Russe', level: 'Natif' },
        { source: 'Anglais', target: 'Français', level: 'Courant' },
        { source: 'Ukrainien', target: 'Français', level: 'Courant' },
      ],
      specialties: ['Médical', 'Scientifique'],
      services: ['interpretation_presentiel', 'interpretation_distance', 'traduction'],
      hourlyRate: 80,
      translationRate: 28,
      city: 'Lyon',
      regions: ['Auvergne-Rhône-Alpes', 'Île-de-France'],
      rating: 4.6,
      reviewCount: 18,
      assermente: false,
      verified: true,
      searchPriority: 2,
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      missionsLimit: 20,
      candidaturesLimit: 15,
      missionsViewed: 7,
      candidaturesSent: 4,
    },
  },
  {
    email: 'marco@test.com',
    password: 'Test1234!',
    role: 'interpreter',
    displayName: 'Marco Rossi',
    phone: '06 56 78 90 12',
    city: 'Marseille',
    profile: {
      firstName: 'Marco',
      lastName: 'Rossi',
      bio: 'Interprète commercial et de conférence franco-italien. Spécialisé dans les négociations d\'affaires, présentations corporatives et salons professionnels.',
      languages: [
        { source: 'Italien', target: 'Français', level: 'Natif' },
        { source: 'Français', target: 'Italien', level: 'Natif' },
        { source: 'Espagnol', target: 'Français', level: 'Courant' },
      ],
      specialties: ['Commercial', 'Conférence', 'Marketing'],
      services: ['interpretation_presentiel', 'interpretation_distance', 'traduction'],
      hourlyRate: 65,
      translationRate: 22,
      city: 'Marseille',
      regions: ['Provence-Alpes-Côte d\'Azur', 'Occitanie'],
      rating: 4.2,
      reviewCount: 9,
      assermente: false,
      verified: false,
      searchPriority: 1,
    },
    subscription: {
      plan: 'discovery',
      status: 'active',
      missionsLimit: 5,
      candidaturesLimit: 3,
      missionsViewed: 2,
      candidaturesSent: 1,
    },
  },
  {
    email: 'sarah@test.com',
    password: 'Test1234!',
    role: 'interpreter',
    displayName: 'Sarah Okonkwo',
    phone: '06 67 89 01 23',
    city: 'Bordeaux',
    profile: {
      firstName: 'Sarah',
      lastName: 'Okonkwo',
      bio: 'Interprète spécialisée en langue des affaires, diplomatie et relations internationales. Expérience ONU, Union Africaine et grandes entreprises multinationales.',
      languages: [
        { source: 'Anglais', target: 'Français', level: 'Certifié' },
        { source: 'Français', target: 'Anglais', level: 'Certifié' },
        { source: 'Yoruba', target: 'Français', level: 'Natif' },
      ],
      specialties: ['Diplomatique', 'Conférence', 'Commercial'],
      services: ['interpretation_presentiel', 'interpretation_distance'],
      hourlyRate: 88,
      translationRate: 30,
      city: 'Bordeaux',
      regions: ['Nouvelle-Aquitaine', 'Île-de-France'],
      rating: 4.9,
      reviewCount: 31,
      assermente: false,
      verified: true,
      searchPriority: 2,
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      missionsLimit: 20,
      candidaturesLimit: 15,
      missionsViewed: 12,
      candidaturesSent: 8,
    },
  },
];

// ── Composant principal ────────────────────────────────────────────────────
const SeedDataScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, id: Date.now() + Math.random() }]);
  };

  const handleSeed = async () => {
    setRunning(true);
    setLogs([]);
    setDone(false);

    const createdUsers = {}; // email → { uid, displayName, role }

    try {
      addLog('🌱 Démarrage du seed...', 'title');

      // ── 1. Créer les comptes Firebase Auth + Firestore ─────────────────
      addLog('👥 Création des utilisateurs...', 'section');

      for (const u of TEST_USERS) {
        try {
          // Créer le compte Auth
          const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
          const uid = cred.user.uid;
          createdUsers[u.email] = { uid, displayName: u.displayName, role: u.role };

          // Document users/{uid}
          await setDoc(doc(db, 'users', uid), {
            email: u.email,
            displayName: u.displayName,
            role: u.role,
            phone: u.phone || '',
            city: u.city || '',
            photoURL: '',
            cguAccepted: u.role === 'interpreter',
            cguAcceptedAt: u.role === 'interpreter' ? serverTimestamp() : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Profil interprète si besoin
          if (u.role === 'interpreter' && u.profile) {
            await setDoc(doc(db, 'interpreters', uid), {
              ...u.profile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            // Abonnement
            if (u.subscription) {
              const now = new Date();
              const nextMonth = new Date(now);
              nextMonth.setMonth(nextMonth.getMonth() + 1);

              await setDoc(doc(db, 'subscriptions', uid), {
                ...u.subscription,
                stripeSubscriptionId: `sub_test_${uid.slice(0, 8)}`,
                stripePriceId: `price_test_${u.subscription.plan}`,
                currentPeriodStart: Timestamp.fromDate(now),
                currentPeriodEnd: Timestamp.fromDate(nextMonth),
                cancelAtPeriodEnd: false,
                trialEnd: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }

          addLog(`  ✅ ${u.displayName} (${u.role}) — ${u.email}`);
          await signOut(auth);
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            // Compte déjà créé — récupérer le UID via connexion
            const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
            createdUsers[u.email] = { uid: cred.user.uid, displayName: u.displayName, role: u.role };
            addLog(`  ⚠️ ${u.displayName} déjà existant, récupéré`);
            await signOut(auth);
          } else {
            addLog(`  ❌ Erreur ${u.email}: ${err.message}`, 'error');
          }
        }
      }

      // Identifier les UIDs des utilisateurs créés
      const clientIds = Object.values(createdUsers).filter(u => u.role === 'client').map(u => u.uid);
      const interpreterEmails = ['ahmed@test.com', 'elena@test.com', 'marco@test.com', 'sarah@test.com'];
      const interpIds = interpreterEmails.map(e => createdUsers[e]?.uid).filter(Boolean);

      if (clientIds.length === 0 || interpIds.length === 0) {
        addLog('❌ Pas assez d\'utilisateurs créés pour les données de démo.', 'error');
        setRunning(false);
        return;
      }

      const [client1Id, client2Id] = clientIds;
      const [ahmedId, elenaId, marcoId, sarahId] = interpIds;

      // ── 2. Réservations ──────────────────────────────────────────────────
      addLog('📋 Création des réservations...', 'section');

      const booking1Ref = await addDoc(collection(db, 'bookings'), {
        clientId: client1Id,
        interpreterId: ahmedId,
        source: 'direct_search',
        missionId: null,
        service: 'interpretation_presentiel',
        languageFrom: 'Français',
        languageTo: 'Arabe',
        date: '15/04/2025',
        startTime: '09:00',
        endTime: '12:00',
        location: 'Tribunal de Paris, 4 bd du Palais, 75001 Paris',
        description: 'Audience au tribunal correctionnel. Client arabophone nécessitant une interprétation complète des débats et des questions posées par le juge.',
        budget: 285,
        status: 'accepted',
        contactRevealed: true,
        clientNotes: '',
        interpreterNotes: '',
        createdAt: Timestamp.fromDate(new Date('2025-03-10')),
        updatedAt: serverTimestamp(),
      });
      addLog('  ✅ Réservation acceptée (Marie → Ahmed, tribunal)');

      await addDoc(collection(db, 'bookings'), {
        clientId: client1Id,
        interpreterId: elenaId,
        source: 'direct_search',
        missionId: null,
        service: 'traduction',
        languageFrom: 'Russe',
        languageTo: 'Français',
        date: '20/04/2025',
        startTime: '14:00',
        endTime: '16:00',
        location: 'À distance',
        description: 'Traduction de rapports médicaux russes (IRM, analyses biologiques) pour un patient suivi en France.',
        budget: 150,
        status: 'pending',
        contactRevealed: false,
        clientNotes: '',
        interpreterNotes: '',
        createdAt: Timestamp.fromDate(new Date('2025-03-12')),
        updatedAt: serverTimestamp(),
      });
      addLog('  ✅ Réservation en attente (Marie → Elena, traduction médicale)');

      await addDoc(collection(db, 'bookings'), {
        clientId: client2Id,
        interpreterId: marcoId,
        source: 'direct_search',
        missionId: null,
        service: 'interpretation_presentiel',
        languageFrom: 'Français',
        languageTo: 'Italien',
        date: '02/04/2025',
        startTime: '10:00',
        endTime: '13:00',
        location: 'Lyon, Palais des Congrès',
        description: 'Présentation commerciale pour des partenaires italiens lors d\'un salon professionnel.',
        budget: 195,
        status: 'completed',
        contactRevealed: true,
        clientNotes: 'Excellent travail, très professionnel.',
        interpreterNotes: '',
        createdAt: Timestamp.fromDate(new Date('2025-03-01')),
        updatedAt: serverTimestamp(),
      });
      addLog('  ✅ Réservation terminée (Thomas → Marco, conférence)');

      await addDoc(collection(db, 'bookings'), {
        clientId: client2Id,
        interpreterId: sarahId,
        source: 'direct_search',
        missionId: null,
        service: 'interpretation_distance',
        languageFrom: 'Anglais',
        languageTo: 'Français',
        date: '25/04/2025',
        startTime: '15:00',
        endTime: '17:00',
        location: 'À distance (Zoom)',
        description: 'Réunion avec un partenaire britannique pour négociation d\'un contrat de distribution.',
        budget: 176,
        status: 'accepted',
        contactRevealed: true,
        clientNotes: '',
        interpreterNotes: '',
        createdAt: Timestamp.fromDate(new Date('2025-03-15')),
        updatedAt: serverTimestamp(),
      });
      addLog('  ✅ Réservation acceptée (Thomas → Sarah, visio)');

      // ── 3. Avis ──────────────────────────────────────────────────────────
      addLog('⭐ Création des avis...', 'section');

      await addDoc(collection(db, 'reviews'), {
        bookingId: booking1Ref.id,
        clientId: client1Id,
        clientName: 'Marie D.',
        interpreterId: ahmedId,
        rating: 5,
        comment: 'Ahmed a été d\'un professionnalisme exemplaire. Sa maîtrise du vocabulaire juridique arabe est impressionnante. La traduction était précise et fluide tout au long de l\'audience. Je le recommande vivement.',
        createdAt: Timestamp.fromDate(new Date('2025-03-20')),
      });
      addLog('  ✅ Avis 5⭐ pour Ahmed');

      await addDoc(collection(db, 'reviews'), {
        bookingId: booking1Ref.id,
        clientId: client2Id,
        clientName: 'Thomas B.',
        interpreterId: marcoId,
        rating: 4,
        comment: 'Très bonne prestation. Marco est ponctuel et efficace. Légère hésitation sur un terme technique du domaine du packaging, mais rien de bloquant. Je referai appel à lui.',
        createdAt: Timestamp.fromDate(new Date('2025-03-08')),
      });
      addLog('  ✅ Avis 4⭐ pour Marco');

      await addDoc(collection(db, 'reviews'), {
        bookingId: booking1Ref.id,
        clientId: client1Id,
        clientName: 'Marie D.',
        interpreterId: sarahId,
        rating: 5,
        comment: 'Sarah est extraordinaire. Sa capacité à suivre les échanges complexes en temps réel, sans jamais perdre le fil ni le ton, est remarquable. Une vraie professionnelle.',
        createdAt: Timestamp.fromDate(new Date('2025-03-18')),
      });
      addLog('  ✅ Avis 5⭐ pour Sarah');

      // ── 4. Conversations et messages ─────────────────────────────────────
      addLog('💬 Création des conversations...', 'section');

      const conv1Ref = await addDoc(collection(db, 'conversations'), {
        participants: [client1Id, ahmedId],
        bookingId: booking1Ref.id,
        missionId: null,
        lastMessage: 'Parfait, je serai au tribunal à 8h45 pour préparer.',
        lastMessageAt: Timestamp.fromDate(new Date('2025-03-11T10:30:00')),
        contactRevealed: true,
        unreadCount: { [client1Id]: 0, [ahmedId]: 0 },
        participantsData: {
          [client1Id]: { displayName: 'Marie Dupont', role: 'client' },
          [ahmedId]: { displayName: 'Ahmed Benali', role: 'interpreter' },
        },
      });

      const conv1Messages = [
        {
          senderId: 'system',
          text: '✅ Demande acceptée — conversation ouverte. Les coordonnées ont été partagées.',
          type: 'system',
          createdAt: Timestamp.fromDate(new Date('2025-03-10T14:00:00')),
        },
        {
          senderId: client1Id,
          text: 'Bonjour Ahmed, merci d\'avoir accepté ma demande. L\'audience est prévue pour 9h mais il faudra sans doute arriver un peu avant.',
          type: 'text',
          read: true,
          createdAt: Timestamp.fromDate(new Date('2025-03-10T14:05:00')),
        },
        {
          senderId: ahmedId,
          text: 'Bonjour Marie ! Pas de problème. Je connais bien le tribunal de Paris. Souhaitez-vous me faire parvenir les documents liés à l\'affaire en amont ?',
          type: 'text',
          read: true,
          createdAt: Timestamp.fromDate(new Date('2025-03-10T14:20:00')),
        },
        {
          senderId: client1Id,
          text: 'Oui, je vous envoie le dossier par email. Mon téléphone : 06 12 34 56 78.',
          type: 'text',
          read: true,
          createdAt: Timestamp.fromDate(new Date('2025-03-10T15:00:00')),
        },
        {
          senderId: ahmedId,
          text: 'Parfait, je serai au tribunal à 8h45 pour préparer.',
          type: 'text',
          read: true,
          createdAt: Timestamp.fromDate(new Date('2025-03-11T10:30:00')),
        },
      ];

      for (const msg of conv1Messages) {
        await addDoc(collection(db, 'conversations', conv1Ref.id, 'messages'), msg);
      }
      addLog('  ✅ Conversation Marie ↔ Ahmed (5 messages)');

      const conv2Ref = await addDoc(collection(db, 'conversations'), {
        participants: [client2Id, sarahId],
        bookingId: null,
        missionId: null,
        lastMessage: 'Je prépare un glossaire technique pour faciliter la réunion.',
        lastMessageAt: Timestamp.fromDate(new Date('2025-03-16T09:00:00')),
        contactRevealed: true,
        unreadCount: { [client2Id]: 1, [sarahId]: 0 },
        participantsData: {
          [client2Id]: { displayName: 'Thomas Bernard', role: 'client' },
          [sarahId]: { displayName: 'Sarah Okonkwo', role: 'interpreter' },
        },
      });

      const conv2Messages = [
        {
          senderId: 'system',
          text: '✅ Demande acceptée — conversation ouverte.',
          type: 'system',
          createdAt: Timestamp.fromDate(new Date('2025-03-15T16:00:00')),
        },
        {
          senderId: client2Id,
          text: 'Bonjour Sarah ! Très content que vous soyez disponible. La réunion porte sur un contrat de distribution de matériaux de construction.',
          type: 'text',
          read: true,
          createdAt: Timestamp.fromDate(new Date('2025-03-15T16:10:00')),
        },
        {
          senderId: sarahId,
          text: 'Bonjour Thomas ! Parfait, ce secteur m\'est familier. Pouvez-vous me partager l\'ordre du jour ?',
          type: 'text',
          read: true,
          createdAt: Timestamp.fromDate(new Date('2025-03-15T16:30:00')),
        },
        {
          senderId: sarahId,
          text: 'Je prépare un glossaire technique pour faciliter la réunion.',
          type: 'text',
          read: false,
          createdAt: Timestamp.fromDate(new Date('2025-03-16T09:00:00')),
        },
      ];

      for (const msg of conv2Messages) {
        await addDoc(collection(db, 'conversations', conv2Ref.id, 'messages'), msg);
      }
      addLog('  ✅ Conversation Thomas ↔ Sarah (4 messages)');

      // ── 5. Mission de démo ───────────────────────────────────────────────
      addLog('📋 Création d\'une mission de démo...', 'section');

      await addDoc(collection(db, 'missions'), {
        clientId: client2Id,
        title: 'Interprète anglais-français pour réunion de direction',
        description: 'Nous organisons une réunion de direction avec nos partenaires londoniens. Besoin d\'un interprète simultané pour toute la durée de la réunion (3h). Sujets : stratégie 2025, expansion en Europe du Sud.',
        service: 'interpretation_presentiel',
        languageFrom: 'Anglais',
        languageTo: 'Français',
        date: '30/04/2025',
        startTime: '09:00',
        endTime: '12:00',
        location: 'En présentiel',
        region: 'Île-de-France',
        budget: 264,
        status: 'no_match',
        currentOfferedTo: null,
        offerExpiresAt: null,
        assignedTo: null,
        candidateQueue: [],
        currentQueueIndex: 0,
        offerHistory: [],
        retryCount: 1,
        maxRetries: 48,
        contactRevealed: false,
        createdAt: Timestamp.fromDate(new Date('2025-03-14')),
        updatedAt: serverTimestamp(),
      });
      addLog('  ✅ Mission de démo créée (statut: no_match)');

      addLog('', 'spacer');
      addLog('🎉 Seed terminé avec succès !', 'success');
      addLog('', 'spacer');
      addLog('📧 Comptes de test :', 'info');
      addLog('  Client : client1@test.com / Test1234!', 'account');
      addLog('  Client : client2@test.com / Test1234!', 'account');
      addLog('  Interprète : ahmed@test.com / Test1234!', 'account');
      addLog('  Interprète : elena@test.com / Test1234!', 'account');
      addLog('  Interprète : marco@test.com / Test1234!', 'account');
      addLog('  Interprète : sarah@test.com / Test1234!', 'account');

      setDone(true);
    } catch (err) {
      addLog(`❌ Erreur générale : ${err.message}`, 'error');
    }

    setRunning(false);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🌱</Text>
        <Text style={styles.headerTitle}>Seed de données de démo</Text>
        <Text style={styles.headerSub}>
          Crée des utilisateurs, profils, réservations et conversations de test dans Firebase.
        </Text>
      </View>

      {/* Logs */}
      <ScrollView style={styles.logBox} contentContainerStyle={styles.logContent}>
        {logs.length === 0 && !running && (
          <Text style={styles.emptyLog}>
            Appuie sur le bouton pour démarrer le seed.{'\n\n'}
            ⚠️  Les données existantes ne seront pas effacées.
          </Text>
        )}
        {logs.map((log) => (
          <Text
            key={log.id}
            style={[
              styles.logLine,
              log.type === 'title' && styles.logTitle,
              log.type === 'section' && styles.logSection,
              log.type === 'success' && styles.logSuccess,
              log.type === 'error' && styles.logError,
              log.type === 'account' && styles.logAccount,
            ]}
          >
            {log.msg}
          </Text>
        ))}
        {running && (
          <ActivityIndicator style={{ marginTop: 16 }} color={COLORS.primary} />
        )}
      </ScrollView>

      {/* Boutons */}
      <View style={[styles.footer, SHADOWS.deep]}>
        {done ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnSuccess]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>← Retour à la connexion</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, running && styles.btnDisabled]}
            onPress={handleSeed}
            disabled={running}
            activeOpacity={0.85}
          >
            {running
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>🌱 Lancer le seed</Text>
            }
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backLink}>Retour sans seeder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f0f' },

  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerEmoji: { fontSize: 48 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },

  logBox: {
    flex: 1,
    backgroundColor: '#111',
  },
  logContent: {
    padding: 16,
    gap: 2,
  },
  emptyLog: {
    color: '#555',
    fontSize: 13,
    lineHeight: 22,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 32,
  },
  logLine: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  logTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '800',
    marginTop: 8,
  },
  logSection: {
    color: '#60a5fa',
    fontWeight: '700',
    marginTop: 8,
  },
  logSuccess: {
    color: '#34d399',
    fontWeight: '800',
    fontSize: 15,
  },
  logError: {
    color: '#f87171',
    fontWeight: '700',
  },
  logAccount: {
    color: '#fbbf24',
    fontFamily: 'monospace',
  },

  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 12,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#059669',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  backLink: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
});

export default SeedDataScreen;
