'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function RevenueChart({ data = [] }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Default demo data if none provided
  const chartData = data.length > 0 ? data : [
    { day: 'Mon', value: 320 },
    { day: 'Tue', value: 450 },
    { day: 'Wed', value: 280 },
    { day: 'Thu', value: 520 },
    { day: 'Fri', value: 680 },
    { day: 'Sat', value: 890 },
    { day: 'Sun', value: 340 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));
  const chartHeight = 200;
  const barWidth = 40;
  const gap = 20;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {t('dashboard.analytics.weeklyRevenue') || 'Weekly Revenue'}
          </h3>
          <p className="text-slate-400 text-sm">
            {t('dashboard.analytics.lastSevenDays') || 'Last 7 days performance'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-lg">
            {t('dashboard.analytics.week') || 'Week'}
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 rounded-lg transition-colors">
            {t('dashboard.analytics.month') || 'Month'}
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 rounded-lg transition-colors">
            {t('dashboard.analytics.year') || 'Year'}
          </button>
        </div>
      </div>

      <div className="relative h-[240px]">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-500">
          <span>${maxValue}</span>
          <span>${Math.round(maxValue * 0.75)}</span>
          <span>${Math.round(maxValue * 0.5)}</span>
          <span>${Math.round(maxValue * 0.25)}</span>
          <span>$0</span>
        </div>

        {/* Chart area */}
        <div className="ml-14 h-full flex items-end justify-between pb-8">
          {chartData.map((item, index) => {
            const height = (item.value / maxValue) * chartHeight;
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="relative">
                  {activeIndex === index && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded whitespace-nowrap">
                      ${item.value}
                    </div>
                  )}
                  <div
                    className={`w-10 rounded-t-lg transition-all cursor-pointer ${
                      activeIndex === index
                        ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                        : 'bg-gradient-to-t from-amber-500/60 to-orange-400/60'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{item.day}</span>
              </div>
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute left-14 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-slate-700/50 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppointmentsChart({ data = [] }) {
  const { t } = useLanguage();

  // Default demo data
  const chartData = data.length > 0 ? data : [
    { hour: '9AM', value: 3 },
    { hour: '10AM', value: 5 },
    { hour: '11AM', value: 4 },
    { hour: '12PM', value: 2 },
    { hour: '1PM', value: 1 },
    { hour: '2PM', value: 4 },
    { hour: '3PM', value: 6 },
    { hour: '4PM', value: 5 },
    { hour: '5PM', value: 3 },
    { hour: '6PM', value: 2 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  // Create SVG path for area chart
  const width = 100;
  const height = 100;
  const points = chartData.map((d, i) => ({
    x: (i / (chartData.length - 1)) * width,
    y: height - (d.value / maxValue) * height,
  }));

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {t('dashboard.analytics.peakHours') || 'Peak Hours'}
          </h3>
          <p className="text-slate-400 text-sm">
            {t('dashboard.analytics.appointmentsByTime') || 'Appointments by time of day'}
          </p>
        </div>
      </div>

      <div className="relative h-[200px]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f59e0b" className="drop-shadow-lg" />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          {chartData.filter((_, i) => i % 2 === 0).map((item, index) => (
            <span key={index}>{item.hour}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ServicesPieChart({ data = [] }) {
  const { t } = useLanguage();

  // Default demo data
  const chartData = data.length > 0 ? data : [
    { name: t('dashboard.analytics.haircut') || 'Service A', value: 45, color: '#f59e0b' },
    { name: t('dashboard.analytics.beardTrim') || 'Service B', value: 25, color: '#10b981' },
    { name: t('dashboard.analytics.fullService') || 'Full Service', value: 20, color: '#3b82f6' },
    { name: t('dashboard.analytics.other') || 'Other', value: 10, color: '#8b5cf6' },
  ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">
          {t('dashboard.analytics.popularServices') || 'Popular Services'}
        </h3>
        <p className="text-slate-400 text-sm">
          {t('dashboard.analytics.serviceDistribution') || 'Service distribution this month'}
        </p>
      </div>

      <div className="flex items-center gap-8">
        {/* Pie Chart */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {chartData.map((item, index) => {
              const angle = (item.value / total) * 360;
              const largeArc = angle > 180 ? 1 : 0;
              const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
              const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
              const endAngle = currentAngle + angle;
              const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
              const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
              const path = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
              currentAngle = endAngle;

              return (
                <path
                  key={index}
                  d={path}
                  fill={item.color}
                  className="transition-all hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{total}%</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-300">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
