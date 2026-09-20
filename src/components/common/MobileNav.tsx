import React from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { NavigationTab } from '../../types/crypto';
import { Home, LineChart, CandlestickChart, Percent, Wallet } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentTab, setCurrentTab, t } = useCrypto();

  const items: { tab: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'home', label: t('home'), icon: <Home className="w-5 h-5" /> },
    { tab: 'markets', label: t('markets'), icon: <LineChart className="w-5 h-5" /> },
    { tab: 'trade', label: t('trade'), icon: <CandlestickChart className="w-5 h-5" /> },
    { tab: 'earn', label: t('earn'), icon: <Percent className="w-5 h-5" /> },
    { tab: 'wallet', label: t('wallet'), icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around">
      {items.map(item => {
        const active = currentTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              active ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
