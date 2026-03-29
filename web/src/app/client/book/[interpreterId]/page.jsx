'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { getInterpreterById } from '../../../../services/searchService';
import { createBooking } from '../../../../services/bookingService';
import { useAuth } from '../../../../contexts/AuthContext';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Avatar from '../../../../components/ui/Avatar';
import Spinner from '../../../../components/ui/Spinner';
import { SERVICES } from '../../../../lib/constants';

export default function BookInterpreterPage() {
  const { interpreterId } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [interpreter, setInterpreter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    serviceType: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!interpreterId) return;
      setLoading(true);
      const result = await getInterpreterById(interpreterId);
      if (result.success) setInterpreter(result.interpreter);
      setLoading(false);
    };
    load();
  }, [interpreterId]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.serviceType) { setError('Veuillez choisir un type de service'); return; }
    if (!form.date) { setError('Veuillez choisir une date'); return; }
    if (!form.startTime) { setError('Veuillez indiquer l\'heure de début'); return; }

    setSubmitting(true);
    try {
      const bookingData = {
        ...form,
        clientId: user.uid,
        clientName: userData.displayName || '',
        interpreterId,
        interpreterName: interpreter ? `${interpreter.firstName} ${interpreter.lastName}` : '',
      };
      const result = await createBooking(bookingData);
      if (result.success) {
        router.push('/client/missions');
      } else {
        setError(result.error || 'Erreur lors de la création de la réservation');
      }
    } catch (err) {
      setError('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const fullName = interpreter ? `${interpreter.firstName} ${interpreter.lastName}` : '';

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href={`/client/interpreters/${interpreterId}`} className="inline-flex items-center gap-1 text-sm text-[#434655] hover:text-[#191c1d]">
        <ArrowLeft size={16} /> Retour au profil
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Nouvelle réservation</h1>
        {interpreter && (
          <div className="flex items-center gap-3 mt-3 p-3 bg-[#dbe1ff] rounded-xl">
            <Avatar name={fullName} photoURL={interpreter.user?.photoURL} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[#004ac6]">{fullName}</p>
              {interpreter.city && <p className="text-xs text-[#434655]">{interpreter.city}</p>}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <label className="text-sm font-medium text-[#191c1d] block mb-1">Type de service *</label>
          <select
            value={form.serviceType}
            onChange={(e) => updateForm('serviceType', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
          >
            <option value="">Choisir un service</option>
            {SERVICES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Date *"
          type="date"
          value={form.date}
          onChange={(e) => updateForm('date', e.target.value)}
          inputClassName="cursor-pointer"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Heure de début *"
            type="time"
            value={form.startTime}
            onChange={(e) => updateForm('startTime', e.target.value)}
          />
          <Input
            label="Heure de fin"
            type="time"
            value={form.endTime}
            onChange={(e) => updateForm('endTime', e.target.value)}
          />
        </div>

        <Input
          label="Lieu / Adresse"
          placeholder="Paris 8e, en ligne, etc."
          value={form.location}
          onChange={(e) => updateForm('location', e.target.value)}
        />

        <div>
          <label className="text-sm font-medium text-[#191c1d] block mb-1">Description / Contexte</label>
          <textarea
            rows={3}
            placeholder="Décrivez votre mission, le contexte, vos besoins spécifiques..."
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white placeholder:text-[#737686] focus:outline-none focus:ring-2 focus:ring-[#004ac6] resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#ba1a1a]">
            {error}
          </div>
        )}

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          <Calendar size={18} />
          Envoyer la demande de réservation
        </Button>
      </form>
    </div>
  );
}
