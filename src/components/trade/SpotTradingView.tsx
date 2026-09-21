import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X, 
  SlidersHorizontal 
} from 'lucide-react';

export const SpotTradingView: React.FC = () => {
  const {
    selectedPair,
    setSelectedPair,
    assets,
    balances,
    placeSpotOrder,
    cancelSpotOrder,
    orders,
    orderHistory,
    formatFiat,
    t,
  } = useCrypto();

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [priceInput, setPriceInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [orderStatus, setOrderStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split selected pair e.g. "BTC/USDT"
  const [baseSymbol, quoteSymbol = 'USDT'] = (selectedPair || 'BTC/USDT').split('/');
  const baseAsset = assets.find(a => a.symbol === baseSymbol) || assets[0];
  const quoteAsset = assets.find(a => a.symbol === quoteSymbol) || assets.find(a => a.symbol === 'USDT') || assets[0];

  const currentPrice = baseAsset.priceUsd;
  const activePrice = priceInput ? parseFloat(priceInput) : currentPrice;
  const activeAmount = parseFloat(amountInput) || 0;
  const orderTotal = activePrice * activeAmount;

  const baseBalance = balances[baseSymbol]?.spot || 0;
  const quoteBalance = balances[quoteSymbol]?.spot || 0;
  const availableToSpend = orderSide === 'buy' ? quoteBalance : baseBalance;

  const handlePercentClick = (percent: number) => {
    if (orderSide === 'buy') {
      const maxSpend = (quoteBalance * percent) / 100;
      const targetPrice = orderType === 'limit' && priceInput ? parseFloat(priceInput) : currentPrice;
      if (targetPrice > 0) {
        setAmountInput((maxSpend / targetPrice).toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2));
      }
    } else {
      const maxSell = (baseBalance * percent) / 100;
      setAmountInput(maxSell.toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2));
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderStatus(null);
    const price = orderType === 'market' ? currentPrice : parseFloat(priceInput);
    const amount = parseFloat(amountInput);

    if (!price || price <= 0) {
      setOrderStatus({ success: false, message: 'Please specify a valid price.' });
      return;
    }
    if (!amount || amount <= 0) {
      setOrderStatus({ success: false, message: 'Please specify a valid amount.' });
      return;
    }

    if (orderSide === 'buy' && price * amount > quoteBalance) {
      setOrderStatus({ success: false, message: `Insufficient ${quoteSymbol} balance in Spot wallet.` });
      return;
    }
    if (orderSide === 'sell' && amount > baseBalance) {
      setOrderStatus({ success: false, message: `Insufficient ${baseSymbol} balance in Spot wallet.` });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await placeSpotOrder({
        pair: `${baseSymbol}/${quoteSymbol}`,
        type: orderType,
        side: orderSide,
        price,
        amount,
      });
      setOrderStatus(res);
      if (res.success) {
        setAmountInput('');
      }
    } catch {
      setOrderStatus({ success: false, message: 'Trading service temporarily unavailable.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Ticker strip & pair selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md"
              style={{ backgroundColor: baseAsset.iconBg }}
            >
              {baseAsset.symbol}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-white text-lg tracking-tight">
                  {baseSymbol}/{quoteSymbol}
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                  SPOT
                </span>
              </div>
              <span className="text-xs text-slate-400">{baseAsset.name}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="text-lg font-mono font-black text-white">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`text-xs font-semibold flex items-center gap-1 ${
                baseAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {baseAsset.change24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>
                {baseAsset.change24h >= 0 ? '+' : ''}
                {baseAsset.change24h}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick pair switches (Wrapping on mobile, no horizontal drag) */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {assets.slice(0, 6).map(a => {
            const pairName = `${a.symbol}/USDT`;
            const isActive = selectedPair === pairName;
            return (
              <button
                key={a.symbol}
                onClick={() => {
                  setSelectedPair(pairName);
                  setPriceInput(String(a.priceUsd));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-900 font-bold shadow'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {a.symbol}/USDT
              </button>
            );
          })}
        </div>
      </div>

      {/* Main trading stage: Chart + Order form + Orderbook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Price Chart & Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Action (24h Trend)</span>
              <div className="flex gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2 py-1 rounded bg-slate-800 text-white font-mono">1D</span>
                <span className="px-2 py-1 rounded hover:text-white">1W</span>
                <span className="px-2 py-1 rounded hover:text-white">1M</span>
              </div>
            </div>

            {/* Sparkline Canvas / SVG */}
            <div className="h-64 w-full pt-4">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {baseAsset.sparkline && baseAsset.sparkline.length > 1 && (
                  <>
                    <path
                      d={`${baseAsset.sparkline.reduce((acc, val, idx) => {
                        const min = Math.min(...baseAsset.sparkline);
                        const max = Math.max(...baseAsset.sparkline);
                        const x = (idx / (baseAsset.sparkline.length - 1)) * 500;
                        const y = 190 - ((val - min) / (max - min || 1)) * 170;
                        return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')} L 500 200 L 0 200 Z`}
                      fill="url(#chartGrad)"
                    />
                    <path
                      d={baseAsset.sparkline.reduce((acc, val, idx) => {
                        const min = Math.min(...baseAsset.sparkline);
                        const max = Math.max(...baseAsset.sparkline);
                        const x = (idx / (baseAsset.sparkline.length - 1)) * 500;
                        const y = 190 - ((val - min) / (max - min || 1)) * 170;
                        return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                    />
                  </>
                )}
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">24h High</span>
                <span className="text-white font-mono font-semibold">${baseAsset.high24h?.toLocaleString() || '---'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">24h Low</span>
                <span className="text-white font-mono font-semibold">${baseAsset.low24h?.toLocaleString() || '---'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">24h Volume</span>
                <span className="text-white font-mono font-semibold">${(baseAsset.volume24h / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>

          {/* Open Orders & History */}
          <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Open Orders ({orders.length})</h3>
              <span className="text-xs text-slate-400">Database authoritative</span>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No open orders for this account.</div>
            ) : (
              <div>
                {/* Mobile Open Order Cards */}
                <div className="sm:hidden divide-y divide-slate-800/60 font-mono">
                  {orders.map(o => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{o.pair}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${o.side === 'buy' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'}`}>
                            {o.side}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Price: <span className="text-slate-200">${o.price}</span> • Amt: <span className="text-slate-200">{o.amount}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => cancelSpotOrder(o.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition-colors shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800 font-sans">
                      <tr>
                        <th className="pb-2">Pair</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right font-sans">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 font-bold text-white">{o.pair}</td>
                          <td className={`py-2.5 font-bold uppercase ${o.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {o.side}
                          </td>
                          <td className="py-2.5 text-right text-slate-300">${o.price}</td>
                          <td className="py-2.5 text-right text-slate-300">{o.amount}</td>
                          <td className="py-2.5 text-right font-sans">
                            <button
                              onClick={() => cancelSpotOrder(o.id)}
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-[11px]"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-5">
            {/* Side toggle */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderSide('buy')}
                className={`py-2.5 rounded-lg transition-all ${
                  orderSide === 'buy' ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Buy {baseSymbol}
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('sell')}
                className={`py-2.5 rounded-lg transition-all ${
                  orderSide === 'sell' ? 'bg-rose-500 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sell {baseSymbol}
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 text-xs font-semibold text-slate-400">
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  orderType === 'limit' ? 'bg-slate-800 text-white' : 'hover:text-white'
                }`}
              >
                Limit
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType('market');
                  setPriceInput(String(currentPrice));
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  orderType === 'market' ? 'bg-slate-800 text-white' : 'hover:text-white'
                }`}
              >
                Market
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Order Price</span>
                  <span className="text-slate-500 font-mono">USD</span>
                </div>
                <input
                  type="number"
                  step="any"
                  disabled={orderType === 'market'}
                  value={orderType === 'market' ? currentPrice : priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  placeholder={String(currentPrice)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Amount</span>
                  <span className="text-slate-400">
                    Avail:{' '}
                    <span className="text-cyan-400 font-mono">
                      {availableToSpend} {orderSide === 'buy' ? quoteSymbol : baseSymbol}
                    </span>
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Percent buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentClick(pct)}
                    className="py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Order Total:</span>
                  <span className="text-white font-bold">${orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Trading Fee (VIP 2):</span>
                  <span>0.06%</span>
                </div>
              </div>

              {orderStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    orderStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {orderStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{orderStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !amountInput || parseFloat(amountInput) <= 0}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-lg disabled:opacity-40 cursor-pointer ${
                  orderSide === 'buy'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/20'
                }`}
              >
                {isSubmitting
                  ? 'Placing Order...'
                  : `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${baseSymbol}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
