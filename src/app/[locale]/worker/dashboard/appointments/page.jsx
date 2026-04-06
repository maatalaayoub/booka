'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorker } from '@/contexts/WorkerContext';
import {
  Calendar,
  RotateCw,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function WorkerAppointmentsPage() {
  const { t, isRTL } = useLanguage();
  const { activeMembership, permissions } = useWorker();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // appointmentId being acted on
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });

  const fetchAppointments = useCallback(async () => {
    if (!activeMembership?.businessInfoId || !permissions?.canManageAppointments) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/worker/appointments?businessId=${activeMembership.businessInfoId}`
      );
      if (res.ok) {
        const body = await res.json();
        setAppointments(body.data || body || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeMembership?.businessInfoId, permissions?.canManageAppointments]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleAction = async (appointmentId, newStatus) => {
    if (!activeMembership?.businessInfoId) return;
    setActionLoading(appointmentId);
    try {
      const res = await fetch('/api/worker/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          businessId: activeMembership.businessInfoId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        // Optimistic update
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        );
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  // Day navigation
  const changeDay = (offset) => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + offset);
    setSelectedDay(d.toISOString().slice(0, 10));
  };

  // Filter by selected day
  const dayAppts = appointments
    .filter((a) => a.start_time?.slice(0, 10) === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const dayLabel = new Date(selectedDay + 'T12:00:00').toLocaleDateString(
    isRTL ? 'ar' : 'en',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Permission check
  if (!permissions?.canManageAppointments) {
    return (
      <div className="text-center py-16" dir={isRTL ? 'rtl' : 'ltr'}>
        <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-gray-900 mb-1">
          {t('worker.noPermission') || 'No Permission'}
        </h2>
        <p className="text-sm text-gray-500">
          {t('worker.noAppointmentPerm') || 'You do not have permission to view appointments.'}
        </p>
      </div>
    );
  }

  const STATUS_ICON = {
    confirmed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {t('worker.appointments') || 'My Appointments'}
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Day Picker */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <button
          onClick={() => changeDay(isRTL ? 1 : -1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{dayLabel}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {dayAppts.filter((a) => a.status !== 'cancelled').length}{' '}
            {t('worker.appointmentsCount') || 'appointments'}
          </p>
        </div>
        <button
          onClick={() => changeDay(isRTL ? -1 : 1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Appointment List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : dayAppts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {t('worker.noAppointmentsDay') || 'No appointments for this day'}
          </h3>
          <p className="text-sm text-gray-500">
            {t('worker.noAppointmentsDayDesc') || 'Try another date or check back later.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayAppts.map((appt) => {
            const start = new Date(appt.start_time);
            const end = new Date(appt.end_time);
            const timeStr = `${start.toLocaleTimeString(isRTL ? 'ar' : 'en', {
              hour: '2-digit', minute: '2-digit',
            })} – ${end.toLocaleTimeString(isRTL ? 'ar' : 'en', {
              hour: '2-digit', minute: '2-digit',
            })}`;
            const cfg = STATUS_ICON[appt.status] || STATUS_ICON.pending;
            const StatusIcon = cfg.icon;

            return (
              <div
                key={appt.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {appt.client_name || t('worker.walkIn') || 'Walk-in'}
                      </p>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${cfg.bg} ${cfg.color}`}>
                        {appt.status === 'confirmed'
                          ? (t('worker.statusConfirmed') || 'Confirmed')
                          : appt.status === 'cancelled'
                          ? (t('worker.statusCancelled') || 'Cancelled')
                          : (t('worker.statusPending') || 'Pending')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{appt.service || ''}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {timeStr}
                      {appt.price && (
                        <>
                          <span className="mx-1">·</span>
                          <span className="font-medium text-gray-700">{appt.price} MAD</span>
                        </>
                      )}
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-gray-400 mt-1.5 italic">
                        {appt.notes}
                      </p>
                    )}
                    {/* Action buttons */}
                    {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-100">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleAction(appt.id, 'confirmed')}
                            disabled={actionLoading === appt.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === appt.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {t('worker.actionConfirm') || 'Confirm'}
                          </button>
                        )}
                        {new Date(appt.start_time) <= new Date() && (
                          <button
                            onClick={() => handleAction(appt.id, 'completed')}
                            disabled={actionLoading === appt.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === appt.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {t('worker.actionComplete') || 'Complete'}
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(appt.id, 'cancelled')}
                          disabled={actionLoading === appt.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === appt.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {t('worker.actionCancel') || 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
