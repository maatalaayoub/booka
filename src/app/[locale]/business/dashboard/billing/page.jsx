'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CreditCard, Loader2, Check, RefreshCw, Sparkles, Receipt,
} from 'lucide-react';

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-600 border-green-200',
  trialing: 'bg-blue-50 text-blue-600 border-blue-200',
  past_due: 'bg-amber-50 text-amber-600 border-amber-200',
  canceled: 'bg-gray-50 text-gray-500 border-gray-200',
  expired: 'bg-red-50 text-red-600 border-red-200',
};

const PAYMENT_STATUS_COLORS = {
  paid: 'bg-green-50 text-green-600',
  pending: 'bg-amber-50 text-amber-600',
  failed: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-50 text-gray-500',
};

export default function BillingPage() {
  const { t } = useLanguage();
  const params = useParams();
  const locale = params.locale || 'en';

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingPlanId, setChangingPlanId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/business/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || null);
        setPlans(data.plans || []);
        setPayments(data.payments || []);
      }
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleChoosePlan = async (planId) => {
    setChangingPlanId(planId);
    try {
      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setChangingPlanId(null);
    }
  };

  const formatMoney = (amount, currency) =>
    `${Number(amount || 0).toLocaleString()} ${currency || 'MAD'}`;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const currentPlan = subscription?.subscription_plans || null;
  const currentPlanId = currentPlan?.id || null;
  const subStatus = subscription?.status;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-[#364153]" />
            {t('dashboard.billing.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('dashboard.billing.subtitle')}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title={t('admin.refresh')}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t('admin.loading')}</span>
        </div>
      ) : (
        <>
          {/* Current plan */}
          <div className="bg-white rounded-[8px] border border-gray-200 p-5 mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {t('dashboard.billing.currentPlan')}
            </p>
            {currentPlan ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{currentPlan.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[subStatus] || STATUS_COLORS.canceled}`}>
                      {t(`dashboard.billing.status.${subStatus}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatMoney(currentPlan.price, currentPlan.currency)}/
                    {currentPlan.billing_interval === 'year'
                      ? t('dashboard.billing.perYear')
                      : t('dashboard.billing.perMonth')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{t('dashboard.billing.renewsOn')}</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(subscription.current_period_end)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('dashboard.billing.noPlan')}</p>
            )}
          </div>

          {/* Available plans */}
          {plans.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                {t('dashboard.billing.availablePlans')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentPlanId && subStatus === 'active';
                  const isBusy = changingPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-[8px] border p-5 flex flex-col ${
                        isCurrent ? 'border-[#364153] ring-1 ring-[#364153]/20 bg-[#364153]/[0.02]' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="text-lg font-bold text-gray-900">{plan.name}</p>
                      <p className="mt-1">
                        <span className="text-2xl font-extrabold text-gray-900">
                          {Number(plan.price).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500"> {plan.currency}/
                          {plan.billing_interval === 'year'
                            ? t('dashboard.billing.perYear')
                            : t('dashboard.billing.perMonth')}
                        </span>
                      </p>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-2 flex-1">{plan.description}</p>
                      )}
                      <button
                        onClick={() => handleChoosePlan(plan.id)}
                        disabled={isCurrent || isBusy}
                        className={`mt-4 w-full py-2 rounded-[6px] text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-400 cursor-default'
                            : 'bg-[#364153] text-white hover:bg-[#2b3542]'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCurrent ? (
                          <><Check className="w-4 h-4" /> {t('dashboard.billing.currentPlanBadge')}</>
                        ) : (
                          t('dashboard.billing.choosePlan')
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment history */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4 text-gray-500" />
              {t('dashboard.billing.paymentHistory')}
            </h2>
            {payments.length === 0 ? (
              <div className="bg-white rounded-[8px] border border-gray-200 text-center py-10 text-gray-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">{t('dashboard.billing.noPayments')}</p>
              </div>
            ) : (
              <div className="bg-white rounded-[8px] border border-gray-200 divide-y divide-gray-100">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatMoney(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(p.paid_at || p.created_at)}
                        {p.payment_method ? ` · ${p.payment_method}` : ''}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PAYMENT_STATUS_COLORS[p.status] || 'bg-gray-50 text-gray-500'}`}>
                      {t(`dashboard.billing.payStatus.${p.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
