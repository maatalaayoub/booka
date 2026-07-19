'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CreditCard, Loader2, Search, RefreshCw, Store, User, Wallet, CheckCircle2,
} from 'lucide-react';
import { useParams } from 'next/navigation';

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-600 border-green-200',
  trialing: 'bg-blue-50 text-blue-600 border-blue-200',
  past_due: 'bg-amber-50 text-amber-600 border-amber-200',
  canceled: 'bg-gray-50 text-gray-500 border-gray-200',
  expired: 'bg-red-50 text-red-600 border-red-200',
};

export default function AdminSubscriptionsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const locale = params.locale || 'en';
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, activeCount: 0, currency: 'MAD' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search.trim()) p.set('search', search.trim());
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/admin/subscriptions?${p}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || { totalRevenue: 0, activeCount: 0, currency: 'MAD' });
      }
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const getBusinessName = (sub) => {
    const info = sub.business_info;
    return (
      info?.shop_salon_info?.business_name ||
      info?.mobile_service_info?.business_name ||
      info?.users?.username ||
      info?.users?.email ||
      '—'
    );
  };

  const getLatestPayment = (sub) => {
    const payments = sub.subscription_payments || [];
    if (payments.length === 0) return null;
    return [...payments].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];
  };

  const formatMoney = (amount, currency) =>
    `${Number(amount || 0).toLocaleString()} ${currency || 'MAD'}`;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-[#364153]" />
            {t('admin.subscriptions.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('admin.subscriptions.subtitle')}</p>
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-[5px] border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">{t('admin.subscriptions.totalRevenue')}</p>
            <p className="text-xl font-bold text-gray-900">
              {formatMoney(stats.totalRevenue, stats.currency)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-[5px] border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">{t('admin.subscriptions.activeSubscriptions')}</p>
            <p className="text-xl font-bold text-gray-900">{stats.activeCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[5px] border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.subscriptions.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[#364153]/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[#364153]/30 bg-white"
          >
            <option value="">{t('admin.subscriptions.allStatuses')}</option>
            <option value="active">{t('admin.subscriptions.statusActive')}</option>
            <option value="trialing">{t('admin.subscriptions.statusTrialing')}</option>
            <option value="past_due">{t('admin.subscriptions.statusPastDue')}</option>
            <option value="canceled">{t('admin.subscriptions.statusCanceled')}</option>
            <option value="expired">{t('admin.subscriptions.statusExpired')}</option>
          </select>
        </div>
      </div>

      {/* Subscriptions list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t('admin.loading')}</span>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CreditCard className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">{t('admin.subscriptions.noResults')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[5px] border border-gray-200 divide-y divide-gray-100">
          {subscriptions.map((sub) => {
            const plan = sub.subscription_plans;
            const payment = getLatestPayment(sub);
            const statusColor = STATUS_COLORS[sub.status] || STATUS_COLORS.canceled;
            return (
              <div key={sub.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{getBusinessName(sub)}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {plan?.name || t('admin.subscriptions.noPlan')}
                    {plan && (
                      <> · {formatMoney(plan.price, plan.currency)}/{plan.billing_interval === 'year'
                        ? t('admin.subscriptions.perYear')
                        : t('admin.subscriptions.perMonth')}</>
                    )}
                  </p>
                </div>

                {/* Latest payment */}
                <div className="hidden md:block text-right">
                  <p className="text-xs text-gray-400">{t('admin.subscriptions.lastPayment')}</p>
                  <p className="text-sm font-medium text-gray-700">
                    {payment ? formatMoney(payment.amount, payment.currency) : '—'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {payment ? formatDate(payment.paid_at || payment.created_at) : ''}
                  </p>
                </div>

                {/* Renewal date */}
                <div className="hidden lg:block text-right">
                  <p className="text-xs text-gray-400">{t('admin.subscriptions.renewsOn')}</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(sub.current_period_end)}</p>
                </div>

                {/* Status badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor}`}>
                  {t(`admin.subscriptions.status${sub.status.charAt(0).toUpperCase() + sub.status.slice(1).replace(/_(\w)/g, (m, c) => c.toUpperCase())}`)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
