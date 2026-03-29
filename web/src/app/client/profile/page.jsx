'use client';
import { useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserProfile, uploadProfileImage } from '../../../services/profileService';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';

export default function ClientProfilePage() {
  const { user, userData } = useAuth();
  const [form, setForm] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    city: userData?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    await updateUserProfile(user.uid, form);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadProfileImage(user.uid, file);
    setUploading(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Mon profil</h1>
        <p className="text-[#434655] mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl shadow-card p-6 flex items-center gap-5">
        <div className="relative">
          <Avatar name={userData?.displayName} photoURL={userData?.photoURL} size="xl" />
          <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#004ac6] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors shadow-md">
            {uploading ? <Spinner size="xs" /> : <Camera size={14} />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
        <div>
          <p className="font-semibold text-[#191c1d]">{userData?.displayName || 'Votre nom'}</p>
          <p className="text-sm text-[#737686]">{userData?.email}</p>
          <span className="inline-block mt-1 text-xs bg-[#dbe1ff] text-[#004ac6] px-2 py-0.5 rounded-lg font-medium">Client</span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
        <h2 className="font-semibold text-[#191c1d]">Informations</h2>

        <Field label="Nom complet" value={form.displayName} onChange={v => handleChange('displayName', v)} placeholder="Jean Dupont" />
        <Field label="Téléphone" value={form.phone} onChange={v => handleChange('phone', v)} placeholder="+33 6 00 00 00 00" type="tel" />
        <Field label="Ville" value={form.city} onChange={v => handleChange('city', v)} placeholder="Paris" />

        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            Profil mis à jour avec succès.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#004ac6] text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Spinner size="xs" /> : <Save size={16} />}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#434655] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#f3f4f5] border border-transparent rounded-xl px-4 py-2.5 text-sm text-[#191c1d] outline-none focus:border-[#004ac6] focus:bg-white transition-colors"
      />
    </div>
  );
}
