'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, MessageSquare, TrendingUp, Star, Bell, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeInterpreterBookings, confirmBooking, rejectBooking } from '../../../services/bookingService';
import { subscribeInterpreterMissions, subscribeIncomingOffer } from '../../../services/missionService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { BOOKING_STATUS_LABELS } from '../../../lib/constants';

export default function InterpreterDashboardPage() {
  const { user, userData, hasActiveSubscription, subscription } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [missions, setMissions] = useState([]);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const firstName = userData?.displayName?.split(' ')[0] || 'vous';

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'interpreters', user.uid)).then(d => {
      if (d.exists()) setProfile(d.data());
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeInterpreterBookings(user.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeInterpreterMissions(user.uid, (data) => setMissions(data));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeIncomingOffer(user.uid, (offer) => setIncomingOffer(offer));
    return () => unsub();
  }, [user]);

  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');
  const thisMonth = completed.filter(b => {
    const d = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = thisMonth.reduce((s, b) => s + (b.estimatedPrice || 0), 0);

  const handleAccept = async (id) => { await confirmBooking(id); };
  const handleReject = async (id) => { await rejectBooking(id); };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1d]">Bonjour, {firstName} 👋</h1>
          <p className="text-[#434655] mt-1">Tableau de bord interprète</p>
        </div>
        <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${
          profile?.availability?.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
          profile?.availability?.status === 'vacation' ? 'bg-red-100 text-red-700' :
          'bg-green-100 text-green-800'
        }`}>
          {profile?.availability?.status === 'busy' ? 'Occupé(e)' :
           profile?.availability?.status === 'vacation' ? 'En congés' : 'Disponible'}
        </div>
      </div>

      {/* Subscription alert */}
      {!hasActiveSubscription && (
        <Link href="/interpreter/subscription" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 hover:bg-amber-100 transition-colors">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800 flex-1">Activez votre abonnement pour recevoir des missions</p>
          <ChevronRight size={16} className="text-amber-600" />
        </Link>
      )}

      {/* Incoming offer banner */}
      {incomingOffer && (
        <Link href="/interpreter/bookings" className="flex items-center gap-3 bg-[#004ac6] text-white rounded-2xl px-4 py-3 hover:bg-blue-800 transition-colors">
          <Bell size={18} className="shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">Nouvelle mission disponible !</p>
            <p className="text-xs text-blue-200">{incomingOffer.languageFrom} → {incomingOffer.languageTo} · {incomingOffer.location}</p>
          </div>
          <ChevronRight size={16} />
        </Link>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={<Briefcase size={20} />} label="Ce mois" value={completed.length + confirmed.length} color="bg-[#dbe1ff] text-[#004ac6]" />
        <KpiCard icon={<Clock size={20} />} label="En attente" value={pending.length} color="bg-yellow-100 text-yellow-700" />
        <KpiCard icon={<TrendingUp size={20} />} label="Revenus" value={revenue > 0 ? `${revenue}€` : '—'} color="bg-green-100 text-green-700" />
        <KpiCard icon={<Star size={20} />} label="Note" value={profile?.rating > 0 ? profile.rating.toFixed(1) : '—'} color="bg-orange-100 text-orange-700" />
      </div>

      {/* Pending bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#191c1d] flex items-center gap-2">
            Nouvelles demandes
            {pending.length > 0 && (
              <span className="w-5 h-5 bg-[#004ac6] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </h2>
          <Link href="/interpreter/bookings" className="text-sm text-[#004ac6] hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={14} />
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-card">
            <p className="text-sm text-[#737686]">Aucune nouvelle demande</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 3).map(b => (
              <div key={b.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#191c1d] capitalize">{b.serviceType || 'Prestation'}</p>
                    <p className="text-xs text-[#737686]">{typeof b.date === 'string' ? b.date : ''} · {b.location || ''}</p>
                  </div>
                  {b.estimatedPrice > 0 && <p className="text-base font-bold text-[#004ac6]">{b.estimatedPrice}€</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(b.id)}
                    className="flex-1 bg-[#004ac6] text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue-800 transition-colors"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleReject(b.id)}
                    className="px-4 text-sm font-semibold text-[#737686] bg-[#f3f4f5] rounded-xl hover:bg-[#e7e8e9] transition-colors"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming confirmed */}
      {confirmed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#191c1d] mb-3">Prochaines missions</h2>
          <div className="bg-white rounded-2xl shadow-card divide-y divide-[#f3f4f5]">
            {confirmed.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#191c1d] capitalize truncate">{b.serviceType || 'Prestation'}</p>
                  <p className="text-xs text-[#737686]">{typeof b.date === 'string' ? b.date : ''}</p>
                </div>
                <Badge status={b.status} label={BOOKING_STATUS_LABELS[b.status]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/interpreter/subscription', icon: <Star size={18} />, label: 'Abonnement', color: 'bg-[#dbe1ff] text-[#004ac6]' },
          { href: '/interpreter/profile', icon: <Briefcase size={18} />, label: 'Mon profil', color: 'bg-[#f3f4f5] text-[#434655]' },
          { href: '/interpreter/messages', icon: <MessageSquare size={18} />, label: 'Messages', color: 'bg-yellow-100 text-yellow-700' },
        ].map(({ href, icon, label, color }) => (
          <Link key={href} href={href} className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-2 hover:shadow-deep transition-all">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
            <span className="text-xs font-medium text-[#434655] text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-[#191c1d]">{value}</p>
      <p className="text-xs text-[#737686] mt-0.5">{label}</p>
    </div>
  );
}
