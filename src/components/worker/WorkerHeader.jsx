'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams } from 'next/navigation';
import { Menu, ChevronDown, Building2, User } from 'lucide-react';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/useUserProfile';
import NotificationBell from '@/components/dashboard/NotificationBell';

export default function WorkerHeader({ activeMembership, memberships = [], onSwitchBusiness }) {
  const { user } = useAuthUser();
  const params = useParams();
  const locale = params.locale || 'en';
  const { t, isRTL } = useLanguage();
  const { profile } = useUserProfile({ refetchOnFocus: true, refetchOnProfileUpdate: true });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const profileImage = profile?.profileImageUrl || (user?.hasImage ? user.imageUrl : null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
  };

  return (
    <header className={`bg-white border-b border-gray-200 fixed top-0 z-30 right-0 left-0 ${isRTL ? 'lg:right-16' : 'lg:left-16'}`}>
      <div className="px-4 lg:px-8">
        <nav dir="ltr" className={`flex items-center justify-between py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Left Section */}
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleOpenSidebar}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Business Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => memberships.length > 1 && setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  memberships.length > 1
                    ? 'hover:bg-gray-100 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-gray-900 max-w-[200px] truncate">
                  {activeMembership?.businessName || 'Business'}
                </span>
                {memberships.length > 1 && (
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                )}
              </button>

              {showDropdown && memberships.length > 1 && (
                <div className={`absolute top-full mt-1 ${isRTL ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[220px] z-50`}>
                  {memberships.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSwitchBusiness(m);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        m.businessInfoId === activeMembership?.businessInfoId
                          ? 'bg-[#D4AF37]/5 text-[#D4AF37] font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {m.businessName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <NotificationBell />

            {user && (
              <Link
                href={`/${locale}/profile`}
                className="rounded-full transition-all cursor-pointer hover:ring-2 hover:ring-[#D4AF37]/30"
              >
                <div className="w-9 h-9 rounded-full ring-2 ring-[#D4AF37]/50 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
