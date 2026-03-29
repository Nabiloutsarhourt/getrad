// CGU — Conditions Générales d'Utilisation - GETRAD
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SHADOWS } from '../../config/constants';

const CGUScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      Alert.alert('Attention', 'Vous devez cocher la case pour continuer.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cguAccepted: true,
        cguAcceptedAt: serverTimestamp(),
      });
      navigation.navigate('Subscription');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de valider. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroIconBox}>
            <Ionicons name="document-text-outline" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>Conditions Générales d'Utilisation</Text>
          <Text style={styles.heroSub}>GETRAD — Plateforme de mise en relation</Text>
        </View>

        {CGU_SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer fixe */}
      <View style={[styles.footer, SHADOWS.deep]}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
          </View>
          <Text style={styles.checkLabel}>
            J'ai lu et j'accepte les Conditions Générales d'Utilisation de GETRAD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !accepted && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={loading || !accepted}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnText}>Continuer vers l'abonnement</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CGU_SECTIONS = [
  {
    title: '1. Nature du service',
    text: 'GETRAD est une plateforme de mise en relation entre des clients (particuliers, entreprises, administrations) et des interprètes/traducteurs professionnels. GETRAD n\'est pas un employeur et ne prend aucune commission sur les prestations réalisées.',
  },
  {
    title: '2. Abonnement et accès',
    text: 'L\'accès aux missions et à la visibilité sur la plateforme est conditionné à un abonnement mensuel payant selon le plan choisi (Découverte, Professionnel ou Premium). Sans abonnement actif, le profil ne sera pas visible dans les résultats de recherche.',
  },
  {
    title: '3. Paiements',
    text: 'Le paiement des prestations d\'interprétation ou de traduction s\'effectue directement entre le client et l\'interprète, en dehors de l\'application. GETRAD ne gère pas, ne perçoit pas et n\'est pas responsable de ces paiements.',
  },
  {
    title: '4. Confidentialité des coordonnées',
    text: 'Vos coordonnées personnelles (nom complet, email, téléphone, adresse) ne sont partagées avec un client qu\'après acceptation mutuelle d\'une mission ou demande de réservation. Avant acceptation, seul votre prénom et des informations professionnelles sont visibles.',
  },
  {
    title: '5. Délai de réponse',
    text: 'Vous disposez de 2 minutes pour accepter ou refuser chaque offre de mission reçue. Un taux de non-réponse élevé peut entraîner une baisse de votre priorité dans l\'algorithme d\'affectation.',
  },
  {
    title: '6. Qualité et fiabilité',
    text: 'Vous êtes responsable de la qualité de vos prestations et de l\'exactitude des informations fournies sur votre profil (diplômes, certifications, langues maîtrisées). GETRAD se réserve le droit de suspendre tout compte en cas de fausse déclaration ou d\'abus signalé.',
  },
  {
    title: '7. Avis clients',
    text: 'Les avis laissés par les clients après une prestation sont publiés sans modification sur votre profil. Vous ne pouvez pas demander la suppression d\'un avis sauf en cas de contenu illicite.',
  },
  {
    title: '8. Résiliation',
    text: 'Vous pouvez résilier votre abonnement à tout moment depuis votre espace de gestion. La résiliation prend effet à la fin de la période en cours. Aucun remboursement n\'est effectué pour la période entamée.',
  },
  {
    title: '9. Droit de rétractation',
    text: 'Conformément à la loi française, vous disposez d\'un droit de rétractation de 14 jours à compter de la souscription de votre abonnement, sauf si vous avez expressément demandé à bénéficier du service avant l\'expiration de ce délai.',
  },
  {
    title: '10. Données personnelles',
    text: 'Vos données personnelles sont traitées conformément au Règlement Général sur la Protection des Données (RGPD). Vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Pour toute demande, contactez : privacy@getrad.app',
  },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
  },

  footer: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    gap: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default CGUScreen;
