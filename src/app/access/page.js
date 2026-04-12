'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

const translations = {
  en: {
    accessGranted: 'Access Granted',
    redirecting: 'Redirecting you now...',
    accessRequired: 'Access Required',
    enterCodeDesc: 'Enter the access code to continue',
    accessCode: 'Access code',
    enterCode: 'Enter code',
    invalidCode: 'Invalid access code',
    somethingWrong: 'Something went wrong. Please try again.',
    verifying: 'Verifying...',
    continue: 'Continue',
  },
  fr: {
    accessGranted: 'Accès Accordé',
    redirecting: 'Redirection en cours...',
    accessRequired: 'Accès Requis',
    enterCodeDesc: "Entrez le code d'accès pour continuer",
    accessCode: "Code d'accès",
    enterCode: 'Entrez le code',
    invalidCode: "Code d'accès invalide",
    somethingWrong: "Une erreur s'est produite. Veuillez réessayer.",
    verifying: 'Vérification...',
    continue: 'Continuer',
  },
  ar: {
    accessGranted: 'تم منح الوصول',
    redirecting: 'جارٍ إعادة التوجيه...',
    accessRequired: 'مطلوب رمز الدخول',
    enterCodeDesc: 'أدخل رمز الوصول للمتابعة',
    accessCode: 'رمز الوصول',
    enterCode: 'أدخل الرمز',
    invalidCode: 'رمز الوصول غير صالح',
    somethingWrong: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    verifying: 'جارٍ التحقق...',
    continue: 'متابعة',
  },
};

const locales = ['en', 'fr', 'ar'];
const localeLabels = { en: 'EN', fr: 'FR', ar: 'عربي' };

function getDefaultLocale() {
  if (typeof navigator === 'undefined') return 'fr';
  const browserLang = (navigator.language || '').substring(0, 2);
  return locales.includes(browserLang) ? browserLang : 'fr';
}

export default function AccessPage() {
  const [locale, setLocale] = useState('fr');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setLocale(getDefaultLocale());
  }, []);

  const t = translations[locale];
  const isRTL = locale === 'ar';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Hard redirect so the browser sends the newly set cookie
        setTimeout(() => {
          window.location.replace('/');
        }, 1200);
      } else {
        setError(data.error || t.invalidCode);
        setLoading(false);
      }
    } catch {
      setError(t.somethingWrong);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Language switcher */}
      <div className="fixed top-4 right-4 flex items-center gap-1 z-10">
        <Globe className="w-4 h-4 text-slate-400 mr-1" />
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
              locale === l
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {localeLabels[l]}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div
          className={`bg-white p-8 sm:p-10 border transition-all duration-500 ${
            success
              ? 'border-green-400 bg-green-50/30'
              : 'border-gray-300'
          }`}
          style={{ borderRadius: '5px' }}
        >
          {success ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 border border-green-200 mb-4 animate-[scaleIn_0.4s_ease-out]" style={{ borderRadius: '5px' }}>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{t.accessGranted}</h2>
              <p className="text-slate-500 text-sm">{t.redirecting}</p>
              <div className="mt-4">
                <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </div>
          ) : (
            /* Default state */
            <>
              {/* Icon + Title */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 border border-slate-200 mb-4"
                  style={{ borderRadius: '5px' }}
                >
                  <Lock className="w-6 h-6 text-slate-800" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {t.accessRequired}
                </h1>
                <p className="text-slate-500 text-sm">
                  {t.enterCodeDesc}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-medium text-sm mb-1.5">
                    {t.accessCode}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={t.enterCode}
                      autoFocus
                      required
                      className={`w-full bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#D4AF37] focus:ring-0 focus:bg-white h-12 px-4 transition-all ${isRTL ? 'pl-12' : 'pr-12'}`}
                      style={{ borderRadius: '5px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200" style={{ borderRadius: '5px' }}>
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-white font-semibold h-12 text-base transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ borderRadius: '5px' }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.verifying}
                    </>
                  ) : (
                    t.continue
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
