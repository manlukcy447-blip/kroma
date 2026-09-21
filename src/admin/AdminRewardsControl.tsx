import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { 
  Gift, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  Globe, 
  TrendingUp, 
  DollarSign, 
  Percent,
  AlertCircle
} from 'lucide-react';
import { RewardItem } from '../types/crypto';

export const AdminRewardsControl: React.FC = () => {
  const [items, setItems] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('Staking Bonus');
  const [formRewardAmount, setFormRewardAmount] = useState('50 USDT');
  const [formMinInvestment, setFormMinInvestment] = useState('100');
  const [formRoiPercentage, setFormRoiPercentage] = useState('18.5');
  const [formRegionRestricted, setFormRegionRestricted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/admin/rewards/items');
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleToggleRegion = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/api/admin/rewards/items/${id}/toggle-region`, { method: 'POST' });
      setItems(prev => prev.map(item => item.id === id ? { ...item, regionRestricted: !current } : item));
      setStatusMessage('Regional restriction updated.');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'paused' : 'active';
    try {
      await apiFetch(`/api/admin/rewards/items/${id}/toggle-status`, { method: 'POST' });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any } : item));
      setStatusMessage(`Reward program ${newStatus === 'active' ? 'activated' : 'paused'}.`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reward program?')) return;
    try {
      await apiFetch(`/api/admin/rewards/items/${id}`, { method: 'DELETE' });
      fetchRewards();
      setStatusMessage('Reward program removed.');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSubmitting(true);
    try {
      await apiFetch('/api/admin/rewards/items', {
        method: 'POST',
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          type: formType,
          rewardAmount: formRewardAmount.trim(),
          minInvestment: parseFloat(formMinInvestment) || 0,
          roiPercentage: parseFloat(formRoiPercentage) || 0,
          regionRestricted: formRegionRestricted,
          status: 'active',
        }),
      });

      setShowAddModal(false);
      setFormTitle('');
      setFormDescription('');
      fetchRewards();
      setStatusMessage('New reward program added successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#1A1424] to-[#120D1A] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            <span>Incentive & ROI Regulation Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">Rewards Hub Management</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure rewards, program types, required investment capital, money amounts, and ROI yields.
            Enforce <strong className="text-amber-300">"Not available in your region"</strong> policies when users attempt to participate.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchRewards}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Reward Program</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Rewards Grid (Responsive, mobile friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
              item.regionRestricted
                ? 'bg-[#15120F] border-amber-500/40'
                : item.status === 'active'
                ? 'bg-[#0E131D] border-slate-800 hover:border-slate-700'
                : 'bg-slate-900/40 border-slate-800 opacity-65'
            }`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-block mb-1">
                    {item.type}
                  </span>
                  <h3 className="font-bold text-white text-base leading-snug">{item.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {item.regionRestricted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Region Restricted
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {item.description || 'Verified incentive program.'}
              </p>

              {/* Metrics: Reward Money, Invest, ROI */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Money / Bonus</span>
                  <span className="text-xs font-bold text-amber-400 block truncate">{item.rewardAmount}</span>
                </div>
                <div className="border-x border-slate-800 px-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Min Invest</span>
                  <span className="text-xs font-bold text-white block">${item.minInvestment || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">ROI Yield</span>
                  <span className="text-xs font-bold text-emerald-400 block">+{item.roiPercentage || 0}%</span>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Globe className="w-3 h-3 text-amber-400" />
                  <span>Region Restrict:</span>
                </span>
                <button
                  onClick={() => handleToggleRegion(item.id, item.regionRestricted)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    item.regionRestricted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.regionRestricted ? 'Restricted (On)' : 'Allowed (Off)'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleToggleStatus(item.id, item.status)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                    item.status === 'active'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {item.status === 'active' ? 'Pause Program' : 'Activate Program'}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
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
            <h3 className="text-base font-bold text-white mb-1">Create Reward & ROI Incentive</h3>
            <p className="text-xs text-slate-400 mb-4">Set program rules, investment threshold, money and ROI</p>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. VIP Staking Booster Pool"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe program conditions and claiming instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Reward Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Staking Bonus">Staking Bonus</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                    <option value="ROI Yield Booster">ROI Yield Booster</option>
                    <option value="Mystery Box">Mystery Box</option>
                    <option value="Trading Bonus">Trading Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Reward Money / Token</label>
                  <input
                    type="text"
                    required
                    value={formRewardAmount}
                    onChange={e => setFormRewardAmount(e.target.value)}
                    placeholder="e.g. 50 USDT or $100"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Min Investment ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formMinInvestment}
                    onChange={e => setFormMinInvestment(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">ROI Percentage (%)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formRoiPercentage}
                    onChange={e => setFormRoiPercentage(e.target.value)}
                    placeholder="e.g. 25.0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

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
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
                >
                  {submitting ? 'Creating...' : 'Save Reward Program'}
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
