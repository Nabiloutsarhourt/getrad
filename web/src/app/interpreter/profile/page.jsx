'use client';
import { useState, useEffect } from 'react';
import { Camera, Save, Plus, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserProfile, updateInterpreterProfile, getInterpreterProfile, uploadProfileImage } from '../../../services/profileService';
import { LANGUAGES, SPECIALTIES, REGIONS } from '../../../lib/constants';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';

export default function InterpreterProfilePage() {
  const { user, userData } = useAuth();
  const [userForm, setUserForm] = useState({ displayName: '', phone: '', city: '' });
  const [interpForm, setInterpForm] = useState({ bio: '', hourlyRate: '', specialties: [], regions: [] });
  const [languages, setLanguages] = useState([]);
  const [newLang, setNewLang] = useState({ source: 'Français', target: 'Anglais' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUserForm({ displayName: userData?.displayName || '', phone: userData?.phone || '', city: userData?.city || '' });
    getInterpreterProfile(user.uid).then(r => {
      if (r.success) {
        const d = r.data;
        setInterpForm({ bio: d.bio || '', hourlyRate: d.hourlyRate || '', specialties: d.specialties || [], regions: d.regions || [] });
        setLanguages(d.languages || []);
      }
      setLoading(false);
    });
  }, [user, userData]);

  const toggleSpecialty = (s) => setInterpForm(p => ({
    ...p, specialties: p.specialties.includes(s) ? p.specialties.filter(x => x !== s) : [...p.specialties, s]
  }));
  const toggleRegion = (r) => setInterpForm(p => ({
    ...p, regions: p.regions.includes(r) ? p.regions.filter(x => x !== r) : [...p.regions, r]
  }));
  const addLanguage = () => {
    if (!languages.find(l => l.source === newLang.source && l.target === newLang.target)) {
      setLanguages(prev => [...prev, { ...newLang, level: 'professionnel' }]);
    }
  };
  const removeLang = (i) => setLanguages(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setSuccess(false);
    await Promise.all([
      updateUserProfile(user.uid, userForm),
      updateInterpreterProfile(user.uid, { ...interpForm, languages }),
    ]);
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    await uploadProfileImage(user.uid, file);
    setUploading(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Mon profil</h1>
        <p className="text-[#434655] mt-1">Complétez votre profil pour être plus visible</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl shadow-card p-6 flex items-center gap-5">
        <div className="relative">
          <Avatar name={userData?.displayName} photoURL={userData?.photoURL} size="xl" />
          <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#004ac6] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-800 shadow-md">
            {uploading ? <Spinner size="xs" /> : <Camera size={14} />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
        <div>
          <p className="font-semibold text-[#191c1d]">{userData?.displayName || 'Votre nom'}</p>
          <p className="text-sm text-[#737686]">{userData?.email}</p>
          <span className="inline-block mt-1 text-xs bg-[#dbe1ff] text-[#004ac6] px-2 py-0.5 rounded-lg font-medium">Interprète</span>
        </div>
      </div>

      {/* User info */}
      <Section title="Informations personnelles">
        <Field label="Nom complet" value={userForm.displayName} onChange={v => setUserForm(p => ({ ...p, displayName: v }))} />
        <Field label="Téléphone" value={userForm.phone} onChange={v => setUserForm(p => ({ ...p, phone: v }))} type="tel" />
        <Field label="Ville" value={userForm.city} onChange={v => setUserForm(p => ({ ...p, city: v }))} />
      </Section>

      {/* Pro info */}
      <Section title="Profil professionnel">
        <div>
          <label className="block text-sm font-medium text-[#434655] mb-1.5">Bio</label>
          <textarea value={interpForm.bio} onChange={e => setInterpForm(p => ({ ...p, bio: e.target.value }))}
            rows={3} placeholder="Décrivez votre expertise..."
            className="w-full bg-[#f3f4f5] rounded-xl px-4 py-2.5 text-sm text-[#191c1d] resize-none outline-none focus:border-[#004ac6] focus:bg-white transition-colors border border-transparent" />
        </div>
        <Field label="Tarif horaire (€)" value={interpForm.hourlyRate} onChange={v => setInterpForm(p => ({ ...p, hourlyRate: v }))} type="number" placeholder="75" />
      </Section>

      {/* Languages */}
      <Section title="Paires de langues">
        <div className="flex flex-wrap gap-2 mb-3">
          {languages.map((l, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-[#dbe1ff] text-[#004ac6] text-xs font-medium px-3 py-1.5 rounded-xl">
              {l.source} → {l.target}
              <button onClick={() => removeLang(i)} className="hover:text-red-600"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={newLang.source} onChange={e => setNewLang(p => ({ ...p, source: e.target.value }))}
            className="flex-1 bg-[#f3f4f5] rounded-xl px-3 py-2 text-sm outline-none">
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <span className="self-center text-[#737686]">→</span>
          <select value={newLang.target} onChange={e => setNewLang(p => ({ ...p, target: e.target.value }))}
            className="flex-1 bg-[#f3f4f5] rounded-xl px-3 py-2 text-sm outline-none">
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <button onClick={addLanguage} className="w-9 h-9 bg-[#004ac6] text-white rounded-xl flex items-center justify-center hover:bg-blue-800 shrink-0">
            <Plus size={16} />
          </button>
        </div>
      </Section>

      {/* Specialties */}
      <Section title="Spécialités">
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => toggleSpecialty(s)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                interpForm.specialties.includes(s) ? 'bg-[#004ac6] text-white' : 'bg-[#f3f4f5] text-[#434655] hover:bg-[#e7e8e9]'
              }`}>{s}</button>
          ))}
        </div>
      </Section>

      {/* Regions */}
      <Section title="Régions d'intervention">
        <div className="flex flex-wrap gap-2">
          {REGIONS.map(r => (
            <button key={r} onClick={() => toggleRegion(r)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                interpForm.regions.includes(r) ? 'bg-[#006c49] text-white' : 'bg-[#f3f4f5] text-[#434655] hover:bg-[#e7e8e9]'
              }`}>{r}</button>
          ))}
        </div>
      </Section>

      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          Profil mis à jour avec succès.
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#004ac6] text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50">
        {saving ? <Spinner size="xs" /> : <Save size={16} />}
        {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
      <h2 className="font-semibold text-[#191c1d]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#434655] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#f3f4f5] border border-transparent rounded-xl px-4 py-2.5 text-sm text-[#191c1d] outline-none focus:border-[#004ac6] focus:bg-white transition-colors" />
    </div>
  );
}
