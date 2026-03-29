'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import AppShell from '../../components/layout/AppShell';
import Spinner from '../../components/ui/Spinner';

export default function InterpreterLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading, isClient, isInterpreter, isAdmin, isVerified, hasActiveSubscription, verification } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (isClient) {
        router.push('/client/home');
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

  if (!isAuthenticated || (!isInterpreter && !loading)) {
    return null;
  }

  return <AppShell role="interpreter">{children}</AppShell>;
}
