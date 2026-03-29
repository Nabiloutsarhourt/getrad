// Paywall — Mur d'accès sans abonnement actif - GETRAD
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const PaywallScreen = ({ navigation }) => {
  const { subscription } = useAuth();
  const isPastDue = subscription?.status === 'past_due';

  return (
    <View style={styles.container}>
      <View style={[styles.card, SHADOWS.deep]}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: isPastDue ? COLORS.errorContainer : COLORS.primaryFixed }]}>
          <Ionicons
            name={isPastDue ? 'alert-circle-outline' : 'ribbon-outline'}
            size={36}
            color={isPastDue ? COLORS.error : COLORS.primary}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isPastDue
            ? 'Paiement en échec'
            : 'Abonnement requis'}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {isPastDue
            ? 'Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement pour continuer à accéder aux missions.'
            : 'Pour accéder aux missions et être visible dans les résultats de recherche, vous devez souscrire un abonnement GETRAD.'}
        </Text>

        {/* Features preview */}
        {!isPastDue && (
          <View style={styles.features}>
            {[
              'Recevez des missions automatiquement',
              'Visibilité dans les recherches clients',
              'Messagerie professionnelle',
              'Essai gratuit 7 à 14 jours',
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                <Text style={styles.feature}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {isPastDue ? 'Mettre à jour le paiement' : 'Voir les abonnements'}
          </Text>
        </TouchableOpacity>

        {/* Lien retour */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.back}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.primaryFixed, top: -60, right: -50 },
  heroDecor2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primaryFixed, bottom: -40, left: -30 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  features: {
    alignSelf: 'stretch',
    gap: 8,
    paddingVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feature: {
    fontSize: 13,
    color: COLORS.onSurface,
    fontWeight: '500',
    flex: 1,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  back: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default PaywallScreen;
