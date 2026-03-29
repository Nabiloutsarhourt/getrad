'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeToConversations } from '../../../services/messageService';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';

export default function InterpreterMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (data) => { setConversations(data); setLoading(false); });
    return () => unsub();
  }, [user]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Messages</h1>
        <p className="text-[#434655] mt-1">Vos conversations avec les clients</p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-card">
          <div className="w-16 h-16 bg-[#f3f4f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-[#737686]" />
          </div>
          <p className="text-[#737686] font-medium">Aucune conversation</p>
          <p className="text-xs text-[#737686] mt-1">Les conversations démarrent après l&apos;acceptation d&apos;une mission.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card divide-y divide-[#f3f4f5] overflow-hidden">
          {conversations.map(conv => {
            const otherId = conv.participants?.find(p => p !== user?.uid);
            const otherData = otherId ? conv.participantsData?.[otherId] : null;
            const unread = user ? (conv.unreadCount?.[user.uid] || 0) : 0;
            return (
              <Link key={conv.id} href={`/interpreter/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8f9fa] transition-colors">
                <div className="relative">
                  <Avatar name={otherData?.displayName || '?'} photoURL={otherData?.photoURL} size="md" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#004ac6] text-white text-xs font-bold rounded-full flex items-center justify-center">{unread}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${unread > 0 ? 'font-bold' : 'font-medium'} text-[#191c1d] truncate`}>
                      {otherData?.displayName || 'Client'}
                    </p>
                    <span className="text-xs text-[#737686] shrink-0">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-[#191c1d] font-medium' : 'text-[#737686]'}`}>
                    {conv.lastMessage || 'Démarrez la conversation...'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
