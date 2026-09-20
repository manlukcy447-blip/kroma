import React from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { ShieldCheck, Lock, Activity, Server, FileText, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentTab } = useCrypto();

  return (
    <footer className="border-t border-slate-800/80 bg-[#070A0F] text-slate-400 text-xs py-10 px-4 sm:px-6 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
        {/* Brand overview */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-900 font-black text-sm">
              K
            </div>
            <span className="text-lg font-bold text-white tracking-wider">KROMA</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Vault & Exchange
            </span>
          </div>
          <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
            Institutional-grade digital asset custody, real-time spot order matching engine, cross-chain bridge gateway, and audited decentralized reserves.
          </p>
          <div className="flex items-center space-x-3 pt-2 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 104.2% Proof of Reserves
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Lock className="w-3.5 h-3.5" /> ISO/IEC 27001 Certified
            </span>
          </div>
        </div>

        {/* Column 1: Products */}
        <div className="space-y-2.5">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Exchange</h4>
          <ul className="space-y-1.5">
            <li><button onClick={() => setCurrentTab('markets')} className="hover:text-white transition-colors">Markets</button></li>
            <li><button onClick={() => setCurrentTab('trade')} className="hover:text-white transition-colors">Spot Trading</button></li>
            <li><button onClick={() => setCurrentTab('convert')} className="hover:text-white transition-colors">Instant Swap</button></li>
            <li><button onClick={() => setCurrentTab('buysell')} className="hover:text-white transition-colors">Buy Crypto (Fiat)</button></li>
            <li><button onClick={() => setCurrentTab('p2p')} className="hover:text-white transition-colors">P2P Escrow Desk</button></li>
          </ul>
        </div>

        {/* Column 2: Earn & Custody */}
        <div className="space-y-2.5">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Custody & Yield</h4>
          <ul className="space-y-1.5">
            <li><button onClick={() => setCurrentTab('wallet')} className="hover:text-white transition-colors">Kroma Multi-Chain Vault</button></li>
            <li><button onClick={() => setCurrentTab('earn')} className="hover:text-white transition-colors">Flexible Staking</button></li>
            <li><button onClick={() => setCurrentTab('earn')} className="hover:text-white transition-colors">High-Yield Vaults</button></li>
            <li><button onClick={() => setCurrentTab('rewards')} className="hover:text-white transition-colors">Rewards Hub & Mystery Box</button></li>
            <li><button onClick={() => setCurrentTab('rewards')} className="hover:text-white transition-colors">Referral Program</button></li>
          </ul>
        </div>

        {/* Column 3: Trust & Security */}
        <div className="space-y-2.5">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Security</h4>
          <ul className="space-y-1.5">
            <li><button onClick={() => setCurrentTab('security')} className="hover:text-white transition-colors">Security Center</button></li>
            <li><button onClick={() => setCurrentTab('security')} className="hover:text-white transition-colors">2FA Verification</button></li>
            <li><button onClick={() => setCurrentTab('security')} className="hover:text-white transition-colors">Device & Sessions</button></li>
            <li><button onClick={() => setCurrentTab('kyc')} className="hover:text-white transition-colors">Identity Verification (KYC)</button></li>
            <li><button onClick={() => setCurrentTab('profile')} className="hover:text-white transition-colors">VIP Fee Schedule</button></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <div>
          © {new Date().getFullYear()} Kroma Global Digital Asset Holdings Ltd. All rights reserved.
        </div>
        <div className="flex items-center space-x-6">
          <span className="hover:text-slate-400 cursor-pointer">Privacy Notice</span>
          <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-400 cursor-pointer">Proof of Solvency</span>
          <span className="hover:text-slate-400 cursor-pointer">API Documentation</span>
        </div>
      </div>
    </footer>
  );
};
