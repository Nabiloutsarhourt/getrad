'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, MessageSquare, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeClientBookings } from '../../../services/bookingService';
import { getRecommendedInterpreters } from '../../../services/searchService';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import { BOOKING_STATUS_LABELS } from '../../../lib/constants';

export default function ClientHomePage() {
  const { userData } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [interpreters, setInterpreters] = useState([]);
  const [loadingInterpreters, setLoadingInterpreters] = useState(true);

  const firstName = userData?.displayName?.split(' ')[0] || 'vous';

  useEffect(() => {
    if (!userData?.uid && !userData) return;
    // We need the user uid — get it from useAuth
  }, [userData]);

  // We need the auth user uid
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeClientBookings(user.uid, (bookings) => {
      setRecentBookings(bookings.slice(0, 3));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoadingInterpreters(true);
      const result = await getRecommendedInterpreters(6);
      if (result.success) setInterpreters(result.interpreters);
      setLoadingInterpreters(false);
    };
    load();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const quickActions = [
    {
      href: '/client/missions/post',
      icon: PlusCircle,
      title: 'Publier une mission',
      desc: 'Trouvez un prestataire automatiquement',
      color: 'bg-[#dbe1ff] text-[#004ac6]',
    },
    {
      href: '/client/interpreters',
      icon: Search,
      title: 'Explorer les profils',
      desc: 'Parcourez notre annuaire',
      color: 'bg-[#c5f8e1] text-[#006c49]',
    },
    {
      href: '/client/messages',
      icon: MessageSquare,
      title: 'Mes messages',
      desc: 'Voir toutes vos conversations',
      color: 'bg-yellow-100 text-yellow-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-[#434655] mt-1">Que souhaitez-vous faire aujourd&apos;hui ?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl p-5 shadow-card hover:shadow-deep transition-all duration-200 hover:-translate-y-1 flex items-start gap-4"
          >
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-[#191c1d] text-sm">{title}</h3>
              <p className="text-xs text-[#737686] mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#191c1d]">Réservations récentes</h2>
          <Link href="/client/missions" className="text-sm text-[#004ac6] hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={14} />
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-card">
            <p className="text-[#737686] text-sm">Aucune réservation pour le moment</p>
            <Link href="/client/interpreters" className="mt-3 inline-block text-sm text-[#004ac6] hover:underline">
              Chercher un interprète
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/client/bookings/${booking.id}`}
                className="bg-white rounded-2xl p-4 shadow-card hover:shadow-deep transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={booking.interpreterName || 'I'} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[#191c1d]">{booking.serviceType || 'Service'}</p>
                    <p className="text-xs text-[#737686]">{formatDate(booking.date || booking.createdAt)}</p>
                  </div>
                </div>
                <Badge
                  status={booking.status}
                  label={BOOKING_STATUS_LABELS[booking.status] || booking.status}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recommended interpreters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#191c1d]">Interprètes recommandés</h2>
          <Link href="/client/interpreters" className="text-sm text-[#004ac6] hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={14} />
          </Link>
        </div>
        {loadingInterpreters ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : interpreters.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-card">
            <p className="text-[#737686] text-sm">Aucun interprète disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {interpreters.map((interpreter) => (
              <Link
                key={interpreter.id}
                href={`/client/interpreters/${interpreter.id}`}
                className="bg-white rounded-2xl p-4 shadow-card hover:shadow-deep transition-all hover:-translate-y-1"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={`${interpreter.firstName} ${interpreter.lastName}`}
                    photoURL={interpreter.user?.photoURL}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#191c1d] text-sm truncate">
                      {interpreter.firstName} {interpreter.lastName}
                    </h3>
                    <p className="text-xs text-[#737686] truncate">{interpreter.city || 'France'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium text-[#434655]">
                        {interpreter.rating?.toFixed(1) || '0.0'} ({interpreter.reviewCount || 0})
                      </span>
                    </div>
                  </div>
                </div>
                {interpreter.languages && interpreter.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {interpreter.languages.slice(0, 2).map((lang, i) => (
                      <span key={i} className="text-xs bg-[#f3f4f5] text-[#434655] px-2 py-0.5 rounded-lg">
                        {lang.source} → {lang.target}
                      </span>
                    ))}
                  </div>
                )}
                {interpreter.hourlyRate > 0 && (
                  <p className="text-xs font-semibold text-[#004ac6] mt-2">
                    {interpreter.hourlyRate}€/h
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
