'use client';
import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, ExternalLink,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  getAllVerifications,
  approveVerification,
  rejectVerification,
} from '../../../services/adminService';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', icon: Clock, cls: 'bg-amber-100 text-amber-700' },
  accepte: { label: 'Accepté', icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700' },
  rejete: { label: 'Rejeté', icon: XCircle, cls: 'bg-red-100 text-red-600' },
};

const REJECTION_REASONS = [
  { value: 'document_illisible', label: 'Document illisible' },
  { value: 'document_expire', label: 'Document expiré' },
  { value: 'informations_incorrectes', label: 'Informations incorrectes' },
  { value: 'document_manquant', label: 'Document manquant' },
  { value: 'fraude_suspectee', label: 'Fraude suspectée' },
  { value: 'autre', label: 'Autre' },
];

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

function RejectModal({ verification, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('document_illisible');
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-deep w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#191c1d]">Rejeter la vérification</h2>
        <p className="text-sm text-[#434655]">
          Vous allez rejeter la demande de{' '}
          <span className="font-semibold">{verification.fullName || verification.id}</span>.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#434655]">Motif du rejet</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border border-[#e2e3e8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30 focus:border-[#004ac6]"
          >
            {REJECTION_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#434655]">Commentaire (optionnel)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Précisez la raison du rejet…"
            className="w-full border border-[#e2e3e8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30 focus:border-[#004ac6] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#e2e3e8] text-sm font-medium text-[#434655] hover:bg-[#f3f4f5] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(reason, comment)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="xs" /> : <XCircle size={15} />}
            Rejeter
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationCard({ verification, onApprove, onReject, acting }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[verification.status] || STATUS_CONFIG.en_attente;
  const Icon = cfg.icon;

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        <Avatar name={verification.fullName || verification.id} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#191c1d] truncate">{verification.fullName || '—'}</p>
          <p className="text-xs text-[#737686]">Soumis le {formatDate(verification.submittedAt)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
          <Icon size={13} />
          {cfg.label}
        </span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-8 h-8 rounded-lg bg-[#f3f4f5] flex items-center justify-center text-[#434655] hover:bg-[#e2e3e8] transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#f3f4f5] p-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: 'Téléphone', value: verification.phone },
              { label: 'Adresse', value: verification.address },
              { label: 'SIRET', value: verification.siretNumber },
              { label: 'Revu le', value: verification.reviewedAt ? formatDate(verification.reviewedAt) : null },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <p className="text-xs text-[#737686] font-medium">{label}</p>
                  <p className="text-[#191c1d] mt-0.5">{value}</p>
                </div>
              ) : null
            )}
          </div>

          {/* Rejection info */}
          {verification.status === 'rejete' && verification.rejectionReason && (
            <div className="bg-red-50 rounded-xl p-3 text-sm">
              <p className="font-medium text-red-700">
                Motif : {REJECTION_REASONS.find(r => r.value === verification.rejectionReason)?.label || verification.rejectionReason}
              </p>
              {verification.rejectionComment && (
                <p className="text-red-600 mt-1">{verification.rejectionComment}</p>
              )}
            </div>
          )}

          {/* Documents */}
          {verification.documents && verification.documents.length > 0 && (
            <div>
              <p className="text-xs text-[#737686] font-medium mb-2">Documents fournis</p>
              <div className="flex flex-wrap gap-2">
                {verification.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dbe1ff] text-[#004ac6] rounded-lg text-xs font-medium hover:bg-[#c5cdff] transition-colors"
                  >
                    <Eye size={13} />
                    {doc.type || `Document ${i + 1}`}
                    <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions (only for pending) */}
          {verification.status === 'en_attente' && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => onReject(verification)}
                disabled={acting}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle size={15} /> Rejeter
              </button>
              <button
                onClick={() => onApprove(verification.id)}
                disabled={acting}
                className="flex-1 py-2.5 rounded-xl bg-[#004ac6] text-white text-sm font-semibold hover:bg-[#003a9e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {acting ? <Spinner size="xs" /> : <CheckCircle size={15} />}
                Approuver
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');
  const [acting, setActing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await getAllVerifications();
    if (res.success) setVerifications(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const displayed = filter === 'all'
    ? verifications
    : verifications.filter(v => v.status === filter);

  const counts = {
    all: verifications.length,
    en_attente: verifications.filter(v => v.status === 'en_attente').length,
    accepte: verifications.filter(v => v.status === 'accepte').length,
    rejete: verifications.filter(v => v.status === 'rejete').length,
  };

  const handleApprove = async (uid) => {
    setActing(true);
    const res = await approveVerification(uid);
    if (res.success) {
      setVerifications(prev =>
        prev.map(v => v.id === uid ? { ...v, status: 'accepte', reviewedAt: new Date() } : v)
      );
    }
    setActing(false);
  };

  const handleRejectConfirm = async (reason, comment) => {
    if (!rejectTarget) return;
    setActing(true);
    const res = await rejectVerification(rejectTarget.id, reason, comment);
    if (res.success) {
      setVerifications(prev =>
        prev.map(v =>
          v.id === rejectTarget.id
            ? { ...v, status: 'rejete', reviewedAt: new Date(), rejectionReason: reason, rejectionComment: comment }
            : v
        )
      );
    }
    setActing(false);
    setRejectTarget(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Vérifications d&apos;identité</h1>
        <p className="text-[#434655] mt-1">{counts.en_attente} en attente de traitement</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <Chip label={`Tous (${counts.all})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        <Chip label={`En attente (${counts.en_attente})`} active={filter === 'en_attente'} onClick={() => setFilter('en_attente')} />
        <Chip label={`Acceptés (${counts.accepte})`} active={filter === 'accepte'} onClick={() => setFilter('accepte')} />
        <Chip label={`Rejetés (${counts.rejete})`} active={filter === 'rejete'} onClick={() => setFilter('rejete')} />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-card">
          <p className="text-[#737686]">Aucune vérification dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(v => (
            <VerificationCard
              key={v.id}
              verification={v}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              acting={acting}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          verification={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          loading={acting}
        />
      )}
    </div>
  );
}
