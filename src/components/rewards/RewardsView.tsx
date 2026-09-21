import React, { useState, useEffect } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { RewardItem } from '../../types/crypto';
import { Sparkles, Gift, Users, CheckCircle2, Copy, Check, AlertCircle, Globe, TrendingUp, DollarSign, Percent, ArrowRight } from 'lucide-react';

export const RewardsView: React.FC = () => {
  const { userProfile, balances, regionalRestrictions, triggerRegionRestricted, claimRewardItem } = useCrypto();
  const [copied, setCopied] = useState(false);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimStatus, setClaimStatus] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const referralCode = `KROMA-${userProfile.uid?.slice(-6) || '789123'}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://kroma.exchange/signup?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGlobalRegionRestricted = Boolean(regionalRestrictions['rewards']);

  // Fetch admin-regulated reward items
  const fetchRewards = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/rewards/items`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.items && Array.isArray(data.items)) {
          setRewards(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleClaim = async (item: RewardItem) => {
    if (isGlobalRegionRestricted || item.regionRestricted) {
      triggerRegionRestricted('Rewards Hub Program');
      return;
    }

    setProcessingId(item.id);
    setClaimStatus(null);
    try {
      const res = await claimRewardItem(item.id, item.title);
      if (res.success) {
        setClaimStatus({ id: item.id, type: 'success', text: res.message });
      } else {
        setClaimStatus({ id: item.id, type: 'error', text: res.message });
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Global Regional Restriction Notice Banner */}
      {isGlobalRegionRestricted && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Notice: Rewards Hub participation is restricted in your geographic jurisdiction by exchange regulation.
            </span>
          </div>
          <button
            onClick={() => triggerRegionRestricted('Rewards Hub Program')}
            className="px-3 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-bold shrink-0"
          >
            View Policy
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#1A1A2E] to-[#0A0D14] border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>KROMA REWARDS HUB & ROI INCENTIVES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Rewards & Yield Incentives</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Participate in platform reward tiers, invest to unlock verified ROI programs, and claim verified cash and token bonuses.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center min-w-[190px]">
          <span className="text-[11px] font-semibold text-amber-300 block">Spot Balance</span>
          <span className="text-2xl font-black text-white font-mono">${(balances['USDT']?.spot || 0).toLocaleString()}</span>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Eligible for Claiming</span>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              <span>Available Rewards & Investment Plans</span>
            </h3>
            <p className="text-xs text-slate-400">Active reward tiers with configured types, minimum investments, and ROI</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {rewards.length} Active {rewards.length === 1 ? 'Program' : 'Programs'}
          </span>
        </div>

        {rewards.length === 0 && !loading ? (
          <div className="p-8 text-center rounded-2xl bg-[#0E131D] border border-slate-800 text-slate-400">
            No rewards programs configured yet. Check back shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map(item => {
              const isRestricted = isGlobalRegionRestricted || item.regionRestricted;
              const hasFeedback = claimStatus && claimStatus.id === item.id;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#0E131D] hover:bg-[#111724] border border-slate-800 hover:border-amber-500/40 transition-all shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-block mb-1">
                          {item.type || 'Standard'}
                        </span>
                        <h4 className="font-bold text-white text-base leading-snug">{item.title}</h4>
                      </div>
                      {isRestricted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                          Region Blocked
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {item.description || 'Participate and meet requirements to receive rewards.'}
                    </p>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Reward</span>
                        <span className="text-xs sm:text-sm font-black text-amber-400 block truncate">
                          {item.rewardAmount}
                        </span>
                      </div>
                      <div className="border-x border-slate-800 px-1">
                        <span className="text-[10px] text-slate-400 block uppercase">Min Invest</span>
                        <span className="text-xs sm:text-sm font-bold text-white block">
                          ${item.minInvestment || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">ROI</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-400 block">
                          +{item.roiPercentage || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback or Claim Button */}
                  <div className="space-y-2">
                    {hasFeedback && (
                      <div
                        className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                          claimStatus.type === 'error'
                            ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                            : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        }`}
                      >
                        {claimStatus.type === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="leading-tight">{claimStatus.text}</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleClaim(item)}
                      disabled={processingId === item.id}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        isRestricted
                          ? 'bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700'
                          : 'bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 text-slate-950 hover:opacity-95 shadow-lg shadow-amber-500/10'
                      }`}
                    >
                      <span>
                        {isRestricted
                          ? 'Not Available in Region'
                          : processingId === item.id
                          ? 'Claiming...'
                          : 'Participate & Claim'}
                      </span>
                      {!isRestricted && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referral Program Box */}
      <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Invite Friends & Earn Commission</h3>
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
    </div>
  );
};
