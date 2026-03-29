'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { createMission } from '../../../../services/missionService';
import { useAuth } from '../../../../contexts/AuthContext';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { SERVICES, LANGUAGES, REGIONS, FRENCH_CITIES } from '../../../../lib/constants';

export default function PostMissionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    service: '',
    languageFrom: '',
    languageTo: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    region: '',
    budget: '',
    description: '',
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.service) return 'Veuillez choisir un type de service';
    if (!form.languageFrom) return 'Veuillez choisir la langue source';
    if (!form.languageTo) return 'Veuillez choisir la langue cible';
    if (!form.date) return 'Veuillez choisir une date';
    if (!form.startTime) return "Veuillez indiquer l'heure de début";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const missionData = {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : null,
      };
      const result = await createMission(missionData, user.uid);
      if (result.success) {
        router.push('/client/missions');
      } else {
        setError(result.error || 'Erreur lors de la création de la mission');
      }
    } catch (err) {
      setError('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/client/missions" className="inline-flex items-center gap-1 text-sm text-[#434655] hover:text-[#191c1d]">
        <ArrowLeft size={16} /> Retour
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Publier une mission</h1>
        <p className="text-[#434655] mt-1">Notre algorithme trouvera automatiquement le meilleur interprète disponible</p>
      </div>

      {/* Info banner */}
      <div className="bg-[#dbe1ff] rounded-xl p-4">
        <p className="text-sm text-[#004ac6] font-medium">Comment ça fonctionne</p>
        <p className="text-xs text-[#434655] mt-1">
          Après publication, notre système contacte automatiquement les interprètes disponibles par ordre de priorité. Chaque interprète a 2 minutes pour accepter ou refuser.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <label className="text-sm font-medium text-[#191c1d] block mb-1">Type de service *</label>
          <select
            value={form.service}
            onChange={(e) => updateForm('service', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
          >
            <option value="">Choisir un service</option>
            {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[#191c1d] block mb-1">Langue source *</label>
            <select
              value={form.languageFrom}
              onChange={(e) => updateForm('languageFrom', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
            >
              <option value="">Langue source</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[#191c1d] block mb-1">Langue cible *</label>
            <select
              value={form.languageTo}
              onChange={(e) => updateForm('languageTo', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
            >
              <option value="">Langue cible</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <Input
          label="Date *"
          type="date"
          value={form.date}
          onChange={(e) => updateForm('date', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Heure début *"
            type="time"
            value={form.startTime}
            onChange={(e) => updateForm('startTime', e.target.value)}
          />
          <Input
            label="Heure fin"
            type="time"
            value={form.endTime}
            onChange={(e) => updateForm('endTime', e.target.value)}
          />
        </div>

        <Input
          label="Lieu"
          placeholder="Paris, en ligne, etc."
          value={form.location}
          onChange={(e) => updateForm('location', e.target.value)}
        />

        <div>
          <label className="text-sm font-medium text-[#191c1d] block mb-1">Région</label>
          <select
            value={form.region}
            onChange={(e) => updateForm('region', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
          >
            <option value="">Toute la France</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <Input
          label="Budget (€)"
          type="number"
          placeholder="Budget indicatif"
          value={form.budget}
          onChange={(e) => updateForm('budget', e.target.value)}
          hint="Optionnel — laissez vide si pas de budget défini"
        />

        <div>
          <label className="text-sm font-medium text-[#191c1d] block mb-1">Description</label>
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

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <Send size={18} />
          Publier la mission
        </Button>
      </form>
    </div>
  );
}
