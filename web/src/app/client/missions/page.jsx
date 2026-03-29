'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeClientBookings } from '../../../services/bookingService';
import { subscribeClientMissions } from '../../../services/missionService';
import { MISSION_STATUS_LABELS, MISSION_STATUS_TAILWIND } from '../../../services/missionService';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../../lib/constants';

export default function ClientMissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingBookings(true);
    const unsub = subscribeClientBookings(user.uid, (data) => {
      setBookings(data);
      setLoadingBookings(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingMissions(true);
    const unsub = subscribeClientMissions(user.uid, (data) => {
      setMissions(data);
      setLoadingMissions(false);
    });
    return () => unsub();
  }, [user]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1d]">Mes missions</h1>
          <p className="text-[#434655] mt-1">Réservations directes et missions auto-assignées</p>
        </div>
        <Link href="/client/missions/post">
          <button className="flex items-center gap-2 bg-[#004ac6] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors">
            <PlusCircle size={16} />
            Publier
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#edeeef] p-1 rounded-xl w-fit">
        {[
          { key: 'bookings', label: `Réservations (${bookings.length})` },
          { key: 'missions', label: `Missions (${missions.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#434655] hover:text-[#191c1d]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {activeTab === 'bookings' && (
        <div>
          {loadingBookings ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-card">
              <p className="text-[#737686] mb-3">Aucune réservation</p>
              <Link href="/client/interpreters" className="text-sm text-[#004ac6] hover:underline">
                Trouver un interprète
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/client/bookings/${booking.id}`}
                  className="bg-white rounded-2xl p-4 shadow-card hover:shadow-deep transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#191c1d]">
                      {booking.serviceType || 'Réservation'}
                    </p>
                    <p className="text-xs text-[#737686] mt-0.5">
                      {booking.date || formatDate(booking.createdAt)}
                      {booking.startTime && ` — ${booking.startTime}`}
                    </p>
                    {booking.location && (
                      <p className="text-xs text-[#737686]">{booking.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                      {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                    </span>
                    <ChevronRight size={16} className="text-[#737686]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missions tab */}
      {activeTab === 'missions' && (
        <div>
          {loadingMissions ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : missions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-card">
              <p className="text-[#737686] mb-3">Aucune mission publiée</p>
              <Link href="/client/missions/post" className="text-sm text-[#004ac6] hover:underline">
                Publier une mission
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <Link
                  key={mission.id}
                  href={`/client/missions/${mission.id}`}
                  className="bg-white rounded-2xl p-4 shadow-card hover:shadow-deep transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#191c1d]">
                      {mission.service || 'Mission'}
                    </p>
                    <p className="text-xs text-[#737686] mt-0.5">
                      {mission.languageFrom && mission.languageTo
                        ? `${mission.languageFrom} → ${mission.languageTo}`
                        : ''}
                    </p>
                    <p className="text-xs text-[#737686]">
                      {mission.date && formatDate({ toDate: () => new Date(mission.date) })}
                      {mission.location && ` — ${mission.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mission.status === 'searching' && (
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${MISSION_STATUS_TAILWIND[mission.status] || 'bg-gray-100 text-gray-700'}`}>
                      {MISSION_STATUS_LABELS[mission.status] || mission.status}
                    </span>
                    <ChevronRight size={16} className="text-[#737686]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
