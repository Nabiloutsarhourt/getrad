'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeClientBookings } from '../../../services/bookingService';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { BOOKING_STATUS_LABELS } from '../../../lib/constants';

const FILTERS = [
  { label: 'Toutes', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'Confirmées', value: 'confirmed' },
  { label: 'Terminées', value: 'completed' },
];

export default function ClientBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeClientBookings(user.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Mes réservations</h1>
        <p className="text-[#434655] mt-1">Historique de toutes vos réservations directes</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-[#004ac6] text-white'
                : 'bg-white text-[#434655] border border-[#e7e8e9] hover:bg-[#f3f4f5]'
            }`}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({bookings.filter(b => b.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-card">
          <div className="w-16 h-16 bg-[#f3f4f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-[#737686]" />
          </div>
          <p className="text-[#737686] font-medium">Aucune réservation</p>
          <Link href="/client/interpreters" className="mt-3 inline-block text-sm text-[#004ac6] hover:underline">
            Trouver un interprète
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => (
            <Link
              key={booking.id}
              href={`/client/bookings/${booking.id}`}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-deep transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 bg-[#dbe1ff] rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={20} className="text-[#004ac6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#191c1d] text-sm capitalize">
                    {booking.serviceType || 'Prestation'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {booking.date && (
                      <span className="flex items-center gap-1 text-xs text-[#737686]">
                        <Clock size={11} /> {typeof booking.date === 'string' ? booking.date : formatDate(booking.date)}
                      </span>
                    )}
                    {booking.location && (
                      <span className="flex items-center gap-1 text-xs text-[#737686]">
                        <MapPin size={11} /> {booking.location}
                      </span>
                    )}
                  </div>
                  {booking.estimatedPrice > 0 && (
                    <p className="text-sm font-bold text-[#004ac6] mt-1">{booking.estimatedPrice}€</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status] || booking.status} />
                <ChevronRight size={16} className="text-[#737686]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
