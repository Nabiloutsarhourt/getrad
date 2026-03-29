// Demande de disponibilité — écran d'attente client (GETRAD)
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/constants';
import {
  subscribeAvailabilityRequest,
  cancelAvailabilityRequest,
} from '../../services/availabilityService';

const AVATAR_COLORS = [
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FFEDD5', text: '#9A3412' },
];
const getAvatarColor = (name) =>
  AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

const AvailabilityRequestScreen = ({ route, navigation }) => {
  const {
    requestId,
    interpreterName,
    interpreterPhoto,
    interpreterId,
  } = route.params;

  const [request, setRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const navigatedRef = useRef(false);

  // ── Listener temps réel ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeAvailabilityRequest(requestId, (req) => {
      setRequest(req);

      if (!req) return;

      if (req.status === 'accepted' && !navigatedRef.current) {
        navigatedRef.current = true;
        clearInterval(timerRef.current);
        // Bref délai pour que l'utilisateur voit le statut "accepté"
        setTimeout(() => {
          navigation.replace('Chat', {
            conversationId: req.conversationId,
            otherUserId: interpreterId,
            otherUserData: {
              displayName: interpreterName,
              photoURL: interpreterPhoto || null,
              role: 'interpreter',
            },
          });
        }, 1200);
      }

      if (['refused', 'expired', 'cancelled'].includes(req.status)) {
        clearInterval(timerRef.current);
      }
    });

    return () => {
      unsub();
      clearInterval(timerRef.current);
    };
  }, [requestId]);

  // ── Countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      pulse.stop();
      clearInterval(timerRef.current);
    };
  }, []);

  const handleCancel = () => {
    Alert.alert('Annuler la demande ?', 'La demande sera annulée.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          clearInterval(timerRef.current);
          await cancelAvailabilityRequest(requestId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleRetry = () => navigation.goBack();

  const status = request?.status;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft <= 30 ? COLORS.error : timeLeft <= 60 ? '#F59E0B' : COLORS.primary;

  const isAccepted = status === 'accepted';
  const isRefused = status === 'refused';
  const isExpired = status === 'expired' || (status === 'pending' && timeLeft === 0);
  const isPending = status === 'pending' && timeLeft > 0;

  const avatarColor = getAvatarColor(interpreterName);
  const initials = (interpreterName || 'I').charAt(0).toUpperCase();

  // ── Render état final ────────────────────────────────────────────────────
  if (isRefused || isExpired) {
    const iconName = isRefused ? 'close-circle' : 'time-outline';
    const title = isRefused ? 'Demande refusée' : 'Temps écoulé';
    const sub = isRefused
      ? "L'interprète n'est pas disponible pour l'instant."
      : "L'interprète n'a pas répondu à temps.";

    return (
      <View style={styles.container}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={[styles.resultIcon, { backgroundColor: COLORS.errorContainer }]}>
          <Ionicons name={iconName} size={44} color={COLORS.error} />
        </View>
        <Text style={[styles.statusTitle, { color: COLORS.error }]}>{title}</Text>
        <Text style={styles.statusSub}>{sub}</Text>
        <TouchableOpacity style={[styles.primaryBtn, SHADOWS.card]} onPress={handleRetry} activeOpacity={0.85}>
          <Ionicons name="search-outline" size={18} color={COLORS.white} />
          <Text style={styles.primaryBtnText}>Chercher un autre interprète</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isAccepted) {
    return (
      <View style={styles.container}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={[styles.resultIcon, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={44} color={COLORS.secondary} />
        </View>
        <Text style={[styles.statusTitle, { color: COLORS.secondary }]}>Disponibilité confirmée !</Text>
        <Text style={styles.statusSub}>Ouverture de la conversation...</Text>
        <ActivityIndicator color={COLORS.secondary} style={{ marginTop: 12 }} />
      </View>
    );
  }

  // ── Render en attente ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.heroDecor1} />
      <View style={styles.heroDecor2} />

      {/* Badge "EN ATTENTE" */}
      <View style={styles.waitingBadge}>
        <ActivityIndicator size="small" color={COLORS.white} />
        <Text style={styles.waitingBadgeText}>EN ATTENTE DE RÉPONSE</Text>
      </View>

      {/* Avatar interprète */}
      {interpreterPhoto ? (
        <Image source={{ uri: interpreterPhoto }} style={styles.photo} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
          <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
        </View>
      )}
      <Text style={styles.interpreterName}>{interpreterName}</Text>

      {/* Timer */}
      <Animated.View
        style={[styles.timerCircle, { borderColor: timerColor, transform: [{ scale: pulseAnim }] }]}
      >
        <Text style={[styles.timerText, { color: timerColor }]}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.timerLabel}>pour répondre</Text>
      </Animated.View>

      {/* Barre de progression */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${(timeLeft / 120) * 100}%`, backgroundColor: timerColor }]} />
      </View>

      {/* Info card */}
      <View style={[styles.infoCard, SHADOWS.subtle]}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>
          L'interprète a 2 minutes pour confirmer sa disponibilité.{'\n'}
          Si il/elle ne répond pas, essayez un autre profil.
        </Text>
      </View>

      {/* Annuler */}
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
        <Text style={styles.cancelText}>Annuler la demande</Text>
      </TouchableOpacity>
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
    gap: 20,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.primaryFixed, top: -80, right: -80,
  },
  heroDecor2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: COLORS.primaryFixed, bottom: -60, left: -60,
  },

  waitingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 30,
  },
  waitingBadgeText: {
    fontSize: 12, fontWeight: '800', color: COLORS.white, letterSpacing: 1.2,
  },

  photo: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 34, fontWeight: '800' },
  interpreterName: {
    fontSize: 20, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.3,
  },

  timerCircle: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4,
    ...SHADOWS.card,
  },
  timerText: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  timerLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', marginTop: 2 },

  progressBg: {
    height: 6, backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 3, overflow: 'hidden', alignSelf: 'stretch',
  },
  progressFill: { height: 6, borderRadius: 3 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primaryFixed,
    borderRadius: 16, padding: 16, alignSelf: 'stretch',
  },
  infoText: {
    flex: 1, fontSize: 13, color: COLORS.primary,
    lineHeight: 19, fontWeight: '500',
  },

  cancelBtn: { marginTop: 4 },
  cancelText: { fontSize: 13, color: COLORS.error, fontWeight: '600', textDecorationLine: 'underline' },

  // États finaux
  resultIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  statusTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  statusSub: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 28,
    paddingVertical: 16, paddingHorizontal: 28, alignSelf: 'stretch',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 5,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default AvailabilityRequestScreen;
