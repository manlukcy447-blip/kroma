import React, { useState, useRef, useEffect } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { NavigationTab, FiatCurrency, LanguageCode } from '../../types/crypto';
import { FIAT_RATES } from '../../data/mockData';
import { useAuth } from '../../auth';
import { 
  ShieldCheck, 
  Bell, 
  Globe, 
  DollarSign, 
  User, 
  ChevronDown, 
  ArrowDownToLine, 
  ArrowUpRight, 
  CheckCheck, 
  Sparkles, 
  Lock, 
  Smartphone, 
  ExternalLink,
  Search,
  Eye,
  EyeOff,
  Menu,
  X
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const {
    currentTab,
    setCurrentTab,
    fiatCurrency,
    setFiatCurrency,
    language,
    setLanguage,
    t,
    unreadNotifsCount,
    notifications,
    markAllNotificationsRead,
    markNotificationAsRead,
    userProfile,
    openDepositModal,
    hideBalances,
    setHideBalances,
    setSelectedPair,
    feeClearance,
  } = useCrypto();

  const isHoldActive = Boolean(feeClearance?.holdActive && feeClearance?.status !== 'cleared');

  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setIsCurrencyMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setIsLangMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { tab: NavigationTab; label: string; badge?: string }[] = [
    { tab: 'home', label: t('home') },
    { tab: 'markets', label: t('markets') },
    { tab: 'trade', label: t('trade'), badge: 'PRO' },
    { tab: 'convert', label: t('convert') },
    { tab: 'p2p', label: t('p2p') },
    { tab: 'earn', label: t('earn'), badge: '11.4%' },
    { tab: 'rewards', label: t('rewards'), badge: 'NEW' },
    { tab: 'wallet', label: t('wallet'), badge: isHoldActive ? 'HOLD' : undefined },
  ];

  const fiatList: FiatCurrency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
  const languages: { code: LanguageCode; name: string }[] = [
    { code: 'en', name: 'English (US)' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '繁體中文' },
    { code: 'pt', name: 'Português' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0E14]/95 backdrop-blur-md">
      {/* Top micro market status ticker strip */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 text-[11px] font-medium border-b border-slate-800/40 text-slate-400 bg-[#090C10]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All Systems Operational</span>
          </div>
          <div className="flex items-center space-x-1 hover:text-slate-200 cursor-pointer" onClick={() => { setSelectedPair('BTC/USDT'); setCurrentTab('trade'); }}>
            <span className="text-slate-500">BTC/USDT:</span>
            <span className="font-semibold text-slate-200">$87,420.50</span>
            <span className="text-emerald-400">+3.42%</span>
          </div>
          <div className="flex items-center space-x-1 hover:text-slate-200 cursor-pointer" onClick={() => { setSelectedPair('ETH/USDT'); setCurrentTab('trade'); }}>
            <span className="text-slate-500">ETH/USDT:</span>
            <span className="font-semibold text-slate-200">$3,180.40</span>
            <span className="text-emerald-400">+4.85%</span>
          </div>
          <div className="flex items-center space-x-1 hover:text-slate-200 cursor-pointer" onClick={() => { setSelectedPair('SOL/USDT'); setCurrentTab('trade'); }}>
            <span className="text-slate-500">SOL/USDT:</span>
            <span className="font-semibold text-slate-200">$178.65</span>
            <span className="text-emerald-400">+7.12%</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setHideBalances(!hideBalances)} 
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {hideBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideBalances ? 'Show Balances' : 'Hide Balances'}</span>
          </button>
          <div className="flex items-center space-x-1 text-cyan-400/90 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Reserve Backed</span>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Left: Brand logo & primary links */}
        <div className="flex items-center space-x-8">
          <button 
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-2.5 group cursor-pointer focus:outline-none"
            id="btn-kroma-brand"
          >
            {/* Original geometric monogram logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-teal-300 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/30 transition-all">
              <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16M4 12l10-8M9 8l11 12" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-bold tracking-wider text-white flex items-center gap-1.5 font-sans">
                KROMA
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 tracking-normal">
                  Vault
                </span>
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => {
              const active = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={`nav-${item.tab}`}
                  onClick={() => setCurrentTab(item.tab)}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                    active 
                      ? 'text-white bg-slate-800/80 font-semibold shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      item.badge === 'HOLD'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse'
                        : item.badge === 'PRO' 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                        : item.badge === 'NEW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-3">
          {/* Quick Deposit action */}
          <button
            id="btn-quick-deposit"
            onClick={() => openDepositModal('USDT')}
            className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{t('deposit')}</span>
          </button>

          {/* Fiat selector dropdown */}
          <div className="relative" ref={currencyRef}>
            <button
              id="btn-fiat-selector"
              onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition-colors"
            >
              <span>{FIAT_RATES[fiatCurrency]?.symbol || '$'} {fiatCurrency}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {isCurrencyMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#121721] border border-slate-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Select Currency
                </div>
                {fiatList.map(curr => (
                  <button
                    key={curr}
                    onClick={() => {
                      setFiatCurrency(curr);
                      setIsCurrencyMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      fiatCurrency === curr ? 'text-cyan-400 font-semibold bg-slate-800/40' : 'text-slate-200'
                    }`}
                  >
                    <span>{curr}</span>
                    <span className="text-slate-400 font-mono">{FIAT_RATES[curr].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language selector dropdown */}
          <div className="relative" ref={langRef}>
            <button
              id="btn-language-selector"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#121721] border border-slate-700 shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Language & Region
                </div>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      language === lang.code ? 'text-cyan-400 font-semibold bg-slate-800/40' : 'text-slate-200'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-[11px] text-slate-400 uppercase">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification bell flyout */}
          <div className="relative" ref={notifRef}>
            <button
              id="btn-notifications-bell"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121721] border border-slate-700 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Notifications</span>
                    {unreadNotifsCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                        {unreadNotifsCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 my-1">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                        n.read ? 'opacity-70 hover:bg-slate-800/40' : 'bg-slate-800/60 hover:bg-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & KYC Badge */}
          <div className="relative" ref={profileRef}>
            <button
              id="btn-user-profile-menu"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center font-bold text-xs text-white">
                KV
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {userProfile.nickname}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  VIP {userProfile.vipTier} • Verified
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#121721] border border-slate-700 shadow-2xl p-3 z-50">
                <div className="p-2 bg-slate-800/60 rounded-xl mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{userProfile.nickname}</div>
                      <div className="text-xs text-slate-400 font-mono">{authUser?.email || userProfile.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      VIP Tier {userProfile.vipTier}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">UID: <span className="text-slate-200 font-mono">{userProfile.uid}</span></span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Tier 2 KYC
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => { setCurrentTab('profile'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{t('profile')}</span>
                  </button>
                  <button
                    onClick={() => { setCurrentTab('security'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>{t('security')}</span>
                  </button>
                  <button
                    onClick={() => { setCurrentTab('kyc'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('kyc')}</span>
                  </button>
                  <button
                    onClick={() => { setCurrentTab('rewards'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Rewards Hub & Referral</span>
                  </button>
                  <a
                    href="/admin"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-cyan-300 hover:bg-cyan-950/40 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">Admin Portal (Approvals)</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400/80" />
                  </a>
                  <button
                    onClick={async () => { setIsProfileMenuOpen(false); await logout(); window.location.href='/login'; }}
                    className="w-full text-left px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-950/30 flex items-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 bg-[#0B0E14] border-b border-slate-800 space-y-2">
          {navItems.map(item => (
            <button
              key={item.tab}
              onClick={() => {
                setCurrentTab(item.tab);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentTab === item.tab ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                openDepositModal('USDT');
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-emerald-400 text-center"
            >
              {t('deposit')} Crypto
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
