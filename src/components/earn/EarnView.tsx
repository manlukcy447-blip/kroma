import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { EARN_PRODUCTS } from '../../data/mockData';
import { EarnProduct } from '../../types/crypto';
import { Sparkles, Lock, Unlock, Calculator, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const EarnView: React.FC = () => {
  const {
    balances,
    executeInternalTransfer,
    formatFiat,
    t,
  } = useCrypto();

  const [activeType, setActiveType] = useState<'all' | 'flexible' | 'locked'>('all');
  const [selectedProduct, setSelectedProduct] = useState<EarnProduct | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>('500');
  const [stakeStatus, setStakeStatus] = useState<string | null>(null);

  const filteredProducts = EARN_PRODUCTS.filter(p => {
    if (activeType === 'all') return true;
    return p.type === activeType;
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const num = parseFloat(stakeAmount);
    if (!num || num < selectedProduct.minAmount) {
      setStakeStatus(`Minimum subscription is ${selectedProduct.minAmount} ${selectedProduct.asset}`);
      return;
    }

    const currentSpot = balances[selectedProduct.asset]?.spot || 0;
    if (num > currentSpot) {
      setStakeStatus(`Insufficient ${selectedProduct.asset} in Spot Wallet. (Available: ${currentSpot})`);
      return;
    }

    setStakeStatus('Earn provider is not connected. No funds were moved.'); return;
    const transfer = await executeInternalTransfer(selectedProduct.asset, 'spot', 'earn', num);
    if (!transfer.success) { setStakeStatus(transfer.message); return; }
    setStakeStatus('Earn provider is not connected. No yield subscription was created.');
    setTimeout(() => {
      setSelectedProduct(null);
      setStakeStatus(null);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"/>
        <div><div className="text-sm font-bold text-amber-300">Earn provider not connected</div><p className="text-xs text-slate-400 mt-1">Vault rates shown in this screen are product design placeholders only. Kroma will not accrue or promise yield until a real provider is connected.</p></div>
      </div>
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#151D2E] to-[#0D121B] border border-slate-700/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>KROMA EARN VAULTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            High-Yield Crypto Staking & Savings
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Deposit idle assets to earn automated compounding yields backed by native proof-of-stake validator delegation and institutional liquidity pools.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          {(['all', 'flexible', 'locked'] as const).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeType === type
                  ? 'bg-cyan-500 text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All Vaults' : `${type} Yield`}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(product => {
          const userSpotBal = balances[product.asset]?.spot || 0;
          return (
            <div
              key={product.id}
              className="p-5 rounded-2xl bg-[#0E131D] hover:bg-[#111724] border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center border border-slate-700">
                      {product.asset}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{product.asset} {product.type === 'flexible' ? 'Flexible Savings' : `${product.durationDays}D Locked`}</h4>
                      <span className="text-[11px] text-slate-400">{product.riskLevel} Risk</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    product.type === 'flexible'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                      : 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/40'
                  }`}>
                    {product.type === 'flexible' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {product.type === 'flexible' ? 'Flexible' : `${product.durationDays} Days`}
                  </span>
                </div>

                {/* APY Display */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Est. Annual Yield</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">{product.apy}%</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>Min: <strong className="text-white font-mono">{product.minDeposit} {product.asset}</strong></div>
                    <div className="text-cyan-400 font-mono">Daily payouts</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedProduct(product);
                  setStakeAmount(userSpotBal > 0 ? (userSpotBal * 0.5).toFixed(2) : '100');
                  setStakeStatus(null);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
              >
                Subscribe to Vault
              </button>
            </div>
          );
        })}
      </div>

      {/* Subscription Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Subscribe to {selectedProduct.asset} Vault</h3>
                <p className="text-[11px] text-emerald-400">{selectedProduct.apy}% APY • {selectedProduct.type === 'flexible' ? 'Flexible' : `${selectedProduct.durationDays} Days`}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-4 pt-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Deposit Amount ({selectedProduct.asset})</span>
                  <span className="text-slate-400 text-[11px]">
                    Spot Avail: <strong className="text-cyan-400 font-mono">{balances[selectedProduct.asset]?.spot || 0}</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={stakeAmount}
                    onChange={e => setStakeAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setStakeAmount((balances[selectedProduct.asset]?.spot || 0).toString())}
                    className="absolute right-2.5 top-2 px-2 py-1 rounded text-xs font-bold text-cyan-400 hover:bg-cyan-950/60"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Yield estimate preview */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Daily Return:</span>
                  <span className="text-emerald-400 font-bold">
                    +{((parseFloat(stakeAmount) || 0) * (selectedProduct.apy / 100) / 365).toFixed(4)} {selectedProduct.asset}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Annual Yield:</span>
                  <span className="text-cyan-400 font-bold">
                    +{((parseFloat(stakeAmount) || 0) * (selectedProduct.apy / 100)).toFixed(2)} {selectedProduct.asset}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-800">
                  <span>Redemption:</span>
                  <span className="text-slate-300">
                    {selectedProduct.type === 'flexible' ? 'Anytime instantly' : 'At maturity'}
                  </span>
                </div>
              </div>

              {stakeStatus && (
                <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-[11px]">
                  {stakeStatus}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md active:scale-98 cursor-pointer"
              >
                Confirm Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
