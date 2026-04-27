'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AppointmentCalendar({ appointments = [] }) {
  const { t, isRTL } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Default demo appointments
  const demoAppointments = [
    { date: new Date(), time: '09:00', client: 'John Smith', service: 'Appointment' },
    { date: new Date(), time: '10:30', client: 'Mike Johnson', service: 'Consultation' },
    { date: new Date(), time: '14:00', client: 'David Wilson', service: 'Full Service' },
    { date: new Date(Date.now() + 86400000), time: '11:00', client: 'Chris Brown', service: 'Appointment' },
    { date: new Date(Date.now() + 86400000 * 2), time: '15:00', client: 'James Taylor', service: 'Consultation' },
    { date: new Date(Date.now() + 86400000 * 3), time: '09:30', client: 'Robert Lee', service: 'Appointment' },
    { date: new Date(Date.now() + 86400000 * 5), time: '13:00', client: 'William Davis', service: 'Consultation' },
  ];

  const allAppointments = appointments.length > 0 ? appointments : demoAppointments;

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    t('calendar.january') || 'January',
    t('calendar.february') || 'February',
    t('calendar.march') || 'March',
    t('calendar.april') || 'April',
    t('calendar.may') || 'May',
    t('calendar.june') || 'June',
    t('calendar.july') || 'July',
    t('calendar.august') || 'August',
    t('calendar.september') || 'September',
    t('calendar.october') || 'October',
    t('calendar.november') || 'November',
    t('calendar.december') || 'December',
  ];

  const dayNames = [
    t('calendar.sun') || 'Sun',
    t('calendar.mon') || 'Mon',
    t('calendar.tue') || 'Tue',
    t('calendar.wed') || 'Wed',
    t('calendar.thu') || 'Thu',
    t('calendar.fri') || 'Fri',
    t('calendar.sat') || 'Sat',
  ];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getAppointmentsForDay = (day) => {
    return allAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDayOfMonth + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const dayAppointments = isCurrentMonth ? getAppointmentsForDay(day) : [];

      days.push(
        <div
          key={i}
          className={`min-h-[100px] p-2 border border-slate-700 ${
            isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-900/50'
          } ${isToday(day) ? 'ring-2 ring-amber-500 ring-inset' : ''}`}
        >
          {isCurrentMonth && (
            <>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                  isToday(day)
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-300'
                }`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {dayAppointments.slice(0, 2).map((apt, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded truncate cursor-pointer hover:bg-amber-500/30 transition-colors"
                    title={`${apt.time} - ${apt.client}: ${apt.service}`}
                  >
                    {apt.time} {apt.client}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="px-2 py-1 text-xs text-slate-500">
                    +{dayAppointments.length - 2} {t('calendar.more') || 'more'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          {t('dashboard.calendar.title') || 'Appointment Calendar'}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="p-2 text-center text-sm font-medium text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 rounded-lg overflow-hidden">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>{t('dashboard.calendar.today') || 'Today'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500/20" />
          <span>{t('dashboard.calendar.hasAppointments') || 'Has appointments'}</span>
        </div>
      </div>
    </div>
  );
}
