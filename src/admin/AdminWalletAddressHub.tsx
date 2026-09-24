import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Users, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertTriangle, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Clock, 
  Eye, 
  Lock, 
  Archive, 
  Ban, 
  ChevronRight,
  Send,
  Sliders,
  ExternalLink,
  History,
  QrCode
} from 'lucide-react';
import { apiFetch } from './api';

interface WalletHubAddress {
  id: string;
  asset: string;
  network: string;
  address: string;
  label?: string;
  status: 'available' | 'activated' | 'assigned' | 'in_use' | 'disabled' | 'archived';
  userId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  minDeposit?: number | string;
  instructions?: string;
  batchId?: string;
  activatedAt?: string | null;
  assignedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface NetworkInventory {
  asset: string;
  network: string;
  total: number;
  available: number;
  activated: number;
  assigned: number;
  inUse: number;
  disabled: number;
  archived: number;
}

interface HubAuditLog {
  id: number | string;
  addressId?: string;
  address?: string;
  asset?: string;
  network?: string;
  action: string;
  adminId?: string;
  adminEmail?: string;
  userId?: string;
  userEmail?: string;
  details?: string;
  createdAt: string;
}

interface AdminWalletAddressHubProps {
  users?: any[];
  onRefreshParent?: () => void;
}

export const AdminWalletAddressHub: React.FC<AdminWalletAddressHubProps> = ({ 
  users = [],
  onRefreshParent 
}) => {
  const [addresses, setAddresses] = useState<WalletHubAddress[]>([]);
  const [inventory, setInventory] = useState<NetworkInventory[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    available: 0,
    activated: 0,
    assigned: 0,
    inUse: 0,
    disabled: 0,
    archived: 0
  });
  const [auditLogs, setAuditLogs] = useState<HubAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Tabs
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'assigned_spotlight' | 'all_addresses' | 'audit_trail'>('inventory');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals / Drawers
  const [batchActivateModal, setBatchActivateModal] = useState<{ open: boolean; network?: string; asset?: string; count: number }>({
    open: false,
    count: 5
  });
  const [manualAssignModal, setManualAssignModal] = useState<{ open: boolean; address?: WalletHubAddress; targetUserId: string; customName: string }>({
    open: false,
    targetUserId: '',
    customName: ''
  });
  const [importGenerateModal, setImportGenerateModal] = useState<{
    open: boolean;
    mode: 'generate' | 'custom';
    network: string;
    asset: string;
    generateCount: number;
    customAddresses: string;
    status: 'available' | 'activated';
  }>({
    open: false,
    mode: 'generate',
    network: 'Tron (TRC-20)',
    asset: 'USDT',
    generateCount: 10,
    customAddresses: '',
    status: 'available'
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [addrRes, invRes, auditRes] = await Promise.all([
        apiFetch<any>(`/api/admin/wallet-hub/addresses?network=${encodeURIComponent(selectedNetwork)}&status=${encodeURIComponent(selectedStatus)}&search=${encodeURIComponent(searchQuery)}&limit=200`),
        apiFetch<any>('/api/admin/wallet-hub/inventory'),
        apiFetch<any>('/api/admin/wallet-hub/audit-logs')
      ]);

      if (addrRes) {
        setAddresses(addrRes.addresses || []);
        if (addrRes.stats) setStats(addrRes.stats);
      }
      if (invRes) {
        setInventory(invRes.inventory || []);
      }
      if (auditRes) {
        setAuditLogs(auditRes.logs || []);
      }
    } catch (err: any) {
      console.error('Wallet Hub fetch error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load wallet hub data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, [selectedNetwork, selectedStatus, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick or Batch Activate addresses for a specific network
  const handleBatchActivate = async () => {
    if (!batchActivateModal.network || batchActivateModal.count <= 0) return;
    try {
      const res = await apiFetch<any>('/api/admin/wallet-hub/batch-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: batchActivateModal.network,
          asset: batchActivateModal.asset,
          count: batchActivateModal.count
        })
      });
      setFeedback({ type: 'success', message: res.message || `Activated ${res.activatedCount} addresses for ${batchActivateModal.network}` });
      setBatchActivateModal({ open: false, count: 5 });
      fetchHubData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Batch activation failed' });
    }
  };

  // Single status transition
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await apiFetch<any>(`/api/admin/wallet-hub/addresses/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setFeedback({ type: 'success', message: res.message || 'Status updated successfully' });
      fetchHubData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status change failed' });
    }
  };

  // Manual Assign to User
  const handleManualAssign = async () => {
    if (!manualAssignModal.address || !manualAssignModal.targetUserId) {
      setFeedback({ type: 'error', message: 'Please select a target user' });
      return;
    }
    try {
      const selectedUserObj = users.find(u => (u.id || u.userId) === manualAssignModal.targetUserId);
      const res = await apiFetch<any>(`/api/admin/wallet-hub/addresses/${manualAssignModal.address.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: manualAssignModal.targetUserId,
          userName: manualAssignModal.customName || selectedUserObj?.name || (selectedUserObj?.email ? selectedUserObj.email.split('@')[0] : 'User')
        })
      });
      setFeedback({ type: 'success', message: res.message || 'Address successfully assigned to user' });
      setManualAssignModal({ open: false, targetUserId: '', customName: '' });
      fetchHubData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Manual assignment failed' });
    }
  };

  // Release address from user
  const handleReleaseAddress = async (id: string) => {
    if (!confirm('Are you sure you want to release this wallet address from the user? It will return to the active pool.')) return;
    try {
      const res = await apiFetch<any>(`/api/admin/wallet-hub/addresses/${id}/release`, {
        method: 'POST'
      });
      setFeedback({ type: 'success', message: res.message || 'Address released and returned to pool' });
      fetchHubData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Release failed' });
    }
  };

  // Batch Import or Generate
  const handleBatchImportOrGenerate = async () => {
    try {
      let payload: any = {
        network: importGenerateModal.network,
        asset: importGenerateModal.asset,
        status: importGenerateModal.status
      };
      if (importGenerateModal.mode === 'generate') {
        payload.generateCount = importGenerateModal.generateCount;
      } else {
        payload.addresses = importGenerateModal.customAddresses
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        if (payload.addresses.length === 0) {
          setFeedback({ type: 'error', message: 'Enter at least one wallet address' });
          return;
        }
      }

      const res = await apiFetch<any>('/api/admin/wallet-hub/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setFeedback({ type: 'success', message: res.message || `Successfully added addresses to ${importGenerateModal.network} pool` });
      setImportGenerateModal({
        open: false,
        mode: 'generate',
        network: 'Tron (TRC-20)',
        asset: 'USDT',
        generateCount: 10,
        customAddresses: '',
        status: 'available'
      });
      fetchHubData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to import/generate addresses' });
    }
  };

  // Assigned addresses list for the spotlight
  const assignedAddresses = useMemo(() => {
    return addresses.filter(a => a.status === 'assigned' || a.status === 'in_use' || Boolean(a.userId));
  }, [addresses]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:text-white cursor-pointer px-1">✕</button>
        </div>
      )}

      {/* Hero Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111622] via-[#161f30] to-[#0d131f] border border-cyan-500/30 p-6 shadow-xl shadow-cyan-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Database className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2.5">
                  USER WALLET ADDRESS HUB
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    Automated User Assignment Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Manages dedicated blockchain network receiver addresses, automated user registration allocation, and failsafe fallback hierarchy.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchHubData()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              Refresh Pool
            </button>
            <button
              onClick={() => setImportGenerateModal(prev => ({ ...prev, open: true }))}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Top-up / Generate Pool
            </button>
          </div>
        </div>

        {/* 3-Tier Fallback Hierarchy Architecture Badge */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-cyan-500/30 px-3 py-2 rounded-xl">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">1</span>
            <div>
              <div className="font-bold text-white">Tier 1: Dedicated User Address</div>
              <div className="text-[10px] text-cyan-300/80">Permanent dedicated user allocation</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-amber-500/30 px-3 py-2 rounded-xl">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">2</span>
            <div>
              <div className="font-bold text-white">Tier 2: USER WALLET HUB</div>
              <div className="text-[10px] text-amber-300/80">Auto-claims fresh activated pool address</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-xl">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">3</span>
            <div>
              <div className="font-bold text-white">Tier 3: Global System Vault</div>
              <div className="text-[10px] text-slate-400">Zero-downtime application reserve</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Inventory Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Addresses</span>
            <Database className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {stats.total || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across all networks</div>
        </div>

        <div className="bg-[#111622] border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
            <span>Ready / Activated</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
            {stats.activated || 0}
          </div>
          <div className="text-[10px] text-cyan-300/70 mt-1">Ready for auto-assignment</div>
        </div>

        <div className="bg-[#111622] border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-300 flex items-center justify-between">
            <span>Assigned to Users</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {stats.assigned || 0}
          </div>
          <div className="text-[10px] text-emerald-300/70 mt-1">Bound to user profiles</div>
        </div>

        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Available Reserve</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-200 mt-2 font-mono">
            {stats.available || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Unactivated reserve pool</div>
        </div>

        <div className="bg-[#111622] border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-purple-300 flex items-center justify-between">
            <span>In Use / Active</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2 font-mono">
            {stats.inUse || 0}
          </div>
          <div className="text-[10px] text-purple-300/70 mt-1">Receiving deposits</div>
        </div>

        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Disabled / Archived</span>
            <Ban className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-400 mt-2 font-mono">
            {(Number(stats.disabled) || 0) + (Number(stats.archived) || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Out of rotation</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Network Inventory & Activation</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950/40 text-current">
            {inventory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('assigned_spotlight')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'assigned_spotlight'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Activated to Users (Assigned)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {stats.assigned || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('all_addresses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'all_addresses'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>All Hub Addresses ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_trail')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'audit_trail'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail & Activity Log</span>
        </button>
      </div>

      {/* TAB 1: NETWORK INVENTORY & ACTIVATION */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Network Address Inventory Monitor</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Auto-Assignment Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                View real-time address pools per blockchain network. Click "Activate Batch" to instantly promote addresses for new user registrations.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item, idx) => {
              const activeCount = Number(item.activated) || 0;
              const availCount = Number(item.available) || 0;
              const assignCount = Number(item.assigned) || 0;
              const totalCount = Number(item.total) || 0;
              const isLow = activeCount < 2;

              return (
                <div 
                  key={`${item.asset}-${item.network}-${idx}`} 
                  className="bg-[#111622] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 transition-all shadow-lg shadow-black/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {item.asset}
                          </span>
                          <span className="font-bold text-sm text-white">{item.network}</span>
                        </div>
                      </div>
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Low Ready Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Healthy Pool
                        </span>
                      )}
                    </div>

                    {/* Progress Inventory Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Total Registered in Pool</span>
                        <span className="font-mono font-bold text-white">{totalCount} addresses</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all" 
                          style={{ width: `${totalCount ? (assignCount / totalCount) * 100 : 0}%` }}
                          title={`Assigned: ${assignCount}`}
                        />
                        <div 
                          className="bg-cyan-400 h-full transition-all" 
                          style={{ width: `${totalCount ? (activeCount / totalCount) * 100 : 0}%` }}
                          title={`Activated (Ready): ${activeCount}`}
                        />
                        <div 
                          className="bg-slate-600 h-full transition-all" 
                          style={{ width: `${totalCount ? (availCount / totalCount) * 100 : 0}%` }}
                          title={`Available: ${availCount}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="text-emerald-400 flex items-center gap-1">● Assigned: {assignCount}</span>
                        <span className="text-cyan-300 flex items-center gap-1">● Ready: {activeCount}</span>
                        <span className="text-slate-400 flex items-center gap-1">● Reserve: {availCount}</span>
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 mb-4 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400">Activated</div>
                        <div className="text-base font-black text-cyan-400 font-mono">{activeCount}</div>
                      </div>
                      <div className="border-x border-slate-800">
                        <div className="text-[10px] text-slate-400">Assigned</div>
                        <div className="text-base font-black text-emerald-400 font-mono">{assignCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Reserve</div>
                        <div className="text-base font-black text-slate-300 font-mono">{availCount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions on card */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => setBatchActivateModal({
                        open: true,
                        network: item.network,
                        asset: item.asset,
                        count: Math.min(availCount || 5, 5)
                      })}
                      disabled={availCount <= 0}
                      className="flex-1 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-40 disabled:pointer-events-none text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Activate Batch (+{Math.min(availCount || 5, 5)})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNetwork(item.network);
                        setActiveSubTab('all_addresses');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                      title="Inspect all addresses in this network"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVATED TO USERS (ASSIGNED SPOTLIGHT) */}
      {activeSubTab === 'assigned_spotlight' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Assigned User Wallet Visibility Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {assignedAddresses.length} User Allocations
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Individual assigned network receiver addresses permanently linked to users with zero multi-assignment collision.
              </p>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search user, ID, or address..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {assignedAddresses.length === 0 ? (
            <div className="p-12 text-center bg-[#111622] border border-slate-800 rounded-2xl">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-slate-300 font-bold text-sm">No addresses currently assigned</div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Addresses are automatically assigned to new registering users from the Activated pool, or you can manually assign addresses using the "All Hub Addresses" tab.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedAddresses.map(addr => {
                const userNameDisplay = addr.assignedToName || (addr.assignedToEmail ? addr.assignedToEmail.split('@')[0] : 'Active Trader');
                const userIdDisplay = addr.userId ? String(addr.userId).slice(0, 8) : '0092';
                const isCopied = copiedId === addr.id;

                return (
                  <div 
                    key={addr.id}
                    className="bg-[#111622] border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-5 shadow-xl shadow-black/20 flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* User Assignment Card Header */}
                      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 mb-3">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Activated to User:</div>
                          <div className="font-extrabold text-base text-white flex items-center gap-1.5">
                            <span>{userNameDisplay}</span>
                          </div>
                          <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                            {addr.assignedToEmail || 'user@kroma.io'}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      </div>

                      {/* Detail Fields in Exact Requested Prompt Specification */}
                      <div className="space-y-2 text-xs font-mono mb-4">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 font-sans text-[11px]">User ID:</span>
                          <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {userIdDisplay}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 font-sans text-[11px]">Network:</span>
                          <span className="font-bold text-cyan-300">
                            {addr.network} ({addr.asset})
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-slate-400 font-sans text-[11px]">
                            <span>Receiver Address:</span>
                            <button
                              onClick={() => handleCopy(addr.address, addr.id)}
                              className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 text-[10px]"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {isCopied ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="text-[11px] text-white break-all font-mono select-all bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            {addr.address}
                          </div>
                        </div>

                        {addr.assignedAt && (
                          <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1.5 pt-1">
                            <Clock className="w-3 h-3" />
                            Assigned on: {new Date(addr.assignedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on Assigned Card */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleReleaseAddress(addr.id)}
                        className="flex-1 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3 h-3" />
                        Release Address
                      </button>
                      <button
                        onClick={() => handleStatusChange(addr.id, addr.status === 'in_use' ? 'assigned' : 'in_use')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                        title={addr.status === 'in_use' ? 'Mark as Assigned' : 'Mark as In Use'}
                      >
                        {addr.status === 'in_use' ? 'In Use' : 'Active'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL HUB ADDRESSES & CONTROLS */}
      {activeSubTab === 'all_addresses' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111622] p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              {/* Network Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Network:</span>
                <select
                  value={selectedNetwork}
                  onChange={e => setSelectedNetwork(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Networks ({stats.total || 0})</option>
                  {inventory.map((inv, i) => (
                    <option key={i} value={inv.network}>
                      {inv.network} ({inv.asset})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available (Reserve)</option>
                  <option value="activated">Activated (Ready)</option>
                  <option value="assigned">Assigned to User</option>
                  <option value="in_use">In Use</option>
                  <option value="disabled">Disabled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search address, label, or user..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Addresses Table */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="p-3">Network & Asset</th>
                    <th className="p-3">Receiver Wallet Address</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">User Assignment</th>
                    <th className="p-3">Created / Batch</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {addresses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                        No wallet addresses match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    addresses.map(addr => {
                      const isCopied = copiedId === addr.id;
                      return (
                        <tr key={addr.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-sans">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                                {addr.asset}
                              </span>
                              <span>{addr.network}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{addr.label || 'Dedicated Vault'}</div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2 max-w-[280px]">
                              <span className="truncate text-slate-200" title={addr.address}>
                                {addr.address}
                              </span>
                              <button
                                onClick={() => handleCopy(addr.address, addr.id)}
                                className="text-slate-400 hover:text-cyan-400 cursor-pointer p-1"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="p-3 font-sans">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              addr.status === 'activated'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : addr.status === 'assigned'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : addr.status === 'in_use'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : addr.status === 'available'
                                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {addr.status === 'activated' && 'Ready / Activated'}
                              {addr.status === 'assigned' && 'Assigned'}
                              {addr.status === 'in_use' && 'In Use'}
                              {addr.status === 'available' && 'Available (Reserve)'}
                              {addr.status === 'disabled' && 'Disabled'}
                              {addr.status === 'archived' && 'Archived'}
                            </span>
                          </td>

                          <td className="p-3 font-sans">
                            {addr.userId ? (
                              <div>
                                <div className="font-bold text-white text-[11px]">
                                  {addr.assignedToName || 'Active User'}
                                </div>
                                <div className="text-[10px] text-cyan-400 font-mono">
                                  {addr.assignedToEmail || String(addr.userId).slice(0, 8)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">— Unassigned —</span>
                            )}
                          </td>

                          <td className="p-3 text-[10px] text-slate-400 font-sans">
                            <div>{addr.createdAt ? new Date(addr.createdAt).toLocaleDateString() : '—'}</div>
                            <div className="text-slate-500 font-mono">{addr.batchId || 'Default'}</div>
                          </td>

                          <td className="p-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick State Toggle */}
                              {addr.status === 'available' && (
                                <button
                                  onClick={() => handleStatusChange(addr.id, 'activated')}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  Activate
                                </button>
                              )}

                              {addr.status === 'activated' && (
                                <button
                                  onClick={() => setManualAssignModal({
                                    open: true,
                                    address: addr,
                                    targetUserId: '',
                                    customName: ''
                                  })}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  Assign User
                                </button>
                              )}

                              {addr.status === 'assigned' && (
                                <button
                                  onClick={() => handleReleaseAddress(addr.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  Release
                                </button>
                              )}

                              {/* Status changer select */}
                              <select
                                value={addr.status}
                                onChange={e => handleStatusChange(addr.id, e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value="available">Available</option>
                                <option value="activated">Activated</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_use">In Use</option>
                                <option value="disabled">Disabled</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOG */}
      {activeSubTab === 'audit_trail' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <span>Wallet Hub Immutable Audit Trail</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {auditLogs.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographic audit trail tracking all address creations, batch activations, user assignments, and administrative status updates.
              </p>
            </div>
          </div>

          <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Network & Address</th>
                    <th className="p-3">Admin / Actor</th>
                    <th className="p-3">User Target</th>
                    <th className="p-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'auto_assigned'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : log.action === 'batch_activated' || log.action === 'activated'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : log.action === 'released'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-sans font-bold text-white text-[11px]">
                            {log.asset} - {log.network}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={log.address}>
                            {log.address || '—'}
                          </div>
                        </td>
                        <td className="p-3 text-[11px] text-cyan-300 font-sans">
                          {log.adminEmail || 'System Engine'}
                        </td>
                        <td className="p-3 text-[11px] text-slate-200 font-sans">
                          {log.userEmail || (log.userId ? `ID: ${String(log.userId).slice(0, 8)}` : '—')}
                        </td>
                        <td className="p-3 text-[11px] text-slate-300 font-sans">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH ACTIVATE ADDRESSES */}
      {batchActivateModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Batch Activate Addresses</span>
              </h3>
              <button
                onClick={() => setBatchActivateModal(prev => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select how many reserve addresses from the available pool to activate for user auto-assignment on <strong className="text-white">{batchActivateModal.network}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Network</label>
                <input
                  type="text"
                  disabled
                  value={`${batchActivateModal.network} (${batchActivateModal.asset})`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Number of Addresses to Activate
                </label>
                <div className="flex items-center gap-2">
                  {[3, 5, 10, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBatchActivateModal(prev => ({ ...prev, count: cnt }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        batchActivateModal.count === cnt
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={batchActivateModal.count}
                  onChange={e => setBatchActivateModal(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBatchActivateModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchActivate}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                Activate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ASSIGN ADDRESS TO USER */}
      {manualAssignModal.open && manualAssignModal.address && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Manual Assign Wallet Address</span>
              </h3>
              <button
                onClick={() => setManualAssignModal(prev => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="text-slate-400">Assigning Address:</div>
              <div className="font-mono text-cyan-300 break-all select-all font-bold">
                {manualAssignModal.address.address}
              </div>
              <div className="text-[11px] text-slate-500">
                {manualAssignModal.address.network} ({manualAssignModal.address.asset})
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Target User</label>
                <select
                  value={manualAssignModal.targetUserId}
                  onChange={e => setManualAssignModal(prev => ({ ...prev, targetUserId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Choose Registered User --</option>
                  {users.map(u => (
                    <option key={u.id || u.userId} value={u.id || u.userId}>
                      {u.email} ({u.name || (u.id ? String(u.id).slice(0, 8) : 'User')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nifty Cole"
                  value={manualAssignModal.customName}
                  onChange={e => setManualAssignModal(prev => ({ ...prev, customName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setManualAssignModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH TOP-UP / GENERATE POOL */}
      {importGenerateModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Top-up / Generate Pool Addresses</span>
              </h3>
              <button
                onClick={() => setImportGenerateModal(prev => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setImportGenerateModal(prev => ({ ...prev, mode: 'generate' }))}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  importGenerateModal.mode === 'generate'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Bulk Auto-Generate Fresh Pool
              </button>
              <button
                type="button"
                onClick={() => setImportGenerateModal(prev => ({ ...prev, mode: 'custom' }))}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  importGenerateModal.mode === 'custom'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ➕ Paste Custom Addresses
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asset</label>
                  <select
                    value={importGenerateModal.asset}
                    onChange={e => setImportGenerateModal(prev => ({ ...prev, asset: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                    <option value="SOL">SOL</option>
                    <option value="SUI">SUI</option>
                    <option value="AVAX">AVAX</option>
                    <option value="NEAR">NEAR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Network</label>
                  <select
                    value={importGenerateModal.network}
                    onChange={e => setImportGenerateModal(prev => ({ ...prev, network: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Tron (TRC-20)">Tron (TRC-20)</option>
                    <option value="Bitcoin Native (SegWit)">Bitcoin Native (SegWit)</option>
                    <option value="Ethereum Mainnet (ERC-20)">Ethereum Mainnet (ERC-20)</option>
                    <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
                    <option value="Solana (SOL)">Solana (SOL)</option>
                    <option value="Sui Network">Sui Network</option>
                    <option value="Avalanche C-Chain">Avalanche C-Chain</option>
                    <option value="NEAR Protocol">NEAR Protocol</option>
                  </select>
                </div>
              </div>

              {importGenerateModal.mode === 'generate' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Number of Addresses to Generate
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {[5, 10, 20, 50].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setImportGenerateModal(prev => ({ ...prev, generateCount: cnt }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          importGenerateModal.generateCount === cnt
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        +{cnt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Paste Addresses (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={importGenerateModal.customAddresses}
                    onChange={e => setImportGenerateModal(prev => ({ ...prev, customAddresses: e.target.value }))}
                    placeholder="bc1q...&#10;0x...&#10;TYD..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="initStatus"
                      checked={importGenerateModal.status === 'available'}
                      onChange={() => setImportGenerateModal(prev => ({ ...prev, status: 'available' }))}
                    />
                    <div>
                      <div className="font-bold text-white">Available (Reserve)</div>
                      <div className="text-[10px] text-slate-500">Requires activation before user use</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="initStatus"
                      checked={importGenerateModal.status === 'activated'}
                      onChange={() => setImportGenerateModal(prev => ({ ...prev, status: 'activated' }))}
                    />
                    <div>
                      <div className="font-bold text-cyan-400">Activated (Instant)</div>
                      <div className="text-[10px] text-slate-500">Ready for instant user assignment</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setImportGenerateModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchImportOrGenerate}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                {importGenerateModal.mode === 'generate' ? 'Generate & Add to Pool' : 'Import Addresses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
