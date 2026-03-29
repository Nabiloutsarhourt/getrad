'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, FileText, User, AlertCircle } from 'lucide-react';
import { getBookingById, cancelBooking } from '../../../../services/bookingService';
import Badge from '../../../../components/ui/Badge';
import Spinner from '../../../../components/ui/Spinner';
import { BOOKING_STATUS_LABELS } from '../../../../lib/constants';

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await getBookingById(bookingId);
      if (result.success) setBooking(result.booking);
      setLoading(false);
    };
    load();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!confirm('Voulez-vous annuler cette réservation ?')) return;
    setCancelling(true);
    await cancelBooking(bookingId);
    router.push('/client/bookings');
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!booking) return (
    <div className="text-center py-16">
      <p className="text-[#737686]">Réservation introuvable.</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-[#004ac6] hover:underline">Retour</button>
    </div>
  );

  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#434655] hover:text-[#191c1d]">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#191c1d]">Détail de la réservation</h1>
        <Badge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status] || booking.status} />
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-card divide-y divide-[#f3f4f5]">
        <Row icon={<User size={16} />} label="Service" value={booking.serviceType || '—'} capitalize />
        <Row icon={<Calendar size={16} />} label="Date" value={typeof booking.date === 'string' ? booking.date : formatDate(booking.date)} />
        {booking.time && <Row icon={<Clock size={16} />} label="Heure" value={booking.time} />}
        {booking.duration && <Row icon={<Clock size={16} />} label="Durée" value={`${booking.duration} h`} />}
        {booking.location && <Row icon={<MapPin size={16} />} label="Lieu" value={booking.location} />}
        {booking.estimatedPrice > 0 && (
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-[#434655]">Prix estimé</span>
            <span className="text-lg font-bold text-[#004ac6]">{booking.estimatedPrice}€</span>
          </div>
        )}
        {booking.notes && <Row icon={<FileText size={16} />} label="Notes" value={booking.notes} />}
      </div>

      {/* Created at */}
      <p className="text-xs text-[#737686] text-center">
        Réservation créée le {formatDate(booking.createdAt)}
      </p>

      {/* Cancel */}
      {canCancel && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Annuler la réservation</p>
            <p className="text-xs text-red-600 mt-0.5">Cette action est irréversible.</p>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
          >
            {cancelling ? 'En cours...' : 'Annuler'}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value, capitalize }) {
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <span className="text-[#737686] shrink-0">{icon}</span>
      <span className="text-sm text-[#434655] w-28 shrink-0">{label}</span>
      <span className={`text-sm font-medium text-[#191c1d] ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}
