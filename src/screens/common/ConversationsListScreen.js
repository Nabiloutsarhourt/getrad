// Messagerie - Liste des conversations - GETRAD
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToConversations } from '../../services/messageService';

const AVATAR_COLORS = [
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FFEDD5', text: '#9A3412' },
];
const getAvatarColor = (name) => AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];

const ConversationsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToConversations(user.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getOtherUser = (conv) => {
    const otherId = conv.participants.find(id => id !== user.uid);
    return conv.participantsData?.[otherId] || {};
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }) => {
    const other = getOtherUser(item);
    const unread = item.unreadCount?.[user.uid] || 0;
    const initial = (other.displayName?.[0] || '?').toUpperCase();
    const avColor = getAvatarColor(other.displayName || '?');

    return (
      <TouchableOpacity
        style={[styles.row, unread > 0 && styles.rowUnread]}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          otherUserData: getOtherUser(item),
        })}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: avColor.bg }]}>
            <Text style={[styles.avatarText, { color: avColor.text }]}>{initial}</Text>
          </View>
          {unread > 0 && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadDotText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, unread > 0 && styles.nameBold]} numberOfLines={1}>
              {other.displayName || 'Utilisateur'}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <Text
            style={[styles.preview, unread > 0 && styles.previewBold]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Nouvelle conversation'}
          </Text>
        </View>

        {/* Indicator */}
        {unread > 0 && <View style={styles.unreadBar} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="chatbubble-ellipses-outline" size={32} color={COLORS.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptyText}>
        Vos échanges avec les prestataires apparaîtront ici.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <Text style={styles.heroTitle}>Messages</Text>
        <Text style={styles.heroSub}>{conversations.length > 0 ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}` : 'Aucune conversation'}</Text>
      </View>

      {/* Search hint */}
      <View style={styles.searchHint}>
        <Ionicons name="search-outline" size={16} color={COLORS.onSurfaceVariant} />
        <Text style={styles.searchHintText}>Rechercher une conversation...</Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={conversations.length === 0 && styles.emptyContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
    overflow: 'hidden',
    gap: 4,
  },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroDecor2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -20 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },

  // Search hint
  searchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchHintText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    gap: 14,
  },
  rowUnread: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginLeft: 88,
  },

  // Avatar
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  unreadDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Content
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
  },
  nameBold: {
    fontWeight: '800',
  },
  time: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginLeft: 8,
  },
  preview: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  previewBold: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },

  // Unread bar
  unreadBar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // Empty
  emptyContainer: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConversationsListScreen;
