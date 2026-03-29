'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import AppShell from '../../components/layout/AppShell';
import Spinner from '../../components/ui/Spinner';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading, isAdmin, isClient, isInterpreter } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (isClient) {
        router.push('/client/home');
      } else if (isInterpreter) {
        router.push('/interpreter/dashboard');
      }
    }
  }, [loading, isAuthenticated, isAdmin, isClient, isInterpreter, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin && !loading)) {
    return null;
  }

  return <AppShell role="admin">{children}</AppShell>;
}
