import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { Gift, Users, Copy, Check, Sparkles, Trophy, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RewardsView: React.FC = () => {
  const { userProfile, t } = useCrypto();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [mysteryBoxOpened, setMysteryBoxOpened] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<string | null>(null);

  const referralCode = 'KROMA-VIP88';
  const referralLink = `https://kroma.exchange/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDailyCheckIn = () => {
    setCheckedIn(true);
  };

  const handleOpenMysteryBox = () => {
    setMysteryBoxOpened(true);
    setMysteryReward('Preview only — no reward was credited.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F1420] via-[#1A182E] to-[#0A0D14] border border-slate-700/80 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Gift className="w-4 h-4" />
            <span>KROMA REWARDS HUB & REFERRALS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Earn Crypto Rewards & 35% Commission
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Invite friends to trade on Kroma and receive up to 35% lifetime commission rebates paid in real-time USDT directly to your Funding Wallet.
          </p>
        </div>

        {/* Stats card */}
        <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shrink-0">
          <div className="text-center px-3">
            <span className="text-[11px] text-slate-400 block">Invited Friends</span>
            <span className="text-xl font-bold font-mono text-cyan-400">14</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center px-3">
            <span className="text-[11px] text-slate-400 block">Total Commission</span>
            <span className="text-xl font-bold font-mono text-emerald-400">$482.50</span>
          </div>
        </div>
      </div>

      {/* Grid: Mystery Box & Daily Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mystery Box */}
        <div className="p-6 rounded-3xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">VIP Mystery Box</h3>
                <p className="text-xs text-slate-400">Unlocked by completing &gt;$500 in volume</p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              1 Ready
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
            {!mysteryBoxOpened ? (
              <>
                <div className="text-4xl animate-bounce">🎁</div>
                <div className="text-xs text-slate-300">
                  Open your box to reveal trading fee vouchers, airdrop tokens, or cold cash rewards.
                </div>
                <button
                  onClick={() => setMysteryReward('Preview only — no reward was credited.')}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-gradient-to-r from-amber-400 to-amber-300 hover:opacity-95 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Unbox Reward Now
                </button>
              </>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs font-bold space-y-1">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
                <div>{mysteryReward}</div>
                <div className="text-[10px] text-slate-400 font-normal">Credited to your account rewards balance</div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Check-in Streak */}
        <div className="p-6 rounded-3xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Daily Check-In Streak</h3>
                <p className="text-xs text-slate-400">Claim free Kroma Points every 24 hours</p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              5-Day Streak 🔥
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs pt-2 font-mono">
            {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, idx) => (
              <div
                key={day}
                className={`p-2 rounded-xl border ${
                  idx < 5
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : idx === 5
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[9px] uppercase">{day}</div>
                <div className="font-bold mt-1">+{idx === 6 ? '100' : '10'} pts</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleDailyCheckIn}
            disabled={checkedIn}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
              checkedIn
                ? 'bg-slate-800 text-emerald-400 cursor-default flex items-center justify-center gap-1.5'
                : 'bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-900 hover:opacity-95 shadow-md active:scale-98 cursor-pointer'
            }`}
          >
            {checkedIn ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Checked In Today (+10 Pts Claimed)</span>
              </>
            ) : (
              'Check In Today (+10 Pts)'
            )}
          </button>
        </div>
      </div>

      {/* Referral Link & Commission Sharing Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E131D] border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Your Referral Information</h3>
            <p className="text-xs text-slate-400">Share your invite link to start accumulating automated commission</p>
          </div>
          <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Current Tier: 35% Rebate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-xs text-slate-400 font-semibold">Your Referral Code</span>
            <div className="flex items-center justify-between font-mono text-sm font-bold text-cyan-400">
              <span>{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-xs text-slate-400 font-semibold">Your Referral Link</span>
            <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-200 truncate">
              <span className="truncate pr-2">{referralLink}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
