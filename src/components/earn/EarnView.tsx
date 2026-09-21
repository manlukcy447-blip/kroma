import React, { useState, useEffect } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { EarnProduct } from '../../types/crypto';
import { Sparkles, Lock, Unlock, CheckCircle2, AlertCircle, X, Globe, Loader2 } from 'lucide-react';

export const EarnView: React.FC = () => {
  const {
    balances,
    subscribeToEarnProduct,
    regionalRestrictions,
    triggerRegionRestricted,
  } = useCrypto();

  const [products, setProducts] = useState<EarnProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<'all' | 'flexible' | 'locked'>('all');
  const [selectedProduct, setSelectedProduct] = useState<EarnProduct | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>('500');
  const [stakeStatus, setStakeStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch admin-regulated Earn/Yield products directly from database API
  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/earn/products`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products.map((p: any) => ({
            id: p.id,
            asset: p.asset,
            name: p.title || `${p.asset} ${p.type === 'flexible' ? 'Flexible Vault' : `${p.durationDays}D Locked`}`,
            type: p.type || 'flexible',
            apy: parseFloat(p.apy) || 5,
            durationDays: parseInt(p.durationDays) || 0,
            minDeposit: parseFloat(p.minDeposit) || 10,
            riskLevel: 'Low' as const,
            status: p.status || 'active',
            regionRestricted: Boolean(p.regionRestricted),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p => {
    if (activeType === 'all') return true;
    return p.type === activeType;
  });

  const isGlobalRegionRestricted = Boolean(regionalRestrictions['earn']);

  const handleOpenSubscribe = (product: EarnProduct) => {
    if (isGlobalRegionRestricted || (product as any).regionRestricted) {
      triggerRegionRestricted('Earn & Yield Program');
      return;
    }
    setSelectedProduct(product);
    const userSpotBal = balances[product.asset]?.spot || 0;
    setStakeAmount(userSpotBal > 0 ? (userSpotBal * 0.5).toFixed(2) : String(product.minDeposit || 10));
    setStakeStatus(null);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (isGlobalRegionRestricted || (selectedProduct as any).regionRestricted) {
      triggerRegionRestricted('Earn & Yield Program');
      return;
    }

    const num = parseFloat(stakeAmount);
    const min = selectedProduct.minDeposit ?? 0;
    if (!num || num < min) {
      setStakeStatus({ type: 'error', text: `Minimum subscription is ${min} ${selectedProduct.asset}` });
      return;
    }

    const currentSpot = balances[selectedProduct.asset]?.spot || 0;
    if (num > currentSpot) {
      setStakeStatus({ type: 'error', text: `Insufficient ${selectedProduct.asset} in Spot Wallet. (Available: ${currentSpot})` });
      return;
    }

    setIsSubmitting(true);
    setStakeStatus(null);
    try {
      const res = await subscribeToEarnProduct(selectedProduct.id, selectedProduct.asset, num, selectedProduct.apy);
      if (res.success) {
        setStakeStatus({ type: 'success', text: res.message });
        setTimeout(() => {
          setSelectedProduct(null);
          setStakeStatus(null);
        }, 2200);
      } else {
        setStakeStatus({ type: 'error', text: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Global Regional Restriction Notice Banner if restricted */}
      {isGlobalRegionRestricted && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Notice: Earn & Yield participation is restricted in your geographic jurisdiction by exchange administration.
            </span>
          </div>
          <button
            onClick={() => triggerRegionRestricted('Earn & Yield Program')}
            className="px-3 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-bold shrink-0"
          >
            View Policy
          </button>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#151D2E] to-[#0D121B] border border-slate-700/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>KROMA EARN & YIELD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            High-Yield Crypto Staking & Savings
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Deposit idle assets to earn automated yields regulated directly by platform treasury management and smart balance staking.
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
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[#0E131D] border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading active Earn vaults...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0E131D] border border-slate-800 text-slate-400">
          <p className="text-sm font-semibold text-slate-200">No active Earn vaults available right now.</p>
          <p className="text-xs text-slate-500 mt-1">Please check back soon for upcoming treasury yield programs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(product => {
            const userSpotBal = balances[product.asset]?.spot || 0;
            const isRestricted = isGlobalRegionRestricted || Boolean((product as any).regionRestricted);

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
                        <h4 className="font-bold text-white text-sm">
                          {product.asset} {product.type === 'flexible' ? 'Flexible Savings' : `${product.durationDays}D Locked`}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {isRestricted ? 'Restricted Region' : 'Regulated Yield Vault'}
                        </span>
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
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Est. Annual APY</span>
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
                onClick={() => handleOpenSubscribe(product)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                  isRestricted
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700'
                    : 'text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-cyan-500/20 active:scale-98'
                }`}
              >
                {isRestricted ? 'Not Available in Region' : 'Subscribe to Vault'}
              </button>
            </div>
          );
        })}
      </div>
      )}

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
                <div
                  className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                    stakeStatus.type === 'error'
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  }`}
                >
                  {stakeStatus.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{stakeStatus.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Processing Vault Transfer...' : 'Confirm Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
