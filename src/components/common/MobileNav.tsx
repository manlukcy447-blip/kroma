import React from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { NavigationTab } from '../../types/crypto';
import { 
  Home, 
  CandlestickChart, 
  ArrowRightLeft, 
  Percent, 
  Gift, 
  Wallet 
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentTab, setCurrentTab, feeClearance } = useCrypto();
  const isHoldActive = Boolean(feeClearance?.holdActive && feeClearance?.status !== 'cleared');

  const items: { tab: NavigationTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { tab: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { tab: 'trade', label: 'Trade', icon: <CandlestickChart className="w-4 h-4" /> },
    { tab: 'convert', label: 'Convert', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { tab: 'earn', label: 'Earn', icon: <Percent className="w-4 h-4" /> },
    { tab: 'rewards', label: 'Rewards', icon: <Gift className="w-4 h-4" /> },
    { tab: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" />, badge: isHoldActive },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-lg border-t border-slate-800 px-1 py-1.5 flex items-center justify-around">
      {items.map(item => {
        const active = currentTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            className={`relative flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-xs transition-colors min-h-[44px] ${
              active ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-400 rounded-full border border-[#0B0E14] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
