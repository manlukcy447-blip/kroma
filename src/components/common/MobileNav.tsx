import React from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { NavigationTab } from '../../types/crypto';
import { Home, LineChart, CandlestickChart, Percent, Wallet } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentTab, setCurrentTab, t, feeClearance } = useCrypto();
  const isHoldActive = Boolean(feeClearance?.holdActive && feeClearance?.status !== 'cleared');

  const items: { tab: NavigationTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { tab: 'home', label: t('home'), icon: <Home className="w-5 h-5" /> },
    { tab: 'markets', label: t('markets'), icon: <LineChart className="w-5 h-5" /> },
    { tab: 'trade', label: t('trade'), icon: <CandlestickChart className="w-5 h-5" /> },
    { tab: 'earn', label: t('earn'), icon: <Percent className="w-5 h-5" /> },
    { tab: 'wallet', label: t('wallet'), icon: <Wallet className="w-5 h-5" />, badge: isHoldActive },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around">
      {items.map(item => {
        const active = currentTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              active ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#0B0E14] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
