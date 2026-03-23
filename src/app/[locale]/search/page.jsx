'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, MapPin, Calendar as CalendarIcon, Filter, Layers, List, Navigation, Star, ArrowLeft, Loader2, Scissors, ChevronLeft, ChevronRight, X, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOROCCO_CITIES = [
  'All Cities', 'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier',
  'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi',
  'Mohammedia', 'El Jadida', 'Beni Mellal', 'Nador', 'Taza',
];

// Mock dynamic map to avoid SSR issues
const PlacesMap = dynamic(() => import('@/components/PlacesMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
});

const ServiceCard = ({ biz, locale, t }) => {
  return (
    <Link href={`/${locale}/b/${biz.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-row h-full w-full">
        {/* Image Section */}
        <div className="relative w-28 h-28 sm:h-auto sm:w-[220px] bg-gray-100 shrink-0 overflow-hidden">
          {biz.coverGallery && biz.coverGallery[0] ? (
            <img src={biz.coverGallery[0]} alt={biz.businessName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#244C70]/10 to-[#244C70]/20 flex items-center justify-center">
              <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-[#244C70]/40" />
            </div>
          )}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-gray-800 flex items-center gap-0.5 sm:gap-1 shadow-sm">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            4.9
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-5 flex-1 flex flex-col gap-1.5 sm:gap-3 min-w-0">
          <div>
            <h3 className="font-bold text-[#1e293b] text-sm sm:text-lg leading-tight line-clamp-1">{biz.businessName}</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 capitalize">{biz.professionalType?.replace('_', ' ') || 'Salon'}</p>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{biz.city || 'Morocco'}</span>
          </div>

          {biz.services && biz.services.length > 0 && (
            <div className="hidden sm:block flex-1 space-y-2 mt-1">
              {biz.services.slice(0, 2).map((s, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 line-clamp-1 pr-2">{s.name}</span>
                  <span className="font-medium text-[#1e293b] whitespace-nowrap">{s.price} {s.currency}</span>
                </div>
              ))}
            </div>
          )}

          <div className="hidden sm:flex mt-2 pt-4 border-t border-gray-100 gap-3">
            <span className="flex-1 bg-[#244C70] text-center text-white py-2.5 rounded-lg text-sm font-semibold group-hover:bg-[#1a3a5a] transition-colors">
              Book Now
            </span>
          </div>

          {/* Mobile compact price hint */}
          {biz.services && biz.services.length > 0 && (
            <div className="sm:hidden mt-auto">
              <span className="text-xs font-semibold text-[#244C70]">
                From {biz.services[0].price} {biz.services[0].currency}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function SearchPage() {
  const { locale } = useParams();
  const { t, isRTL } = useLanguage();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [serviceMode, setServiceMode] = useState('all'); // all, store, mobile
  const [showFilters, setShowFilters] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Bottom sheet state for mobile
  const [sheetHeight, setSheetHeight] = useState('50vh'); // '10vh', '50vh', '85vh'

  useEffect(() => {
    fetch('/api/businesses')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (data.businesses) {
          const allBiz = Object.values(data.businesses).flat();
          setBusinesses(allBiz);
        }
      })
      .catch(err => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchSearch = searchQuery === '' || 
                          (b.businessName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (b.professionalType?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchCity = cityQuery === '' || 
                        (b.city?.toLowerCase() || '').includes(cityQuery.toLowerCase());
      
      let matchMode = true;
      if (serviceMode === 'store') matchMode = b.serviceMode !== 'mobile';
      if (serviceMode === 'mobile') matchMode = b.serviceMode === 'mobile' || b.businessCategory === 'mobile_service';

      return matchSearch && matchCity && matchMode;
    });
  }, [businesses, searchQuery, cityQuery, serviceMode]);


  // --- Mobile Sheet Handlers ---
  const handleDragEnd = (event, info) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    
    // swipe down
    if (offset > 100 || velocity > 500) {
      if (sheetHeight === '85vh') setSheetHeight('50vh');
      else if (sheetHeight === '50vh') setSheetHeight('15vh');
    }
    // swipe up
    else if (offset < -100 || velocity < -500) {
      if (sheetHeight === '15vh') setSheetHeight('50vh');
      else if (sheetHeight === '50vh') setSheetHeight('85vh');
    }
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden relative md:flex md:flex-col">
      {/* Top Navigation - Desktop & Mobile */}
      <header className="md:bg-white md:border-b md:border-gray-200 z-30 md:shrink-0 md:relative fixed top-0 left-0 right-0">
        <div className="flex items-center px-4 h-14 md:h-16 max-w-7xl mx-auto w-full gap-4">
          <Link href={`/${locale}`} className="p-2 -ml-2 rounded-full md:hover:bg-gray-100 text-gray-700 transition-colors bg-white/80 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none shadow-sm md:shadow-none">
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
          
          <div className="flex-1 flex gap-2 items-center">
            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 items-center bg-gray-100 rounded-full pl-4 pr-1 py-1 gap-3 focus-within:ring-2 focus-within:ring-[#244C70]/30 transition-shadow">
              
              <div className="flex flex-1 items-center gap-2">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Haircut, Barber, Massage..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full min-w-0 placeholder-gray-500"
                />
              </div>

              <div className="w-px h-6 bg-gray-300 shrink-0"></div>
              
              {/* City Dropdown Trigger */}
              <div className="flex flex-1 items-center gap-2 relative">
                <button
                  onClick={() => { setShowCityDropdown(!showCityDropdown); setShowDatePicker(false); }}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className={`text-sm truncate ${cityQuery ? 'text-gray-800' : 'text-gray-500'}`}>
                    {cityQuery || 'All Cities'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                </button>

                {/* City Dropdown Panel */}
                <AnimatePresence>
                  {showCityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto"
                    >
                      {MOROCCO_CITIES.map(city => (
                        <button
                          key={city}
                          onClick={() => { setCityQuery(city === 'All Cities' ? '' : city); setShowCityDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            (city === 'All Cities' && !cityQuery) || city === cityQuery ? 'text-[#244C70] font-medium bg-[#244C70]/5' : 'text-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 opacity-50" />
                            {city}
                          </span>
                          {((city === 'All Cities' && !cityQuery) || city === cityQuery) && (
                            <Check className="w-4 h-4 text-[#244C70]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-6 bg-gray-300 shrink-0"></div>
              
              {/* Date Picker Trigger */}
              <div className="flex flex-1 items-center gap-2 relative">
                <button
                  onClick={() => { setShowDatePicker(!showDatePicker); setShowCityDropdown(false); }}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className={`text-sm truncate ${selectedDate ? 'text-gray-800' : 'text-gray-500'}`}>
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Any date'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                </button>

                {/* Date Picker Panel */}
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-3 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-72"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">Select Date</span>
                        {selectedDate && (
                          <button onClick={() => { setSelectedDate(''); setShowDatePicker(false); }} className="text-xs text-[#244C70] hover:underline">
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => { setSelectedDate(e.target.value); setShowDatePicker(false); }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#244C70]/30 focus:border-[#244C70] outline-none"
                      />
                      <div className="flex gap-2 mt-3">
                        {['Today', 'Tomorrow'].map((label, i) => {
                          const d = new Date(); d.setDate(d.getDate() + i);
                          const val = d.toISOString().split('T')[0];
                          return (
                            <button
                              key={label}
                              onClick={() => { setSelectedDate(val); setShowDatePicker(false); }}
                              className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${selectedDate === val ? 'bg-[#244C70] text-white border-[#244C70]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                className="bg-[#244C70] hover:bg-[#1a3a5a] text-white p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0 ml-1"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Header Title */}
            <div className="md:hidden flex-1">
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-sm ${showFilters ? 'bg-[#244C70] text-white' : 'bg-white/80 backdrop-blur-sm text-gray-700 md:bg-gray-100 md:backdrop-blur-none md:shadow-none hover:bg-gray-200'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search & Filter Chips */}
        <div className="md:hidden px-4 pb-3 flex flex-col gap-2">
          {/* Search Input */}
          <div className="flex items-center bg-white/80 backdrop-blur-md rounded-full px-4 py-2.5 gap-2 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Services or businesses..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1 w-full placeholder-gray-500"
            />
          </div>
           
          {/* Filter Chips Row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {/* City Chip */}
            <button
              onClick={() => { setShowCityDropdown(!showCityDropdown); setShowDatePicker(false); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap border transition-colors backdrop-blur-md shadow-sm ${
                cityQuery ? 'bg-[#244C70]/90 border-[#244C70]/30 text-white font-medium' : 'bg-white/80 border-white/50 text-gray-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{cityQuery || 'City'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Date Chip */}
            <button
              onClick={() => { setShowDatePicker(!showDatePicker); setShowCityDropdown(false); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap border transition-colors backdrop-blur-md shadow-sm ${
                selectedDate ? 'bg-[#244C70]/90 border-[#244C70]/30 text-white font-medium' : 'bg-white/80 border-white/50 text-gray-700'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Service Mode Chips */}
            {['all', 'store', 'mobile'].map(mode => (
              <button
                key={mode}
                onClick={() => setServiceMode(mode)}
                className={`px-3.5 py-2 rounded-full text-sm whitespace-nowrap border transition-colors backdrop-blur-md shadow-sm ${
                  serviceMode === mode ? 'bg-[#244C70] text-white border-[#244C70]' : 'bg-white/80 border-white/50 text-gray-700'
                }`}
              >
                {mode === 'all' ? 'All' : mode === 'store' ? 'In-Store' : 'Mobile'}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile City Dropdown Overlay */}
        <AnimatePresence>
          {showCityDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-lg z-50 max-h-72 overflow-y-auto"
            >
              {MOROCCO_CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => { setCityQuery(city === 'All Cities' ? '' : city); setShowCityDropdown(false); }}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm border-b border-gray-50 active:bg-gray-100 transition-colors ${
                    (city === 'All Cities' && !cityQuery) || city === cityQuery ? 'text-[#244C70] font-medium bg-[#244C70]/5' : 'text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 opacity-40" />
                    {city}
                  </span>
                  {((city === 'All Cities' && !cityQuery) || city === cityQuery) && (
                    <Check className="w-4 h-4 text-[#244C70]" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Date Picker Overlay */}
        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-lg z-50 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800">Select Date</span>
                {selectedDate && (
                  <button onClick={() => { setSelectedDate(''); setShowDatePicker(false); }} className="text-xs text-[#244C70] hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setShowDatePicker(false); }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-[#244C70]/30 focus:border-[#244C70] outline-none"
              />
              <div className="flex gap-2 mt-3">
                {['Today', 'Tomorrow', 'This Week'].map((label, i) => {
                  const d = new Date();
                  if (i < 2) d.setDate(d.getDate() + i);
                  else d.setDate(d.getDate() + (7 - d.getDay()));
                  const val = d.toISOString().split('T')[0];
                  return (
                    <button
                      key={label}
                      onClick={() => { setSelectedDate(val); setShowDatePicker(false); }}
                      className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${selectedDate === val ? 'bg-[#244C70] text-white border-[#244C70]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop for closing dropdowns */}
      {(showCityDropdown || showDatePicker) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowCityDropdown(false); setShowDatePicker(false); }} />
      )}

      {/* Main Layout Area */}
      <div className="md:flex-1 md:flex md:flex-row absolute inset-0 md:relative overflow-hidden">
        
        {/* Map: full screen on mobile, 50% on desktop */}
        <div className="absolute inset-0 md:relative md:w-1/2 md:h-full z-0">
          <PlacesMap businesses={filteredBusinesses} locale={locale} />
        </div>

        {/* RIGHT: Results Panel (Desktop Only) */}
        <div className="hidden md:flex w-1/2 h-full flex-col bg-gray-50 z-10 border-l border-gray-200">
          
          {/* Quick Filters */}
          <div className="bg-white py-3 px-6 border-b border-gray-200 flex items-center gap-2 overflow-x-auto scroller-hide shrink-0">
            <button 
              onClick={() => setServiceMode('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${serviceMode === 'all' ? 'bg-[#244C70] text-white border-[#244C70]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
            >
              All Services
            </button>
            <button 
              onClick={() => setServiceMode('store')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${serviceMode === 'store' ? 'bg-[#244C70] text-white border-[#244C70]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
            >
              In-Store
            </button>
            <button 
              onClick={() => setServiceMode('mobile')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${serviceMode === 'mobile' ? 'bg-[#244C70] text-white border-[#244C70]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
            >
              Mobile Service
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {searchQuery || cityQuery ? 'Search Results' : 'Recommended for You'}
              </h2>
              <span className="text-sm text-gray-500 font-medium">{filteredBusinesses.length} found</span>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No results found</h3>
                <p className="text-gray-500 max-w-sm">Try adjusting your filters or searching for a different city or service.</p>
                <button onClick={() => {setSearchQuery(''); setCityQuery(''); setServiceMode('all')}} className="mt-4 text-[#244C70] font-medium hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid xl:grid-cols-2 gap-4">
                {filteredBusinesses.map(biz => (
                  <ServiceCard key={biz.id} biz={biz} locale={locale} t={t} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SHEET (Mobile Only) */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 pointer-events-none" style={{ height: '100%' }}>
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] pointer-events-auto flex flex-col"
            initial={{ height: '50vh' }}
            animate={{ height: sheetHeight }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Drag Handle */}
            <motion.div 
              className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ touchAction: 'none' }}
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </motion.div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
                onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-1">
                <h2 className="font-bold text-gray-900 text-base">
                  {searchQuery ? 'Results' : 'Nearby'}
                </h2>
                <span className="text-sm font-medium text-gray-500">{filteredBusinesses.length} found</span>
              </div>

              {filteredBusinesses.length === 0 && !loading && (
                 <div className="py-10 text-center">
                    <p className="text-gray-500">No results match your criteria.</p>
                 </div>
              )}

              {filteredBusinesses.map(biz => (
                <ServiceCard key={biz.id} biz={biz} locale={locale} t={t} />
              ))}
              
              {/* padding bottom for mobile safe area */}
              <div className="h-20 shrink-0" />
            </div>

            {/* Tap to expand overlay when sheet is minified */}
            {sheetHeight === '15vh' && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => setSheetHeight('50vh')}
              />
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}