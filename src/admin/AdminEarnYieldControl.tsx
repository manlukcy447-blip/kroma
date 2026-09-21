import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { 
  Percent, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  Globe, 
  Unlock, 
  Lock, 
  AlertCircle,
  Sliders,
  DollarSign,
  Calendar
} from 'lucide-react';

interface EarnProductAdmin {
  id: string;
  asset: string;
  type: 'flexible' | 'locked';
  apy: number;
  durationDays: number;
  minDeposit: number;
  status: 'active' | 'paused';
  regionRestricted: boolean;
  createdAt?: string;
}

export const AdminEarnYieldControl: React.FC = () => {
  const [products, setProducts] = useState<EarnProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Form state
  const [formAsset, setFormAsset] = useState('USDT');
  const [formType, setFormType] = useState<'flexible' | 'locked'>('flexible');
  const [formApy, setFormApy] = useState('8.5');
  const [formDuration, setFormDuration] = useState('0');
  const [formMinDeposit, setFormMinDeposit] = useState('10');
  const [formRegionRestricted, setFormRegionRestricted] = useState(false);
  const [formStatus, setFormStatus] = useState<'active' | 'paused'>('active');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/admin/earn/products');
      setProducts(data.products || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleRegion = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/api/admin/earn/products/${id}/toggle-region`, { method: 'POST' });
      const nextState = !current;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, regionRestricted: nextState } : p));
      setActionStatus(nextState ? 'Confirmation: Restricted ON - Users clicking this vault will see "Regional Restriction".' : 'Confirmation: Restriction OFF - Vault allowed globally.');
      setTimeout(() => setActionStatus(null), 4000);
    } catch {
      // ignore
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'paused' : 'active';
    try {
      await apiFetch(`/api/admin/earn/products/${id}/toggle-status`, { method: 'POST' });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      setActionStatus(`Product ${newStatus === 'active' ? 'activated' : 'paused'}.`);
      setTimeout(() => setActionStatus(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this Earn & Yield vault product?')) return;
    try {
      await apiFetch(`/api/admin/earn/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'paused' } : p));
      fetchProducts();
      setActionStatus('Product removed.');
      setTimeout(() => setActionStatus(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/admin/earn/products', {
        method: 'POST',
        body: JSON.stringify({
          asset: formAsset.trim().toUpperCase(),
          type: formType,
          apy: parseFloat(formApy) || 5,
          durationDays: formType === 'flexible' ? 0 : parseInt(formDuration) || 30,
          minDeposit: parseFloat(formMinDeposit) || 10,
          status: formStatus,
          regionRestricted: formRegionRestricted,
        }),
      });

      setShowAddModal(false);
      fetchProducts();
      setActionStatus('New Earn & Yield vault created successfully.');
      setTimeout(() => setActionStatus(null), 3000);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#10192A] to-[#0A101C] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4" />
            <span>Yield Treasury Administration</span>
          </div>
          <h2 className="text-xl font-bold text-white">Earn & Yield Vaults Management</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure return on investment (APY), vault types (Flexible / Locked durations), minimum investment caps,
            and enforce regional compliance restrictions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Yield Vault</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionStatus}</span>
        </div>
      )}

      {/* Cards Grid (Mobile responsive, no horizontal drag) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
              p.regionRestricted
                ? 'bg-[#15120F] border-amber-500/40'
                : p.status === 'active'
                ? 'bg-[#0E131D] border-slate-800 hover:border-slate-700'
                : 'bg-slate-900/40 border-slate-850 opacity-65'
            }`}
          >
            <div className="space-y-3">
              {/* Top info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center">
                    {p.asset}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {p.asset} {p.type === 'flexible' ? 'Flexible Vault' : `${p.durationDays}D Locked`}
                    </h3>
                    <span className="text-[11px] text-slate-400 capitalize">{p.type} Yield Structure</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {p.regionRestricted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Region Restricted
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>

              {/* APY & Min metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Annual APY</span>
                  <span className="text-xl font-black text-emerald-400">{p.apy}%</span>
                </div>
                <div className="border-l border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Min Invest</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {p.minDeposit} {p.asset}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Globe className="w-3 h-3 text-amber-400" />
                  <span>Region Restrict:</span>
                </span>
                <button
                  onClick={() => handleToggleRegion(p.id, p.regionRestricted)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    p.regionRestricted
                      ? 'bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.regionRestricted ? 'Restricted ON' : 'Restricted OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleToggleStatus(p.id, p.status)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                    p.status === 'active'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {p.status === 'active' ? 'Pause Vault' : 'Activate Vault'}
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-1">Create Yield & Staking Vault</h3>
            <p className="text-xs text-slate-400 mb-4">Add a new admin-regulated Earn product</p>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Asset Symbol</label>
                  <input
                    type="text"
                    required
                    value={formAsset}
                    onChange={e => setFormAsset(e.target.value)}
                    placeholder="e.g. USDT, BTC"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Vault Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="flexible">Flexible</option>
                    <option value="locked">Locked Duration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">APY Yield % (ROI)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formApy}
                    onChange={e => setFormApy(e.target.value)}
                    placeholder="e.g. 12.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Min Invest Deposit</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formMinDeposit}
                    onChange={e => setFormMinDeposit(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {formType === 'locked' && (
                <div>
                  <label className="text-slate-400 block mb-1">Lock Duration (Days)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Regional restriction toggle */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Regional Restriction</span>
                  <span className="text-[11px] text-slate-400">Set "Not available in your region"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormRegionRestricted(!formRegionRestricted)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    formRegionRestricted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {formRegionRestricted ? 'Restricted' : 'Open All'}
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
                >
                  {submitting ? 'Creating Vault...' : 'Save Vault Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
