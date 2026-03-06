'use client';

import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHeader() {
  const { user } = useUser();
  const params = useParams();
  const locale = params.locale || 'en';
  const { t, isRTL } = useLanguage();

  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-8">
        <nav dir="ltr" className={`flex items-center justify-between py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Left Section - Mobile Menu & Logo */}
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Mobile Menu Button */}
            <button
              onClick={handleOpenSidebar}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center"
            >
              <img src="/images/dark-logo.png" alt="Booq" width={140} height={42} className="h-10 w-auto" />
            </Link>
          </div>

          {/* Right Section - Notifications & Profile */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} w-2 h-2 bg-red-500 rounded-full`}></span>
            </button>

            {/* User Profile Button */}
            {user && (
              <Link
                href={`/${locale}/business/profile`}
                className="rounded-full transition-all cursor-pointer hover:ring-2 hover:ring-[#D4AF37]/30"
              >
                <div className="w-9 h-9 rounded-full ring-2 ring-[#D4AF37]/50 overflow-hidden">
                  <img 
                    src={user.imageUrl} 
                    alt={user.firstName || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            )}
          </motion.div>
        </nav>
      </div>
    </header>
  );
}
