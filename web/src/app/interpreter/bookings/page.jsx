'use client';
import { useState, useEffect } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeInterpreterBookings, confirmBooking, rejectBooking } from '../../../services/bookingService';
import { subscribeInterpreterMissions, MISSION_STATUS_LABELS, MISSION_STATUS_TAILWIND } from '../../../services/missionService';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { BOOKING_STATUS_LABELS } from '../../../lib/constants';

const TABS = [
  { key: 'bookings', label: 'Réservations directes' },
  { key: 'missions', label: 'Missions auto' },
];

export default function InterpreterBookingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeInterpreterBookings(user.uid, (data) => { setBookings(data); setLoading(false); });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeInterpreterMissions(user.uid, (data) => setMissions(data));
    return () => unsub();
  }, [user]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pending = bookings.filter(b => b.status === 'pending');

  const handleAccept = async (id) => { await confirmBooking(id); };
  const handleReject = async (id) => { await rejectBooking(id); };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Mes missions</h1>
        <p className="text-[#434655] mt-1">Réservations directes et missions auto-assignées</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f3f4f5] rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-white text-[#191c1d] shadow-card' : 'text-[#737686] hover:text-[#191c1d]'
            }`}
          >
            {t.label}
            {t.key === 'bookings' && pending.length > 0 && (
              <span className="ml-1.5 text-xs bg-[#004ac6] text-white px-1.5 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <>
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === f ? 'bg-[#004ac6] text-white' : 'bg-white text-[#434655] border border-[#e7e8e9] hover:bg-[#f3f4f5]'
              }`}>
                {f === 'all' ? 'Toutes' : BOOKING_STATUS_LABELS[f] || f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Empty icon={<Calendar size={28} />} text="Aucune réservation" />
          ) : (
            <div className="space-y-3">
              {filtered.map(b => (
                <div key={b.id} className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-[#191c1d] capitalize">{b.serviceType || 'Prestation'}</p>
                      <p className="text-xs text-[#737686] mt-0.5">
                        {typeof b.date === 'string' ? b.date : ''}{b.location ? ` · ${b.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.estimatedPrice > 0 && <span className="text-sm font-bold text-[#004ac6]">{b.estimatedPrice}€</span>}
                      <Badge status={b.status} label={BOOKING_STATUS_LABELS[b.status] || b.status} />
                    </div>
                  </div>
                  {b.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(b.id)} className="flex-1 bg-[#004ac6] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors">
                        Accepter
                      </button>
                      <button onClick={() => handleReject(b.id)} className="px-5 text-sm font-semibold text-[#737686] bg-[#f3f4f5] rounded-xl hover:bg-[#e7e8e9] transition-colors">
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'missions' && (
        missions.length === 0 ? (
          <Empty icon={<Calendar size={28} />} text="Aucune mission acceptée" />
        ) : (
          <div className="space-y-3">
            {missions.map(m => (
              <div key={m.id} className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#191c1d]">{m.title || 'Mission'}</p>
                    <p className="text-xs text-[#737686] mt-0.5">
                      {m.languageFrom && m.languageTo ? `${m.languageFrom} → ${m.languageTo}` : ''}
                      {m.date ? ` · ${m.date}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl ${MISSION_STATUS_TAILWIND[m.status] || 'bg-gray-100 text-gray-700'}`}>
                    {MISSION_STATUS_LABELS[m.status] || m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center shadow-card">
      <div className="w-16 h-16 bg-[#f3f4f5] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#737686]">{icon}</div>
      <p className="text-sm text-[#737686] font-medium">{text}</p>
    </div>
  );
}
