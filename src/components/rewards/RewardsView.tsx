import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { Sparkles, Gift, Users, CheckCircle2, Copy, Check, ChevronRight } from 'lucide-react';

export const RewardsView: React.FC = () => {
  const { userProfile, formatFiat, t } = useCrypto();
  const [copied, setCopied] = useState(false);
  const referralCode = `KROMA-${userProfile.uid?.slice(-6) || '789123'}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://kroma.exchange/signup?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tasks = [
    { id: 1, title: 'Complete Tier 2 KYC Verification', reward: '50 USDT Fee Voucher', status: 'completed' },
    { id: 2, title: 'Deposit ≥ $100 equivalent in crypto', reward: 'Mystery Box (Up to $500)', status: 'claimable' },
    { id: 3, title: 'Execute first Spot trade on any pair', reward: '20 USDT Trading Bonus', status: 'in_progress' },
    { id: 4, title: 'Invite 3 friends to complete KYC', reward: '100 USDT Cash Voucher', status: 'in_progress' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#1A1A2E] to-[#0A0D14] border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>KROMA REWARDS HUB & REFERRAL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Earn Vouchers & Mystery Boxes</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Complete verification steps and trading challenges to unlock exclusive fee rebates and crypto rewards.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center min-w-[180px]">
          <span className="text-[11px] font-semibold text-amber-300 block">Total Rewards Claimed</span>
          <span className="text-2xl font-black text-white font-mono">$150.00</span>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">VIP Tier 2 Active</span>
        </div>
      </div>

      {/* Referral box */}
      <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Invite Friends & Earn 30% Commission</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Referral ID: {referralCode}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={`https://kroma.exchange/signup?ref=${referralCode}`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono select-all focus:outline-none"
          />
          <button
            onClick={copyReferral}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Challenge Task List */}
      <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">Beginner Tasks & Challenges</h3>

        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{task.title}</span>
                </div>
                <div className="text-[11px] text-cyan-400 font-semibold">{task.reward}</div>
              </div>

              <div>
                {task.status === 'completed' ? (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                  </span>
                ) : task.status === 'claimable' ? (
                  <button className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 text-xs font-bold shadow hover:opacity-95">
                    Claim Reward
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
