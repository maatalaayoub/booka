'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Dynamically import the map component so it doesn't break SSR
const PlacesMap = dynamic(() => import('@/components/PlacesMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#244C70]" />
    </div>
  )
});

export default function MapPage() {
  const params = useParams();
  const locale = params?.locale || 'en';
  const { t, isRTL } = useLanguage();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('/api/businesses')
      .then(res => res.json())
      .then(data => {
        if (data.businesses) {
          const allBiz = Object.values(data.businesses).flat().filter(b => b.latitude && b.longitude);
          setBusinesses(allBiz);
        }
      })
      .catch(err => { console.error(err); setFetchError(true); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 safe-top">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
          <h1 className="font-semibold text-gray-900 text-lg">
            {t('navMap') || 'Map'}
          </h1>
        </div>
      </header>

      <div className="flex-1 w-full h-full relative z-0">
        {fetchError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-gray-700 font-semibold mb-1">{t('map.errorTitle') || 'Failed to load map'}</p>
            <p className="text-gray-400 text-sm mb-4">{t('map.errorDesc') || 'Could not load businesses.'}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
              {t('map.retry') || 'Retry'}
            </button>
          </div>
        ) : !loading ? (
          <PlacesMap businesses={businesses} locale={locale} />
        ) : null}
      </div>
    </div>
  );
}