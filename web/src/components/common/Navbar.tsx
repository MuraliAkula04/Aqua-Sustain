import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Waves,
  Globe2,
  Menu,
  X,
  ChevronDown,
  Plus,
  Shield,
  Layers,
  LogOut,
  User,
} from 'lucide-react';
import { UserRole, LanguageCode } from '@aquasustain/shared';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const {
    currentUser,
    role,
    language,
    setLanguage,
    switchRole,
    farms,
    ponds,
    selectedFarmId,
    selectedPondId,
    setSelectedFarmId,
    setSelectedPondId,
    logout,
    setActiveTab,
    t,
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showFarmMenu, setShowFarmMenu] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const farmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (farmRef.current && !farmRef.current.contains(event.target as Node)) {
        setShowFarmMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  ];

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const farmPonds = ponds.filter((p) => p.farmId === (currentFarm?.id || selectedFarmId));

  // User initials (first 2 chars of name)
  const displayName = currentUser.name || currentUser.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-3">

          {/* LEFT: Mobile toggle + Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <img
                src="/assets/logo-mark.png"
                alt="AquaSustain Logo"
                className="w-8 h-8 rounded-lg object-contain shadow-sm group-hover:scale-105 transition"
              />
              <span className="font-extrabold text-base text-teal-900 tracking-tight hidden sm:block">
                Aqua<span className="text-teal-600">Sustain</span>
              </span>
            </div>
          </div>

          {/* CENTER: Farm & Pond selector — farmer only, desktop only */}
          {role === 'farmer' && (
            <div className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0 mx-4">
              {farms.length > 0 ? (
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1 py-0.5 gap-1 max-w-xs">
                  {/* Farm dropdown */}
                  <div className="relative" ref={farmRef}>
                    <button
                      type="button"
                      onClick={() => setShowFarmMenu(!showFarmMenu)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white text-xs font-semibold text-slate-700 transition max-w-[160px]"
                    >
                      <Layers className="w-3 h-3 text-teal-600 flex-shrink-0" />
                      <span className="truncate">{currentFarm?.name || 'Select Farm'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    </button>

                    {showFarmMenu && (
                      <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('allFarms')} ({farms.length})
                        </div>
                        {farms.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => { setSelectedFarmId(f.id); setShowFarmMenu(false); }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between transition ${
                              f.id === selectedFarmId ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{f.village}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-slate-300">|</span>

                  {/* Pond selector */}
                  {farmPonds.length > 0 ? (
                    <select
                      value={selectedPondId}
                      onChange={(e) => setSelectedPondId(e.target.value)}
                      className="bg-transparent text-xs font-medium text-slate-700 px-2 py-1.5 focus:outline-none cursor-pointer hover:text-teal-800 max-w-[150px]"
                    >
                      {farmPonds.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setActiveTab('farms')}
                      className="text-xs text-teal-600 hover:text-teal-800 font-semibold px-2 py-1.5"
                    >
                      + Add Pond
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* RIGHT: Register Farm + Language + User profile */}
          <div className="ml-auto flex items-center gap-2">

            {/* Register Pond button — top right, farmer only */}
            {role === 'farmer' && (
              <button
                onClick={() => setActiveTab('farms')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register Pond</span>
              </button>
            )}

            {/* Admin role toggle */}
            {role !== 'farmer' && (
              <button
                onClick={() => switchRole('farmer')}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold transition hover:bg-indigo-100"
              >
                <Shield className="w-3 h-3" />
                <span className="capitalize">{role}</span>
              </button>
            )}

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <Globe2 className="w-3.5 h-3.5 text-teal-600" />
                <span className="uppercase">{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('selectLanguage')}
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition ${
                        language === l.code ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{l.native}</span>
                      {language === l.code && <span className="text-teal-500 text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User profile pill */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">{displayName}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{role}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-800 truncate">{displayName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{t('navProfile')}</span>
                  </button>
                  {role === 'farmer' && (
                    <button
                      onClick={() => { switchRole('admin'); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Switch to Admin</span>
                    </button>
                  )}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => { logout(); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
