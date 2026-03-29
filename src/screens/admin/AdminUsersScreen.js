// Gestion des utilisateurs & RH — Admin GETRAD
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Alert, Linking,
  RefreshControl, ScrollView,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { getAllUsers, suspendUser } from '../../services/adminService';

const ROLE_TABS = [
  { key: 'all',         label: 'Tous'         },
  { key: 'client',      label: 'Clients'      },
  { key: 'interpreter', label: 'Prestataires'  },
];

const VERIF_COLORS = {
  accepte:    COLORS.secondary,
  en_attente: '#F59E0B',
  rejete:     COLORS.error,
};
const VERIF_LABELS = { accepte: 'Validé', en_attente: 'En attente', rejete: 'Rejeté' };

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('all');
  const [selected, setSelected] = useState(null); // user detail modal

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const result = await getAllUsers();
    if (result.success) setUsers(result.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleTab !== 'all') list = list.filter(u => u.role === roleTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleTab, search]);

  const handleSuspend = (user) => {
    const isSuspended = user.suspended;
    Alert.alert(
      isSuspended ? 'Réactiver le compte' : 'Suspendre le compte',
      `${isSuspended ? 'Réactiver' : 'Suspendre'} le compte de ${user.displayName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isSuspended ? 'Réactiver' : 'Suspendre',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            const result = await suspendUser(user.id, !isSuspended);
            if (result.success) { load(); setSelected(null); }
            else Alert.alert('Erreur', result.error);
          },
        },
      ]
    );
  };

  const renderUser = ({ item }) => {
    const verif = item.interpreterProfile?.verificationStatus;
    const joined = item.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) || '—';
    const initial = (item.displayName || item.email || '?')[0].toUpperCase();

    return (
      <TouchableOpacity style={[styles.card, SHADOWS.subtle]} onPress={() => setSelected(item)} activeOpacity={0.8}>
        <View style={[styles.userAvatar, { backgroundColor: item.role === 'interpreter' ? COLORS.primaryFixed : COLORS.surfaceContainerHigh }]}>
          <Text style={styles.userInitial}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{item.displayName || '—'}</Text>
            {item.suspended && <View style={styles.suspendedBadge}><Text style={styles.suspendedText}>Suspendu</Text></View>}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.userMeta}>{item.city || '—'} · {joined}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <RoleBadge role={item.role} />
          {verif && (
            <View style={[styles.verifBadge, { backgroundColor: VERIF_COLORS[verif] + '18' }]}>
              <Text style={[styles.verifText, { color: VERIF_COLORS[verif] }]}>{VERIF_LABELS[verif]}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, email, ville..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.onSurfaceVariant}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Role tabs */}
      <View style={styles.tabBar}>
        {ROLE_TABS.map(t => {
          const count = users.filter(u => t.key === 'all' ? true : u.role === t.key).length;
          return (
            <TouchableOpacity key={t.key} style={[styles.tab, roleTab === t.key && styles.tabActive]} onPress={() => setRoleTab(t.key)}>
              <Text style={[styles.tabText, roleTab === t.key && styles.tabTextActive]}>{t.label}</Text>
              <Text style={[styles.tabCount, roleTab === t.key && styles.tabCountActive]}>{count}</Text>
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
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={COLORS.outlineVariant} />
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            </View>
          }
        />
      )}

      {/* Fiche utilisateur / RH */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selected && <UserDetailSheet user={selected} onClose={() => setSelected(null)} onSuspend={() => handleSuspend(selected)} />}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Fiche détail utilisateur (RH) ─────────────────────────────────────────

const UserDetailSheet = ({ user, onClose, onSuspend }) => {
  const ip = user.interpreterProfile;
  const verif = ip?.verificationStatus;
  const joined = user.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) || '—';

  return (
    <View style={sheet.container}>
      {/* Handle */}
      <View style={sheet.handle} />

      {/* Header */}
      <View style={sheet.header}>
        <View style={sheet.avatar}>
          <Text style={sheet.avatarText}>{(user.displayName || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sheet.name}>{user.displayName || '—'}</Text>
          <Text style={sheet.email}>{user.email}</Text>
          <View style={sheet.badgeRow}>
            <RoleBadge role={user.role} />
            {user.suspended && <View style={[sheet.tag, { backgroundColor: COLORS.errorContainer }]}><Text style={[sheet.tagText, { color: COLORS.error }]}>Suspendu</Text></View>}
          </View>
        </View>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.onSurfaceVariant} /></TouchableOpacity>
      </View>

      {/* Informations */}
      <View style={sheet.section}>
        <Text style={sheet.sectionTitle}>Informations</Text>
        <InfoRow icon="location-outline" label="Ville" value={user.city} />
        <InfoRow icon="call-outline" label="Téléphone" value={user.phone} />
        <InfoRow icon="calendar-outline" label="Membre depuis" value={joined} />
      </View>

      {/* Profil interprète */}
      {user.role === 'interpreter' && ip && (
        <>
          <View style={sheet.section}>
            <Text style={sheet.sectionTitle}>Profil prestataire</Text>
            <InfoRow icon="shield-checkmark-outline" label="Vérification" value={VERIF_LABELS[verif] || 'Non soumis'} valueColor={VERIF_COLORS[verif]} />
            <InfoRow icon="star-outline" label="Note" value={ip.rating ? `${ip.rating.toFixed(1)} / 5 (${ip.reviewCount} avis)` : '—'} />
            <InfoRow icon="cash-outline" label="Tarif horaire" value={ip.hourlyRate ? `${ip.hourlyRate} €/h` : '—'} />
            <InfoRow icon="document-text-outline" label="SIRET" value={ip.siretNumber || '—'} />
            {ip.assermente && <InfoRow icon="scale-outline" label="Statut" value="Assermenté" valueColor={COLORS.secondary} />}
          </View>

          {/* Langues */}
          {ip.languages?.length > 0 && (
            <View style={sheet.section}>
              <Text style={sheet.sectionTitle}>Langues</Text>
              {ip.languages.map((l, i) => (
                <View key={i} style={sheet.langRow}>
                  <Text style={sheet.langText}>{l.source} → {l.target}</Text>
                  <View style={sheet.levelPill}><Text style={sheet.levelText}>{l.level}</Text></View>
                </View>
              ))}
            </View>
          )}

          {/* Documents */}
          {(ip.cvURL || ip.kbisURL || ip.identiteURL) && (
            <View style={sheet.section}>
              <Text style={sheet.sectionTitle}>Documents</Text>
              <View style={sheet.docsRow}>
                {ip.cvURL && <SheetDocBtn label="CV" url={ip.cvURL} icon="document-text-outline" />}
                {ip.kbisURL && <SheetDocBtn label="Kbis" url={ip.kbisURL} icon="business-outline" />}
                {ip.identiteURL && <SheetDocBtn label="Identité" url={ip.identiteURL} icon="card-outline" />}
              </View>
            </View>
          )}
        </>
      )}

      {/* Actions */}
      <TouchableOpacity
        style={[sheet.actionBtn, { backgroundColor: user.suspended ? COLORS.secondary : COLORS.error }]}
        onPress={onSuspend}
      >
        <Ionicons name={user.suspended ? 'checkmark-circle-outline' : 'ban-outline'} size={18} color={COLORS.white} />
        <Text style={sheet.actionText}>{user.suspended ? 'Réactiver le compte' : 'Suspendre le compte'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const InfoRow = ({ icon, label, value, valueColor }) => (
  <View style={info.row}>
    <Ionicons name={icon} size={14} color={COLORS.onSurfaceVariant} />
    <Text style={info.label}>{label}</Text>
    <Text style={[info.value, valueColor && { color: valueColor, fontWeight: '700' }]}>{value || '—'}</Text>
  </View>
);

const SheetDocBtn = ({ label, url, icon }) => (
  <TouchableOpacity
    style={sheet.docBtn}
    onPress={() => Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir le document'))}
  >
    <Ionicons name={icon} size={14} color={COLORS.primary} />
    <Text style={sheet.docLabel}>{label}</Text>
    <Ionicons name="open-outline" size={12} color={COLORS.primary} />
  </TouchableOpacity>
);

const RoleBadge = ({ role }) => {
  const cfg = {
    client:      { label: 'Client',      color: '#6366F1' },
    interpreter: { label: 'Prestataire',  color: COLORS.primary },
    admin:       { label: 'Admin',       color: COLORS.error },
  }[role] || { label: role, color: COLORS.onSurfaceVariant };
  return (
    <View style={[rb.badge, { backgroundColor: cfg.color + '18' }]}>
      <Text style={[rb.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const rb = StyleSheet.create({
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 10, fontWeight: '700' },
});

const info = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  label: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '600', minWidth: 80 },
  value: { flex: 1, fontSize: 13, color: COLORS.onSurface },
});

const sheet = StyleSheet.create({
  container: { gap: 0 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.outlineVariant, alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.onSurface },
  email: { fontSize: 12, color: COLORS.onSurfaceVariant, marginVertical: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.onSurface, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  langText: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface },
  levelPill: { backgroundColor: COLORS.primaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  docsRow: { flexDirection: 'row', gap: 8 },
  docBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
  },
  docLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 28, paddingVertical: 15, marginTop: 8,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  actionText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, paddingBottom: 32 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    margin: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.onSurface },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerLowest },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  tabCount: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  tabCountActive: { color: COLORS.primary },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14, padding: 14, marginBottom: 8 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, maxWidth: 140 },
  userEmail: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 1 },
  userMeta: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 1 },

  suspendedBadge: { backgroundColor: COLORS.errorContainer, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  suspendedText: { fontSize: 9, fontWeight: '700', color: COLORS.error },

  verifBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  verifText: { fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
});

export default AdminUsersScreen;
