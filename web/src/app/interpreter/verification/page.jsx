'use client';
import { useState } from 'react';
import { Upload, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { submitVerification, uploadVerificationDocument } from '../../../services/verificationService';
import Spinner from '../../../components/ui/Spinner';

export default function InterpreterVerificationPage() {
  const { user, verification } = useAuth();
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', siretNumber: '' });
  const [files, setFiles] = useState({ kbis: null, identite: null });
  const [uploading, setUploading] = useState({ kbis: false, identite: false });
  const [uploadedURLs, setUploadedURLs] = useState({ kbisURL: '', identiteURL: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles(p => ({ ...p, [type]: file }));
  };

  const handleUpload = async (type) => {
    const file = files[type];
    if (!file || !user) return;
    setUploading(p => ({ ...p, [type]: true }));
    const result = await uploadVerificationDocument(user.uid, type, file);
    if (result.success) {
      setUploadedURLs(p => ({ ...p, [`${type}URL`]: result.url }));
    }
    setUploading(p => ({ ...p, [type]: false }));
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.address) {
      setError('Veuillez remplir tous les champs obligatoires.'); return;
    }
    setSubmitting(true); setError('');
    const result = await submitVerification(user.uid, { ...form, ...uploadedURLs });
    setSubmitting(false);
    if (result.success) setSuccess(true);
    else setError(result.error || 'Erreur lors de la soumission.');
  };

  // Already submitted
  if (verification) {
    return (
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1d]">Vérification d&apos;identité</h1>
          <p className="text-[#434655] mt-1">Statut de votre dossier</p>
        </div>

        <div className={`rounded-2xl p-6 border ${
          verification.status === 'accepte' ? 'bg-green-50 border-green-200' :
          verification.status === 'rejete' ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {verification.status === 'accepte' && <CheckCircle size={24} className="text-green-600" />}
            {verification.status === 'en_attente' && <Clock size={24} className="text-amber-600" />}
            {verification.status === 'rejete' && <XCircle size={24} className="text-red-500" />}
            <div>
              <p className="font-bold text-[#191c1d]">
                {verification.status === 'accepte' ? 'Dossier validé' :
                 verification.status === 'en_attente' ? 'Dossier en cours d\'examen' : 'Dossier refusé'}
              </p>
              {verification.status === 'en_attente' && (
                <p className="text-sm text-amber-700 mt-0.5">Délai habituel : 48 h ouvrées</p>
              )}
            </div>
          </div>
          {verification.status === 'rejete' && verification.rejectionReason && (
            <div className="bg-white rounded-xl p-4 mt-2">
              <p className="text-sm font-semibold text-red-700">Motif : {verification.rejectionReason}</p>
              {verification.rejectionComment && (
                <p className="text-sm text-red-600 mt-1">{verification.rejectionComment}</p>
              )}
              <p className="text-xs text-[#737686] mt-3">Vous pouvez soumettre un nouveau dossier après correction.</p>
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <Step done label="Dossier soumis" sub="Vos documents ont été reçus." />
          <Step done={verification.status !== 'en_attente'} active={verification.status === 'en_attente'} label="Vérification en cours" sub="Notre équipe examine votre dossier." />
          <Step done={verification.status === 'accepte'} label="Accès complet" sub="Profil visible et missions disponibles." last />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl text-center space-y-4 py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={36} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1d]">Dossier soumis !</h2>
        <p className="text-[#434655]">Notre équipe examinera votre dossier dans les 48 h ouvrées. Vous recevrez une notification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Vérification d&apos;identité</h1>
        <p className="text-[#434655] mt-1">Soumettez votre dossier pour accéder aux missions</p>
      </div>

      {/* Info */}
      <div className="bg-[#dbe1ff] rounded-2xl p-4 text-sm text-[#004ac6] flex items-start gap-3">
        <FileText size={18} className="shrink-0 mt-0.5" />
        <p>La vérification est obligatoire pour que votre profil soit visible et que vous puissiez recevoir des missions.</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
        <h2 className="font-semibold text-[#191c1d]">Informations personnelles</h2>
        <Field label="Nom complet *" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))} />
        <Field label="Téléphone *" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} type="tel" />
        <Field label="Adresse *" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
        <Field label="N° SIRET (si applicable)" value={form.siretNumber} onChange={v => setForm(p => ({ ...p, siretNumber: v }))} />
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
        <h2 className="font-semibold text-[#191c1d]">Documents</h2>
        {[
          { key: 'kbis', label: 'Extrait KBIS ou équivalent', urlKey: 'kbisURL' },
          { key: 'identite', label: "Pièce d'identité", urlKey: 'identiteURL' },
        ].map(({ key, label, urlKey }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-[#434655] mb-2">{label}</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-[#f3f4f5] rounded-xl text-sm text-[#434655] cursor-pointer hover:bg-[#e7e8e9] transition-colors">
                <Upload size={15} />
                {files[key] ? files[key].name : 'Choisir un fichier'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileChange(key, e)} />
              </label>
              {files[key] && !uploadedURLs[urlKey] && (
                <button onClick={() => handleUpload(key)} disabled={uploading[key]}
                  className="text-sm text-[#004ac6] font-semibold hover:underline disabled:opacity-50 flex items-center gap-1">
                  {uploading[key] ? <Spinner size="xs" /> : null}
                  {uploading[key] ? 'Upload...' : 'Envoyer'}
                </button>
              )}
              {uploadedURLs[urlKey] && (
                <span className="flex items-center gap-1 text-sm text-green-700"><CheckCircle size={14} /> Envoyé</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
      )}

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-[#004ac6] text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50">
        {submitting ? <Spinner size="xs" /> : null}
        {submitting ? 'Envoi en cours...' : 'Soumettre le dossier'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#434655] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#f3f4f5] border border-transparent rounded-xl px-4 py-2.5 text-sm text-[#191c1d] outline-none focus:border-[#004ac6] focus:bg-white transition-colors" />
    </div>
  );
}

function Step({ label, sub, done, active, last }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          done ? 'bg-green-500 text-white' : active ? 'bg-[#004ac6] text-white' : 'bg-[#e7e8e9] text-[#737686]'
        }`}>
          {done ? <CheckCircle size={14} /> : <span className="text-xs">·</span>}
        </div>
        {!last && <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-green-300' : 'bg-[#e7e8e9]'}`} />}
      </div>
      <div className="pb-4 pt-0.5">
        <p className={`text-sm font-medium ${done || active ? 'text-[#191c1d]' : 'text-[#737686]'}`}>{label}</p>
        <p className="text-xs text-[#737686] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
