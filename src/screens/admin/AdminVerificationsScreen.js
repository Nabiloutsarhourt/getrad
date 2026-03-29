// Validation des prestataires — Admin GETRAD
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, Linking, RefreshControl,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { getAllVerifications, approveVerification, rejectVerification } from '../../services/adminService';

const STATUS_TABS = [
  { key: 'en_attente', label: 'En attente' },
  { key: 'accepte',    label: 'Acceptés'   },
  { key: 'rejete',     label: 'Rejetés'    },
];

const STATUS_COLORS = {
  en_attente: '#F59E0B',
  accepte:    COLORS.secondary,
  rejete:     COLORS.error,
};

const STATUS_LABELS = {
  en_attente: 'En attente',
  accepte:    'Validé',
  rejete:     'Rejeté',
};

const AdminVerificationsScreen = () => {
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('en_attente');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Rejet modal
  const [rejectModal, setRejectModal] = useState({ visible: false, uid: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const result = await getAllVerifications();
    if (result.success) setVerifications(result.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = verifications.filter(v => v.status === activeTab);

  const handleApprove = async (uid, fullName) => {
    Alert.alert(
      'Valider le dossier',
      `Confirmer la validation du compte de ${fullName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            setActionLoading(true);
            const result = await approveVerification(uid);
            setActionLoading(false);
            if (result.success) {
              setExpanded(null);
              load();
              Alert.alert('Compte validé', `${fullName} peut désormais accéder à la plateforme.`);
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (uid) => {
    setRejectReason('');
    setRejectComment('');
    setRejectModal({ visible: true, uid });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Motif requis', 'Veuillez indiquer un motif de rejet.');
      return;
    }
    setActionLoading(true);
    const result = await rejectVerification(rejectModal.uid, rejectReason.trim(), rejectComment.trim());
    setActionLoading(false);
    if (result.success) {
      setExpanded(null);
      setRejectModal({ visible: false, uid: null });
      load();
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const renderItem = ({ item }) => {
    const isExpanded = expanded === item.id;
    const color = STATUS_COLORS[item.status];
    const date = item.submittedAt?.toDate?.()?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) || '—';

    return (
      <View style={[styles.card, SHADOWS.subtle]}>
        {/* Header */}
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(isExpanded ? null : item.id)} activeOpacity={0.8}>
          <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
            <Text style={[styles.avatarText, { color }]}>
              {(item.fullName || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{item.fullName || '—'}</Text>
            <Text style={styles.cardSub}>SIRET: {item.siretNumber || '—'} · {date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[item.status]}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Expanded detail */}
        {isExpanded && (
          <View style={styles.cardDetail}>
            <DetailRow icon="call-outline"     label="Téléphone" value={item.phone} />
            <DetailRow icon="location-outline" label="Adresse"   value={item.address} />
            <DetailRow icon="business-outline" label="SIRET"     value={item.siretNumber} />

            {/* Documents */}
            <View style={styles.docsRow}>
              <DocBtn label="Kbis"     url={item.kbisURL}     icon="business-outline" />
              <DocBtn label="Identité" url={item.identiteURL} icon="card-outline" />
            </View>

            {/* Rejection info */}
            {item.status === 'rejete' && item.rejectionReason && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>Motif : {item.rejectionReason}</Text>
                {item.rejectionComment ? <Text style={styles.rejectionComment}>{item.rejectionComment}</Text> : null}
              </View>
            )}

            {/* Actions */}
            {item.status === 'en_attente' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.btnApprove}
                  onPress={() => handleApprove(item.id, item.fullName)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                  <Text style={styles.btnApproveText}>Valider</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnReject}
                  onPress={() => openRejectModal(item.id)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                  <Text style={styles.btnRejectText}>Rejeter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map(t => {
          const count = verifications.filter(v => v.status === t.key).length;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeTab === t.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === t.key && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={40} color={COLORS.outlineVariant} />
              <Text style={styles.emptyText}>Aucun dossier dans cette catégorie</Text>
            </View>
          }
        />
      )}

      {/* Modal rejet */}
      <Modal visible={rejectModal.visible} transparent animationType="slide" onRequestClose={() => setRejectModal({ visible: false, uid: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rejeter le dossier</Text>

            <Text style={styles.modalLabel}>Motif de rejet *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Documents illisibles, SIRET invalide..."
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholderTextColor={COLORS.onSurfaceVariant}
            />

            <Text style={styles.modalLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Indiquez les corrections à apporter..."
              value={rejectComment}
              onChangeText={setRejectComment}
              placeholderTextColor={COLORS.onSurfaceVariant}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectModal({ visible: false, uid: null })}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleReject} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Confirmer le rejet</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Sous-composants ────────────────────────────────────────────────────────

const DetailRow = ({ icon, label, value }) => (
  <View style={det.row}>
    <Ionicons name={icon} size={14} color={COLORS.onSurfaceVariant} />
    <Text style={det.label}>{label}</Text>
    <Text style={det.value}>{value || '—'}</Text>
  </View>
);

const DocBtn = ({ label, url, icon }) => (
  <TouchableOpacity
    style={[det.docBtn, !url && det.docBtnDisabled]}
    onPress={() => url && Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir le document'))}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={14} color={url ? COLORS.primary : COLORS.outlineVariant} />
    <Text style={[det.docLabel, !url && det.docLabelDisabled]}>{label}</Text>
    {url && <Ionicons name="open-outline" size={12} color={COLORS.primary} />}
  </TouchableOpacity>
);

const det = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  label: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '600', minWidth: 72 },
  value: { flex: 1, fontSize: 13, color: COLORS.onSurface },
  docsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  docBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
  },
  docBtnDisabled: { borderColor: COLORS.outlineVariant },
  docLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  docLabelDisabled: { color: COLORS.outlineVariant },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, paddingBottom: 32 },

  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  tabBadge: { backgroundColor: COLORS.outlineVariant, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: COLORS.primaryFixed },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant },
  tabBadgeTextActive: { color: COLORS.primary },

  card: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardDetail: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderTopColor: COLORS.outlineVariant },
  docsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },

  rejectionBox: {
    backgroundColor: COLORS.errorContainer, borderRadius: 10,
    padding: 12, marginTop: 12, gap: 4,
  },
  rejectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.error },
  rejectionComment: { fontSize: 13, color: COLORS.error, lineHeight: 18 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnApprove: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: COLORS.secondary, borderRadius: 28, paddingVertical: 13,
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnApproveText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  btnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 28, paddingVertical: 13, borderWidth: 1.5, borderColor: COLORS.error,
  },
  btnRejectText: { fontSize: 14, fontWeight: '700', color: COLORS.error },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.onSurfaceVariant },
  modalInput: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface,
  },
  modalTextArea: { minHeight: 80 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, paddingBottom: 8 },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 28, borderWidth: 1, borderColor: COLORS.outlineVariant },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.onSurfaceVariant },
  modalConfirm: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 28, backgroundColor: COLORS.error,
    shadowColor: COLORS.error, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});

export default AdminVerificationsScreen;
