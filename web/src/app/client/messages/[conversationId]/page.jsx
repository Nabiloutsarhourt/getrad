'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '../../../../services/messageService';
import Avatar from '../../../../components/ui/Avatar';
import Spinner from '../../../../components/ui/Spinner';

export default function ClientChatPage() {
  const { conversationId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const convDoc = await getDoc(doc(db, 'conversations', conversationId));
        if (convDoc.exists() && user) {
          const data = convDoc.data();
          const otherId = data.participants?.find(p => p !== user.uid);
          if (otherId) setOtherUser(data.participantsData?.[otherId] || { displayName: 'Interlocuteur' });
        }
      } catch {}
    };
    loadMeta();
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    if (user) markMessagesAsRead(conversationId, user.uid);
    return () => unsub();
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!input.trim() || sending || !user) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await sendMessage(conversationId, user.uid, text);
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDay = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const shouldShowDay = (msg, prev) => {
    if (!prev) return true;
    const a = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp || 0);
    const b = prev.timestamp?.toDate ? prev.timestamp.toDate() : new Date(prev.timestamp || 0);
    return a.toDateString() !== b.toDateString();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      {/* Header */}
      <div className="bg-white border-b border-[#e7e8e9] rounded-t-2xl px-4 py-3 flex items-center gap-3 shadow-card">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[#f3f4f5] text-[#434655]">
          <ArrowLeft size={18} />
        </button>
        <Avatar name={otherUser?.displayName || '?'} photoURL={otherUser?.photoURL} size="sm" />
        <div>
          <p className="text-sm font-semibold text-[#191c1d]">{otherUser?.displayName || 'Interlocuteur'}</p>
          <p className="text-xs text-[#737686] capitalize">{otherUser?.role || ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center pt-8"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#737686]">Démarrez la conversation...</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user?.uid;
            const isSystem = msg.type === 'system';
            const prev = i > 0 ? messages[i - 1] : null;
            const showDay = shouldShowDay(msg, prev);

            return (
              <div key={msg.id}>
                {showDay && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#e7e8e9]" />
                    <span className="text-xs text-[#737686] font-medium">{formatDay(msg.timestamp)}</span>
                    <div className="flex-1 h-px bg-[#e7e8e9]" />
                  </div>
                )}
                {isSystem ? (
                  <div className="flex justify-center my-2">
                    <span className="text-xs bg-[#e7e8e9] text-[#434655] px-3 py-1 rounded-full">{msg.text}</span>
                  </div>
                ) : (
                  <div className={`flex items-end gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <Avatar name={otherUser?.displayName || '?'} photoURL={otherUser?.photoURL} size="xs" />
                    )}
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-[#004ac6] text-white rounded-br-sm'
                        : 'bg-white text-[#191c1d] shadow-card rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200 text-right' : 'text-[#737686]'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#e7e8e9] rounded-b-2xl px-4 py-3 flex items-end gap-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message..."
          rows={1}
          className="flex-1 bg-[#f3f4f5] rounded-xl px-4 py-2.5 text-sm text-[#191c1d] resize-none outline-none focus:ring-2 focus:ring-[#004ac6]/20 max-h-32"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-[#004ac6] text-white rounded-xl flex items-center justify-center hover:bg-blue-800 transition-colors disabled:opacity-40 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
