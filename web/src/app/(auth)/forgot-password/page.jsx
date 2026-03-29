'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../../services/authService';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Erreur inattendue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1d] mb-2">Email envoyé !</h2>
        <p className="text-sm text-[#434655] mb-6">
          Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
        </p>
        <Link
          href="/login"
          className="text-sm text-[#004ac6] font-semibold hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#dbe1ff] rounded-xl flex items-center justify-center">
          <Mail size={24} className="text-[#004ac6]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#191c1d]">Mot de passe oublié</h1>
          <p className="text-sm text-[#434655]">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#ba1a1a]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Envoyer le lien
        </Button>
      </form>

      <p className="text-center text-sm text-[#434655] mt-6">
        <Link href="/login" className="text-[#004ac6] hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
