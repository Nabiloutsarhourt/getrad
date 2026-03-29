'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import AppShell from '../../components/layout/AppShell';
import Spinner from '../../components/ui/Spinner';
import Link from 'next/link';

export default function ClientLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading, isClient, isInterpreter, isAdmin, phoneVerified } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (isInterpreter) {
        router.push('/interpreter/dashboard');
      } else if (isAdmin) {
        router.push('/admin/dashboard');
      }
    }
  }, [loading, isAuthenticated, isClient, isInterpreter, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || (!isClient && !loading)) {
    return null;
  }

  // Phone verification gate
  if (phoneVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#dbe1ff] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h2 className="text-xl font-bold text-[#191c1d] mb-2">Vérifiez votre téléphone</h2>
          <p className="text-sm text-[#434655] mb-6">
            Vous devez vérifier votre numéro de téléphone pour accéder à GETRAD.
          </p>
          <Link
            href="/phone-verify"
            className="inline-flex items-center justify-center gap-2 bg-[#004ac6] text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Vérifier mon téléphone
          </Link>
        </div>
      </div>
    );
  }

  return <AppShell role="client">{children}</AppShell>;
}
