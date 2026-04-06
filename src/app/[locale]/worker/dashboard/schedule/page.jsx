'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  CalendarDays,
  Save,
  Coffee,
  Utensils,
  XCircle,
  Palmtree,
  Plane,
  HelpCircle,
  Trash2,
  Loader2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  Pencil,
} from 'lucide-react';
import AddExceptionModal from '@/components/dashboard/AddExceptionModal';
import ExceptionDetailModal from '@/components/dashboard/ExceptionDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorker } from '@/contexts/WorkerContext';

const FullCalendarWrapper = dynamic(
  () => import('@/components/dashboard/ScheduleCalendarWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded" />
            <div className="h-8 w-8 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[...Array(7)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded border border-gray-100" />)}
        </div>
      </div>
    ),
  }
);

// ─── Constants ──────────────────────────────────────────────
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const EXCEPTION_ICONS = {
  break: Coffee,
  lunch_break: Utensils,
  closure: XCircle,
  holiday: Palmtree,
  vacation: Plane,
  other: HelpCircle,
};

const EXCEPTION_COLORS = {
  break: { bg: '#3B82F6', border: '#2563EB' },
  lunch_break: { bg: '#F97316', border: '#EA580C' },
  closure: { bg: '#EF4444', border: '#DC2626' },
  holiday: { bg: '#10B981', border: '#059669' },
  vacation: { bg: '#8B5CF6', border: '#7C3AED' },
  other: { bg: '#6B7280', border: '#4B5563' },
};

const DEFAULT_HOURS = DAY_KEYS.map((_, i) => ({
  dayOfWeek: i,
  isOpen: i >= 1 && i <= 5,
  openTime: '09:00',
  closeTime: '19:00',
}));

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function TimeDropdown({ options, value, onSelect, max }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const ref = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        commitInput();
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, inputValue]);

  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const commitInput = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num >= 0 && num <= max) {
      onSelect(String(num).padStart(2, '0'));
    } else {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitInput();
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue(value);
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          setInputValue(v);
        }}
        onFocus={(e) => { setOpen(true); e.target.select(); }}
        onBlur={() => { if (!ref.current?.contains(document.activeElement)) commitInput(); }}
        onKeyDown={handleKeyDown}
        className="w-[44px] px-1 py-2 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 cursor-pointer text-center"
      />
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-[5px] shadow-lg"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.time-dropdown-list::-webkit-scrollbar { display: none; }`}</style>
          <div className="time-dropdown-list max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                data-active={opt === value}
                onMouseDown={(e) => { e.preventDefault(); onSelect(opt); setOpen(false); }}
                className={`block w-full px-3 py-1.5 text-sm text-center hover:bg-amber-50 transition-colors ${
                  opt === value ? 'bg-amber-100 text-amber-700 font-medium' : 'text-gray-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSelect24({ value, onChange, disabled }) {
  const [h, m] = (value || '00:00').split(':');
  if (disabled) {
    return (
      <div className="flex items-center gap-1 opacity-60">
        <span className="w-[44px] px-1 py-2 bg-gray-100 border border-gray-200 rounded-[5px] text-sm text-gray-500 text-center">{h}</span>
        <span className="text-gray-400 font-medium">:</span>
        <span className="w-[44px] px-1 py-2 bg-gray-100 border border-gray-200 rounded-[5px] text-sm text-gray-500 text-center">{m}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <TimeDropdown options={HOURS_24} value={h} onSelect={(v) => onChange(`${v}:${m}`)} max={23} />
      <span className="text-gray-500 font-medium">:</span>
      <TimeDropdown options={MINUTES} value={m} onSelect={(v) => onChange(`${h}:${v}`)} max={59} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function WorkerSchedulePage() {
  const { t, isRTL, locale } = useLanguage();
  const { activeMembership, permissions } = useWorker();
  const calendarRef = useRef(null);
  const [businessHours, setBusinessHours] = useState(DEFAULT_HOURS);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasCustomSchedule, setHasCustomSchedule] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState(null);
  const [editingException, setEditingException] = useState(null);
  const [activeTab, setActiveTab] = useState('hours');
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedExc, setSelectedExc] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const savedHoursRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  const canEdit = !!permissions?.canEditSchedule;
  const businessId = activeMembership?.businessInfoId;

  // ── Fetch schedule + exceptions ──
  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/worker/schedule?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.schedule && data.schedule.length > 0) {
          const merged = DAY_KEYS.map((_, i) => {
            const existing = data.schedule.find(s => s.day_of_week === i);
            return existing ? {
              dayOfWeek: i,
              isOpen: existing.is_open,
              openTime: existing.open_time?.substring(0, 5) || '09:00',
              closeTime: existing.close_time?.substring(0, 5) || '19:00',
            } : { dayOfWeek: i, isOpen: false, openTime: '09:00', closeTime: '19:00' };
          });
          setBusinessHours(merged);
          savedHoursRef.current = JSON.parse(JSON.stringify(merged));
          setHasCustomSchedule(true);
        } else {
          setBusinessHours(DEFAULT_HOURS);
          savedHoursRef.current = JSON.parse(JSON.stringify(DEFAULT_HOURS));
          setHasCustomSchedule(false);
        }
        setExceptions(data.exceptions || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/worker/schedule?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.schedule && data.schedule.length > 0) {
          const merged = DAY_KEYS.map((_, i) => {
            const existing = data.schedule.find(s => s.day_of_week === i);
            return existing ? {
              dayOfWeek: i,
              isOpen: existing.is_open,
              openTime: existing.open_time?.substring(0, 5) || '09:00',
              closeTime: existing.close_time?.substring(0, 5) || '19:00',
            } : { dayOfWeek: i, isOpen: false, openTime: '09:00', closeTime: '19:00' };
          });
          setBusinessHours(merged);
          savedHoursRef.current = JSON.parse(JSON.stringify(merged));
          setHasCustomSchedule(true);
        }
        setExceptions(data.exceptions || []);
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  // ── Save working hours ──
  const saveHours = async () => {
    if (!businessId || !canEdit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/worker/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, schedule: businessHours }),
      });
      if (res.ok) {
        savedHoursRef.current = JSON.parse(JSON.stringify(businessHours));
        setHasCustomSchedule(true);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  // ── Update a day's hours ──
  const updateDay = (dayIndex, field, value) => {
    if (!canEdit) return;
    setBusinessHours((prev) =>
      prev.map((d) => d.dayOfWeek === dayIndex ? { ...d, [field]: value } : d)
    );
  };

  // Change count
  const changeCount = useMemo(() => {
    if (!savedHoursRef.current) return 0;
    let count = 0;
    for (let i = 0; i < businessHours.length; i++) {
      const curr = businessHours[i];
      const orig = savedHoursRef.current[i];
      if (!orig) { count++; continue; }
      if (curr.isOpen !== orig.isOpen || curr.openTime !== orig.openTime || curr.closeTime !== orig.closeTime) {
        count++;
      }
    }
    return count;
  }, [businessHours, saved]);

  const hasChanges = changeCount > 0;

  // ── Add or update exception ──
  const addException = async (exceptionData) => {
    if (exceptionData.id) {
      const res = await fetch('/api/worker/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, ...exceptionData }),
      });
      if (res.ok) {
        const { exception } = await res.json();
        setExceptions((prev) => prev.map((e) => e.id === exception.id ? exception : e));
      } else {
        throw new Error('Failed to update exception');
      }
    } else {
      const res = await fetch('/api/worker/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, ...exceptionData }),
      });
      if (res.ok) {
        const { exception } = await res.json();
        setExceptions((prev) => [...prev, exception]);
      } else {
        throw new Error('Failed to add exception');
      }
    }
  };

  const openEditModal = (exc) => {
    setEditingException(exc);
    setModalDefaultDate(null);
    setIsModalOpen(true);
  };

  const deleteException = async (id) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 0));
    try {
      const res = await fetch(`/api/worker/schedule?id=${id}&businessId=${businessId}`, { method: 'DELETE' });
      if (res.ok) {
        await new Promise((r) => setTimeout(r, 400));
        setExceptions((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ── Calendar navigation ──
  const goToday = () => calendarRef.current?.getApi()?.today();
  const goPrev = () => calendarRef.current?.getApi()?.prev();
  const goNext = () => calendarRef.current?.getApi()?.next();
  const changeView = (view) => {
    calendarRef.current?.getApi()?.changeView(view);
    setCurrentView(view);
  };

  // ── Calendar events ──
  const calendarEvents = useMemo(() => {
    const events = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    for (let w = 0; w < 8; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const dayOfWeek = date.getDay();
        const dayConf = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
        if (dayConf?.isOpen && dayConf.openTime && dayConf.closeTime) {
          const dateStr = date.toISOString().split('T')[0];
          events.push({
            id: `wh_${dateStr}`,
            title: t('schedule.workingHours'),
            start: `${dateStr}T${dayConf.openTime}:00`,
            end: `${dateStr}T${dayConf.closeTime}:00`,
            display: 'background',
            backgroundColor: '#D4AF3720',
            borderColor: 'transparent',
          });
        }
      }
    }
    exceptions.forEach((ex) => {
      const color = EXCEPTION_COLORS[ex.type] || EXCEPTION_COLORS.other;
      const normalizeTime = (t) => {
        if (!t) return null;
        const parts = t.split(':');
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}:00` : `${t}:00`;
      };
      if (ex.is_full_day) {
        let endDate = ex.date;
        if (ex.end_date) {
          const d = new Date(ex.end_date + 'T00:00:00');
          d.setDate(d.getDate() + 1);
          endDate = d.toISOString().split('T')[0];
        }
        events.push({
          id: ex.id,
          title: ex.title,
          start: ex.date,
          end: ex.end_date ? endDate : undefined,
          allDay: true,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: { ...ex },
        });
      } else if (ex.start_time && ex.end_time) {
        const startT = normalizeTime(ex.start_time);
        const endT = normalizeTime(ex.end_time);
        events.push({
          id: ex.id,
          title: ex.title,
          start: `${ex.date}T${startT}`,
          end: `${ex.date}T${endT}`,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: { ...ex },
        });
      }
    });
    return events;
  }, [businessHours, exceptions, t]);

  const handleDateClick = useCallback((info) => {
    if (!canEdit) return;
    setEditingException(null);
    setModalDefaultDate(info.dateStr);
    setIsModalOpen(true);
  }, [canEdit]);

  const handleEventClick = useCallback((info) => {
    const ex = info.event.extendedProps;
    if (!ex || !ex.id) return;
    setSelectedExc(ex);
    setIsDetailOpen(true);
  }, []);

  const deleteFromDetail = async (id) => {
    const res = await fetch(`/api/worker/schedule?id=${id}&businessId=${businessId}`, { method: 'DELETE' });
    if (res.ok) {
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } else {
      throw new Error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-[5px]" />
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-[5px] w-fit">
          <div className="h-9 w-36 bg-gray-200 rounded-[5px]" />
          <div className="h-9 w-36 bg-gray-200 rounded-[5px]" />
        </div>
        <div className="bg-white rounded-[5px] border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="h-5 w-44 bg-gray-200 rounded" />
            <div className="h-9 w-32 bg-gray-200 rounded-[5px]" />
          </div>
          <div className="divide-y divide-gray-50">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3 w-44">
                  <div className="w-10 h-5 bg-gray-200 rounded-full" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-32 bg-gray-100 rounded-[5px]" />
                  <div className="h-3 w-6 bg-gray-100 rounded" />
                  <div className="h-9 w-32 bg-gray-100 rounded-[5px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('worker.mySchedule')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('worker.myScheduleDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors disabled:opacity-50"
            title={t('schedule.refresh')}
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {canEdit && (
            <>
              <div className="flex-1 sm:hidden" />
              <button
                onClick={() => {
                  setEditingException(null);
                  setModalDefaultDate(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#364153] hover:bg-[#2a3444] text-white rounded-[5px] font-medium text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('schedule.addException')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── No edit permission notice ── */}
      {!canEdit && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            {t('worker.noSchedulePerm')}
          </p>
        </div>
      )}

      {/* ── No custom schedule info ── */}
      {!hasCustomSchedule && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700">{t('worker.noScheduleSet')}</p>
            <p className="text-xs text-blue-600 mt-0.5">{t('worker.noScheduleSetDesc')}</p>
          </div>
        </div>
      )}

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-[5px] w-fit">
        <button
          onClick={() => setActiveTab('hours')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[5px] text-sm font-medium transition-all ${
            activeTab === 'hours'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          {t('schedule.workingHours')}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[5px] text-sm font-medium transition-all ${
            activeTab === 'calendar'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          {t('schedule.calendarView')}
        </button>
      </div>

      {/* ═══ TAB: Working Hours ═══ */}
      {activeTab === 'hours' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Working Hours Card */}
          <div className="bg-white rounded-[5px] border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">{t('schedule.weeklyHours')}</h2>
              {canEdit && (
                <button
                  onClick={saveHours}
                  disabled={!hasChanges || saving}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-[5px] text-sm font-medium transition-all ${
                    hasChanges
                      ? 'bg-[#364153] hover:bg-[#2a3444] text-white shadow-sm'
                      : saved
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? t('common.saved') : t('common.saveChanges')}
                  {hasChanges && changeCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {changeCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-50">
              {businessHours.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-colors ${
                    day.isOpen ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-44">
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${day.isOpen ? 'bg-amber-500' : 'bg-gray-300'}`}
                      onClick={() => canEdit && updateDay(day.dayOfWeek, 'isOpen', !day.isOpen)}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          day.isOpen ? 'start-5' : 'start-0.5'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${day.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                      {t(`days.${DAY_KEYS[day.dayOfWeek]}`)}
                    </span>
                  </div>

                  {day.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <TimeSelect24
                        value={day.openTime || '09:00'}
                        onChange={(val) => updateDay(day.dayOfWeek, 'openTime', val)}
                        disabled={!canEdit}
                      />
                      <span className="text-gray-400 text-sm">{t('common.to')}</span>
                      <TimeSelect24
                        value={day.closeTime || '19:00'}
                        onChange={(val) => updateDay(day.dayOfWeek, 'closeTime', val)}
                        disabled={!canEdit}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">{t('schedule.closed')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Exceptions List */}
          <div className="bg-white rounded-[5px] border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{t('schedule.exceptions')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('schedule.exceptionsDesc')}</p>
            </div>

            {exceptions.length === 0 ? (
              <div className="px-4 sm:px-6 py-12 text-center">
                <Coffee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('schedule.noExceptions')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('schedule.noExceptionsHint')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {exceptions.map((ex) => {
                  const IconComp = EXCEPTION_ICONS[ex.type] || HelpCircle;
                  const color = EXCEPTION_COLORS[ex.type] || EXCEPTION_COLORS.other;
                  return (
                    <div key={ex.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-[5px] flex-shrink-0"
                        style={{ backgroundColor: color.bg + '20' }}
                      >
                        <IconComp className="w-4 h-4" style={{ color: color.bg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ex.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ex.date + 'T00:00:00').toLocaleDateString(locale, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {ex.end_date && ex.end_date !== ex.date && (
                            <> — {new Date(ex.end_date + 'T00:00:00').toLocaleDateString(locale, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}</>
                          )}
                          {ex.is_full_day
                            ? (!ex.end_date || ex.end_date === ex.date ? ` — ${t('schedule.fullDay')}` : '')
                            : ` — ${ex.start_time} ${t('common.to')} ${ex.end_time}`}
                          {ex.recurring && (
                            <span className="ml-1 text-amber-600">
                              <RotateCw className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                              {t('schedule.weekly')}
                            </span>
                          )}
                        </p>
                      </div>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEditModal(ex)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-[5px] transition-colors flex-shrink-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteException(ex.id)}
                            disabled={deletingId === ex.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[5px] transition-colors flex-shrink-0 disabled:opacity-50"
                          >
                            {deletingId === ex.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ TAB: Calendar View ═══ */}
      {activeTab === 'calendar' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[5px] border border-gray-200 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToday}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-[5px] transition-colors"
                >
                  {t('common.today')}
                </button>
                <button
                  onClick={goPrev}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-[5px] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goNext}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-[5px] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-[5px]">
                {[
                  { key: 'dayGridMonth', label: t('common.month') },
                  { key: 'timeGridWeek', label: t('common.week') },
                  { key: 'timeGridDay', label: t('common.day') },
                  { key: 'listMonth', label: t('common.list') },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => changeView(key)}
                    className={`px-3 py-1.5 rounded-[5px] text-xs font-medium transition-all ${
                      currentView === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300" />
                  <span className="text-xs text-gray-500">{t('schedule.working')}</span>
                </div>
                {Object.entries(EXCEPTION_COLORS).slice(0, 4).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.bg }} />
                    <span className="text-xs text-gray-500">{t(`exception.${type === 'lunch_break' ? 'lunchBreak' : type}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-2 sm:p-4 fc-custom">
            <FullCalendarWrapper
              ref={calendarRef}
              events={calendarEvents}
              locale={locale}
              noEventsText={t('common.no_events')}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </div>
        </motion.div>
      )}

      {/* ── Exception Modal ── */}
      {canEdit && (
        <AddExceptionModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingException(null); }}
          onSave={addException}
          defaultDate={modalDefaultDate}
          editException={editingException}
          businessHours={businessHours}
        />
      )}

      {/* ── Exception Detail Modal ── */}
      <ExceptionDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedExc(null);
        }}
        exception={selectedExc}
        onDelete={canEdit ? deleteFromDetail : undefined}
        onEdit={canEdit ? (exc) => openEditModal(exc) : undefined}
      />
    </div>
  );
}
