// Suivi en temps réel d'une mission - GETRAD
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import {
  subscribeMission, cancelMission,
  MISSION_STATUS_LABELS, MISSION_STATUS_COLORS,
} from '../../services/missionService';

const MissionTrackingScreen = ({ route, navigation }) => {
  const { missionId } = route.params;
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = subscribeMission(missionId, (m) => {
      setMission(m);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [missionId]);

  useEffect(() => {
    if (!mission || !['searching', 'offered'].includes(mission.status)) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [mission?.status]);

  const handleCancel = async () => {
    await cancelMission(missionId);
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!mission) return null;

  const statusColor = MISSION_STATUS_COLORS[mission.status] || COLORS.onSurfaceVariant;
  const statusLabel = MISSION_STATUS_LABELS[mission.status] || mission.status;
  const isSearching = ['searching', 'offered'].includes(mission.status);
  const isAccepted = mission.status === 'accepted';
  const isFailed = ['no_match', 'expired', 'cancelled'].includes(mission.status);

  const statusIconName = isAccepted ? 'checkmark-circle' : isFailed ? 'close-circle' : 'search';

  return (
    <View style={styles.container}>

      {/* Hero avec icône animée */}
      <View style={styles.heroSection}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulse }], backgroundColor: statusColor + '33' }]}>
          <Ionicons name={statusIconName} size={44} color={statusColor} />
        </Animated.View>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>


      {/* Étapes de progression */}
      <View style={[styles.stepsCard, SHADOWS.subtle]}>
        <Step
          done={true}
          active={false}
          label="Mission publiée"
          sub="Votre demande a bien été enregistrée"
        />
        <Step
          done={!['searching'].includes(mission.status)}
          active={mission.status === 'offered'}
          label="Prestataire contacté"
          sub={mission.status === 'offered'
            ? 'En attente de réponse (2 min max)...'
            : mission.status === 'searching'
            ? 'Recherche en cours...'
            : 'Un prestataire a été trouvé'}
        />
        <Step
          done={isAccepted}
          active={false}
          label="Mission acceptée"
          sub={isAccepted
            ? 'Vos coordonnées ont été partagées'
            : isFailed
            ? 'Aucun prestataire disponible'
            : 'En attente d\'acceptation'}
          last
        />
      </View>

      {/* Détails de la mission */}
      <View style={[styles.detailCard, SHADOWS.subtle]}>
        <DetailRow iconName="briefcase-outline" label="Service" value={mission.service?.replace(/_/g, ' ')} />
        <DetailRow iconName="language-outline" label="Langues" value={`${mission.languageFrom} → ${mission.languageTo}`} />
        <DetailRow iconName="calendar-outline" label="Date" value={mission.date} />
        <DetailRow iconName="location-outline" label="Lieu" value={mission.location} />
      </View>

      {/* Actions */}
      {isAccepted && (
        <TouchableOpacity
          style={[styles.primaryBtn, SHADOWS.card]}
          onPress={() => navigation.navigate('MessagesTab')}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.white} />
          <Text style={styles.primaryBtnText}>Ouvrir la conversation</Text>
        </TouchableOpacity>
      )}

      {isFailed && (
        <>
          <Text style={styles.failText}>
            {mission.status === 'no_match'
              ? 'Aucun prestataire n\'a répondu automatiquement. Voici des profils correspondants à votre mission.'
              : 'Cette mission a expiré.'}
          </Text>
          {mission.status === 'no_match' ? (
            <TouchableOpacity
              style={[styles.primaryBtn, SHADOWS.card]}
              onPress={() => navigation.navigate('SuggestedProfiles', { mission })}
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Voir les prestataires suggérés</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, SHADOWS.card]}
              onPress={() => navigation.navigate('InterpretersListTab')}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Chercher un prestataire directement</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {isSearching && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Annuler la mission</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Step = ({ done, active, label, sub, last }) => (
  <View style={stepStyles.row}>
    <View style={stepStyles.leftCol}>
      <View style={[
        stepStyles.dot,
        done && stepStyles.dotDone,
        active && stepStyles.dotActive,
      ]}>
        {done && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
        {active && <ActivityIndicator size={12} color={COLORS.white} />}
      </View>
      {!last && <View style={stepStyles.line} />}
    </View>
    <View style={stepStyles.content}>
      <Text style={[stepStyles.label, done && stepStyles.labelDone]}>{label}</Text>
      <Text style={stepStyles.sub}>{sub}</Text>
    </View>
  </View>
);

const DetailRow = ({ iconName, label, value }) => (
  <View style={detailStyles.row}>
    <Ionicons name={iconName} size={15} color={COLORS.onSurfaceVariant} style={detailStyles.icon} />
    <Text style={detailStyles.label}>{label}</Text>
    <Text style={detailStyles.value}>{value || '—'}</Text>
  </View>
);

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  leftCol: { alignItems: 'center', width: 24 },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.outlineVariant,
  },
  dotDone: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  dotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  line: { width: 2, flex: 1, backgroundColor: COLORS.outlineVariant, marginVertical: 3 },
  content: { flex: 1, paddingBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.onSurfaceVariant },
  labelDone: { color: COLORS.onSurface },
  sub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2, lineHeight: 17 },
});

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  icon: { width: 22 },
  label: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '500', flex: 1 },
  value: { fontSize: 13, color: COLORS.onSurface, fontWeight: '600', flex: 2 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.primaryFixed, top: -60, right: -50 },
  heroDecor2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primaryFixed, bottom: -40, left: -30 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  stepsCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignSelf: 'stretch',
  },
  detailCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    alignSelf: 'stretch',
    gap: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  failText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelBtn: { marginTop: 8 },
  cancelText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default MissionTrackingScreen;
