'use client';

import { SignUp } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { frFR, arSA } from '@clerk/localizations';
import { CalendarPlus, MapPin, Bell, Sparkles } from 'lucide-react';
import AuthPageNav from '@/components/AuthPageNav';
import ClientOnly from '@/components/ClientOnly';

const clerkLocalizations = {
  en: undefined,
  fr: frFR,
  ar: arSA,
};

export default function UserSignUpPage() {
  const params = useParams();
  const locale = params.locale || 'en';
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url');
  const { t, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen flex flex-col bg-white ${isRTL ? 'rtl' : 'ltr'}`}>
      <AuthPageNav locale={locale} isRTL={isRTL} t={t} />

      <div className="flex-1 flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 h-full w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 w-fit mb-8">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 text-xs font-semibold tracking-wide uppercase">
              {t('auth.user.freeForever') || 'Free forever'}
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-slate-900 mb-4 leading-[1.15]">
            {t('auth.user.signUpHeroTitle') || 'Your Next Great Look Starts Here'}
          </h1>

          <p className="text-slate-500 text-lg max-w-md mb-10 leading-relaxed">
            {t('auth.user.signUpHeroSubtitle') || 'Create your free account and find top-rated salons and stylists near you.'}
          </p>

          {/* Feature list */}
          <div className="space-y-4 max-w-md">
            {[
              { icon: CalendarPlus, text: t('auth.user.benefitBook') || 'Book appointments in just a few taps' },
              { icon: MapPin, text: t('auth.user.benefitDiscover') || 'Discover top-rated salons and stylists near you' },
              { icon: Bell, text: t('auth.user.benefitReminders') || 'Get reminders so you never miss an appointment' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 shrink-0">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-slate-600 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {t('auth.user.createAccount') || 'Create your account'}
              </h2>
              <p className="text-gray-600">
                {t('auth.user.signUpFormSubtitle') || 'It only takes a minute to get started'}
              </p>
            </div>

            {/* Clerk Sign Up */}
            <div className="flex justify-center">
              <ClientOnly fallback={
                <div className="w-full h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
              <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-white shadow-xl shadow-slate-200/50 border-0 rounded-2xl p-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all rounded-xl h-12',
                  socialButtonsBlockButtonText: 'text-slate-700 font-medium',
                  socialButtonsBlockButtonArrow: 'text-slate-400',
                  dividerLine: 'bg-slate-200',
                  dividerText: 'text-slate-400 text-sm',
                  formFieldLabel: 'text-slate-700 font-medium text-sm',
                  formFieldInput: 'bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-0 focus:bg-white rounded-xl h-12 transition-all',
                  formButtonPrimary: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 rounded-xl h-12 text-base font-semibold transition-all hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02]',
                  footerActionLink: 'text-amber-600 hover:text-amber-700 font-semibold',
                  identityPreviewText: 'text-slate-900',
                  identityPreviewEditButton: 'text-amber-600 hover:text-amber-700',
                  formFieldInputShowPasswordButton: 'text-slate-400 hover:text-slate-600',
                  otpCodeFieldInput: 'border-2 border-slate-200 focus:border-amber-500 rounded-xl',
                  footer: 'bg-transparent pt-4',
                  footerAction: 'text-slate-600',
                  formFieldAction: 'text-amber-600 hover:text-amber-700 font-medium',
                  alertText: 'text-red-600',
                  formFieldSuccessText: 'text-green-600',
                },
              }}
              localization={clerkLocalizations[locale]}
              routing="path"
              path={`/${locale}/auth/user/sign-up`}
              signInUrl={`/${locale}/auth/user/sign-in${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}
              forceRedirectUrl={redirectUrl ? `${redirectUrl}?setup=user` : `/${locale}?setup=user`}
            />
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
