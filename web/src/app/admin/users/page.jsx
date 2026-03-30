'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, UserX, UserCheck, ShieldAlert, Shield, ChevronDown } from 'lucide-react';
import { getAllUsers, suspendUser } from '../../../services/adminService';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';

const ROLE_LABELS = { client: 'Client', interpreter: 'Interprète', admin: 'Admin' };
const ROLE_COLORS = {
  client: 'bg-[#dbe1ff] text-[#004ac6]',
  interpreter: 'bg-[#c5f8e1] text-[#006c49]',
  admin: 'bg-purple-100 text-purple-700',
};
const VERIF_LABELS = {
  en_attente: 'En attente',
  accepte: 'Accepté',
  rejete: 'Rejeté',
};
const VERIF_COLORS = {
  en_attente: 'bg-amber-100 text-amber-700',
  accepte: 'bg-emerald-100 text-emerald-700',
  rejete: 'bg-red-100 text-red-600',
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [suspending, setSuspending] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await getAllUsers();
    if (res.success) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, search]);

  const handleSuspend = async (user) => {
    setSuspending(user.id);
    const res = await suspendUser(user.id, !user.suspended);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: !u.suspended } : u));
    }
    setSuspending(null);
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Utilisateurs</h1>
        <p className="text-[#434655] mt-1">{users.length} comptes enregistrés</p>
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
          {['all', 'client', 'interpreter', 'admin'].map(r => (
            <Chip
              key={r}
              label={r === 'all' ? 'Tous' : ROLE_LABELS[r]}
              active={roleFilter === r}
              onClick={() => setRoleFilter(r)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-card">
          <p className="text-[#737686]">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f3f4f5] text-[#737686] text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Utilisateur</th>
                  <th className="text-left px-5 py-3 font-medium">Rôle</th>
                  <th className="text-left px-5 py-3 font-medium">Vérification</th>
                  <th className="text-left px-5 py-3 font-medium">Inscrit le</th>
                  <th className="text-left px-5 py-3 font-medium">Statut</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {filtered.map(user => {
                  const verifStatus = user.interpreterProfile?.verificationStatus;
                  return (
                    <tr key={user.id} className={`hover:bg-[#fafafa] transition-colors ${user.suspended ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.displayName || user.email || 'U'} photoURL={user.photoURL} size="sm" />
                          <div>
                            <p className="font-medium text-[#191c1d]">{user.displayName || '—'}</p>
                            <p className="text-xs text-[#737686]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                          {ROLE_LABELS[user.role] || user.role || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {verifStatus ? (
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${VERIF_COLORS[verifStatus] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                            {VERIF_LABELS[verifStatus] || verifStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-[#737686]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#434655]">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-4">
                        {user.suspended ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                            <ShieldAlert size={12} /> Suspendu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <Shield size={12} /> Actif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleSuspend(user)}
                            disabled={suspending === user.id}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              user.suspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            } disabled:opacity-50`}
                          >
                            {suspending === user.id ? (
                              <Spinner size="xs" />
                            ) : user.suspended ? (
                              <><UserCheck size={13} /> Réactiver</>
                            ) : (
                              <><UserX size={13} /> Suspendre</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#f3f4f5]">
            {filtered.map(user => {
              const verifStatus = user.interpreterProfile?.verificationStatus;
              return (
                <div key={user.id} className={`p-4 space-y-3 ${user.suspended ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.displayName || user.email || 'U'} photoURL={user.photoURL} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#191c1d] truncate">{user.displayName || '—'}</p>
                      <p className="text-xs text-[#737686] truncate">{user.email}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                      {ROLE_LABELS[user.role] || user.role || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {verifStatus && (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${VERIF_COLORS[verifStatus] || 'bg-[#f3f4f5] text-[#434655]'}`}>
                          {VERIF_LABELS[verifStatus] || verifStatus}
                        </span>
                      )}
                      {user.suspended && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                          <ShieldAlert size={12} /> Suspendu
                        </span>
                      )}
                    </div>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleSuspend(user)}
                        disabled={suspending === user.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          user.suspended
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        } disabled:opacity-50`}
                      >
                        {suspending === user.id ? (
                          <Spinner size="xs" />
                        ) : user.suspended ? (
                          <><UserCheck size={13} /> Réactiver</>
                        ) : (
                          <><UserX size={13} /> Suspendre</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
