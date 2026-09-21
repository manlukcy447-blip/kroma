import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { Search, Star, ArrowUpRight, ArrowDownRight, ArrowDownToLine, TrendingUp } from 'lucide-react';

export const MarketsView: React.FC = () => {
  const {
    assets,
    setSelectedPair,
    setCurrentTab,
    openDepositModal,
    formatFiat,
    t,
  } = useCrypto();

  const [category, setCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [sortBy, setSortBy] = useState<'marketCap' | 'price' | 'change' | 'volume'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const categories = ['All', 'Favorites', 'Layer 1', 'DeFi', 'AI & Data', 'Layer 2', 'Meme', 'Stablecoin'];

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const filteredAssets = assets
    .filter(asset => {
      if (category === 'Favorites') return favorites.includes(asset.symbol);
      if (category !== 'All' && asset.category !== category) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'marketCap') comparison = b.marketCap - a.marketCap;
      else if (sortBy === 'price') comparison = b.priceUsd - a.priceUsd;
      else if (sortBy === 'change') comparison = b.change24h - a.change24h;
      else if (sortBy === 'volume') comparison = b.volume24h - a.volume24h;

      return sortDirection === 'desc' ? comparison : -comparison;
    });

  const handleSort = (type: 'marketCap' | 'price' | 'change' | 'volume') => {
    if (sortBy === type) {
      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(type);
      setSortDirection('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Cryptocurrency Markets
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-network price feeds, volume analytics, and spot pairs
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchAsset')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Category Pills (Wrapping on mobile, no horizontal drag) */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              category === cat
                ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {cat === 'Favorites' ? `★ Favorites (${favorites.length})` : cat}
          </button>
        ))}
      </div>

      {/* Markets Table / Cards Card */}
      <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4 sm:p-6 shadow-xl overflow-hidden">
        {/* Mobile View: Clean responsive cards with zero horizontal drag */}
        <div className="md:hidden divide-y divide-slate-800/60 font-mono">
          {filteredAssets.map(asset => {
            const isFav = favorites.includes(asset.symbol);
            const isUp = asset.change24h >= 0;

            return (
              <div
                key={asset.symbol}
                onClick={() => {
                  setSelectedPair(`${asset.symbol}/USDT`);
                  setCurrentTab('trade');
                }}
                className="py-3.5 space-y-3 cursor-pointer active:bg-slate-800/30 transition-colors"
              >
                {/* Header: Favorite, Coin, Symbol, Price, Change */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <button
                      onClick={e => toggleFavorite(asset.symbol, e)}
                      className={`p-1 rounded shrink-0 transition-colors ${
                        isFav ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow shrink-0"
                      style={{ backgroundColor: asset.iconBg }}
                    >
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm font-sans truncate">{asset.symbol}</div>
                      <div className="text-[11px] text-slate-400 font-sans truncate">{asset.name}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-white text-sm">
                      ${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold ${
                      isUp ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                    }`}>
                      {isUp ? '+' : ''}{asset.change24h}%
                    </span>
                  </div>
                </div>

                {/* Metrics row & Actions */}
                <div className="flex items-center justify-between text-xs font-sans text-slate-400 pt-1">
                  <div className="flex items-center gap-4 text-[11px]">
                    <div>
                      <span className="text-slate-500">24h Vol: </span>
                      <span className="text-slate-300 font-mono">${(asset.volume24h / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-slate-500">MCap: </span>
                      <span className="text-slate-300 font-mono">${(asset.marketCap / 1000000000).toFixed(1)}B</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedPair(`${asset.symbol}/USDT`);
                        setCurrentTab('trade');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors"
                    >
                      Trade
                    </button>
                    <button
                      onClick={() => openDepositModal(asset.symbol)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                      title="Deposit asset"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full multi-column sortable table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="pb-3 w-8"></th>
                <th className="pb-3">Asset</th>
                <th
                  onClick={() => handleSort('price')}
                  className="pb-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  Price {sortBy === 'price' && (sortDirection === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => handleSort('change')}
                  className="pb-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  24h Change {sortBy === 'change' && (sortDirection === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => handleSort('volume')}
                  className="pb-3 text-right hidden sm:table-cell cursor-pointer hover:text-white transition-colors"
                >
                  24h Volume {sortBy === 'volume' && (sortDirection === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  onClick={() => handleSort('marketCap')}
                  className="pb-3 text-right hidden md:table-cell cursor-pointer hover:text-white transition-colors"
                >
                  Market Cap {sortBy === 'marketCap' && (sortDirection === 'desc' ? '↓' : '↑')}
                </th>
                <th className="pb-3 text-center hidden lg:table-cell w-36">7D Trend</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {filteredAssets.map(asset => {
                const isFav = favorites.includes(asset.symbol);
                const isUp = asset.change24h >= 0;

                return (
                  <tr
                    key={asset.symbol}
                    onClick={() => {
                      setSelectedPair(`${asset.symbol}/USDT`);
                      setCurrentTab('trade');
                    }}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 pr-2">
                      <button
                        onClick={e => toggleFavorite(asset.symbol, e)}
                        className={`p-1 rounded hover:text-amber-400 transition-colors ${
                          isFav ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow shrink-0"
                          style={{ backgroundColor: asset.iconBg }}
                        >
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm font-sans">{asset.symbol}</div>
                          <div className="text-[11px] text-slate-400 font-sans">{asset.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-right font-bold text-white text-sm">
                      ${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        isUp ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                      }`}>
                        {isUp ? '+' : ''}{asset.change24h}%
                      </span>
                    </td>

                    <td className="py-3.5 text-right text-slate-300 hidden sm:table-cell">
                      ${(asset.volume24h / 1000000).toFixed(2)}M
                    </td>

                    <td className="py-3.5 text-right text-slate-300 hidden md:table-cell">
                      ${(asset.marketCap / 1000000000).toFixed(2)}B
                    </td>

                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      <div className="h-6 w-28 mx-auto">
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
                    </td>

                    <td className="py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end space-x-2 font-sans">
                        <button
                          onClick={() => {
                            setSelectedPair(`${asset.symbol}/USDT`);
                            setCurrentTab('trade');
                          }}
                          className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => openDepositModal(asset.symbol)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                          title="Deposit asset"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
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
    </div>
  );
};
