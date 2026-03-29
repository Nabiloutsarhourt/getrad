// Écran de chat pour GETRAD — MD3
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { getDoc, doc } from 'firebase/firestore';
import { COLORS, SHADOWS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation,
} from '../../services/messageService';
import { db } from '../../config/firebase';

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

const ChatScreen = ({ route }) => {
  const { conversationId, otherUserId, otherUserData } = route.params;
  const { user, userData } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [contactInfo, setContactInfo] = useState(null);
  const [contactRevealed, setContactRevealed] = useState(false);
  const flatListRef = useRef(null);

  // Nom de l'autre participant
  const otherName =
    otherUserData?.displayName ||
    otherUserData?.firstName + ' ' + (otherUserData?.lastName || '') ||
    'Interlocuteur';
  const otherInitial = (otherName?.[0] || '?').toUpperCase();
  const otherAvatarColor = getAvatarColor(otherName);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;

    const unsubscribe = subscribeToMessages(activeConversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    markMessagesAsRead(activeConversationId, user.uid);

    // Vérifier si le contact est révélé
    loadConversationMeta(activeConversationId);

    return () => unsubscribe();
  }, [activeConversationId]);

  const initializeChat = async () => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    } else if (otherUserId && otherUserData) {
      const result = await getOrCreateConversation(
        user.uid,
        otherUserId,
        userData,
        otherUserData,
      );
      if (result.success) {
        setActiveConversationId(result.conversation.id);
      }
    }
  };

  const loadConversationMeta = async (convId) => {
    try {
      const convDoc = await getDoc(doc(db, 'conversations', convId));
      if (convDoc.exists() && convDoc.data().contactRevealed) {
        setContactRevealed(true);
        // Charger les infos de contact de l'autre utilisateur
        const uid = otherUserId || convDoc.data().participants?.find(p => p !== user.uid);
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            setContactInfo(userDoc.data());
          }
        }
      }
    } catch (_) {}
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending || !activeConversationId) return;
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    await sendMessage(activeConversationId, user.uid, messageText);
    setSending(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const shouldShowDate = (current, previous) => {
    if (!previous) return true;
    return current.timestamp?.toDate().toDateString() !== previous.timestamp?.toDate().toDateString();
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user.uid;
    const isSystem = item.type === 'system';
    const previous = index > 0 ? messages[index - 1] : null;
    const showDate = shouldShowDate(item, previous);

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateSeparatorText}>{formatDate(item.timestamp)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}

        {isSystem ? (
          <View style={styles.systemMessageWrapper}>
            <Text style={styles.systemMessageText}>{item.text}</Text>
          </View>
        ) : (
          <View style={[styles.messageRow, isMyMessage ? styles.messageRowRight : styles.messageRowLeft]}>
            {/* Avatar de l'autre participant */}
            {!isMyMessage && (
              <View style={[styles.avatar, { backgroundColor: otherAvatarColor.bg }]}>
                <Text style={[styles.avatarText, { color: otherAvatarColor.text }]}>{otherInitial}</Text>
              </View>
            )}

            <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
              <Text style={[styles.messageText, isMyMessage ? styles.myText : styles.otherText]}>
                {item.text}
              </Text>
              <Text style={[styles.messageTime, isMyMessage ? styles.myTime : styles.otherTime]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
      </>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="chatbubble-ellipses-outline" size={32} color={COLORS.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>Démarrez la conversation</Text>
      <Text style={styles.emptyText}>Présentez-vous et décrivez vos besoins</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Bannière contact révélé */}
      {contactRevealed && contactInfo && (
        <View style={styles.contactBanner}>
          <View style={styles.contactBannerTitleRow}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} />
            <Text style={styles.contactBannerTitle}>Contact révélé</Text>
          </View>
          <View style={styles.contactChips}>
            {contactInfo.phone ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={() => Linking.openURL(`tel:${contactInfo.phone}`)}
              >
                <Ionicons name="call-outline" size={13} color={COLORS.onSurface} />
                <Text style={styles.contactChipText}>{contactInfo.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {contactInfo.email ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={() => Linking.openURL(`mailto:${contactInfo.email}`)}
              >
                <Ionicons name="mail-outline" size={13} color={COLORS.onSurface} />
                <Text style={styles.contactChipText}>{contactInfo.email}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        style={{ flex: 1 }}
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Barre de saisie */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={COLORS.onSurfaceVariant}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.onPrimary} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={COLORS.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },

  // Contact banner
  contactBanner: {
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    gap: 8,
  },
  contactBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  contactChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...SHADOWS.subtle,
  },
  contactChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  // Messages list
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  // System message
  systemMessageWrapper: {
    alignItems: 'center',
    marginVertical: 6,
  },
  systemMessageText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Message rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },

  // Avatar
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Bubbles
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomLeftRadius: 4,
    ...SHADOWS.card,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 3,
  },
  myText: {
    color: COLORS.onPrimary,
  },
  otherText: {
    color: COLORS.onSurface,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  myTime: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
  otherTime: {
    color: COLORS.onSurfaceVariant,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 15,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceContainerHighest,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatScreen;
