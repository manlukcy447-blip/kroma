import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { 
  TrendingUp, 
  Plus, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  Check, 
  Globe, 
  Lock, 
  Unlock, 
  Sliders, 
  DollarSign, 
  Percent,
  XOctagon,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { TradingPairConfig, TradingSettingsConfig } from '../types/crypto';

export const AdminTradingControl: React.FC = () => {
  const [pairs, setPairs] = useState<TradingPairConfig[]>([]);
  const [settings, setSettings] = useState<TradingSettingsConfig>({
    haltAllTrading: false,
    regionRestricted: false,
    makerFeePercent: 0.1,
    takerFeePercent: 0.1,
    minOrderSizeUsd: 5.0,
    maxSlippagePercent: 1.5,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddPairModal, setShowAddPairModal] = useState(false);

  // New pair form
  const [newBase, setNewBase] = useState('DOGE');
  const [newQuote, setNewQuote] = useState('USDT');
  const [newPrice, setNewPrice] = useState('0.15');
  const [newChange, setNewChange] = useState('3.2');
  const [newVolume, setNewVolume] = useState('1500000');
  const [newMinOrder, setNewMinOrder] = useState('5');
  const [submittingPair, setSubmittingPair] = useState(false);

  const fetchTradingData = async () => {
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        apiFetch<any>('/api/trading/pairs'),
        apiFetch<any>('/api/trading/settings'),
      ]);

      setPairs(pData.pairs || []);
      setSettings(sData.settings || settings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradingData();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiFetch('/api/admin/trading/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      setActionFeedback({ type: 'success', text: 'Global trading configuration updated successfully.' });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback({ type: 'error', text: 'Failed to update trading configuration.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleEmergencyHalt = async () => {
    const updated = !settings.haltAllTrading;
    setSettings(prev => ({ ...prev, haltAllTrading: updated }));
    try {
      await apiFetch('/api/admin/trading/settings', {
        method: 'POST',
        body: JSON.stringify({ ...settings, haltAllTrading: updated }),
      });
      setActionFeedback({
        type: 'success',
        text: updated ? 'EMERGENCY: All trading pairs halted!' : 'Trading resumed successfully.',
      });
      setTimeout(() => setActionFeedback(null), 3500);
    } catch {
      // ignore
    }
  };

  const handleToggleTradingRegion = async () => {
    const updated = !settings.regionRestricted;
    setSettings(prev => ({ ...prev, regionRestricted: updated }));
    try {
      await apiFetch('/api/admin/trading/settings', {
        method: 'POST',
        body: JSON.stringify({ ...settings, regionRestricted: updated }),
      });
      setActionFeedback({
        type: 'success',
        text: updated ? 'Spot Trading restricted by region.' : 'Spot Trading allowed globally.',
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleTogglePairStatus = async (id: string, current: string) => {
    try {
      const data = await apiFetch<any>(`/api/admin/trading/pairs/${id}/toggle-status`, { method: 'POST' });
      setPairs(prev => prev.map(p => p.id === id ? { ...p, status: data.status } : p));
    } catch {
      // ignore
    }
  };

  const handleTogglePairRegion = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/api/admin/trading/pairs/${id}/toggle-region`, { method: 'POST' });
      setPairs(prev => prev.map(p => p.id === id ? { ...p, regionRestricted: !current } : p));
    } catch {
      // ignore
    }
  };

  const handleCancelAllOrders = async () => {
    if (!window.confirm('WARNING: Are you sure you want to cancel ALL open orders across the exchange?')) return;
    try {
      await apiFetch('/api/admin/trading/cancel-all-orders', { method: 'POST' });
      setActionFeedback({ type: 'success', text: 'Circuit breaker triggered: All open orders cancelled.' });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch {
      // ignore
    }
  };

  const handleCreatePair = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPair(true);
    const sym = `${newBase.trim().toUpperCase()}/${newQuote.trim().toUpperCase()}`;
    try {
      await apiFetch('/api/admin/trading/pairs', {
        method: 'POST',
        body: JSON.stringify({
          symbol: sym,
          baseAsset: newBase.trim().toUpperCase(),
          quoteAsset: newQuote.trim().toUpperCase(),
          price: parseFloat(newPrice) || 1,
          change24h: parseFloat(newChange) || 0,
          volume24h: parseFloat(newVolume) || 100000,
          minOrderSize: parseFloat(newMinOrder) || 1,
          status: 'active',
          regionRestricted: false,
        }),
      });

      setShowAddPairModal(false);
      fetchTradingData();
      setActionFeedback({ type: 'success', text: `Trading pair ${sym} listed successfully.` });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      // ignore
    } finally {
      setSubmittingPair(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#161D2B] to-[#0E1523] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Exchange Engine Administration</span>
          </div>
          <h2 className="text-xl font-bold text-white">Full Access "TRADE" Control Panel</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Full administrative access for any trading changes: emergency trading halts, fees regulation, pair management,
            price overrides, and regional trading gates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchTradingData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddPairModal(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>List New Pair</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
            actionFeedback.type === 'error'
              ? 'bg-rose-950/50 border-rose-800 text-rose-300'
              : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
          }`}
        >
          {actionFeedback.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Emergency & Global Master Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Emergency Halt */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            settings.haltAllTrading
              ? 'bg-rose-950/40 border-rose-800 text-rose-200'
              : 'bg-[#0E131D] border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Circuit Breaker</span>
              <ShieldAlert className={`w-5 h-5 ${settings.haltAllTrading ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <h3 className="text-base font-bold text-white">Emergency Trading Halt</h3>
            <p className="text-xs text-slate-400 mt-1">
              Instantly freezes all limit & market order execution across every trading pair.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleToggleEmergencyHalt}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                settings.haltAllTrading
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
              }`}
            >
              {settings.haltAllTrading ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{settings.haltAllTrading ? 'Resume All Trading' : 'HALT ALL TRADING'}</span>
            </button>
          </div>
        </div>

        {/* 2. Global Regional Trading Lock */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            settings.regionRestricted
              ? 'bg-[#18130E] border-amber-500/40'
              : 'bg-[#0E131D] border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Gate</span>
              <Globe className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white">Trade Region Restriction</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enforce "Not available in your region" modal when user attempts to execute trades.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleToggleTradingRegion}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                settings.regionRestricted
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{settings.regionRestricted ? 'Restricted (On)' : 'Open All Regions (Off)'}</span>
            </button>
          </div>
        </div>

        {/* 3. Global Order Cancellation */}
        <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Orderbook Flush</span>
              <XOctagon className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-white">Cancel All Open Orders</h3>
            <p className="text-xs text-slate-400 mt-1">
              Purges all open bids and asks across the entire orderbook in case of market volatility.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleCancelAllOrders}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold text-xs transition-colors"
            >
              Purge Open Orders
            </button>
          </div>
        </div>
      </div>

      {/* Fee & Engine Configuration Form */}
      <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Trading Fee & Slippage Settings</h3>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
          >
            {savingSettings ? 'Saving...' : 'Save Engine Settings'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans text-[11px]">Maker Fee (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.makerFeePercent}
              onChange={e => setSettings(s => ({ ...s, makerFeePercent: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans text-[11px]">Taker Fee (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.takerFeePercent}
              onChange={e => setSettings(s => ({ ...s, takerFeePercent: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans text-[11px]">Min Order Size (USD)</label>
            <input
              type="number"
              step="1"
              value={settings.minOrderSizeUsd}
              onChange={e => setSettings(s => ({ ...s, minOrderSizeUsd: parseFloat(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-sans text-[11px]">Max Slippage (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.maxSlippagePercent}
              onChange={e => setSettings(s => ({ ...s, maxSlippagePercent: parseFloat(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Trading Pairs Management (Responsive Mobile-Friendly Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Listed Trading Pairs</h3>
            <p className="text-xs text-slate-400">Admin control over price, status, volume, and regional availability per pair</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{pairs.length} Pairs Configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pairs.map(p => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                p.regionRestricted
                  ? 'bg-[#15120F] border-amber-500/40'
                  : p.status === 'active'
                  ? 'bg-[#0E131D] border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/40 border-slate-800 opacity-65'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-white text-base tracking-tight">{p.symbol}</h4>
                    <span className="text-[11px] text-slate-400">Spot Market</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.regionRestricted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Region Gated
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                    <span className="text-xs font-bold text-white block truncate">
                      ${p.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-x border-slate-800 px-1">
                    <span className="text-[10px] text-slate-400 block uppercase">24h Chg</span>
                    <span className={`text-xs font-bold block ${p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.change24h >= 0 ? '+' : ''}{p.change24h}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Volume</span>
                    <span className="text-xs font-bold text-slate-300 block truncate">
                      ${(p.volume24h / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Pair Toggles */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Globe className="w-3 h-3 text-amber-400" />
                    <span>Pair Region Restrict:</span>
                  </span>
                  <button
                    onClick={() => handleTogglePairRegion(p.id, p.regionRestricted)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      p.regionRestricted
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.regionRestricted ? 'Restricted' : 'Open All'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleTogglePairStatus(p.id, p.status)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                      p.status === 'active'
                        ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    }`}
                  >
                    {p.status === 'active' ? 'Halt Pair' : 'Activate Pair'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Pair Modal */}
      {showAddPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-1">List New Trading Pair</h3>
            <p className="text-xs text-slate-400 mb-4">Add pair to orderbook engine with initial price</p>

            <form onSubmit={handleCreatePair} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Base Asset</label>
                  <input
                    type="text"
                    required
                    value={newBase}
                    onChange={e => setNewBase(e.target.value)}
                    placeholder="e.g. DOGE"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Quote Asset</label>
                  <input
                    type="text"
                    required
                    value={newQuote}
                    onChange={e => setNewQuote(e.target.value)}
                    placeholder="e.g. USDT"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Initial Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="0.15"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">24h Change (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={newChange}
                    onChange={e => setNewChange(e.target.value)}
                    placeholder="+3.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">24h Volume ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={newVolume}
                    onChange={e => setNewVolume(e.target.value)}
                    placeholder="1000000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Min Order Amount</label>
                  <input
                    type="number"
                    step="any"
                    value={newMinOrder}
                    onChange={e => setNewMinOrder(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingPair}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
                >
                  {submittingPair ? 'Listing Pair...' : 'Confirm Pair Listing'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPairModal(false)}
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
