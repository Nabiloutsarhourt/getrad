'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Phone, ArrowRight, ChevronLeft } from 'lucide-react';
import { auth, db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function PhoneVerifyPage() {
  const router = useRouter();
  const { user, userData, isClient, isInterpreter, isAdmin } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);

  // Pre-fill phone from user data
  useEffect(() => {
    if (userData?.phone) {
      setPhone(userData.phone);
    }
  }, [userData]);

  // Init invisible recaptcha on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            if (window.recaptchaVerifier) {
              window.recaptchaVerifier.clear();
              window.recaptchaVerifier = null;
            }
          },
        });
      } catch (err) {
        console.error('Recaptcha init error:', err);
      }
    }
    return () => {
      // Cleanup on unmount
    };
  }, []);

  const toE164 = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('0')) return '+33' + cleaned.slice(1);
    return '+33' + cleaned;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    setLoading(true);
    try {
      const e164 = toE164(phone);

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, e164, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep('code');
      setSuccess(`Code envoyé au ${e164}`);
    } catch (err) {
      console.error('Erreur envoi SMS:', err);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = null;
      }
      setError('Erreur lors de l\'envoi du code. Vérifiez votre numéro.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6) {
      setError('Veuillez entrer le code à 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      await confirmationResult.confirm(code);
      // Update Firestore phoneVerified flag on the original user
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { phoneVerified: true, phone: toE164(phone) });
      }
      setSuccess('Téléphone vérifié avec succès !');

      setTimeout(() => {
        if (isAdmin) router.push('/admin/dashboard');
        else if (isInterpreter) router.push('/interpreter/dashboard');
        else router.push('/client/home');
      }, 1000);
    } catch (err) {
      console.error('Erreur vérification code:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Code incorrect. Veuillez réessayer.');
      } else {
        setError('Erreur lors de la vérification.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Allow skipping for now (can be enforced later)
    if (isAdmin) router.push('/admin/dashboard');
    else if (isInterpreter) router.push('/interpreter/dashboard');
    else router.push('/client/home');
  };

  return (
    <div>
      {/* Invisible recaptcha container */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#dbe1ff] rounded-xl flex items-center justify-center">
          <Phone size={24} className="text-[#004ac6]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#191c1d]">Vérification du téléphone</h1>
          <p className="text-sm text-[#434655]">
            {step === 'phone' ? 'Entrez votre numéro pour recevoir un code' : 'Entrez le code reçu par SMS'}
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 mb-4">
          {success}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <Input
            label="Numéro de téléphone"
            type="tel"
            placeholder="+33 6 00 00 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Format international (+33...) ou national (06...)"
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#ba1a1a]">
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Envoyer le code SMS
            <ArrowRight size={18} />
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-center text-sm text-[#737686] hover:text-[#434655] py-2"
          >
            Passer cette étape
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <button
            type="button"
            onClick={() => { setStep('phone'); setError(''); }}
            className="flex items-center gap-1 text-sm text-[#434655] hover:text-[#191c1d] mb-2"
          >
            <ChevronLeft size={16} />
            Changer de numéro
          </button>

          <Input
            label="Code de vérification"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            hint="Code à 6 chiffres reçu par SMS"
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-[#ba1a1a]">
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Vérifier
          </Button>
          <button
            type="button"
            onClick={handleSendCode}
            className="w-full text-center text-sm text-[#004ac6] hover:underline py-1"
          >
            Renvoyer le code
          </button>
        </form>
      )}
    </div>
  );
}
