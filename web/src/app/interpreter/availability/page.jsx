'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Spinner from '../../../components/ui/Spinner';
import { CheckCircle, Clock, Plane, Monitor, Building2, Minus, Plus, Check } from 'lucide-react';

const DAYS = [
  { key: 0, short: 'Lun', full: 'Lundi' },
  { key: 1, short: 'Mar', full: 'Mardi' },
  { key: 2, short: 'Mer', full: 'Mercredi' },
  { key: 3, short: 'Jeu', full: 'Jeudi' },
  { key: 4, short: 'Ven', full: 'Vendredi' },
  { key: 5, short: 'Sam', full: 'Samedi' },
  { key: 6, short: 'Dim', full: 'Dimanche' },
];

const STATUS_OPTIONS = [
  {
    key: 'available',
    label: 'Disponible',
    sub: 'Je reçois des missions et demandes',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    activeBg: 'bg-emerald-50',
  },
  {
    key: 'busy',
    label: 'Occupé(e)',
    sub: 'Je ne reçois pas de nouvelles missions',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    activeBg: 'bg-amber-50',
  },
  {
    key: 'vacation',
    label: 'En congés',
    sub: 'Indisponible jusqu\'à nouvel ordre',
    icon: Plane,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-400',
    activeBg: 'bg-red-50',
  },
];

const DEFAULT_AVAILABILITY = {
  status: 'available',
  weekdays: [0, 1, 2, 3, 4],
  startHour: 8,
  endHour: 18,
  acceptsRemote: true,
  acceptsOnsite: true,
};

export default function InterpreterAvailabilityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avail, setAvail] = useState(DEFAULT_AVAILABILITY);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'interpreters', user.uid));
        if (snap.exists() && snap.data().availability) {
          setAvail({ ...DEFAULT_AVAILABILITY, ...snap.data().availability });
        }
      } catch (e) {
        console.error('loadAvailability:', e);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleDay = (dayKey) => {
    setAvail(prev => {
      const days = prev.weekdays.includes(dayKey)
        ? prev.weekdays.filter(d => d !== dayKey)
        : [...prev.weekdays, dayKey].sort((a, b) => a - b);
      return { ...prev, weekdays: days };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'interpreters', user.uid), {
        availability: avail,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('saveAvailability:', e);
    }
    setSaving(false);
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.key === avail.status) || STATUS_OPTIONS[0];

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header card */}
      <div className="relative bg-[#004ac6] rounded-2xl p-6 overflow-hidden text-white">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 left-8 w-24 h-24 bg-white/5 rounded-full" />
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 ${currentStatus.bg} ${currentStatus.color}`}>
          <currentStatus.icon size={13} />
          {currentStatus.label}
        </div>
        <h1 className="text-xl font-bold mb-1">Mes disponibilités</h1>
        <p className="text-sm text-blue-100">
          Gérez votre agenda pour recevoir des missions adaptées à votre planning.
        </p>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <Check size={16} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Disponibilités enregistrées avec succès</span>
        </div>
      )}

      {/* Status */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-[#191c1d]">Statut général</h2>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(opt => {
            const active = avail.status === opt.key;
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                onClick={() => setAvail(prev => ({ ...prev, status: opt.key }))}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? `${opt.border} ${opt.activeBg}`
                    : 'border-[#e2e3e8] hover:border-[#c3c6d7]'
                }`}
              >
                <div className={`w-10 h-10 ${opt.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={opt.color} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${active ? opt.color : 'text-[#191c1d]'}`}>{opt.label}</p>
                  <p className="text-xs text-[#737686] mt-0.5">{opt.sub}</p>
                </div>
                {active && (
                  <div className={`w-5 h-5 rounded-full ${opt.bg} ${opt.color} flex items-center justify-center`}>
                    <Check size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Working days */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-[#191c1d]">Jours travaillés</h2>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(day => {
            const active = avail.weekdays.includes(day.key);
            return (
              <button
                key={day.key}
                onClick={() => toggleDay(day.key)}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  active
                    ? 'bg-[#dbe1ff] text-[#004ac6] border-2 border-[#004ac6]'
                    : 'bg-[#f3f4f5] text-[#737686] border-2 border-transparent hover:border-[#c3c6d7]'
                }`}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Working hours */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-[#191c1d]">Horaires habituels</h2>
        <div className="flex items-center gap-4">
          {/* Start hour */}
          <div className="flex-1">
            <p className="text-xs text-[#737686] font-medium mb-2">Début</p>
            <div className="flex items-center bg-[#f3f4f5] rounded-xl overflow-hidden">
              <button
                onClick={() => setAvail(prev => ({ ...prev, startHour: Math.max(6, prev.startHour - 1) }))}
                className="w-11 h-12 flex items-center justify-center text-[#004ac6] hover:bg-[#e2e3e8] transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="flex-1 text-center text-lg font-bold text-[#004ac6]">
                {avail.startHour}:00
              </span>
              <button
                onClick={() => setAvail(prev => ({
                  ...prev,
                  startHour: Math.min(prev.endHour - 1, prev.startHour + 1),
                }))}
                className="w-11 h-12 flex items-center justify-center text-[#004ac6] hover:bg-[#e2e3e8] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="text-[#c3c6d7] font-bold mt-4">→</div>

          {/* End hour */}
          <div className="flex-1">
            <p className="text-xs text-[#737686] font-medium mb-2">Fin</p>
            <div className="flex items-center bg-[#f3f4f5] rounded-xl overflow-hidden">
              <button
                onClick={() => setAvail(prev => ({
                  ...prev,
                  endHour: Math.max(prev.startHour + 1, prev.endHour - 1),
                }))}
                className="w-11 h-12 flex items-center justify-center text-[#004ac6] hover:bg-[#e2e3e8] transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="flex-1 text-center text-lg font-bold text-[#004ac6]">
                {avail.endHour}:00
              </span>
              <button
                onClick={() => setAvail(prev => ({ ...prev, endHour: Math.min(22, prev.endHour + 1) }))}
                className="w-11 h-12 flex items-center justify-center text-[#004ac6] hover:bg-[#e2e3e8] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mission types */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-1">
        <h2 className="text-sm font-bold text-[#191c1d] mb-3">Types de missions acceptées</h2>

        <div className="flex items-center justify-between py-3 border-b border-[#f3f4f5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#dbe1ff] rounded-xl flex items-center justify-center shrink-0">
              <Monitor size={17} className="text-[#004ac6]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#191c1d]">À distance</p>
              <p className="text-xs text-[#737686]">Visioconférence, téléphone</p>
            </div>
          </div>
          <button
            onClick={() => setAvail(prev => ({ ...prev, acceptsRemote: !prev.acceptsRemote }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              avail.acceptsRemote ? 'bg-[#004ac6]' : 'bg-[#c3c6d7]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                avail.acceptsRemote ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c5f8e1] rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={17} className="text-[#006c49]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#191c1d]">En présentiel</p>
              <p className="text-xs text-[#737686]">Déplacements sur site</p>
            </div>
          </div>
          <button
            onClick={() => setAvail(prev => ({ ...prev, acceptsOnsite: !prev.acceptsOnsite }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              avail.acceptsOnsite ? 'bg-[#004ac6]' : 'bg-[#c3c6d7]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                avail.acceptsOnsite ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-[#004ac6] text-white font-bold rounded-2xl hover:bg-[#003a9e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-deep"
      >
        {saving ? (
          <Spinner size="sm" />
        ) : (
          <><CheckCircle size={18} /> Enregistrer les disponibilités</>
        )}
      </button>
    </div>
  );
}
