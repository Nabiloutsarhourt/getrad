'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Briefcase, ChevronLeft } from 'lucide-react';
import { registerWithEmail } from '../../../services/authService';
import { trackSignUp } from '../../../lib/analytics';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const validate = () => {
    if (role === 'interpreter') {
      if (!form.firstName.trim()) return 'Le prénom est requis';
      if (!form.lastName.trim()) return 'Le nom est requis';
    } else {
      if (!form.displayName.trim()) return 'Le nom est requis';
    }
    if (!form.email.trim()) return "L'email est requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email invalide';
    if (!form.password) return 'Le mot de passe est requis';
    if (form.password.length < 6) return 'Mot de passe minimum 6 caractères';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas';
    if (!form.phone.trim()) return 'Le téléphone est requis';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const displayName = role === 'interpreter'
        ? `${form.firstName} ${form.lastName}`
        : form.displayName;

      const result = await registerWithEmail(form.email, form.password, {
        displayName,
        firstName: form.firstName,
        lastName: form.lastName,
        role,
        phone: form.phone,
        city: form.city,
      });

      if (result.success) {
        trackSignUp(role);
        router.push('/phone-verify');
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#191c1d]">Créer un compte</h1>
          <p className="text-sm text-[#434655] mt-1">Quel est votre rôle sur GETRAD ?</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => handleRoleSelect('client')}
            className="w-full p-5 border-2 border-[#c3c6d7] rounded-2xl text-left hover:border-[#004ac6] hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-[#dbe1ff] transition-colors">
                <User size={24} className="text-[#004ac6]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#191c1d]">Je suis un client</h3>
                <p className="text-sm text-[#434655]">Je cherche un interprète ou traducteur pour ma mission</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('interpreter')}
            className="w-full p-5 border-2 border-[#c3c6d7] rounded-2xl text-left hover:border-[#006c49] hover:bg-green-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-[#c5f8e1] transition-colors">
                <Briefcase size={24} className="text-[#006c49]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#191c1d]">Je suis interprète / traducteur</h3>
                <p className="text-sm text-[#434655]">Je propose mes services professionnels sur la plateforme</p>
              </div>
            </div>
          </button>
        </div>
        <p className="text-center text-sm text-[#434655] mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#004ac6] font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setStep(1)}
        className="flex items-center gap-1 text-sm text-[#434655] hover:text-[#191c1d] mb-4"
      >
        <ChevronLeft size={16} />
        Retour
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#191c1d]">
          {role === 'interpreter' ? 'Compte interprète' : 'Compte client'}
        </h1>
        <p className="text-sm text-[#434655] mt-1">Renseignez vos informations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {role === 'interpreter' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom *"
              placeholder="Jean"
              value={form.firstName}
              onChange={(e) => updateForm('firstName', e.target.value)}
            />
            <Input
              label="Nom *"
              placeholder="Dupont"
              value={form.lastName}
              onChange={(e) => updateForm('lastName', e.target.value)}
            />
          </div>
        ) : (
          <Input
            label="Nom complet *"
            placeholder="Jean Dupont"
            value={form.displayName}
            onChange={(e) => updateForm('displayName', e.target.value)}
          />
        )}

        <Input
          label="Email *"
          type="email"
          placeholder="votre@email.com"
          value={form.email}
          onChange={(e) => updateForm('email', e.target.value)}
          autoComplete="email"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Téléphone *"
            type="tel"
            placeholder="+33 6 00 00 00 00"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
          />
          <Input
            label="Ville"
            placeholder="Paris"
            value={form.city}
            onChange={(e) => updateForm('city', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191c1d]">Mot de passe *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 caractères"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#c3c6d7] text-sm text-[#191c1d] bg-white placeholder:text-[#737686] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Input
          label="Confirmer le mot de passe *"
          type="password"
          placeholder="Répétez votre mot de passe"
          value={form.confirmPassword}
          onChange={(e) => updateForm('confirmPassword', e.target.value)}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#ba1a1a]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Créer mon compte
        </Button>
      </form>

      <p className="text-center text-sm text-[#434655] mt-4">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-[#004ac6] font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
