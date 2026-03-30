// Écran de choix d'abonnement - GETRAD
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { startCheckout } from '../../services/subscriptionService';
import { trackSubscriptionStarted } from '../../services/analyticsService';

const PLANS = [
  {
    id: 'discovery',
    name: 'Découverte',
    price: '19,99',
    trial: '7 jours d\'essai gratuit',
    color: COLORS.onSurfaceVariant,
    bgColor: COLORS.surfaceContainerLowest,
    borderColor: COLORS.outlineVariant,
    features: [
      '5 missions visibles / mois',
      '3 candidatures / mois',
      'Messagerie après acceptation',
      'Statistiques basiques',
      'Support par email',
    ],
    disabled: ['Badge vérifié', 'Position prioritaire'],
  },
  {
    id: 'professional',
    name: 'Professionnel',
    price: '39,99',
    trial: '14 jours d\'essai gratuit',
    color: COLORS.primary,
    bgColor: COLORS.primaryFixed,
    borderColor: COLORS.primary,
    badge: 'Populaire',
    features: [
      '20 missions visibles / mois',
      '15 candidatures / mois',
      'Messagerie illimitée',
      'Badge vérifié',
      'Position prioritaire (2ème)',
      'Statistiques détaillées',
      'Support email + chat',
    ],
    disabled: [],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '69,99',
    trial: '14 jours d\'essai gratuit',
    color: '#92400E',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
    badge: 'Top',
    features: [
      'Missions illimitées',
      'Candidatures illimitées',
      'Messagerie illimitée',
      'Badge vérifié',
      'Position en tête (1ère priorité)',
      'Stats détaillées + export',
      'Support prioritaire',
    ],
    disabled: [],
  },
];

const SubscriptionScreen = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSubscribe = async (planId) => {
    setLoadingPlan(planId);
    const result = await startCheckout(planId);
    if (result.success) {
      trackSubscriptionStarted(planId);
    } else {
      Alert.alert(
        'Erreur',
        result.error || 'Impossible d\'ouvrir la page de paiement. Réessayez.',
      );
    }
    setLoadingPlan(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="ribbon-outline" size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Choisissez votre plan</Text>
        <Text style={styles.headerSub}>
          Accédez aux missions et développez votre activité.{'\n'}
          Résiliez à tout moment, sans engagement.
        </Text>
      </View>

      {/* Plan cards */}
      {PLANS.map((plan) => (
        <View
          key={plan.id}
          style={[
            styles.card,
            SHADOWS.card,
            { backgroundColor: plan.bgColor, borderColor: plan.borderColor },
          ]}
        >
          {/* Badge populaire */}
          {plan.badge && (
            <View style={[styles.badge, { borderColor: plan.borderColor }]}>
              <Text style={[styles.badgeText, { color: plan.color }]}>
                {plan.badge}
              </Text>
            </View>
          )}

          {/* Nom et prix */}
          <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: plan.color }]}>{plan.price}€</Text>
            <Text style={[styles.priceSub, { color: plan.color }]}>/mois</Text>
          </View>
          <Text style={[styles.trial, { color: plan.color }]}>{plan.trial}</Text>

          {/* Features incluses */}
          <View style={styles.features}>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={15} color={plan.color} />
                <Text style={[styles.featureText, { color: plan.color }]}>{f}</Text>
              </View>
            ))}
            {plan.disabled.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="close-circle" size={15} color={COLORS.outlineVariant} />
                <Text style={styles.featureDisabledText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.btn, { borderColor: plan.color, backgroundColor: plan.color }]}
            onPress={() => handleSubscribe(plan.id)}
            disabled={!!loadingPlan}
            activeOpacity={0.85}
          >
            {loadingPlan === plan.id
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>Commencer l'essai</Text>
            }
          </TouchableOpacity>
        </View>
      ))}

      {/* Note de bas de page */}
      <View style={styles.noteRow}>
        <Ionicons name="lock-closed-outline" size={13} color={COLORS.onSurfaceVariant} />
        <Text style={styles.note}>
          Paiement sécurisé par Stripe. Vous serez débité uniquement après la période d'essai.
          Résiliation depuis votre profil à tout moment.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  headerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    marginBottom: 16,
    gap: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  planName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
  },
  priceSub: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  trial: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 8,
  },

  features: { gap: 6, marginBottom: 12 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  featureDisabledText: {
    fontSize: 13,
    color: COLORS.outlineVariant,
    flex: 1,
    textDecorationLine: 'line-through',
  },

  btn: {
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  note: {
    flex: 1,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
});

export default SubscriptionScreen;
