'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Globe, Calendar, MapPin, CheckCircle, XCircle, Loader } from 'lucide-react';
import { subscribeMission, cancelMission, MISSION_STATUS_LABELS, MISSION_STATUS_TAILWIND } from '../../../../services/missionService';
import Spinner from '../../../../components/ui/Spinner';

const STEPS = [
  { key: 'published', label: 'Mission publiée', sub: 'Votre demande a été enregistrée.' },
  { key: 'searching', label: 'Recherche en cours', sub: 'Nous cherchons le meilleur prestataire.' },
  { key: 'offered', label: 'Prestataire contacté', sub: 'En attente de réponse (2 min max)...' },
  { key: 'accepted', label: 'Mission acceptée', sub: 'Un prestataire a confirmé.' },
];

export default function MissionTrackingPage() {
  const { missionId } = useParams();
  const router = useRouter();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const unsub = subscribeMission(missionId, (m) => {
      setMission(m);
      setLoading(false);
    });
    return () => unsub();
  }, [missionId]);

  const handleCancel = async () => {
    if (!confirm('Voulez-vous annuler cette mission ?')) return;
    setCancelling(true);
    await cancelMission(missionId);
    router.push('/client/missions');
  };

  const getStepStatus = (stepKey) => {
    if (!mission) return 'pending';
    const statusOrder = ['published', 'searching', 'offered', 'accepted'];
    const statusMap = {
      searching: 1, offered: 2, accepted: 3, completed: 3,
      no_match: 2, expired: 2, cancelled: 2,
    };
    const currentIndex = statusMap[mission.status] ?? 0;
    const stepIndex = statusOrder.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!mission) return (
    <div className="text-center py-16">
      <p className="text-[#737686]">Mission introuvable.</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-[#004ac6] hover:underline">Retour</button>
    </div>
  );

  const isFailed = ['no_match', 'expired', 'cancelled'].includes(mission.status);
  const isAccepted = mission.status === 'accepted' || mission.status === 'completed';
  const isSearching = ['searching', 'offered'].includes(mission.status);

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#434655] hover:text-[#191c1d]">
        <ArrowLeft size={16} /> Mes missions
      </button>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#191c1d]">Suivi de mission</h1>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${MISSION_STATUS_TAILWIND[mission.status] || 'bg-gray-100 text-gray-700'}`}>
          {MISSION_STATUS_LABELS[mission.status] || mission.status}
        </span>
      </div>

      {/* Mission details */}
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
        <h2 className="font-semibold text-[#191c1d]">{mission.title || 'Mission'}</h2>
        <div className="grid grid-cols-2 gap-3">
          {mission.service && (
            <div className="flex items-center gap-2 text-sm text-[#434655]">
              <Briefcase size={14} className="text-[#737686]" />
              <span className="capitalize">{mission.service.replace(/_/g, ' ')}</span>
            </div>
          )}
          {(mission.languageFrom && mission.languageTo) && (
            <div className="flex items-center gap-2 text-sm text-[#434655]">
              <Globe size={14} className="text-[#737686]" />
              <span>{mission.languageFrom} → {mission.languageTo}</span>
            </div>
          )}
          {mission.date && (
            <div className="flex items-center gap-2 text-sm text-[#434655]">
              <Calendar size={14} className="text-[#737686]" />
              <span>{mission.date}</span>
            </div>
          )}
          {mission.location && (
            <div className="flex items-center gap-2 text-sm text-[#434655]">
              <MapPin size={14} className="text-[#737686]" />
              <span>{mission.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress steps */}
      {!isFailed && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-sm font-semibold text-[#191c1d] mb-4">Progression</h3>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const status = getStepStatus(step.key);
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      status === 'done' ? 'bg-[#006c49] text-white' :
                      status === 'active' ? 'bg-[#004ac6] text-white' :
                      'bg-[#e7e8e9] text-[#737686]'
                    }`}>
                      {status === 'done' ? <CheckCircle size={14} /> :
                       status === 'active' ? <Loader size={12} className="animate-spin" /> :
                       <span className="text-xs">{i + 1}</span>}
                    </div>
                    {i < STEPS.length - 1 && <div className={`w-0.5 h-8 mt-1 ${status === 'done' ? 'bg-[#006c49]' : 'bg-[#e7e8e9]'}`} />}
                  </div>
                  <div className="pb-6 pt-0.5">
                    <p className={`text-sm font-medium ${status === 'pending' ? 'text-[#737686]' : 'text-[#191c1d]'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[#737686] mt-0.5">{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <XCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">
              {mission.status === 'no_match' ? 'Aucun prestataire disponible' :
               mission.status === 'expired' ? 'Mission expirée' : 'Mission annulée'}
            </p>
            <p className="text-sm text-red-600 mt-1">
              {mission.status === 'no_match'
                ? 'Aucun interprète n\'a répondu à votre mission. Essayez la recherche directe.'
                : 'Cette mission n\'est plus active.'}
            </p>
            {mission.status === 'no_match' && (
              <Link href="/client/interpreters" className="mt-3 inline-block text-sm font-semibold text-[#004ac6] hover:underline">
                Chercher directement un interprète →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Accepted */}
      {isAccepted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Mission acceptée !</p>
            <p className="text-sm text-green-700 mt-1">Un prestataire a confirmé. Une conversation a été ouverte.</p>
            <Link href="/client/messages" className="mt-3 inline-block text-sm font-semibold text-[#004ac6] hover:underline">
              Voir la conversation →
            </Link>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {isSearching && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="text-sm text-[#737686] hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {cancelling ? 'Annulation...' : 'Annuler la mission'}
        </button>
      )}
    </div>
  );
}
