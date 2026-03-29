// Gestion de l'abonnement - GETRAD
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { openCustomerPortal, PLAN_LABELS, PLAN_COLORS } from '../../services/subscriptionService';

const ManageSubscriptionScreen = ({ navigation }) => {
  const { subscription } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleManageStripe = async () => {
    setLoading(true);
    const result = await openCustomerPortal();
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Impossible d\'ouvrir le portail.');
    }
    setLoading(false);
  };

  if (!subscription) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="ribbon-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyText}>Aucun abonnement actif.</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.btnText}>Voir les abonnements</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const planLabel = PLAN_LABELS[subscription.plan] || subscription.plan;
  const planColor = PLAN_COLORS[subscription.plan] || COLORS.primary;
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const periodEnd = subscription.currentPeriodEnd?.toDate().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const trialEnd = subscription.trialEnd?.toDate().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const missionsUsed = subscription.missionsViewed || 0;
  const missionsMax = subscription.missionsLimit === -1 ? '∞' : subscription.missionsLimit;
  const missionsProgress = subscription.missionsLimit === -1
    ? 1
    : Math.min(missionsUsed / (subscription.missionsLimit || 1), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status card */}
      <View style={[styles.statusCard, SHADOWS.card, { borderColor: planColor }]}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={styles.statusTop}>
          <View>
            <Text style={styles.statusPlanLabel}>Plan actuel</Text>
            <Text style={[styles.statusPlan, { color: planColor }]}>{planLabel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.statusBadgeText, { color: isActive ? '#166534' : '#991b1b' }]}>
              {subscription.status === 'trialing' ? 'Essai gratuit' :
               subscription.status === 'active' ? 'Actif' :
               subscription.status === 'past_due' ? 'Paiement échoué' :
               subscription.status === 'canceled' ? 'Résilié' : subscription.status}
            </Text>
          </View>
        </View>

        {subscription.status === 'trialing' && trialEnd && (
          <View style={styles.infoLine}>
            <Ionicons name="sparkles-outline" size={13} color={COLORS.onSurfaceVariant} />
            <Text style={styles.infoLineText}>Essai gratuit jusqu'au {trialEnd}</Text>
          </View>
        )}
        {periodEnd && (
          <View style={styles.infoLine}>
            <Ionicons
              name={subscription.cancelAtPeriodEnd ? 'alert-circle-outline' : 'refresh-outline'}
              size={13}
              color={COLORS.onSurfaceVariant}
            />
            <Text style={styles.infoLineText}>
              {subscription.cancelAtPeriodEnd
                ? `Résiliation le ${periodEnd}`
                : `Renouvellement le ${periodEnd}`}
            </Text>
          </View>
        )}
      </View>

      {/* Consommation du mois */}
      <View style={[styles.card, SHADOWS.subtle]}>
        <Text style={styles.cardTitle}>Utilisation ce mois-ci</Text>

        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Missions vues</Text>
          <Text style={[styles.usageValue, { color: planColor }]}>
            {missionsUsed} / {missionsMax}
          </Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${missionsProgress * 100}%`, backgroundColor: planColor }]} />
        </View>

        <View style={[styles.usageRow, { marginTop: 12 }]}>
          <Text style={styles.usageLabel}>Candidatures envoyées</Text>
          <Text style={[styles.usageValue, { color: planColor }]}>
            {subscription.candidaturesSent || 0} / {subscription.candidaturesLimit === -1 ? '∞' : subscription.candidaturesLimit}
          </Text>
        </View>
      </View>

      {/* Bouton gérer via Stripe */}
      <TouchableOpacity
        style={[styles.btn, SHADOWS.card]}
        onPress={handleManageStripe}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} />
          : (
            <>
              <Text style={styles.btnText}>Gérer via Stripe</Text>
              <Text style={styles.btnSub}>Changer de plan · Mettre à jour le paiement · Résilier</Text>
            </>
          )}
      </TouchableOpacity>

      <Text style={styles.note}>
        Vous serez redirigé vers le portail sécurisé de Stripe pour gérer votre abonnement.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, color: COLORS.onSurfaceVariant },

  statusCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 8,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primaryFixed, top: -60, right: -50 },
  heroDecor2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryFixed, bottom: -30, left: -20 },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPlanLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPlan: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLineText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    flex: 1,
  },

  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBg: {
    height: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  btnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ManageSubscriptionScreen;
