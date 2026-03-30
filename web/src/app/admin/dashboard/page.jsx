'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, TrendingUp, CreditCard,
  FileText, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronRight,
} from 'lucide-react';
import { getDashboardStats } from '../../../services/adminService';
import Spinner from '../../../components/ui/Spinner';

function KpiCard({ icon: Icon, label, value, sub, color = 'bg-[#dbe1ff] text-[#004ac6]' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#737686] font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-[#191c1d] mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-[#737686] mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-[#004ac6]' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#434655] w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-[#f3f4f5] rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-[#191c1d] w-6 text-right">{value}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.success) setStats(res.stats);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-card">
        <p className="text-[#737686]">Impossible de charger les statistiques.</p>
      </div>
    );
  }

  const mrrFormatted = stats.mrr.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const maxPlan = Math.max(
    stats.subscriptionsByPlan.discovery,
    stats.subscriptionsByPlan.professional,
    stats.subscriptionsByPlan.premium,
    1
  );
  const maxMission = Math.max(
    stats.missions.open,
    stats.missions.accepted,
    stats.missions.completed,
    stats.missions.cancelled,
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Tableau de bord</h1>
        <p className="text-[#434655] mt-1">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* Pending verifications alert */}
      {stats.pendingVerifications > 0 && (
        <Link
          href="/admin/verifications"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800 flex-1">
            {stats.pendingVerifications} vérification{stats.pendingVerifications > 1 ? 's' : ''} en attente de validation
          </p>
          <ChevronRight size={16} className="text-amber-600" />
        </Link>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Utilisateurs"
          value={stats.totalUsers}
          sub={`${stats.clients} clients · ${stats.interpreters} interprètes`}
          color="bg-[#dbe1ff] text-[#004ac6]"
        />
        <KpiCard
          icon={TrendingUp}
          label="MRR"
          value={mrrFormatted}
          sub={`${stats.activeSubscriptions} abonnement${stats.activeSubscriptions > 1 ? 's' : ''} actif${stats.activeSubscriptions > 1 ? 's' : ''}`}
          color="bg-[#c5f8e1] text-[#006c49]"
        />
        <KpiCard
          icon={FileText}
          label="Missions totales"
          value={stats.missions.total}
          sub={`${stats.missions.open} en cours`}
          color="bg-yellow-100 text-yellow-700"
        />
        <KpiCard
          icon={UserCheck}
          label="Vérifications acceptées"
          value={stats.acceptedVerifications}
          sub={`${stats.pendingVerifications} en attente`}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missions breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#191c1d]">Missions</h2>
            <span className="text-xs text-[#737686]">{stats.missions.total} total</span>
          </div>
          <div className="space-y-3">
            <BarRow label="En cours" value={stats.missions.open} max={maxMission} color="bg-[#004ac6]" />
            <BarRow label="Acceptées" value={stats.missions.accepted} max={maxMission} color="bg-[#006c49]" />
            <BarRow label="Complétées" value={stats.missions.completed} max={maxMission} color="bg-emerald-500" />
            <BarRow label="Annulées" value={stats.missions.cancelled} max={maxMission} color="bg-red-400" />
          </div>
        </div>

        {/* Subscription plan breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#191c1d]">Abonnements actifs</h2>
            <span className="text-xs text-[#737686]">{stats.activeSubscriptions} total</span>
          </div>
          <div className="space-y-3">
            <BarRow label="Découverte" value={stats.subscriptionsByPlan.discovery} max={maxPlan} color="bg-slate-400" />
            <BarRow label="Professionnel" value={stats.subscriptionsByPlan.professional} max={maxPlan} color="bg-[#004ac6]" />
            <BarRow label="Premium" value={stats.subscriptionsByPlan.premium} max={maxPlan} color="bg-purple-500" />
          </div>
        </div>
      </div>

      {/* Verification summary */}
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#191c1d]">Vérifications d&apos;identité</h2>
          <Link href="/admin/verifications" className="text-sm text-[#004ac6] hover:underline flex items-center gap-1">
            Gérer <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <Clock size={20} className="text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">{stats.pendingVerifications}</p>
            <p className="text-xs text-amber-600 mt-1">En attente</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <CheckCircle size={20} className="text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">{stats.acceptedVerifications}</p>
            <p className="text-xs text-emerald-600 mt-1">Acceptées</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <XCircle size={20} className="text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.rejectedVerifications}</p>
            <p className="text-xs text-red-500 mt-1">Rejetées</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/users', icon: Users, label: 'Gérer les utilisateurs', color: 'bg-[#dbe1ff] text-[#004ac6]' },
          { href: '/admin/verifications', icon: UserCheck, label: 'Vérifications', color: 'bg-amber-100 text-amber-700' },
          { href: '/admin/subscriptions', icon: CreditCard, label: 'Abonnements', color: 'bg-[#c5f8e1] text-[#006c49]' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl p-5 shadow-card hover:shadow-deep transition-all hover:-translate-y-0.5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={20} />
            </div>
            <span className="font-medium text-[#191c1d] text-sm">{label}</span>
            <ChevronRight size={16} className="text-[#737686] ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
