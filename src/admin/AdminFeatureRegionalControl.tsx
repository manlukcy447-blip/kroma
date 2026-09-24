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
  Users,
  User,
  UserCheck,
  Search,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

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

interface AdminFeatureRegionalControlProps {
  users?: Array<{ id: string; email: string; status?: string }>;
}

export const AdminFeatureRegionalControl: React.FC<AdminFeatureRegionalControlProps> = ({ users: initialUsers }) => {
  // Scope: 'global' for platform-wide settings, 'user' for individual user overrides
  const [controlScope, setControlScope] = useState<'global' | 'user'>('global');
  
  // User list state
  const [userList, setUserList] = useState<Array<{ id: string; email: string; status?: string }>>(initialUsers || []);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Global features state
  const [globalFeatures, setGlobalFeatures] = useState<Record<string, { enabled: boolean; region_restricted: boolean; restriction_message: string }>>({});
  
  // User-specific features state
  const [userFeatures, setUserFeatures] = useState<Record<string, {
    enabled: boolean;
    region_restricted: boolean;
    restriction_message: string;
    isOverridden: boolean;
    globalEnabled: boolean;
    globalRegionRestricted: boolean;
  }>>({});

  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccessKey, setSaveSuccessKey] = useState<string | null>(null);
  const [customMsgEdit, setCustomMsgEdit] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminConfirmation, setAdminConfirmation] = useState<{
    open: boolean;
    featureKey: string;
    featureName: string;
    type: 'on' | 'off';
    userEmail?: string;
  } | null>(null);

  // Sync users prop if updated
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUserList(initialUsers);
      if (!selectedUserId && initialUsers[0]) {
        setSelectedUserId(initialUsers[0].id);
      }
    }
  }, [initialUsers]);

  // Load user list from server if empty
  const fetchUsers = async () => {
    try {
      const data = await apiFetch<any>('/api/admin/users');
      if (data.users && data.users.length > 0) {
        setUserList(data.users);
        if (!selectedUserId) {
          setSelectedUserId(data.users[0].id);
        }
      }
    } catch (e: any) {
      console.warn('Failed to load user list for feature gating:', e.message);
    }
  };

  const loadGlobalFeatures = async () => {
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
      setGlobalFeatures(map);
      if (controlScope === 'global') {
        setCustomMsgEdit(msgMap);
      }
    } catch (err: any) {
      console.error('Failed to load features:', err);
      setErrorMessage(err.message || 'Unable to load feature statuses from server.');
    } finally {
      setLoading(false);
    }
  };

  // Load individual user feature overrides
  const loadUserFeatures = async (userId: string) => {
    if (!userId) return;
    setUserLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<any>(`/api/admin/users/${userId}/features`);
      const map: Record<string, any> = {};
      const msgMap: Record<string, string> = {};

      (data.features || []).forEach((f: any) => {
        map[f.key] = {
          enabled: Boolean(f.enabled),
          region_restricted: Boolean(f.regionRestricted),
          restriction_message: f.restrictionMessage || '',
          isOverridden: Boolean(f.isOverridden),
          globalEnabled: Boolean(f.globalEnabled),
          globalRegionRestricted: Boolean(f.globalRegionRestricted),
        };
        msgMap[f.key] = f.restrictionMessage || '';
      });

      setUserFeatures(map);
      setCustomMsgEdit(msgMap);
    } catch (err: any) {
      console.error('Failed to load user features:', err);
      setErrorMessage(err.message || 'Unable to load feature statuses for selected user.');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalFeatures();
    if (!userList || userList.length === 0) {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    if (controlScope === 'user' && selectedUserId) {
      loadUserFeatures(selectedUserId);
    }
  }, [controlScope, selectedUserId]);

  const selectedUserObj = userList.find(u => u.id === selectedUserId);

  // Toggle handler for either global or per-user
  const handleToggle = async (key: string, field: 'enabled' | 'region_restricted') => {
    if (controlScope === 'user') {
      if (!selectedUserId) {
        setErrorMessage('Please select a user first.');
        return;
      }

      const current = userFeatures[key] || {
        enabled: true,
        region_restricted: false,
        restriction_message: '',
        isOverridden: false,
        globalEnabled: true,
        globalRegionRestricted: false,
      };

      const updated = {
        ...current,
        [field]: !current[field],
        isOverridden: true,
      };

      // Optimistic update
      setUserFeatures(prev => ({ ...prev, [key]: updated }));
      setSavingKey(key);
      setErrorMessage(null);

      const payload = {
        enabled: updated.enabled,
        regionRestricted: updated.region_restricted,
        restrictionMessage: customMsgEdit[key] ?? current.restriction_message,
      };

      try {
        await apiFetch(`/api/admin/users/${selectedUserId}/features/${key}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSaveSuccessKey(key);
        setTimeout(() => setSaveSuccessKey(null), 2500);

        // Broadcast sync event
        try {
          localStorage.setItem('kroma_feature_settings_sync', JSON.stringify({
            userId: selectedUserId,
            key,
            enabled: updated.enabled,
            regionRestricted: updated.region_restricted,
            time: Date.now()
          }));
          window.dispatchEvent(new CustomEvent('kroma:features-updated', {
            detail: {
              userId: selectedUserId,
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
            userEmail: selectedUserObj?.email || String(selectedUserId || 'User').slice(0, 8),
          });
        }
      } catch (err: any) {
        console.error('Toggle user feature error:', err);
        setUserFeatures(prev => ({ ...prev, [key]: current }));
        setErrorMessage(`Failed to update ${key} for user: ${err.message || 'Request failed'}`);
      } finally {
        setSavingKey(null);
      }

    } else {
      // Global scope toggle
      const current = globalFeatures[key] || { enabled: true, region_restricted: false, restriction_message: '' };
      const updated = {
        ...current,
        [field]: !current[field],
      };

      setGlobalFeatures(prev => ({ ...prev, [key]: updated }));
      setSavingKey(key);
      setErrorMessage(null);

      const payload = {
        enabled: updated.enabled,
        regionRestricted: updated.region_restricted,
        restrictionMessage: customMsgEdit[key] ?? current.restriction_message,
      };

      try {
        await apiFetch(`/api/admin/features/${key}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSaveSuccessKey(key);
        setTimeout(() => setSaveSuccessKey(null), 2500);

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
        setGlobalFeatures(prev => ({ ...prev, [key]: current }));
        setErrorMessage(`Failed to update ${key}: ${err.message || 'Request failed'}`);
      } finally {
        setSavingKey(null);
      }
    }
  };

  // Save custom restriction message notice
  const handleSaveMessage = async (key: string) => {
    setSavingKey(key);
    setErrorMessage(null);
    const messageToSave = customMsgEdit[key] || '';

    if (controlScope === 'user') {
      if (!selectedUserId) return;
      const current = userFeatures[key] || { enabled: true, region_restricted: false, restriction_message: '' };
      const payload = {
        enabled: current.enabled,
        regionRestricted: current.region_restricted,
        restrictionMessage: messageToSave,
      };

      try {
        await apiFetch(`/api/admin/users/${selectedUserId}/features/${key}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setUserFeatures(prev => ({
          ...prev,
          [key]: { ...current, restriction_message: messageToSave, isOverridden: true },
        }));
        setSaveSuccessKey(key);
        setTimeout(() => setSaveSuccessKey(null), 2500);

        try {
          localStorage.setItem('kroma_feature_settings_sync', JSON.stringify({
            userId: selectedUserId,
            key,
            enabled: current.enabled,
            regionRestricted: current.region_restricted,
            restrictionMessage: messageToSave,
            time: Date.now()
          }));
          window.dispatchEvent(new CustomEvent('kroma:features-updated', {
            detail: {
              userId: selectedUserId,
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

    } else {
      const current = globalFeatures[key] || { enabled: true, region_restricted: false, restriction_message: '' };
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

        setGlobalFeatures(prev => ({
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
    }
  };

  // Revert a single feature override for this user back to global
  const handleClearUserOverride = async (key: string) => {
    if (!selectedUserId) return;
    setSavingKey(key);
    try {
      await apiFetch(`/api/admin/users/${selectedUserId}/features/${key}`, {
        method: 'DELETE',
      });
      await loadUserFeatures(selectedUserId);
      setSaveSuccessKey(key);
      setTimeout(() => setSaveSuccessKey(null), 2000);
    } catch (err: any) {
      setErrorMessage(`Failed to reset ${key}: ${err.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  // Reset all features for this user back to global platform settings
  const handleResetAllUserFeatures = async () => {
    if (!selectedUserId) return;
    if (!window.confirm(`Are you sure you want to reset all features for user "${selectedUserObj?.email || selectedUserId}" to global platform settings?`)) return;

    setUserLoading(true);
    try {
      await apiFetch(`/api/admin/users/${selectedUserId}/features/reset`, {
        method: 'POST',
      });
      await loadUserFeatures(selectedUserId);
      setAdminConfirmation({
        open: true,
        featureKey: 'all',
        featureName: 'All Features Reset',
        type: 'off',
        userEmail: selectedUserObj?.email,
      });
    } catch (err: any) {
      setErrorMessage(`Failed to reset user features: ${err.message}`);
    } finally {
      setUserLoading(false);
    }
  };

  // Filtered users for search input
  const filteredUsers = userList.filter(u => 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Active features state depending on scope
  const activeFeatures = controlScope === 'user' ? userFeatures : globalFeatures;
  const isTargetingUser = controlScope === 'user';
  const overriddenCount = Object.values(userFeatures).filter(f => f.isOverridden).length;

  return (
    <div className="space-y-6">
      {/* Overview & Scope Toggle Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#121826] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Platform Governance & Compliance Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">Feature Flags & Regional Restrictions</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Control feature accessibility in real time. Admin can apply restrictions globally across all users or
            <strong className="text-cyan-300"> select a preferred user to set custom feature restrictions & regional gating</strong>.
          </p>
        </div>

        {/* Scope Switcher: Global vs User */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setControlScope('global')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              controlScope === 'global'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global Platform</span>
          </button>

          <button
            onClick={() => setControlScope('user')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              controlScope === 'user'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Individual User Gating</span>
          </button>

          <button
            onClick={() => {
              if (controlScope === 'user' && selectedUserId) {
                loadUserFeatures(selectedUserId);
              } else {
                loadGlobalFeatures();
              }
            }}
            disabled={loading || userLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh States"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || userLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* USER SELECTOR SECTION (When in 'user' scope) */}
      {isTargetingUser && (
        <div className="p-5 rounded-2xl bg-[#0F1420] border-2 border-amber-500/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Select Preferred User to Configure</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Individual Override Mode
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose any registered user to apply tailored regional gating or disable/enable features specifically for their account.
                </p>
              </div>
            </div>

            {selectedUserObj && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResetAllUserFeatures}
                  disabled={userLoading || overriddenCount === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-bold border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Global Defaults</span>
                </button>
              </div>
            )}
          </div>

          {/* User Picker Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Dropdown Selector */}
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Preferred User Account:
              </label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {userList.length === 0 ? (
                  <option value="">No users found in database</option>
                ) : (
                  userList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email} — ID: {String(u.id || '').slice(0, 8)}... [{u.status || 'active'}]
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 2. Quick Search Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Search User:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => {
                    setUserSearchQuery(e.target.value);
                    const match = userList.find(u => u.email.toLowerCase().includes(e.target.value.toLowerCase()));
                    if (match) setSelectedUserId(match.id);
                  }}
                  placeholder="Filter by email or UUID..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Selected User Details Badge */}
          {selectedUserObj ? (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-slate-400">Target User: </span>
                  <strong className="text-white font-mono">{selectedUserObj.email}</strong>
                  <span className="text-slate-500 text-[11px] ml-2 font-mono">({selectedUserObj.id})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  overriddenCount > 0
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {overriddenCount > 0 ? `${overriddenCount} Custom Overrides Active` : 'Inheriting All Global Settings'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold">
                  {selectedUserObj.status || 'Active'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 text-center text-xs text-slate-400">
              No registered user selected. Please select a user above to configure custom feature settings.
            </div>
          )}
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-500/20 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Confirmation Alert Banner */}
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
                {adminConfirmation.userEmail && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black">
                    User: {adminConfirmation.userEmail}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                {adminConfirmation.type === 'on' ? (
                  <>
                    <strong className="text-amber-300">Restricted ON is now active!</strong> When{' '}
                    <strong className="text-white">{adminConfirmation.userEmail ? `user (${adminConfirmation.userEmail})` : 'any regular user'}</strong> accesses{' '}
                    <strong className="text-white">{adminConfirmation.featureName}</strong>, access will be intercepted with the regional restriction notice.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-300">Restriction removed.</strong>{' '}
                    {adminConfirmation.userEmail ? `User (${adminConfirmation.userEmail})` : 'Users from all geographic regions'} can now freely access{' '}
                    <strong className="text-white">{adminConfirmation.featureName}</strong>.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminConfirmation(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
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
            {isTargetingUser && selectedUserObj && (
              <span className="text-[11px] font-mono text-amber-300 font-bold ml-1">
                [For {selectedUserObj.email}]
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click "Restricted" to toggle ON/OFF with live confirmation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'earn', label: 'Earn Yield', icon: Percent },
            { key: 'rewards', label: 'Reward Hub', icon: Gift },
            { key: 'p2p', label: 'P2P Trading', icon: Users },
          ].map(hub => {
            const featState = activeFeatures[hub.key];
            const isRestricted = Boolean(featState?.region_restricted);
            const isSaving = savingKey === hub.key;
            const HubIcon = hub.icon;
            const isOverridden = isTargetingUser && Boolean((featState as any)?.isOverridden);

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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-mono block ${isRestricted ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                          {isRestricted ? '● Restricted ON' : '○ Allowed All'}
                        </span>
                        {isTargetingUser && (
                          <span className={`text-[9px] font-mono px-1 rounded ${isOverridden ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                            {isOverridden ? 'Custom' : 'Inherited'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(hub.key, 'region_restricted')}
                  disabled={isSaving || (isTargetingUser && !selectedUserId)}
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
          const state = activeFeatures[feat.key] || {
            enabled: true,
            region_restricted: false,
            restriction_message: '',
          };
          const isSaving = savingKey === feat.key;
          const isSuccess = saveSuccessKey === feat.key;
          const isOverridden = isTargetingUser && Boolean((state as any)?.isOverridden);

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base">{feat.name}</h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {feat.key}
                      </span>
                      {isTargetingUser && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isOverridden
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isOverridden ? 'User Override' : 'Inheriting Global'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{feat.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isTargetingUser && isOverridden && (
                      <button
                        onClick={() => handleClearUserOverride(feat.key)}
                        disabled={isSaving}
                        className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Revert feature to inherit global platform setting"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSuccess && (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 animate-in fade-in">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggles Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-3">
                  {/* 1. Feature On/Off */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-300">Feature Status:</span>
                    <button
                      onClick={() => handleToggle(feat.key, 'enabled')}
                      disabled={isSaving || (isTargetingUser && !selectedUserId)}
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
                      disabled={isSaving || (isTargetingUser && !selectedUserId)}
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
                      {isTargetingUser ? `User (${selectedUserObj?.email || 'User'}) blocked` : 'Users blocked in region'}
                    </span>
                  </div>
                )}
              </div>

              {/* Custom restriction message */}
              {state.region_restricted && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <label className="text-[11px] font-semibold text-amber-300/90 flex items-center gap-1">
                    <span>Region Restriction Notice {isTargetingUser ? `(Shown to ${selectedUserObj?.email || 'user'})` : '(Shown to user)'}:</span>
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
                      disabled={isSaving || (isTargetingUser && !selectedUserId)}
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
