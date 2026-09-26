import React, { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { BalanceAdjustmentForm } from './BalanceAdjustmentForm';
import { AdminFeeClearanceControl } from './AdminFeeClearanceControl';
import { AdminFeatureRegionalControl } from './AdminFeatureRegionalControl';
import { AdminEarnYieldControl } from './AdminEarnYieldControl';
import { AdminRewardsControl } from './AdminRewardsControl';
import { AdminTradingControl } from './AdminTradingControl';
import { AdminWalletAddressHub } from './AdminWalletAddressHub';
import { 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  Activity, 
  Users, 
  ArrowDownToLine, 
  ScrollText, 
  CheckCircle, 
  XCircle,
  Sliders,
  Percent,
  Gift,
  TrendingUp,
  Globe,
  Wallet,
  Bell,
  Clock,
  FileCheck,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  Database
} from 'lucide-react';

type Address = {
  id: string;
  asset: string;
  network: string;
  address: string;
  label?: string;
  minDeposit: number | string;
  instructions?: string;
  enabled: boolean;
};

type Feature = { key: string; enabled: boolean };
const FEATURES = ['deposits', 'withdrawals', 'trading', 'p2p', 'buySell', 'convert', 'earn', 'rewards', 'referrals', 'kyc'];

export const AdminView: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(Boolean(sessionStorage.getItem('kroma_admin_session')));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'earn' | 'rewards' | 'trade' | 'wallets' | 'notifications' | 'audit' | 'wallet_hub'>('overview');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [intendedDeposits, setIntendedDeposits] = useState<any[]>([]);
  const [copiedAdminHash, setCopiedAdminHash] = useState<string | null>(null);
  
  const [editing, setEditing] = useState<Address | null>(null);
  const blank = { asset: 'USDT', network: 'TRC20', address: '', label: '', minDeposit: '0', instructions: '', enabled: true };
  const [form, setForm] = useState(blank);
  
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [userAddrForm, setUserAddrForm] = useState({ asset: 'USDT', network: 'TRC20', address: '', label: '', minDeposit: '0', instructions: '', enabled: true });
  const [editingUserAddr, setEditingUserAddr] = useState<any | null>(null);

  const load = async () => {
    try {
      const [a, f, u, t, l, w, d, wd, notifData, intentData] = await Promise.all([
        apiFetch<any>('/api/admin/deposit-addresses').catch(() => ({ addresses: [] })),
        apiFetch<any>('/api/admin/features').catch(() => ({ features: [] })),
        apiFetch<any>('/api/admin/users').catch(() => ({ users: [] })),
        apiFetch<any>('/api/admin/transactions').catch(() => ({ transactions: [] })),
        apiFetch<any>('/api/admin/audit-logs').catch(() => ({ logs: [] })),
        apiFetch<any>('/api/admin/wallets').catch(() => ({ wallets: [] })),
        apiFetch<any>('/api/admin/deposits').catch(() => ({ deposits: [] })),
        apiFetch<any>('/api/admin/withdrawals').catch(() => ({ withdrawals: [] })),
        apiFetch<any>('/api/admin/notifications').catch(() => ({ notifications: [], unreadCount: 0 })),
        apiFetch<any>('/api/admin/intended-deposits').catch(() => ({ intendedDeposits: [] }))
      ]);
      setAddresses(a?.addresses || []);
      setFeatures(f?.features || []);
      setUsers(u?.users || []);
      setTransactions(t?.transactions || []);
      setLogs(l?.logs || []);
      setWallets(w?.wallets || []);
      setDeposits(d?.deposits || []);
      setWithdrawals(wd?.withdrawals || []);
      setAdminNotifications(notifData?.notifications || []);
      setUnreadNotifCount(notifData?.unreadCount || 0);
      setIntendedDeposits(intentData?.intendedDeposits || []);
      setError('');
    } catch (e: any) {
      if (
        e.message?.includes('401') ||
        e.message?.toLowerCase().includes('unauthorized') ||
        e.message?.toLowerCase().includes('session expired')
      ) {
        sessionStorage.removeItem('kroma_admin_session');
        sessionStorage.removeItem('kroma_admin_token');
        setLoggedIn(false);
        setError('Your admin session has expired or is invalid. Please sign in again.');
      } else {
        setError(e.message || 'Failed to refresh administrative data');
      }
    }
  };

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn]);

  const loadUserAddresses = async (id: string) => {
    setSelectedUserId(id);
    setUserAddresses([]);
    if (!id) return;
    try {
      const r = await apiFetch<any>(`/api/admin/users/${id}/deposit-addresses`);
      setUserAddresses(r.addresses || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveUserAddress = async () => {
    try {
      const body = { ...userAddrForm, minDeposit: Number(userAddrForm.minDeposit) || 0 };
      if (editingUserAddr) {
        await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${editingUserAddr.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses`, { method: 'POST', body: JSON.stringify(body) });
      }
      setEditingUserAddr(null);
      setUserAddrForm({ asset: 'USDT', network: 'TRC20', address: '', label: '', minDeposit: '0', instructions: '', enabled: true });
      await loadUserAddresses(selectedUserId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const removeUserAddress = async (id: string) => {
    if (!confirm('Delete this user-specific deposit address?')) return;
    try {
      await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${id}`, { method: 'DELETE' });
      await loadUserAddresses(selectedUserId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch<any>('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (res?.token) {
        sessionStorage.setItem('kroma_admin_token', res.token);
      }
      sessionStorage.setItem('kroma_admin_session', '1');
      setLoggedIn(true);
      setPassword('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    sessionStorage.removeItem('kroma_admin_session');
    sessionStorage.removeItem('kroma_admin_token');
    setLoggedIn(false);
  };

  const save = async () => {
    try {
      const body = { ...form, minDeposit: Number(form.minDeposit) || 0 };
      if (editing) {
        await apiFetch(`/api/admin/deposit-addresses/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/api/admin/deposit-addresses', { method: 'POST', body: JSON.stringify(body) });
      }
      setEditing(null);
      setForm(blank);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this deposit address?')) return;
    try {
      await apiFetch(`/api/admin/deposit-addresses/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggle = async (f: Feature) => {
    try {
      await apiFetch(`/api/admin/features/${f.key}`, { method: 'PUT', body: JSON.stringify({ enabled: !f.enabled }) });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmDepositAdmin = async (id: string, currentTxHash?: string) => {
    const hash = prompt('Enter Blockchain Tx Hash (or keep default for Admin Verified):', currentTxHash || `ADMIN_VERIFIED_${Date.now()}`);
    if (hash === null) return;
    try {
      await apiFetch(`/api/admin/deposits/${id}/confirm`, { method: 'POST', body: JSON.stringify({ txHash: hash.trim() || `ADMIN_VERIFIED_${Date.now()}` }) });
      await load();
      try {
        localStorage.setItem('kroma_balance_adjustment_event', JSON.stringify({ type: 'deposit_confirmed', id, time: Date.now() }));
        window.dispatchEvent(new CustomEvent('kroma:wallet-refresh', { detail: { id, type: 'deposit_confirmed' } }));
      } catch {}
    } catch (e: any) {
      setError(e.message);
    }
  };

  const rejectDepositAdmin = async (id: string) => {
    const reason = prompt('Enter rejection reason:', 'Invalid transfer or payment verification failed');
    if (reason === null) return;
    try {
      await apiFetch(`/api/admin/deposits/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      await load();
      try {
        localStorage.setItem('kroma_balance_adjustment_event', JSON.stringify({ type: 'deposit_rejected', id, time: Date.now() }));
        window.dispatchEvent(new CustomEvent('kroma:wallet-refresh', { detail: { id, type: 'deposit_rejected' } }));
      } catch {}
    } catch (e: any) {
      setError(e.message);
    }
  };

  const markAllNotifsRead = async () => {
    try {
      await apiFetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const recover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMsg('');
    setError('');
    try {
      const r = await apiFetch<any>('/api/admin/recovery', {
        method: 'POST',
        body: JSON.stringify({ recoveryKey, newEmail: newAdminEmail, newPassword: newAdminPassword })
      });
      setRecoveryMsg(r.message);
      setRecoveryKey('');
      setNewAdminPassword('');
      setNewAdminEmail('');
      setShowRecovery(false);
      await logout();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md bg-[#111622] border border-slate-700 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={login}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <ShieldCheck />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Control Center</h1>
                <p className="text-xs text-slate-400">Secure server-side administration</p>
              </div>
            </div>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" className="w-full mb-3 p-3 rounded-lg bg-slate-900 border border-slate-700" />
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="w-full mb-4 p-3 rounded-lg bg-slate-900 border border-slate-700" />
            <button className="w-full py-3 rounded-lg bg-cyan-400 text-slate-950 font-bold">Sign in</button>
          </form>
          <button onClick={() => setShowRecovery(!showRecovery)} className="w-full mt-3 py-2 text-sm text-cyan-400">
            <KeyRound className="w-4 h-4 inline mr-1" />Admin Recovery
          </button>
          {showRecovery && (
            <form onSubmit={recover} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <p className="text-xs text-slate-400">Use the recovery key configured in the server environment. This changes the admin email and password.</p>
              <input required type="password" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} placeholder="Recovery key" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700" />
              <input required type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="New admin email" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700" />
              <input required type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="New password (10+ chars)" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700" />
              <button className="w-full py-3 rounded-lg bg-amber-400 text-slate-950 font-bold">Reset admin credentials</button>
            </form>
          )}
          {(error || recoveryMsg) && (
            <p className={`text-sm mt-3 ${error ? 'text-red-400' : 'text-emerald-400'}`}>
              {error || recoveryMsg}
            </p>
          )}
        </div>
      </div>
    );
  }

  const pendingDepositsCount = deposits.filter(d => d.status === 'pending' || d.status === 'awaiting_approval').length;

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Live Operational Nexus</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Control Center</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Full administrative governance: Feature Flags, Regional Restrictions, Earn & Yield, Rewards Hub, and Exchange Trading.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition-colors">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />Refresh Data
            </button>
            <button onClick={logout} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition-colors text-rose-300">
              <LogOut className="w-3.5 h-3.5 inline mr-1.5" />Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Global Metric Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={<Users />} label="Registered Users" value={users.length} />
          <Stat icon={<Activity />} label="Ledger Transactions" value={transactions.length} />
          <Stat icon={<ArrowDownToLine />} label="Pending Deposit Reviews" value={pendingDepositsCount} highlight={pendingDepositsCount > 0} />
          <Stat icon={<ScrollText />} label="Audit Log Events" value={logs.length} />
        </div>

        {/* Navigation Tabs (Mobile-friendly, flex wrap, no horizontal clipping) */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#111622] border border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Approvals</span>
            {pendingDepositsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'overview' ? 'bg-slate-950 text-cyan-400' : 'bg-amber-500 text-slate-950'
              }`}>
                {pendingDepositsCount}
              </span>
            )}
          </button>

          <button
            id="tab-btn-admin-notifications"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts & Intended Deposits</span>
            {unreadNotifCount > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'notifications' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
              }`}>
                {unreadNotifCount}
              </span>
            ) : intendedDeposits.length > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'notifications' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {intendedDeposits.length}
              </span>
            ) : null}
          </button>

          <button
            id="tab-btn-admin-wallet-hub"
            onClick={() => setActiveTab('wallet_hub')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'wallet_hub'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>USER WALLET ADDRESS HUB</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'wallet_hub' ? 'bg-slate-950 text-cyan-400' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}>
              Dedicated Hub
            </span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'features'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Feature Flags & Regional Gating</span>
          </button>

          <button
            onClick={() => setActiveTab('earn')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'earn'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Earn & Yield</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Rewards Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('trade')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'trade'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Full Access "TRADE"</span>
          </button>

          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'wallets'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallets & Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Audit & Recovery</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & APPROVALS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real-time Notice of User Intended Deposits (Triggered on Copy Address) */}
            {intendedDeposits.length > 0 && (
              <section className="bg-gradient-to-r from-amber-500/10 via-[#111622] to-cyan-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-white flex items-center gap-2">
                        <span>Real-Time Intended Deposits</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {intendedDeposits.length} events logged
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Triggered instantaneously when users click "Copy Address" on the Receive modal.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    View All Intended Deposits & Alerts →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-left">
                        <th className="p-2">User / Email</th>
                        <th className="p-2">Asset & Network</th>
                        <th className="p-2">Address Copied</th>
                        <th className="p-2">Time of Intention</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {intendedDeposits.slice(0, 5).map((item: any) => {
                        const userDisplay = item.userEmail || item.user_email || (item.userId ? `User ${String(item.userId).slice(0, 8)}` : item.user_id ? `User ${String(item.user_id).slice(0, 8)}` : 'Active User');
                        const userIdDisplay = item.userId || item.user_id || '—';
                        const dateDisplay = item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleString() : '—';
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/50">
                            <td className="p-2 text-slate-200">
                              <div>{userDisplay}</div>
                              <div className="text-[10px] text-slate-500 font-sans">ID: {userIdDisplay}</div>
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                {item.asset} ({item.network})
                              </span>
                            </td>
                            <td className="p-2 text-slate-300 truncate max-w-[200px]" title={item.address}>
                              {item.address}
                            </td>
                            <td className="p-2 text-amber-300">
                              {dateDisplay}
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                Address Copied
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <BalanceAdjustmentForm users={users} onComplete={load} />
            <AdminFeeClearanceControl users={users} onRefreshParent={load} />

            {/* Deposits & Withdrawals Section */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Deposit Approvals Card */}
              <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-lg text-white">User Deposit Requests & Approvals</h2>
                    <p className="text-xs text-slate-400">Review pending user payments and credit wallet balances</p>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono font-semibold">{deposits.length} Total</span>
                </div>

                {/* Mobile Card View (No horizontal scroll) */}
                <div className="sm:hidden divide-y divide-slate-800/70 max-h-80 overflow-y-auto">
                  {deposits.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No deposit requests recorded</div>
                  ) : (
                    deposits.map((d: any) => {
                      const canReview = d.status === 'pending' || d.status === 'awaiting_approval';
                      return (
                        <div key={d.id} className="py-3 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-white">{d.email || d.userId}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{d.network}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                              d.status === 'awaiting_approval' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse' :
                              d.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                              'bg-amber-950 text-amber-300 border border-amber-800/40'
                            }`}>
                              {d.status === 'awaiting_approval' ? 'Review' : d.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg font-mono">
                            <span className="text-slate-400 font-sans text-[11px]">Amount:</span>
                            <span className="font-bold text-cyan-300">{d.amount} {d.asset}</span>
                          </div>

                          {canReview && (
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => confirmDepositAdmin(d.id, d.txHash)}
                                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[11px] font-bold transition-colors"
                              >
                                Approve &amp; Credit
                              </button>
                              <button
                                onClick={() => rejectDepositAdmin(d.id)}
                                className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded text-[11px] font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-left">
                        <th className="p-2">User / Email</th>
                        <th className="p-2">Asset</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No deposit requests recorded</td></tr>
                      ) : (
                        deposits.map((d: any) => {
                          const canReview = d.status === 'pending' || d.status === 'awaiting_approval';
                          return (
                            <tr key={d.id} className="border-b border-slate-800/70 hover:bg-slate-900/50">
                              <td className="p-2">
                                <div className="font-medium text-white">{d.email || d.userId}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{d.network}</div>
                              </td>
                              <td className="p-2 font-bold text-cyan-300">{d.asset}</td>
                              <td className="p-2 font-mono">{d.amount}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  d.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                                  d.status === 'awaiting_approval' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse' :
                                  d.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                                  'bg-amber-950 text-amber-300 border border-amber-800/40'
                                }`}>
                                  {d.status === 'awaiting_approval' ? 'Awaiting Approval' : d.status}
                                </span>
                              </td>
                              <td className="p-2 text-right">
                                {canReview ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => confirmDepositAdmin(d.id, d.txHash)}
                                      className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[11px] font-bold transition-colors"
                                    >
                                      Approve &amp; Credit
                                    </button>
                                    <button
                                      onClick={() => rejectDepositAdmin(d.id)}
                                      className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded text-[11px] font-bold transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px] font-mono">{d.status}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Withdrawal Queue */}
              <Data title="Withdrawal Queue" rows={withdrawals} cols={['email', 'asset', 'amount', 'status']} />
            </div>
          </div>
        )}

        {/* TAB 2: FEATURE FLAGS & REGIONAL GATING */}
        {activeTab === 'features' && (
          <AdminFeatureRegionalControl users={users} />
        )}

        {/* TAB 3: EARN & YIELD */}
        {activeTab === 'earn' && (
          <AdminEarnYieldControl />
        )}

        {/* TAB 4: REWARDS HUB */}
        {activeTab === 'rewards' && (
          <AdminRewardsControl />
        )}

        {/* TAB 5: TRADE CONTROL */}
        {activeTab === 'trade' && (
          <AdminTradingControl />
        )}

        {/* TAB: USER WALLET ADDRESS HUB */}
        {activeTab === 'wallet_hub' && (
          <AdminWalletAddressHub users={users} onRefreshParent={load} />
        )}

        {/* TAB 6: WALLETS & ADDRESSES */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            {/* Quick Hub Promo / Shortcut Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-[#111622] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">Need dedicated receiver addresses per user?</h4>
                  <p className="text-xs text-slate-400">
                    Manage multi-network address pools, batch activations, and automated user assignment in the <strong>USER WALLET ADDRESS HUB</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('wallet_hub')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap cursor-pointer"
              >
                Open USER WALLET ADDRESS HUB →
              </button>
            </div>

            {/* Platform Deposit Wallet Addresses */}
            <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg text-white">Platform-Wide Deposit Wallet Addresses</h2>
                  <p className="text-xs text-slate-400">Default addresses served to users who do not have an individual override.</p>
                </div>
                <button onClick={() => { setEditing(null); setForm(blank); }} className="px-3 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs">
                  <Plus className="w-4 h-4 inline mr-1" />Add Address
                </button>
              </div>

              {(editing !== null || form.address === '') && (
                <div className="grid md:grid-cols-2 gap-3 p-4 mb-5 rounded-xl bg-slate-900 border border-slate-800">
                  <Field label="Asset"><input value={form.asset} onChange={e => setForm({ ...form, asset: e.target.value })} className="input" /></Field>
                  <Field label="Network"><input value={form.network} onChange={e => setForm({ ...form, network: e.target.value })} className="input" /></Field>
                  <Field label="Wallet Address (Optional if Note provided)"><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input" placeholder="e.g. bc1q... or 0x... (leave empty if replacing with note)" /></Field>
                  <Field label="Label"><input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="input" placeholder="e.g. Master Cold Vault" /></Field>
                  <Field label="Minimum Deposit"><input type="number" min="0" value={form.minDeposit} onChange={e => setForm({ ...form, minDeposit: e.target.value })} className="input" /></Field>
                  <Field label="Deposit Note / Instructions (Can replace address)"><input value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} className="input" placeholder="e.g. Send via TRC-20 only or custom instructions" /></Field>
                  <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Active</label>
                  <div className="md:text-right">
                    <button onClick={save} className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold text-xs">
                      {editing ? 'Save Changes' : 'Save Configuration'}
                    </button>
                    {editing && (
                      <button onClick={() => setEditing(null)} className="ml-2 px-4 py-2 rounded-lg bg-slate-800 text-xs">Cancel</button>
                    )}
                  </div>
                </div>
              )}

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="text-left p-3">Asset</th>
                      <th className="text-left p-3">Network</th>
                      <th className="text-left p-3">Address</th>
                      <th className="text-left p-3">Min</th>
                      <th className="text-left p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map(a => (
                      <tr key={a.id} className="border-b border-slate-800/70">
                        <td className="p-3 font-bold text-white">{a.asset}</td>
                        <td className="p-3">{a.network}</td>
                        <td className="p-3 font-mono text-xs max-w-xs break-all">{a.address}</td>
                        <td className="p-3">{String(a.minDeposit)}</td>
                        <td className="p-3">{a.enabled ? <span className="text-emerald-400">Active</span> : <span className="text-red-400">Disabled</span>}</td>
                        <td className="p-3 flex justify-end gap-2">
                          <button onClick={() => { setEditing(a); setForm({ asset: a.asset, network: a.network, address: a.address, label: a.label || '', minDeposit: String(a.minDeposit), instructions: a.instructions || '', enabled: a.enabled }); }} className="p-2 bg-slate-800 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(a.id)} className="p-2 bg-red-500/10 text-red-400 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Individual User Specific Deposit Addresses */}
            <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-cyan-400" />
                <div>
                  <h2 className="font-bold text-lg text-white">Individual User Deposit Addresses</h2>
                  <p className="text-xs text-slate-400">Assign a custom receiving address to a specific user account.</p>
                </div>
              </div>

              <select value={selectedUserId} onChange={e => loadUserAddresses(e.target.value)} className="input mb-4">
                <option value="">Select a user account...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>

              {selectedUserId && (
                <>
                  <div className="grid md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
                    <Field label="Asset"><input value={userAddrForm.asset} onChange={e => setUserAddrForm({ ...userAddrForm, asset: e.target.value })} className="input" /></Field>
                    <Field label="Network"><input value={userAddrForm.network} onChange={e => setUserAddrForm({ ...userAddrForm, network: e.target.value })} className="input" /></Field>
                    <Field label="Receiving Address (Optional if Note provided)"><input value={userAddrForm.address} onChange={e => setUserAddrForm({ ...userAddrForm, address: e.target.value })} className="input" placeholder="e.g. bc1q... or 0x... (leave empty if replacing with note)" /></Field>
                    <Field label="Label"><input value={userAddrForm.label} onChange={e => setUserAddrForm({ ...userAddrForm, label: e.target.value })} className="input" placeholder="e.g. Dedicated User Wallet" /></Field>
                    <Field label="Minimum Deposit"><input type="number" min="0" value={userAddrForm.minDeposit} onChange={e => setUserAddrForm({ ...userAddrForm, minDeposit: e.target.value })} className="input" /></Field>
                    <Field label="Deposit Note / Instructions (Can replace address)"><input value={userAddrForm.instructions} onChange={e => setUserAddrForm({ ...userAddrForm, instructions: e.target.value })} className="input" placeholder="e.g. Custom note or instructions for this user" /></Field>
                    <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={userAddrForm.enabled} onChange={e => setUserAddrForm({ ...userAddrForm, enabled: e.target.checked })} /> Active</label>
                    <div>
                      <button onClick={saveUserAddress} className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold text-xs">
                        {editingUserAddr ? 'Save Configuration' : 'Add User Address / Note'}
                      </button>
                      {editingUserAddr && (
                        <button onClick={() => { setEditingUserAddr(null); setUserAddrForm({ asset: 'USDT', network: 'TRC20', address: '', label: '', minDeposit: '0', instructions: '', enabled: true }); }} className="ml-2 px-4 py-2 rounded-lg bg-slate-800 text-xs">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800">
                          <th className="text-left p-3">Asset</th>
                          <th className="text-left p-3">Network</th>
                          <th className="text-left p-3">Address</th>
                          <th className="text-left p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userAddresses.map(a => (
                          <tr key={a.id} className="border-b border-slate-800/70">
                            <td className="p-3 font-bold text-white">{a.asset}</td>
                            <td className="p-3">{a.network}</td>
                            <td className="p-3 font-mono text-xs break-all">{a.address}</td>
                            <td className="p-3">{a.enabled ? <span className="text-emerald-400">Active</span> : <span className="text-red-400">Disabled</span>}</td>
                            <td className="p-3 flex justify-end gap-2">
                              <button onClick={() => { setEditingUserAddr(a); setUserAddrForm({ asset: a.asset, network: a.network, address: a.address, label: a.label || '', minDeposit: String(a.minDeposit), instructions: a.instructions || '', enabled: a.enabled }); }} className="p-2 bg-slate-800 rounded">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeUserAddress(a.id)} className="p-2 bg-red-500/10 text-red-400 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* Wallet Ledger & Users */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Data title="Wallet Ledger Balances" rows={wallets} cols={['email', 'asset', 'accountType', 'available', 'locked']} />
              <Data title="Registered Users" rows={users} cols={['email', 'status', 'kycStatus']} />
            </div>
          </div>
        )}

        {/* TAB: LIVE NOTIFICATIONS & INTENDED DEPOSITS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111622] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">Live Administrative Alerts & User Intended Deposits</h2>
                  <p className="text-xs text-slate-400">
                    Real-time notifications triggered when users copy receiving addresses or submit confirmations via the Transaction Confirmation Hub.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllNotifsRead}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />
                  Mark All Read
                </button>
                <button
                  type="button"
                  onClick={load}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Section 1: User Intended Deposits Ledger (Triggered on Copy Address) */}
            <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>User Intended Deposits Stream</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Logged immediately when any user opens the Receive modal, selects a network, and clicks "Copy Address".
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {intendedDeposits.length} Recorded
                </span>
              </div>

              {intendedDeposits.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No intended deposits registered yet. When a user clicks "Copy Address" on the Receive modal, their intent will display here instantly with their user identity and timestamp.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-left">
                        <th className="p-2.5">User Identity</th>
                        <th className="p-2.5">Asset / Network</th>
                        <th className="p-2.5">Vault Address Copied</th>
                        <th className="p-2.5">Intended Time</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {intendedDeposits.map((item: any) => {
                        const userDisplay = item.userEmail || item.user_email || (item.userId ? `User ${String(item.userId).slice(0, 8)}` : item.user_id ? `User ${String(item.user_id).slice(0, 8)}` : 'Active User');
                        const userIdDisplay = item.userId || item.user_id || '—';
                        const dateDisplay = item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleString() : '—';
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/40">
                            <td className="p-2.5">
                              <div className="font-sans font-bold text-slate-200">{userDisplay}</div>
                              <div className="text-[10px] text-slate-500">ID: {userIdDisplay}</div>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                {item.asset}
                              </span>
                              <span className="ml-1.5 text-slate-400 text-[11px] font-sans">
                                {item.network}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[220px]" title={item.address}>{item.address}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.address);
                                    setCopiedAdminHash(item.id);
                                    setTimeout(() => setCopiedAdminHash(null), 1500);
                                  }}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                                  title="Copy address"
                                >
                                  {copiedAdminHash === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5 text-amber-300">
                              {dateDisplay}
                            </td>
                            <td className="p-2.5 font-sans">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Active Intent
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section 2: User Confirmation Hub Submissions & Admin Alerts */}
            <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <span>Transaction Confirmation Hub Submissions & Inquiries</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time notifications sent whenever a user interacts with the User Transaction Confirmation Hub or copies an address.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {adminNotifications.length} Alerts
                </span>
              </div>

              {adminNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No alerts received yet. When users submit confirmations from the Confirmation Hub, alerts will appear here.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {adminNotifications.map((notif: any) => {
                    const isIntent = notif.type === 'deposit_intent' || notif.type === 'intended_deposit';
                    const isConfirmation = notif.type === 'deposit_confirmation';
                    const isWithdrawal = notif.type === 'withdrawal_inquiry';
                    const isRead = Boolean(notif.isRead ?? notif.read);
                    const notifDate = notif.createdAt || notif.created_at ? new Date(notif.createdAt || notif.created_at).toLocaleString() : '—';
                    const notifType = String(notif.type || 'alert').replace(/_/g, ' ');

                    let payload: any = {};
                    try {
                      if (typeof notif.data === 'string') {
                        payload = JSON.parse(notif.data);
                      } else if (typeof notif.payload === 'string') {
                        payload = JSON.parse(notif.payload);
                      } else if (notif.data && typeof notif.data === 'object') {
                        payload = notif.data;
                      } else if (notif.payload && typeof notif.payload === 'object') {
                        payload = notif.payload;
                      }
                    } catch {
                      payload = {};
                    }

                    return (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isRead
                            ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                            : 'bg-[#151D2C] border-cyan-500/40 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isRead ? 'bg-slate-600' : 'bg-cyan-400 animate-pulse'}`} />
                            <span className="font-bold text-xs text-white">{notif.title || 'System Notification'}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              isIntent ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                              isConfirmation ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {notifType}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {notifDate}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                          {notif.message}
                        </p>

                        {/* Optional Meta Payload */}
                        {payload && Object.keys(payload).length > 0 && (
                          <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono flex flex-wrap gap-x-4 gap-y-1 text-slate-400">
                            {payload.asset && <span>Asset: <strong className="text-white">{payload.asset}</strong></span>}
                            {payload.network && <span>Network: <strong className="text-white">{payload.network}</strong></span>}
                            {payload.txHash && (
                              <span className="truncate max-w-[260px]">
                                TxHash: <strong className="text-cyan-300">{payload.txHash}</strong>
                              </span>
                            )}
                            {payload.amount && <span>Amount: <strong className="text-emerald-400">{payload.amount}</strong></span>}
                            {(payload.userEmail || notif.userEmail || notif.user_email) && (
                              <span>User: <strong className="text-slate-200">{payload.userEmail || notif.userEmail || notif.user_email}</strong></span>
                            )}
                            {(payload.userId || notif.userId || notif.user_id) && (
                              <span>ID: <strong className="text-slate-300">{payload.userId || notif.userId || notif.user_id}</strong></span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 7: AUDIT & RECOVERY */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Admin Recovery */}
            <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="text-amber-400" />
                <div>
                  <h2 className="font-bold text-lg text-white">Admin Recovery System</h2>
                  <p className="text-xs text-slate-400">Recovery resets the primary admin credentials and invalidates active sessions.</p>
                </div>
              </div>
              <button onClick={() => setShowRecovery(!showRecovery)} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
                {showRecovery ? 'Close recovery form' : 'Open recovery form'}
              </button>
              {showRecovery && (
                <form onSubmit={recover} className="grid md:grid-cols-2 gap-3 mt-4">
                  <input required type="password" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} placeholder="Recovery key" className="input" />
                  <input required type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="New admin email" className="input" />
                  <input required type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="New admin password" className="input" />
                  <button className="py-3 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs">Reset admin credentials</button>
                </form>
              )}
            </section>

            {/* Audit Logs */}
            <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
              <h2 className="font-bold text-lg text-white mb-3">Audit Logs</h2>
              <div className="space-y-2 max-h-96 overflow-auto">
                {logs.map(l => (
                  <div key={l.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-cyan-400 font-bold font-mono">{l.action}</span>
                      <span className="text-slate-300 ml-2">{l.entityType}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) => (
  <div className={`border rounded-2xl p-4 transition-all ${
    highlight ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-[#111622] border-slate-800'
  }`}>
    <div className={`mb-2 ${highlight ? 'text-amber-400' : 'text-cyan-400'}`}>{icon}</div>
    <div className="text-2xl font-bold font-mono text-white">{value}</div>
    <div className="text-xs text-slate-400">{label}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="text-xs text-slate-400 space-y-1 block">
    <span>{label}</span>
    {children}
  </label>
);

const Data = ({ title, rows, cols }: { title: string; rows: any[]; cols: string[] }) => (
  <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
    <h2 className="font-bold text-lg text-white mb-3">{title}</h2>
    {/* Mobile Cards (No horizontal drag) */}
    <div className="sm:hidden divide-y divide-slate-800/70">
      {rows.length === 0 ? (
        <div className="text-xs text-slate-500 py-4 text-center">No records</div>
      ) : (
        rows.slice(0, 20).map((r, i) => (
          <div key={r.id || i} className="py-2.5 space-y-1 text-xs">
            {cols.map(c => (
              <div key={c} className="flex justify-between items-center gap-2">
                <span className="text-slate-500 capitalize">{c}:</span>
                <span className="font-mono text-slate-200 truncate max-w-[200px]">{String(r[c] ?? '—')}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
    {/* Desktop Table */}
    <div className="hidden sm:block overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 text-left">
            {cols.map(c => (
              <th key={c} className="p-2 capitalize">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((r, i) => (
            <tr key={r.id || i} className="border-b border-slate-800/70 hover:bg-slate-900/40">
              {cols.map(c => <td key={c} className="p-2 font-mono">{String(r[c] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
