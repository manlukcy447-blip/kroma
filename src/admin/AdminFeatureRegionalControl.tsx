import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { 
  Globe, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Sparkles
} from 'lucide-react';
import { FeatureSettingItem } from '../types/crypto';

interface FeatureDef {
  key: string;
  name: string;
  description: string;
  category: 'core' | 'finance' | 'incentive';
}

const FEATURE_CATALOG: FeatureDef[] = [
  { key: 'convert', name: 'Convert Hub', description: 'Instant zero-fee slippage-free asset swapping module', category: 'core' },
  { key: 'p2p', name: 'P2P Trading', description: 'Peer-to-peer escrow fiat & crypto merchant marketplace', category: 'finance' },
  { key: 'earn', name: 'Earn & Yield', description: 'Yield vaults, flexible savings, and locked staking programs', category: 'finance' },
  { key: 'rewards', name: 'Rewards Hub', description: 'ROI incentive tiers, vouchers, mystery boxes, and trading challenges', category: 'incentive' },
  { key: 'trading', name: 'Spot Trading', description: 'Central orderbook exchange, limit/market order execution', category: 'core' },
  { key: 'buySell', name: 'Fiat Buy / Sell', description: 'Credit card and direct fiat payment gateway integrations', category: 'finance' },
  { key: 'deposits', name: 'Wallet Deposits', description: 'Blockchain address generation and incoming asset processing', category: 'core' },
  { key: 'withdrawals', name: 'Wallet Withdrawals', description: 'On-chain withdrawal dispatch and security hold enforcement', category: 'core' },
  { key: 'referrals', name: 'Referral System', description: 'Commission sharing and multi-tier affiliate tracking', category: 'incentive' },
  { key: 'kyc', name: 'Identity (KYC) Verification', description: 'Regulatory identity verification and compliance gatekeeper', category: 'core' },
];

export const AdminFeatureRegionalControl: React.FC = () => {
  const [features, setFeatures] = useState<Record<string, { enabled: boolean; region_restricted: boolean; restriction_message: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccessKey, setSaveSuccessKey] = useState<string | null>(null);
  const [customMsgEdit, setCustomMsgEdit] = useState<Record<string, string>>({});

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/admin/features');
      const map: Record<string, { enabled: boolean; region_restricted: boolean; restriction_message: string }> = {};
      const msgMap: Record<string, string> = {};
      (data.features || []).forEach((f: any) => {
        map[f.feature_key] = {
          enabled: Boolean(f.enabled),
          region_restricted: Boolean(f.region_restricted),
          restriction_message: f.restriction_message || '',
        };
        msgMap[f.feature_key] = f.restriction_message || '';
      });
      setFeatures(map);
      setCustomMsgEdit(msgMap);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleToggle = async (key: string, field: 'enabled' | 'region_restricted') => {
    const current = features[key] || { enabled: true, region_restricted: false, restriction_message: '' };
    const updated = {
      ...current,
      [field]: !current[field],
    };

    setSavingKey(key);
    try {
      await apiFetch(`/api/admin/features/${key}`, {
        method: 'POST',
        body: JSON.stringify({
          enabled: updated.enabled,
          regionRestricted: updated.region_restricted,
          restrictionMessage: customMsgEdit[key] ?? current.restriction_message,
        }),
      });

      setFeatures(prev => ({ ...prev, [key]: updated }));
      setSaveSuccessKey(key);
      setTimeout(() => setSaveSuccessKey(null), 2000);
    } catch {
      // ignore
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveMessage = async (key: string) => {
    const current = features[key] || { enabled: true, region_restricted: false, restriction_message: '' };
    setSavingKey(key);
    try {
      await apiFetch(`/api/admin/features/${key}`, {
        method: 'POST',
        body: JSON.stringify({
          enabled: current.enabled,
          regionRestricted: current.region_restricted,
          restrictionMessage: customMsgEdit[key] || '',
        }),
      });

      setFeatures(prev => ({
        ...prev,
        [key]: { ...current, restriction_message: customMsgEdit[key] || '' },
      }));
      setSaveSuccessKey(key);
      setTimeout(() => setSaveSuccessKey(null), 2000);
    } catch {
      // ignore
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#121826] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Platform Governance & Compliance Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">Feature Flags & Regional Restrictions</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Control feature accessibility in real time. Admin can switch features On/Off and enforce
            <strong className="text-amber-300"> "Not available in your region"</strong> policies for P2P, Earn & Yield, Rewards Hub, and Convert.
          </p>
        </div>

        <button
          onClick={loadFeatures}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh States</span>
        </button>
      </div>

      {/* Feature Cards Grid (Mobile friendly, responsive, no horizontal drag) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_CATALOG.map(feat => {
          const state = features[feat.key] || { enabled: true, region_restricted: false, restriction_message: '' };
          const isSaving = savingKey === feat.key;
          const isSuccess = saveSuccessKey === feat.key;

          return (
            <div
              key={feat.key}
              className={`p-5 rounded-2xl border transition-all ${
                state.region_restricted
                  ? 'bg-[#14120E] border-amber-500/40'
                  : state.enabled
                  ? 'bg-[#0E131D] border-slate-800 hover:border-slate-700'
                  : 'bg-[#101014] border-slate-850 opacity-80'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{feat.name}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {feat.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{feat.description}</p>
                </div>

                {isSuccess && (
                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 animate-in fade-in">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>

              {/* Toggles Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-3">
                {/* 1. Feature On/Off */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">Feature Status:</span>
                  <button
                    onClick={() => handleToggle(feat.key, 'enabled')}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      state.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    }`}
                  >
                    {state.enabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{state.enabled ? 'Enabled (ON)' : 'Disabled (OFF)'}</span>
                  </button>
                </div>

                {/* 2. Region Restricted Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Region Lock:</span>
                  </span>
                  <button
                    onClick={() => handleToggle(feat.key, 'region_restricted')}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      state.region_restricted
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{state.region_restricted ? 'Restricted' : 'Allowed All'}</span>
                  </button>
                </div>
              </div>

              {/* Custom restriction message */}
              {state.region_restricted && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-amber-300/90 flex items-center gap-1">
                    <span>Region Restriction Notice (Shown to user):</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMsgEdit[feat.key] ?? ''}
                      onChange={e => setCustomMsgEdit(prev => ({ ...prev, [feat.key]: e.target.value }))}
                      placeholder={`Access to ${feat.name} is not available in your region due to regulatory compliance.`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/30 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleSaveMessage(feat.key)}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
                    >
                      Save Notice
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
