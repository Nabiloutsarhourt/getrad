'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, CreditCard, TrendingUp, Users } from 'lucide-react';
import { getAllSubscriptions } from '../../../services/adminService';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';

const PLAN_LABELS = {
  discovery: 'Découverte',
  professional: 'Professionnel',
  premium: 'Premium',
};
const PLAN_PRICES = { discovery: 19.99, professional: 39.99, premium: 69.99 };
const PLAN_COLORS = {
  discovery: 'bg-slate-100 text-slate-700',
  professional: 'bg-[#dbe1ff] text-[#004ac6]',
  premium: 'bg-purple-100 text-purple-700',
};
const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  trialing: 'bg-amber-100 text-amber-700',
  canceled: 'bg-red-100 text-red-600',
  past_due: 'bg-orange-100 text-orange-700',
  incomplete: 'bg-gray-100 text-gray-600',
};
const STATUS_LABELS = {
  active: 'Actif',
  trialing: 'Essai',
  canceled: 'Annulé',
  past_due: 'Paiement en retard',
  incomplete: 'Incomplet',
};

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-[#004ac6] text-white'
          : 'bg-white text-[#434655] border border-[#e2e3e8] hover:border-[#004ac6]'
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getAllSubscriptions();
      if (res.success) setSubscriptions(res.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = subscriptions;
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (planFilter !== 'all') list = list.filter(s => s.plan === planFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.user?.displayName || '').toLowerCase().includes(q) ||
        (s.user?.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [subscriptions, planFilter, statusFilter, search]);

  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0);

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Abonnements</h1>
        <p className="text-[#434655] mt-1">{subscriptions.length} abonnements au total</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c5f8e1] text-[#006c49] rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-[#737686]">MRR</p>
            <p className="text-lg font-bold text-[#191c1d]">
              {mrr.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 bg-[#dbe1ff] text-[#004ac6] rounded-xl flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-[#737686]">Actifs</p>
            <p className="text-lg font-bold text-[#191c1d]">{activeSubs.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-xs text-[#737686]">Total</p>
            <p className="text-lg font-bold text-[#191c1d]">{subscriptions.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" />
          <input
            type="text"
            placeholder="Rechercher par nom ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e2e3e8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30 focus:border-[#004ac6]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip label="Tous statuts" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <Chip label="Actifs" active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
          <Chip label="Essai" active={statusFilter === 'trialing'} onClick={() => setStatusFilter('trialing')} />
          <Chip label="Annulés" active={statusFilter === 'canceled'} onClick={() => setStatusFilter('canceled')} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Chip label="Tous les plans" active={planFilter === 'all'} onClick={() => setPlanFilter('all')} />
        {['discovery', 'professional', 'premium'].map(p => (
          <Chip key={p} label={PLAN_LABELS[p]} active={planFilter === p} onClick={() => setPlanFilter(p)} />
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-card">
          <p className="text-[#737686]">Aucun abonnement trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f3f4f5] text-[#737686] text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Interprète</th>
                  <th className="text-left px-5 py-3 font-medium">Plan</th>
                  <th className="text-left px-5 py-3 font-medium">Statut</th>
                  <th className="text-left px-5 py-3 font-medium">Montant/mois</th>
                  <th className="text-left px-5 py-3 font-medium">Depuis le</th>
                  <th className="text-left px-5 py-3 font-medium">Fin période</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={sub.user?.displayName || sub.id} photoURL={sub.user?.photoURL} size="sm" />
                        <div>
                          <p className="font-medium text-[#191c1d]">{sub.user?.displayName || '—'}</p>
                          <p className="text-xs text-[#737686]">{sub.user?.email || sub.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${PLAN_COLORS[sub.plan] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                        {PLAN_LABELS[sub.plan] || sub.plan || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                        {STATUS_LABELS[sub.status] || sub.status || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#191c1d]">
                      {PLAN_PRICES[sub.plan] ? `${PLAN_PRICES[sub.plan].toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-5 py-4 text-[#434655]">{formatDate(sub.currentPeriodStart || sub.createdAt)}</td>
                    <td className="px-5 py-4 text-[#434655]">{formatDate(sub.currentPeriodEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#f3f4f5]">
            {filtered.map(sub => (
              <div key={sub.id} className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar name={sub.user?.displayName || sub.id} photoURL={sub.user?.photoURL} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#191c1d] truncate">{sub.user?.displayName || '—'}</p>
                    <p className="text-xs text-[#737686] truncate">{sub.user?.email || sub.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${PLAN_COLORS[sub.plan] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                    {PLAN_LABELS[sub.plan] || sub.plan || '—'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                    {STATUS_LABELS[sub.status] || sub.status || '—'}
                  </span>
                  <span className="text-xs font-semibold text-[#191c1d] ml-auto">
                    {PLAN_PRICES[sub.plan] ? `${PLAN_PRICES[sub.plan].toFixed(2)} €/mois` : '—'}
                  </span>
                </div>
                <p className="text-xs text-[#737686]">Depuis le {formatDate(sub.currentPeriodStart || sub.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
