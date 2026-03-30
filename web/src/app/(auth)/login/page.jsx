'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { loginWithEmail } from '../../../services/authService';
import { trackLogin } from '../../../lib/analytics';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        trackLogin();
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#191c1d]">Connexion</h1>
        <p className="text-sm text-[#434655] mt-1">Bienvenue sur GETRAD</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191c1d]">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#c3c6d7] text-sm text-[#191c1d] bg-white placeholder:text-[#737686] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#434655]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#ba1a1a]">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-[#004ac6] hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Se connecter
        </Button>
      </form>

      <p className="text-center text-sm text-[#434655] mt-6">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-[#004ac6] font-semibold hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
