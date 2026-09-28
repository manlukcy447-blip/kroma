import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Wallet,
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Eye,
  DollarSign,
  Coins,
  QrCode,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  ChevronRight,
  Sliders,
  Filter
} from 'lucide-react';
import { apiFetch } from './api';

export interface AdminUser {
  id: string;
  email: string;
  status: string;
  kycStatus: string;
  createdAt: string;
  customAddressCount?: number;
  fundedAssetCount?: number;
  usdtBalance?: number | string;
  isNewUser?: boolean;
}

export interface UserWalletBalance {
  spot: number;
  funding: number;
  earn: number;
  locked: number;
  total: number;
  priceUsd: number;
  usdValue: number;
}

export interface UserDepositAddress {
  id: string;
  userId: string;
  asset: string;
  network: string;
  address: string;
  label?: string;
  minDeposit?: number | string;
  instructions?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const COMMON_PRESETS = [
  { asset: 'USDT', network: 'TRC20', label: 'Dedicated USDT TRC20 Vault' },
  { asset: 'USDT', network: 'ERC20', label: 'Dedicated USDT ERC20 Vault' },
  { asset: 'USDT', network: 'BEP20', label: 'Dedicated USDT BSC Vault' },
  { asset: 'BTC', network: 'Bitcoin (Native SegWit)', label: 'Dedicated BTC SegWit' },
  { asset: 'ETH', network: 'Ethereum (ERC-20)', label: 'Dedicated ETH Vault' },
  { asset: 'SOL', network: 'Solana', label: 'Dedicated SOL Vault' },
  { asset: 'USDC', network: 'ERC20', label: 'Dedicated USDC ERC20' },
  { asset: 'BNB', network: 'BNB Smart Chain (BEP20)', label: 'Dedicated BNB Vault' }
];

export const AdminUserWalletsAddresses: React.FC<{
  users: AdminUser[];
  onRefreshParent?: () => void;
  initialUserId?: string;
}> = ({ users: initialUsers = [], onRefreshParent, initialUserId }) => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'new' | 'old' | 'funded' | 'custom_addr'>('all');
  
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || '');
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // User specific details
  const [userDetails, setUserDetails] = useState<{
    user: AdminUser;
    balances: Record<string, UserWalletBalance>;
    ledger: any[];
    totalUsdEstimated: number;
    customAddressesCount: number;
    feeClearance: any;
  } | null>(null);

  const [userAddresses, setUserAddresses] = useState<UserDepositAddress[]>([]);
  
  // Form state for adding/editing user network address
  const [addrForm, setAddrForm] = useState({
    asset: 'USDT',
    network: 'TRC20',
    address: '',
    label: '',
    minDeposit: '0',
    instructions: '',
    enabled: true
  });
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);

  // Balance adjustment modal / drawer inline
  const [showAdjustBalance, setShowAdjustBalance] = useState(false);
  const [adjustAsset, setAdjustAsset] = useState('USDT');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustAccount, setAdjustAccount] = useState<'spot' | 'funding' | 'earn'>('spot');
  const [adjustReason, setAdjustReason] = useState('Admin balance adjustment');
  const [adjusting, setAdjusting] = useState(false);

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load / reload user list
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch<{ users: AdminUser[] }>(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res?.users) {
        setUsers(res.users);
        if (!selectedUserId && res.users.length > 0) {
          setSelectedUserId(res.users[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0 && users.length === 0) {
      setUsers(initialUsers);
      if (!selectedUserId) setSelectedUserId(initialUsers[0].id);
    }
  }, [initialUsers]);

  // Load selected user's wallets and deposit addresses
  const loadUserDetails = async (uid: string) => {
    if (!uid) return;
    setLoadingDetails(true);
    setStatusMessage(null);
    try {
      const [walletData, addrData] = await Promise.all([
        apiFetch<any>(`/api/admin/users/${uid}/wallets`).catch(() => null),
        apiFetch<any>(`/api/admin/users/${uid}/deposit-addresses`).catch(() => null)
      ]);

      if (walletData) {
        setUserDetails(walletData);
      }
      if (addrData?.addresses) {
        setUserAddresses(addrData.addresses);
      } else {
        setUserAddresses([]);
      }
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load user details.' });
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick preset click
  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    // Check if user already has an address for this asset/network
    const existing = userAddresses.find(
      a => a.asset.toUpperCase() === preset.asset.toUpperCase() && a.network.toLowerCase() === preset.network.toLowerCase()
    );

    if (existing) {
      setEditingAddrId(existing.id);
      setAddrForm({
        asset: existing.asset,
        network: existing.network,
        address: existing.address || '',
        label: existing.label || preset.label,
        minDeposit: String(existing.minDeposit || 0),
        instructions: existing.instructions || '',
        enabled: existing.enabled
      });
    } else {
      setEditingAddrId(null);
      setAddrForm({
        asset: preset.asset,
        network: preset.network,
        address: '',
        label: preset.label,
        minDeposit: '0',
        instructions: '',
        enabled: true
      });
    }
  };

  // Save or update user address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setStatusMessage({ type: 'error', text: 'Please select a user first.' });
      return;
    }

    const cleanAddr = addrForm.address.trim();
    const cleanInst = addrForm.instructions.trim();

    if (!addrForm.asset || !addrForm.network) {
      setStatusMessage({ type: 'error', text: 'Asset and Network are required.' });
      return;
    }

    if (!cleanAddr && !cleanInst) {
      setStatusMessage({ type: 'error', text: 'Please provide either a wallet address or a note/instruction (or both).' });
      return;
    }

    setSavingAddr(true);
    setStatusMessage(null);

    try {
      const payload = {
        asset: addrForm.asset.trim().toUpperCase(),
        network: addrForm.network.trim(),
        address: cleanAddr,
        label: addrForm.label.trim() || `${addrForm.asset} Dedicated Address`,
        minDeposit: Number(addrForm.minDeposit) || 0,
        instructions: cleanInst,
        enabled: addrForm.enabled
      };

      if (editingAddrId) {
        await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${editingAddrId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setStatusMessage({ type: 'success', text: `Successfully updated ${payload.asset} (${payload.network}) for user.` });
      } else {
        await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setStatusMessage({ type: 'success', text: `Saved network address for ${payload.asset} (${payload.network})!` });
      }

      // Reset form
      setEditingAddrId(null);
      setAddrForm({
        asset: 'USDT',
        network: 'TRC20',
        address: '',
        label: '',
        minDeposit: '0',
        instructions: '',
        enabled: true
      });

      // Reload user data
      await loadUserDetails(selectedUserId);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error saving user network address' });
    } finally {
      setSavingAddr(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string, asset: string, network: string) => {
    if (!confirm(`Are you sure you want to remove the custom ${asset} (${network}) address for this user?`)) return;
    try {
      await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${id}`, { method: 'DELETE' });
      setStatusMessage({ type: 'success', text: `Removed custom address for ${asset} (${network}).` });
      await loadUserDetails(selectedUserId);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to delete address.' });
    }
  };

  // Toggle active/disabled
  const handleToggleAddress = async (addr: UserDepositAddress) => {
    try {
      await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${addr.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          asset: addr.asset,
          network: addr.network,
          address: addr.address || '',
          label: addr.label || '',
          minDeposit: addr.minDeposit || 0,
          instructions: addr.instructions || '',
          enabled: !addr.enabled
        })
      });
      setStatusMessage({ type: 'success', text: `${addr.asset} (${addr.network}) is now ${!addr.enabled ? 'Active' : 'Disabled'}.` });
      await loadUserDetails(selectedUserId);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to toggle address status.' });
    }
  };

  // Apply Balance Adjustment
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !adjustAmount || Number(adjustAmount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Enter a valid adjustment amount.' });
      return;
    }

    setAdjusting(true);
    try {
      const res = await apiFetch<any>('/api/admin/adjust-balance', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUserId,
          asset: adjustAsset.toUpperCase(),
          accountType: adjustAccount,
          amount: adjustAmount,
          adjustmentType: adjustType,
          reason: adjustReason.trim() || 'Admin manual adjustment'
        })
      });

      setStatusMessage({
        type: 'success',
        text: `Balance adjusted successfully! (${adjustType.toUpperCase()} ${adjustAmount} ${adjustAsset.toUpperCase()})`
      });

      setAdjustAmount('');
      setShowAdjustBalance(false);
      await loadUserDetails(selectedUserId);
      if (onRefreshParent) onRefreshParent();

      // Trigger local storage event for instant client tab refresh
      try {
        localStorage.setItem('kroma_balance_adjustment_event', JSON.stringify({
          userId: selectedUserId,
          asset: adjustAsset,
          time: Date.now()
        }));
      } catch {}
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to adjust balance.' });
    } finally {
      setAdjusting(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }

    if (filterType === 'new') {
      list = list.filter(u => {
        if (u.isNewUser) return true;
        const diffDays = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 3600 * 24);
        return diffDays <= 14;
      });
    } else if (filterType === 'old') {
      list = list.filter(u => {
        const diffDays = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 3600 * 24);
        return diffDays > 14;
      });
    } else if (filterType === 'funded') {
      list = list.filter(u => (u.fundedAssetCount || 0) > 0 || Number(u.usdtBalance || 0) > 0);
    } else if (filterType === 'custom_addr') {
      list = list.filter(u => (u.customAddressCount || 0) > 0);
    }

    return list;
  }, [users, search, filterType]);

  const selectedUser = users.find(u => u.id === selectedUserId) || userDetails?.user;

  // Format currency
  const fmtUsd = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explainer */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#111622] to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Individual User Addresses & Balances</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Old & New Users
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect real-time balances for any user and configure or change custom deposit network addresses & notes specifically for their account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchUsers(); if (selectedUserId) loadUserDetails(selectedUserId); }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers || loadingDetails ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}
      </div>

      {/* Main Grid: Left User Selector, Right User Balances & Network Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: User Directory & Search (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Select User ({filteredUsers.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Total: {users.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search email or UID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-white">✕</button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'new', label: 'New (≤14d)' },
                { id: 'old', label: 'Old' },
                { id: 'funded', label: 'Funded' },
                { id: 'custom_addr', label: 'Custom Addr' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                    filterType === f.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* User List */}
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No users found matching query.
                </div>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = u.id === selectedUserId;
                  const isNew = u.isNewUser || ((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 3600 * 24) <= 14);

                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate flex-1 font-mono text-cyan-200">
                          {u.email}
                        </span>
                        {isNew ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            NEW USER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 shrink-0">
                            OLD USER
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[120px]">
                          ID: {u.id.slice(0, 8)}…
                        </span>
                        <div className="flex items-center gap-2">
                          {(u.customAddressCount ?? 0) > 0 && (
                            <span className="text-cyan-400 font-bold" title="Custom addresses assigned">
                              {u.customAddressCount} addr
                            </span>
                          )}
                          <span className={`${u.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {u.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: User Balances & Network Address Manager (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedUserId ? (
            <div className="p-12 rounded-2xl bg-[#111622] border border-slate-800 text-center flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white">No User Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select any old or new user from the list on the left to see their live balances and configure individual network deposit addresses.
              </p>
            </div>
          ) : (
            <>
              {/* Selected User Header Card */}
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-white font-mono">{selectedUser?.email}</h2>
                      {selectedUser?.isNewUser || ((Date.now() - new Date(selectedUser?.createdAt || 0).getTime()) / (1000 * 3600 * 24) <= 14) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          New User
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          Established User
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {selectedUser?.status || 'Active'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        KYC: {selectedUser?.kycStatus || 'Unverified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        UID: <strong className="text-slate-200">{selectedUserId}</strong>
                        <button
                          onClick={() => handleCopy(selectedUserId, 'uid')}
                          className="p-1 hover:text-white transition"
                          title="Copy UID"
                        >
                          {copiedId === 'uid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </span>
                      {selectedUser?.createdAt && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAdjustBalance(!showAdjustBalance)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Adjust Balance
                    </button>
                  </div>
                </div>

                {/* Inline Balance Adjustment Drawer */}
                {showAdjustBalance && (
                  <form onSubmit={handleAdjustBalance} className="mt-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        Credit / Debit Balance for {selectedUser?.email}
                      </span>
                      <button type="button" onClick={() => setShowAdjustBalance(false)} className="text-slate-400 hover:text-white text-xs">✕ Close</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Action</label>
                        <select
                          value={adjustType}
                          onChange={e => setAdjustType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="credit">+ Credit (Add Funds)</option>
                          <option value="debit">- Debit (Deduct Funds)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Asset</label>
                        <input
                          type="text"
                          value={adjustAsset}
                          onChange={e => setAdjustAsset(e.target.value.toUpperCase())}
                          placeholder="e.g. USDT, BTC"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Amount</label>
                        <input
                          type="number"
                          step="any"
                          min="0.00000001"
                          value={adjustAmount}
                          onChange={e => setAdjustAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account</label>
                        <select
                          value={adjustAccount}
                          onChange={e => setAdjustAccount(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="spot">Spot / Trading</option>
                          <option value="funding">Funding Account</option>
                          <option value="earn">Earn Vault</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reason / Reference Note</label>
                      <input
                        type="text"
                        value={adjustReason}
                        onChange={e => setAdjustReason(e.target.value)}
                        placeholder="e.g. Manual admin deposit settlement or correction"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAdjustBalance(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={adjusting}
                        className={`px-4 py-1.5 rounded-lg font-bold text-xs text-slate-950 cursor-pointer ${
                          adjustType === 'credit' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-red-400 hover:bg-red-300'
                        }`}
                      >
                        {adjusting ? 'Applying…' : `Confirm ${adjustType === 'credit' ? 'Credit' : 'Debit'}`}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* USER BALANCE SECTION ("can also see balance of the user") */}
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white">User Wallet Balances</h3>
                      <p className="text-[11px] text-slate-400">Live ledger balances across all assets for this user.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Total Portfolio Value:</span>
                    <span className="text-base font-bold font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/30">
                      {fmtUsd(userDetails?.totalUsdEstimated || 0)}
                    </span>
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading balances…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(userDetails?.balances || {}).map(([sym, b]) => {
                      const totalAmount = b.total || 0;
                      const hasFunds = totalAmount > 0;

                      return (
                        <div
                          key={sym}
                          className={`p-3 rounded-xl border transition-all ${
                            hasFunds
                              ? 'bg-slate-900 border-slate-700 shadow-md'
                              : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">{sym}</span>
                            <span className={`text-[10px] font-mono ${hasFunds ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {fmtUsd(b.usdValue || 0)}
                            </span>
                          </div>

                          <div className="text-sm font-bold font-mono text-cyan-300">
                            {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-0.5 text-[10px] text-slate-400 font-mono">
                            <div className="flex justify-between">
                              <span>Spot:</span>
                              <span className="text-slate-200">{(b.spot || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Funding:</span>
                              <span className="text-slate-200">{(b.funding || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                            </div>
                            {(b.locked || 0) > 0 && (
                              <div className="flex justify-between text-amber-400">
                                <span>Locked:</span>
                                <span>{b.locked.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INDIVIDUAL USER NETWORK ADDRESS MANAGEMENT ("admin can change individual users networ addresses both old and new user") */}
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white">Custom Network Addresses & Notes</h3>
                      <p className="text-[11px] text-slate-400">
                        Assign or change specific network deposit addresses for this user. Overrides default addresses in their deposit modal.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    {userAddresses.length} Configured
                  </span>
                </div>

                {/* Quick Presets Bar */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">Quick Network Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_PRESETS.map((p, idx) => {
                      const isConfigured = userAddresses.some(
                        a => a.asset.toUpperCase() === p.asset.toUpperCase() && a.network.toLowerCase() === p.network.toLowerCase()
                      );

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer border ${
                            isConfigured
                              ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{p.asset} ({p.network})</span>
                          {isConfigured && <Check className="w-3 h-3 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Network Address Form (Add / Change) */}
                <form onSubmit={handleSaveAddress} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {editingAddrId ? <Pencil className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-emerald-400" />}
                      {editingAddrId ? 'Edit Configured Network Address' : 'Add / Change Network Address for this User'}
                    </span>
                    {editingAddrId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddrId(null);
                          setAddrForm({ asset: 'USDT', network: 'TRC20', address: '', label: '', minDeposit: '0', instructions: '', enabled: true });
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Asset Symbol</label>
                      <input
                        type="text"
                        value={addrForm.asset}
                        onChange={e => setAddrForm({ ...addrForm, asset: e.target.value.toUpperCase() })}
                        placeholder="e.g. USDT, BTC, ETH, SOL"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Network</label>
                      <input
                        type="text"
                        value={addrForm.network}
                        onChange={e => setAddrForm({ ...addrForm, network: e.target.value })}
                        placeholder="e.g. TRC20, ERC20, BEP20, Bitcoin"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Receiving Address <span className="text-slate-500 font-normal">(Optional if replacing with Note/Instructions)</span>
                      </label>
                      <input
                        type="text"
                        value={addrForm.address}
                        onChange={e => setAddrForm({ ...addrForm, address: e.target.value })}
                        placeholder="Paste dedicated blockchain address (e.g. TYD... or 0x... or bc1q...)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        If left blank and a Note is provided, the user deposit window displays the note instead of a blockchain address.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Deposit Note / Custom Instructions <span className="text-slate-500 font-normal">(Can replace address or display below address)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={addrForm.instructions}
                        onChange={e => setAddrForm({ ...addrForm, instructions: e.target.value })}
                        placeholder="e.g. Wire deposits under review. Reach out via support ticket for clearing, or send only from verified whitelist."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Label / Tag</label>
                      <input
                        type="text"
                        value={addrForm.label}
                        onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}
                        placeholder="e.g. Dedicated TRC20 Vault"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Minimum Deposit</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={addrForm.minDeposit}
                        onChange={e => setAddrForm({ ...addrForm, minDeposit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrForm.enabled}
                        onChange={e => setAddrForm({ ...addrForm, enabled: e.target.checked })}
                        className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Active / Enabled (Immediately visible to user)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {editingAddrId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddrId(null);
                            setAddrForm({ asset: 'USDT', network: 'TRC20', address: '', label: '', minDeposit: '0', instructions: '', enabled: true });
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={savingAddr}
                        className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {savingAddr ? 'Saving…' : (editingAddrId ? 'Update Network Address' : 'Save Network Address')}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Table of User's Current Configured Addresses */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Configured Addresses for {selectedUser?.email}
                  </span>

                  {userAddresses.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500">
                      No custom network addresses or notes configured for this user yet. 
                      Default platform addresses or clean empty state will be displayed until you set one above.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {userAddresses.map(a => (
                        <div
                          key={a.id}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {a.asset}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200">
                                {a.network}
                              </span>
                              {a.label && (
                                <span className="text-[11px] text-slate-400 italic">
                                  "{a.label}"
                                </span>
                              )}
                              <button
                                onClick={() => handleToggleAddress(a)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                  a.enabled
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {a.enabled ? 'Active' : 'Disabled'}
                              </button>
                            </div>

                            {/* Address or note indication */}
                            <div className="space-y-1">
                              {a.address ? (
                                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 break-all select-all">
                                  <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{a.address}</span>
                                  <button
                                    onClick={() => handleCopy(a.address, a.id)}
                                    className="p-1 hover:text-white transition shrink-0"
                                    title="Copy address"
                                  >
                                    {copiedId === a.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs font-mono text-amber-300 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span>Note Only (No blockchain address assigned)</span>
                                </div>
                              )}

                              {a.instructions && (
                                <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                                  <strong className="text-cyan-400">Note:</strong> {a.instructions}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => {
                                setEditingAddrId(a.id);
                                setAddrForm({
                                  asset: a.asset,
                                  network: a.network,
                                  address: a.address || '',
                                  label: a.label || '',
                                  minDeposit: String(a.minDeposit || 0),
                                  instructions: a.instructions || '',
                                  enabled: a.enabled
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition border border-slate-700"
                              title="Edit address"
                            >
                              <Pencil className="w-3 h-3 text-amber-400" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(a.id, a.asset, a.network)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs cursor-pointer transition border border-red-500/20"
                              title="Delete address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
