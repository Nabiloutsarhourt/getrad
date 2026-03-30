'use client';
import { useState } from 'react';
import { Check, ExternalLink, Zap } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { startCheckout, openCustomerPortal, PLAN_LABELS, PLAN_FEATURES } from '../../../services/subscriptionService';
import { trackSubscriptionStarted, trackSubscriptionManaged } from '../../../lib/analytics';
import Spinner from '../../../components/ui/Spinner';

const PLANS = ['discovery', 'professional', 'premium'];
const PLAN_HIGHLIGHT = { discovery: false, professional: true, premium: false };

export default function InterpreterSubscriptionPage() {
  const { subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const isActive = ['active', 'trialing'].includes(subscription?.status);

  const handleCheckout = async (plan) => {
    setLoadingPlan(plan);
    trackSubscriptionStarted(plan);
    await startCheckout(plan);
    setLoadingPlan(null);
  };

  const handlePortal = async () => {
    setOpeningPortal(true);
    trackSubscriptionManaged();
    await openCustomerPortal();
    setOpeningPortal(false);
  };

  const periodEnd = subscription?.currentPeriodEnd?.toDate?.().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const trialEnd = subscription?.trialEnd?.toDate?.().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Abonnement</h1>
        <p className="text-[#434655] mt-1">Choisissez le plan adapté à votre activité</p>
      </div>

      {/* Current subscription status */}
      {isActive && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-green-800">
              Plan {PLAN_LABELS[subscription.plan]} — {subscription.status === 'trialing' ? 'Essai gratuit' : 'Actif'}
            </p>
            {subscription.status === 'trialing' && trialEnd && (
              <p className="text-xs text-green-700 mt-0.5">Essai jusqu&apos;au {trialEnd}</p>
            )}
            {periodEnd && subscription.status !== 'trialing' && (
              <p className="text-xs text-green-700 mt-0.5">
                {subscription.cancelAtPeriodEnd ? `Résiliation le ${periodEnd}` : `Renouvellement le ${periodEnd}`}
              </p>
            )}
            {subscription.missionsLimit !== -1 && (
              <p className="text-xs text-green-700 mt-0.5">
                {subscription.missionsViewed || 0} / {subscription.missionsLimit} missions vues ce mois
              </p>
            )}
          </div>
          <button
            onClick={handlePortal}
            disabled={openingPortal}
            className="flex items-center gap-2 text-sm font-semibold text-green-800 bg-white border border-green-300 px-4 py-2 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {openingPortal ? <Spinner size="xs" /> : <ExternalLink size={14} />}
            Gérer
          </button>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const features = PLAN_FEATURES[plan];
          const highlight = PLAN_HIGHLIGHT[plan];
          const isCurrent = subscription?.plan === plan && isActive;

          return (
            <div
              key={plan}
              className={`bg-white rounded-2xl shadow-card p-6 flex flex-col ${
                highlight ? 'ring-2 ring-[#004ac6]' : ''
              }`}
            >
              {highlight && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#004ac6] mb-3">
                  <Zap size={13} fill="currentColor" /> RECOMMANDÉ
                </div>
              )}
              <h3 className="text-lg font-bold text-[#191c1d]">{PLAN_LABELS[plan]}</h3>
              <p className="text-2xl font-bold text-[#004ac6] mt-1">{features.price}</p>
              <div className="flex-1 space-y-2 mt-4 mb-6">
                {[features.missions, features.candidatures, features.trial, features.priority,
                  ...(features.badge ? ['Badge vérifié'] : [])
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[#434655]">
                    <Check size={14} className="text-[#006c49] shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <div className="text-center text-sm font-semibold text-green-700 bg-green-50 py-2.5 rounded-xl">
                  Plan actuel
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={!!loadingPlan}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
                    highlight
                      ? 'bg-[#004ac6] text-white hover:bg-blue-800'
                      : 'bg-[#f3f4f5] text-[#191c1d] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {loadingPlan === plan ? <Spinner size="xs" /> : null}
                  {loadingPlan === plan ? 'Redirection...' : 'Choisir ce plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-[#737686]">
        Paiement sécurisé via Stripe. Résiliable à tout moment depuis le portail.
      </p>
    </div>
  );
}
