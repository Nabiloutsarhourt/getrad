// Écran d'attente de validation du dossier — GETRAD (interprète)
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';

const VerificationStatusScreen = () => (
  <View style={styles.container}>
    <View style={styles.heroDecor1} />
    <View style={styles.heroDecor2} />
    <View style={styles.iconBox}>
      <Ionicons name="hourglass-outline" size={44} color={COLORS.primary} />
    </View>

    <Text style={styles.title}>Dossier en cours d'examen</Text>

    <Text style={styles.sub}>
      Notre équipe vérifie votre dossier de vérification.{'\n'}
      Vous recevrez une notification dès validation.
    </Text>

    <View style={[styles.stepList, SHADOWS.subtle]}>
      <StepRow
        icon="checkmark-circle"
        color={COLORS.secondary}
        label="Dossier soumis"
        done
      />
      <StepRow
        icon="search-outline"
        color={COLORS.primary}
        label="Vérification en cours — délai habituel 48 h ouvrées"
        active
      />
      <StepRow
        icon="rocket-outline"
        color={COLORS.onSurfaceVariant}
        label="Accès complet à la plateforme"
      />
    </View>

    <ActivityIndicator color={COLORS.primary} size="small" style={{ marginTop: 8 }} />
  </View>
);

const StepRow = ({ icon, color, label, done, active }) => (
  <View style={sStep.row}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[sStep.label, done && sStep.done, active && sStep.active]}>
      {label}
    </Text>
  </View>
);

const sStep = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  label: { flex: 1, fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 20 },
  done: { color: COLORS.secondary, fontWeight: '600' },
  active: { color: COLORS.onSurface, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
    overflow: 'hidden',
  },
  heroDecor1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.primaryFixed, top: -70, right: -70 },
  heroDecor2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.primaryFixed, bottom: -50, left: -40 },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 3,
    borderColor: COLORS.primary + '33',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
});

export default VerificationStatusScreen;
