import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { FeeClearanceBanner } from '../wallet/FeeClearanceBanner';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowDownToLine, 
  ArrowRightLeft, 
  Send, 
  Percent, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2 
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    assets,
    balances,
    setCurrentTab,
    setSelectedPair,
    openDepositModal,
    openWithdrawModal,
    openTransferModal,
    openSendReceiveModal,
    openFeeClearanceModal,
    hideBalances,
    setHideBalances,
    formatFiat,
    t,
  } = useCrypto();

  const [marketTab, setMarketTab] = useState<'hot' | 'gainers' | 'losers' | 'volume'>('hot');

  // Total Portfolio value across all assets and wallets
  const totalUsdValue = (Object.entries(balances) as [string, { spot: number; funding: number; earn: number; locked?: number }][]).reduce((acc, [symbol, bal]) => {
    const asset = assets.find(a => a.symbol === symbol);
    const price = asset?.priceUsd || 1;
    const totalCoin = bal.spot + bal.funding + bal.earn + (bal.locked || 0);
    return acc + totalCoin * price;
  }, 0);

  const btcPrice = assets.find(a => a.symbol === 'BTC')?.priceUsd || 87000;
  const totalBtcEquivalent = (totalUsdValue / btcPrice).toFixed(4);

  // Sorted markets for tabs
  const hotAssets = assets.slice(0, 6);
  const topGainers = [...assets].sort((a, b) => b.change24h - a.change24h).slice(0, 6);
  const topLosers = [...assets].sort((a, b) => a.change24h - b.change24h).slice(0, 6);
  const topVolume = [...assets].sort((a, b) => b.volume24h - a.volume24h).slice(0, 6);

  const displayedAssets = {
    hot: hotAssets,
    gainers: topGainers,
    losers: topLosers,
    volume: topVolume,
  }[marketTab];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Account Balance On Hold Settlement Banner */}
      <FeeClearanceBanner onOpenModal={openFeeClearanceModal} />

      {/* 1. Hero Portfolio Snapshot & Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1420] via-[#121A2B] to-[#0A0D14] border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        {/* Subtle decorative mesh gradient */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Portfolio summary */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('totalBalance')}
              </span>
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Toggle balance visibility"
              >
                {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono">
                {hideBalances ? '••••••••' : formatFiat(totalUsdValue)}
              </div>
              <div className="flex items-center space-x-3 text-xs sm:text-sm font-mono text-slate-400">
                <span>≈ {hideBalances ? '••••' : totalBtcEquivalent} BTC</span>
                <span className="text-cyan-300 font-semibold flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                  <ShieldCheck className="w-3.5 h-3.5" /> Server-authoritative balance
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() => openDepositModal('USDT')}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>{t('deposit')}</span>
              </button>

              <button
                onClick={() => openWithdrawModal('USDT')}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>{t('withdraw')}</span>
              </button>

              <button
                onClick={() => openTransferModal('USDT')}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <span>{t('transfer')}</span>
              </button>

              <button
                onClick={() => openSendReceiveModal('send')}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Pay / Send</span>
              </button>

              <button
                onClick={() => setCurrentTab('convert')}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>{t('convert')}</span>
              </button>
            </div>
          </div>

          {/* Right Hero: Earn & Rewards Highlight Card */}
          <div className="lg:col-span-5 bg-[#090C12]/80 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles className="w-4 h-4 text-amber-400" /> Kroma Earn
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Provider pending
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-slate-400 text-[11px]">USDT Flexible Vault</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">Not live</div>
                <div className="text-[10px] text-slate-500">External provider required</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-slate-400 text-[11px]">SOL Locked Staking</div>
                <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">Not live</div>
                <div className="text-[10px] text-slate-500">Custody / validator provider required</div>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('earn')}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>View Earn availability</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Featured Markets Sparklines Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Featured Crypto Markets
          </h3>
          <button
            onClick={() => setCurrentTab('markets')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View all 50+ pairs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.slice(0, 4).map(asset => {
            const isUp = asset.change24h >= 0;
            return (
              <div
                key={asset.symbol}
                onClick={() => {
                  setSelectedPair(`${asset.symbol}/USDT`);
                  setCurrentTab('trade');
                }}
                className="p-4 rounded-2xl bg-[#0E131D] hover:bg-[#121824] border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow"
                      style={{ backgroundColor: asset.iconBg }}
                    >
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {asset.symbol} <span className="text-slate-500 font-normal text-xs">/ USDT</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{asset.name}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    isUp ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                  }`}>
                    {isUp ? '+' : ''}{asset.change24h}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-lg font-bold font-mono text-white">
                    ${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Vol: ${(asset.volume24h / 1000000).toFixed(0)}M
                  </div>
                </div>

                {/* SVG Mini Sparkline */}
                <div className="mt-2 h-7 w-full">
                  <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                    <path
                      d={asset.sparkline.reduce((acc, val, idx) => {
                        const min = Math.min(...asset.sparkline);
                        const max = Math.max(...asset.sparkline);
                        const x = (idx / (asset.sparkline.length - 1)) * 100;
                        const y = 25 - ((val - min) / (max - min || 1)) * 20 - 2;
                        return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke={isUp ? '#10B981' : '#F43F5E'}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Market Discovery Tabs */}
      <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            {[
              { id: 'hot', label: 'Hot Pairs' },
              { id: 'gainers', label: 'Top Gainers' },
              { id: 'losers', label: 'Top Losers' },
              { id: 'volume', label: '24h Volume' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMarketTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  marketTab === tab.id
                    ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentTab('markets')}
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            All Markets →
          </button>
        </div>

        {/* Markets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="pb-3">Asset</th>
                <th className="pb-3 text-right">Last Price</th>
                <th className="pb-3 text-right">24h Change</th>
                <th className="pb-3 text-right hidden sm:table-cell">24h High</th>
                <th className="pb-3 text-right hidden sm:table-cell">24h Low</th>
                <th className="pb-3 text-right hidden md:table-cell">24h Volume</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {displayedAssets.map(asset => {
                const isUp = asset.change24h >= 0;
                return (
                  <tr key={asset.symbol} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[11px]"
                          style={{ backgroundColor: asset.iconBg }}
                        >
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{asset.symbol}</div>
                          <div className="text-[11px] text-slate-400">{asset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white text-sm">
                      ${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        isUp ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'
                      }`}>
                        {isUp ? '+' : ''}{asset.change24h}%
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-300 hidden sm:table-cell">
                      ${asset.high24h.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-300 hidden sm:table-cell">
                      ${asset.low24h.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-400 hidden md:table-cell">
                      ${(asset.volume24h / 1000000).toFixed(2)}M
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPair(`${asset.symbol}/USDT`);
                            setCurrentTab('trade');
                          }}
                          className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors"
                        >
                          Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Trust, Security & Regulatory Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">1:1 Reserve Guarantee</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All user deposits are held in audited segregated cold vaults backed by continuous Merkle-tree Proof of Reserves.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Multi-Party Computation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Threshold cryptography and hardware security modules ensure zero single-point failure for private key management.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Microsecond Matching</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ultra-low latency spot engine capable of handling up to 1.4 million transactions per second with zero downtime.
          </p>
        </div>
      </div>
    </div>
  );
};
