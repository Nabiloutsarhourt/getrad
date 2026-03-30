// Écran d'offre entrante pour l'interprète - GETRAD
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import { respondToOffer } from '../../services/missionService';
import { trackOfferAccepted, trackOfferRefused } from '../../services/analyticsService';

const Detail = ({ iconName, label }) => (
  <View style={detailStyles.row}>
    <Ionicons name={iconName} size={15} color={COLORS.onSurfaceVariant} style={detailStyles.icon} />
    <Text style={detailStyles.label}>{label}</Text>
  </View>
);

const IncomingOfferScreen = ({ route, navigation }) => {
  const { mission } = route.params;
  const [responding, setResponding] = useState(null);

  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (mission.offerExpiresAt) {
      const expiresAt = mission.offerExpiresAt.toDate?.() || new Date(mission.offerExpiresAt);
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: remaining * 1000,
        useNativeDriver: false,
      }).start();
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          navigation.navigate('Home');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(timerRef.current);
      pulse.stop();
    };
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft <= 30 ? COLORS.error : timeLeft <= 60 ? '#F59E0B' : COLORS.primary;

  const handleRespond = async (response) => {
    setResponding(response);
    const result = await respondToOffer(mission.id, response);
    if (result.success) {
      if (response === 'accepted') {
        trackOfferAccepted(mission.id);
        Alert.alert(
          'Mission acceptée',
          'La conversation avec le client a été ouverte. Vos coordonnées ont été partagées.',
          [{ text: 'Voir la conversation', onPress: () => navigation.navigate('MessagesTab') }]
        );
      } else {
        trackOfferRefused(mission.id);
        navigation.navigate('Home');
      }
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de répondre.');
      setResponding(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroDecor1} />
      <View style={styles.heroDecor2} />
      {/* Badge NOUVEAU */}
      <View style={styles.newBadge}>
        <Ionicons name="notifications" size={14} color={COLORS.white} />
        <Text style={styles.newBadgeText}>NOUVELLE MISSION</Text>
      </View>

      {/* Timer cercle animé */}
      <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[styles.timerText, { color: timerColor }]}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.timerLabel}>pour répondre</Text>
      </Animated.View>

      {/* Barre de progression */}
      <View style={styles.progressBg}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: timerColor,
            },
          ]}
        />
      </View>

      {/* Détails de la mission */}
      <View style={[styles.missionCard, SHADOWS.card]}>
        <Text style={styles.missionTitle}>
          {mission.service?.replace(/_/g, ' ') || 'Mission'}
        </Text>

        <View style={styles.detailsGrid}>
          <Detail iconName="language-outline" label={`${mission.languageFrom} → ${mission.languageTo}`} />
          <Detail iconName="calendar-outline" label={mission.date || '—'} />
          <Detail iconName="location-outline" label={mission.location || '—'} />
          {mission.startTime && mission.endTime && (
            <Detail iconName="time-outline" label={`${mission.startTime} – ${mission.endTime}`} />
          )}
          {mission.budget && (
            <Detail iconName="cash-outline" label={`Budget : ${mission.budget}€`} />
          )}
        </View>

        {mission.description ? (
          <Text style={styles.description} numberOfLines={3}>
            "{mission.description}"
          </Text>
        ) : null}
      </View>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.refuseBtn, responding === 'refused' && styles.btnLoading]}
          onPress={() => handleRespond('refused')}
          disabled={!!responding}
          activeOpacity={0.8}
        >
          {responding === 'refused' ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="close" size={18} color={COLORS.error} />
              <Text style={styles.refuseText}>Refuser</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, SHADOWS.card, responding === 'accepted' && styles.btnLoading]}
          onPress={() => handleRespond('accepted')}
          disabled={!!responding}
          activeOpacity={0.85}
        >
          {responding === 'accepted' ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <View style={styles.btnContent}>
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                <Text style={styles.acceptText}>Accepter</Text>
              </View>
              <Text style={styles.acceptSub}>Vos coordonnées seront partagées</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 20 },
  label: { fontSize: 13, color: COLORS.onSurface, fontWeight: '500', flex: 1 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    padding: 24,
    gap: 20,
    paddingTop: 40,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: COLORS.primaryFixed, top: -80, right: -80 },
  heroDecor2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primaryFixed, bottom: -60, left: -40 },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  newBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  timerCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: COLORS.primary,
  },
  timerText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timerLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  progressBg: {
    height: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  missionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignSelf: 'stretch',
    gap: 12,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    textTransform: 'capitalize',
    letterSpacing: -0.3,
  },
  detailsGrid: { gap: 8 },
  description: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refuseBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  refuseText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    gap: 3,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  acceptText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
  },
  acceptSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  btnLoading: { opacity: 0.6 },
});

export default IncomingOfferScreen;
