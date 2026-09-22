import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { 
  Globe, 
  ShieldCheck, 
  ShieldAlert,
  ToggleLeft, 
  ToggleRight, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Sparkles,
  X,
  Percent,
  Gift,
  Users
} from 'lucide-react';
import { FeatureSettingItem } from '../types/crypto';

interface FeatureDef {
  key: string;
  name: string;
  description: string;
  category: 'core' | 'finance' | 'incentive';
}

const FEATURE_CATALOG: FeatureDef[] = [
  { key: 'earn', name: 'Earn & Yield', description: 'Yield vaults, flexible savings, and locked staking programs', category: 'finance' },
  { key: 'rewards', name: 'Rewards Hub', description: 'ROI incentive tiers, vouchers, mystery boxes, and trading challenges', category: 'incentive' },
  { key: 'p2p', name: 'P2P Trading', description: 'Peer-to-peer escrow fiat & crypto merchant marketplace', category: 'finance' },
  { key: 'convert', name: 'Convert Hub', description: 'Instant zero-fee slippage-free asset swapping module', category: 'core' },
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminConfirmation, setAdminConfirmation] = useState<{ open: boolean; featureKey: string; featureName: string; type: 'on' | 'off' } | null>(null);

  const loadFeatures = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<any>('/api/admin/features');
      const map: Record<string, { enabled: boolean; region_restricted: boolean; restriction_message: string }> = {};
      const msgMap: Record<string, string> = {};

      // Seed catalog defaults first
      FEATURE_CATALOG.forEach(fc => {
        map[fc.key] = { enabled: true, region_restricted: false, restriction_message: '' };
        msgMap[fc.key] = '';
      });

      (data.features || []).forEach((f: any) => {
        const featureKey = f.key || f.feature_key;
        if (!featureKey) return;
        const isRestricted = Boolean(f.regionRestricted ?? f.region_restricted);
        const msg = f.restrictionMessage ?? f.restriction_message ?? '';
        map[featureKey] = {
          enabled: Boolean(f.enabled),
          region_restricted: isRestricted,
          restriction_message: msg,
        };
        msgMap[featureKey] = msg;
      });
      setFeatures(map);
      setCustomMsgEdit(msgMap);
    } catch (err: any) {
      console.error('Failed to load features:', err);
      setErrorMessage(err.message || 'Unable to load feature statuses from server.');
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

    // Immediate optimistic update so buttons respond immediately with zero lag
    setFeatures(prev => ({ ...prev, [key]: updated }));
    setSavingKey(key);
    setErrorMessage(null);

    const payload = {
      enabled: updated.enabled,
      regionRestricted: updated.region_restricted,
      restrictionMessage: customMsgEdit[key] ?? current.restriction_message,
    };

    try {
      // Send update to server (supported via PUT or POST)
      await apiFetch(`/api/admin/features/${key}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSaveSuccessKey(key);
      setTimeout(() => setSaveSuccessKey(null), 2500);

      // Broadcast changes across the application and tabs
      try {
        localStorage.setItem('kroma_feature_settings_sync', JSON.stringify({
          key,
          enabled: updated.enabled,
          regionRestricted: updated.region_restricted,
          time: Date.now()
        }));
        window.dispatchEvent(new CustomEvent('kroma:features-updated', {
          detail: {
            key,
            enabled: updated.enabled,
            regionRestricted: updated.region_restricted,
            restrictionMessage: payload.restrictionMessage
          }
        }));
      } catch {}

      if (field === 'region_restricted') {
        const featDef = FEATURE_CATALOG.find(f => f.key === key);
        setAdminConfirmation({
          open: true,
          featureKey: key,
          featureName: featDef?.name || key,
          type: updated.region_restricted ? 'on' : 'off',
        });
      }
    } catch (err: any) {
      console.error('Toggle feature error:', err);
      // Revert optimistic update on failure
      setFeatures(prev => ({ ...prev, [key]: current }));
      setErrorMessage(`Failed to update ${key}: ${err.message || 'Request failed'}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveMessage = async (key: string) => {
    const current = features[key] || { enabled: true, region_restricted: false, restriction_message: '' };
    setSavingKey(key);
    setErrorMessage(null);

    const messageToSave = customMsgEdit[key] || '';
    const payload = {
      enabled: current.enabled,
      regionRestricted: current.region_restricted,
      restrictionMessage: messageToSave,
    };

    try {
      await apiFetch(`/api/admin/features/${key}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setFeatures(prev => ({
        ...prev,
        [key]: { ...current, restriction_message: messageToSave },
      }));
      setSaveSuccessKey(key);
      setTimeout(() => setSaveSuccessKey(null), 2500);

      try {
        localStorage.setItem('kroma_feature_settings_sync', JSON.stringify({
          key,
          enabled: current.enabled,
          regionRestricted: current.region_restricted,
          restrictionMessage: messageToSave,
          time: Date.now()
        }));
        window.dispatchEvent(new CustomEvent('kroma:features-updated', {
          detail: {
            key,
            enabled: current.enabled,
            regionRestricted: current.region_restricted,
            restrictionMessage: messageToSave
          }
        }));
      } catch {}
    } catch (err: any) {
      console.error('Save message error:', err);
      setErrorMessage(`Failed to save notice for ${key}: ${err.message || 'Request failed'}`);
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
            <strong className="text-amber-300"> "Not available in your region"</strong> policies for Earn yield, Reward hub, P2P, and Convert.
          </p>
        </div>

        <button
          onClick={loadFeatures}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh States</span>
        </button>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-500/20"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Confirmation Alert Banner (Explicit confirmation when Restricted ON is clicked) */}
      {adminConfirmation && (
        <div className={`p-4 sm:p-5 rounded-2xl border-2 flex items-start justify-between gap-3 shadow-2xl animate-in fade-in slide-in-from-top-3 ${
          adminConfirmation.type === 'on'
            ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-amber-500/10'
            : 'bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-emerald-500/10'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl text-slate-950 font-black shrink-0 ${adminConfirmation.type === 'on' ? 'bg-amber-400' : 'bg-emerald-400'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
                <span>{adminConfirmation.type === 'on' ? 'CONFIRMATION: Restricted ON' : 'CONFIRMATION: Restriction OFF'}</span>
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${adminConfirmation.type === 'on' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>
                  {adminConfirmation.featureName}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                {adminConfirmation.type === 'on' ? (
                  <>
                    <strong className="text-amber-300">Restricted ON is now officially active!</strong> When any regular user clicks on <strong className="text-white">{adminConfirmation.featureName}</strong>, the exchange will immediately intercept access and display <strong className="text-amber-300">"Regional Restriction: Not Available in Your Region"</strong>.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-300">Restriction removed.</strong> Users from all geographic regions can now freely access and participate in <strong className="text-white">{adminConfirmation.featureName}</strong>.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminConfirmation(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Dismiss Confirmation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Direct Controls for Earn Yield, Reward Hub, and P2P */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Targeted Financial Hubs: Quick Restriction Gating</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Click "Restricted" to toggle ON/OFF with live confirmation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'earn', label: 'Earn Yield', icon: Percent },
            { key: 'rewards', label: 'Reward Hub', icon: Gift },
            { key: 'p2p', label: 'P2P Trading', icon: Users },
          ].map(hub => {
            const isRestricted = Boolean(features[hub.key]?.region_restricted);
            const isSaving = savingKey === hub.key;
            const HubIcon = hub.icon;

            return (
              <div
                key={hub.key}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  isRestricted
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isRestricted ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                      <HubIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{hub.label}</h4>
                      <span className={`text-[11px] font-mono block ${isRestricted ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                        {isRestricted ? '● Restricted ON' : '○ Allowed All'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(hub.key, 'region_restricted')}
                  disabled={isSaving}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isRestricted
                      ? 'bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>{isRestricted ? 'Restricted ON' : 'Set Restricted ON'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_CATALOG.map(feat => {
          const state = features[feat.key] || { enabled: true, region_restricted: false, restriction_message: '' };
          const isSaving = savingKey === feat.key;
          const isSuccess = saveSuccessKey === feat.key;

          return (
            <div
              key={feat.key}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                state.region_restricted
                  ? 'bg-[#14120E] border-amber-500/50 shadow-md shadow-amber-500/5'
                  : state.enabled
                  ? 'bg-[#0E131D] border-slate-800 hover:border-slate-700'
                  : 'bg-[#101014] border-slate-850 opacity-80'
              }`}
            >
              <div>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        state.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : state.enabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        state.region_restricted
                          ? 'bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-sm shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{state.region_restricted ? 'Restricted ON' : 'Restricted OFF'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Confirmation Pill when Restricted ON is active */}
                {state.region_restricted && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1.5 shrink-0">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      Restricted ON (Active)
                    </span>
                    <span className="text-[11px] text-amber-200/90 font-mono truncate">
                      User clicks &rarr; Shows "Regional Restriction"
                    </span>
                  </div>
                )}
              </div>

              {/* Custom restriction message */}
              {state.region_restricted && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
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
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {isSaving && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Save Notice</span>
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
