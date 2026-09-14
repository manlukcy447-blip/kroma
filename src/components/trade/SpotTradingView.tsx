import React, { useState, useMemo } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { TradingChart } from './TradingChart';
import { 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const SpotTradingView: React.FC = () => {
  const {
    selectedPair,
    setSelectedPair,
    assets,
    balances,
    orders,
    orderHistory,
    recentTrades,
    placeSpotOrder,
    cancelSpotOrder,
    formatFiat,
    t,
  } = useCrypto();

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [priceInput, setPriceInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [bottomTab, setBottomTab] = useState<'open' | 'history' | 'trades' | 'assets'>('open');
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [baseAssetSymbol, quoteAssetSymbol] = selectedPair.split('/');
  const baseAsset = assets.find(a => a.symbol === baseAssetSymbol) || assets[0];
  const quoteAsset = assets.find(a => a.symbol === quoteAssetSymbol) || assets.find(a => a.symbol === 'USDT')!;

  // Default price input when pair changes
  React.useEffect(() => {
    if (baseAsset) {
      setPriceInput(baseAsset.priceUsd.toString());
    }
  }, [selectedPair, baseAsset]);

  // Derived available balances
  const availableQuote = balances[quoteAssetSymbol]?.spot || 0;
  const availableBase = balances[baseAssetSymbol]?.spot || 0;

  const currentPrice = baseAsset.priceUsd;
  const isPositive = baseAsset.change24h >= 0;

  // Realistic dynamic order book generated around currentPrice
  const orderBook = useMemo(() => {
    const asks: { price: number; amount: number; total: number; depth: number }[] = [];
    const bids: { price: number; amount: number; total: number; depth: number }[] = [];
    const count = 7;
    const tick = currentPrice * 0.0003;

    let totalAsk = 0;
    for (let i = 1; i <= count; i++) {
      const p = currentPrice + (count - i + 1) * tick;
      const amt = Number((Math.random() * 1.5 + 0.1).toFixed(baseAsset.decimalPlaces > 2 ? 3 : 2));
      totalAsk += amt;
      asks.unshift({ price: p, amount: amt, total: amt * p, depth: Math.min(100, i * 14) });
    }

    let totalBid = 0;
    for (let i = 1; i <= count; i++) {
      const p = currentPrice - i * tick;
      const amt = Number((Math.random() * 1.8 + 0.1).toFixed(baseAsset.decimalPlaces > 2 ? 3 : 2));
      totalBid += amt;
      bids.push({ price: p, amount: amt, total: amt * p, depth: Math.min(100, i * 14) });
    }

    const spread = asks[asks.length - 1].price - bids[0].price;
    const spreadPct = (spread / currentPrice) * 100;

    return { asks, bids, spread, spreadPct };
  }, [currentPrice, baseAssetSymbol]);

  // Percentage slider clicks
  const handlePercentClick = (pct: number) => {
    const numPrice = orderType === 'market' ? currentPrice : parseFloat(priceInput) || currentPrice;
    if (orderSide === 'buy') {
      const budget = availableQuote * pct;
      const calculatedAmt = (budget / numPrice).toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2);
      setAmountInput(calculatedAmt);
    } else {
      const calculatedAmt = (availableBase * pct).toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2);
      setAmountInput(calculatedAmt);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);
    const amt = parseFloat(amountInput);
    const prc = orderType === 'market' ? currentPrice : parseFloat(priceInput);

    if (!amt || amt <= 0) {
      setOrderFeedback({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    if (orderType === 'limit' && (!prc || prc <= 0)) {
      setOrderFeedback({ type: 'error', text: 'Please enter a valid limit price.' });
      return;
    }

    const res = await placeSpotOrder({
      pair: selectedPair,
      type: orderType,
      side: orderSide,
      price: prc,
      amount: amt,
    });

    if (res.success) {
      setOrderFeedback({ type: 'success', text: res.message });
      setAmountInput('');
    } else {
      setOrderFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* 1. Market Pair Banner Strip */}
      <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Pair selector dropdown */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedPair}
              onChange={e => setSelectedPair(e.target.value)}
              className="appearance-none pr-8 pl-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-base font-bold text-white cursor-pointer hover:bg-slate-750 focus:outline-none focus:border-cyan-400"
            >
              <option value="BTC/USDT">BTC / USDT</option>
              <option value="ETH/USDT">ETH / USDT</option>
              <option value="SOL/USDT">SOL / USDT</option>
              <option value="SUI/USDT">SUI / USDT</option>
              <option value="AVAX/USDT">AVAX / USDT</option>
              <option value="LINK/USDT">LINK / USDT</option>
              <option value="NEAR/USDT">NEAR / USDT</option>
              <option value="XRP/USDT">XRP / USDT</option>
              <option value="PEPE/USDT">PEPE / USDT</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <div>
            <div className="text-xl font-bold font-mono text-white">
              ${baseAsset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-xs font-semibold font-mono flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{baseAsset.change24h}%</span>
            </div>
          </div>
        </div>

        {/* 24h Stats Readout */}
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[11px]">24h High</span>
            <span className="text-slate-200 font-bold">${baseAsset.high24h.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">24h Low</span>
            <span className="text-slate-200 font-bold">${baseAsset.low24h.toLocaleString()}</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500 block text-[11px]">24h Volume ({baseAssetSymbol})</span>
            <span className="text-slate-200 font-bold">
              {(baseAsset.volume24h / baseAsset.priceUsd).toFixed(0).toLocaleString()}
            </span>
          </div>
          <div className="hidden md:block">
            <span className="text-slate-500 block text-[11px]">24h Turnover (USDT)</span>
            <span className="text-slate-200 font-bold">
              ${(baseAsset.volume24h / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>
      </div>

      {/* 2. Pro Trading Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 cols: Interactive Candlestick Chart */}
        <div className="lg:col-span-8 space-y-4">
          <TradingChart
            symbol={selectedPair}
            currentPrice={baseAsset.priceUsd}
            priceChange={baseAsset.change24h}
          />

          {/* Bottom Dock: Open Orders, Order History, Trades */}
          <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4">
            <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-3 text-xs font-semibold">
              <button
                onClick={() => setBottomTab('open')}
                className={`flex items-center space-x-1.5 pb-1 transition-all ${
                  bottomTab === 'open'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Open Orders</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-cyan-300">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setBottomTab('history')}
                className={`pb-1 transition-all ${
                  bottomTab === 'history'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Order History
              </button>

              <button
                onClick={() => setBottomTab('trades')}
                className={`pb-1 transition-all ${
                  bottomTab === 'trades'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trade History
              </button>
            </div>

            {/* Tab content */}
            <div className="pt-3 min-h-[160px] overflow-x-auto text-xs">
              {bottomTab === 'open' && (
                orders.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 font-medium">
                    No active open orders for this market.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono">
                    <thead className="text-[11px] text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Pair</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 text-slate-400">
                            {new Date(o.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 font-bold text-white">{o.pair}</td>
                          <td className="py-2.5 uppercase text-slate-400">{o.type}</td>
                          <td className={`py-2.5 font-bold uppercase ${o.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {o.side}
                          </td>
                          <td className="py-2.5 text-right text-slate-200">${o.price.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-slate-200">{o.amount}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => cancelSpotOrder(o.id)}
                              className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[10px] font-bold border border-rose-800/40 transition-colors"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {bottomTab === 'history' && (
                <table className="w-full text-left font-mono">
                  <thead className="text-[11px] text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Pair</th>
                      <th className="pb-2">Side</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Executed Amount</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {orderHistory.map(h => (
                      <tr key={h.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 text-slate-400">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 font-bold text-white">{h.pair}</td>
                        <td className={`py-2.5 font-bold uppercase ${h.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {h.side}
                        </td>
                        <td className="py-2.5 text-right text-slate-200">${h.price.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-200">{h.amount}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            h.status === 'filled' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {bottomTab === 'trades' && (
                <table className="w-full text-left font-mono">
                  <thead className="text-[11px] text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Side</th>
                      <th className="pb-2 text-right">Price (USDT)</th>
                      <th className="pb-2 text-right">Size ({baseAssetSymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {recentTrades.map(tr => (
                      <tr key={tr.id}>
                        <td className="py-2 text-slate-400">{tr.time}</td>
                        <td className={`py-2 font-bold uppercase ${tr.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tr.side}
                        </td>
                        <td className="py-2 text-right text-slate-200 font-bold">${tr.price.toLocaleString()}</td>
                        <td className="py-2 text-right text-slate-300">{tr.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 cols: Order Book & Order Placement Form */}
        <div className="lg:col-span-4 space-y-4">
          {/* Order Placement Form */}
          <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4">
            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setOrderSide('buy')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  orderSide === 'buy'
                    ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Buy {baseAssetSymbol}
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('sell')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  orderSide === 'sell'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Sell {baseAssetSymbol}
              </button>
            </div>

            {/* Limit / Market type */}
            <div className="flex items-center space-x-4 mb-3 text-xs font-semibold text-slate-400">
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`pb-1 ${orderType === 'limit' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'hover:text-white'}`}
              >
                Limit
              </button>
              <button
                type="button"
                onClick={() => setOrderType('market')}
                className={`pb-1 ${orderType === 'market' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'hover:text-white'}`}
              >
                Market
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-3 text-xs">
              {/* Available Bal */}
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Avail:</span>
                <span className="font-mono text-slate-200">
                  {orderSide === 'buy' ? `${availableQuote} ${quoteAssetSymbol}` : `${availableBase} ${baseAssetSymbol}`}
                </span>
              </div>

              {/* Price input */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Price</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    disabled={orderType === 'market'}
                    value={orderType === 'market' ? 'Market Best Price' : priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 pr-14 disabled:opacity-60"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">
                    {quoteAssetSymbol}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 pr-14"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">
                    {baseAssetSymbol}
                  </span>
                </div>
              </div>

              {/* Quick % chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0.25, 0.5, 0.75, 1.0].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePercentClick(p)}
                    className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 font-mono transition-colors"
                  >
                    {p === 1.0 ? '100%' : `${p * 100}%`}
                  </button>
                ))}
              </div>

              {/* Estimated Total */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Order Value:</span>
                  <span className="font-mono text-slate-200">
                    ${((parseFloat(amountInput) || 0) * (orderType === 'market' ? currentPrice : parseFloat(priceInput) || currentPrice)).toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>VIP Trading Fee (0.075%):</span>
                  <span className="text-cyan-400 font-mono">-$0.00 (Promo active)</span>
                </div>
              </div>

              {orderFeedback && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                    orderFeedback.type === 'error'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  }`}
                >
                  {orderFeedback.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{orderFeedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer ${
                  orderSide === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                }`}
              >
                {orderSide === 'buy' ? `Buy ${baseAssetSymbol}` : `Sell ${baseAssetSymbol}`}
              </button>
            </form>
          </div>

          {/* Live Order Book */}
          <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
              <span>Order Book</span>
              <span className="font-mono text-slate-500">Spread: {orderBook.spread.toFixed(2)} ({orderBook.spreadPct.toFixed(2)}%)</span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-3 text-[10px] text-slate-500 font-mono pb-1">
              <span>Price ({quoteAssetSymbol})</span>
              <span className="text-right">Size ({baseAssetSymbol})</span>
              <span className="text-right">Total</span>
            </div>

            {/* Asks (Sell Orders in Red) */}
            <div className="space-y-1">
              {orderBook.asks.map((ask, idx) => (
                <div
                  key={`ask-${idx}`}
                  onClick={() => setPriceInput(ask.price.toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2))}
                  className="grid grid-cols-3 text-[11px] font-mono cursor-pointer hover:bg-slate-800/40 relative py-0.5"
                >
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-rose-500/10 pointer-events-none rounded"
                    style={{ width: `${ask.depth}%` }}
                  />
                  <span className="text-rose-400 font-bold z-10">{ask.price.toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2)}</span>
                  <span className="text-right text-slate-300 z-10">{ask.amount}</span>
                  <span className="text-right text-slate-500 z-10">{ask.total.toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Middle Current Market Price Indicator */}
            <div className="py-2 my-1 border-y border-slate-800/60 flex items-center justify-between font-mono">
              <span className={`text-base font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Live Oracle Feed</span>
            </div>

            {/* Bids (Buy Orders in Green) */}
            <div className="space-y-1">
              {orderBook.bids.map((bid, idx) => (
                <div
                  key={`bid-${idx}`}
                  onClick={() => setPriceInput(bid.price.toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2))}
                  className="grid grid-cols-3 text-[11px] font-mono cursor-pointer hover:bg-slate-800/40 relative py-0.5"
                >
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-emerald-500/10 pointer-events-none rounded"
                    style={{ width: `${bid.depth}%` }}
                  />
                  <span className="text-emerald-400 font-bold z-10">{bid.price.toFixed(baseAsset.decimalPlaces > 2 ? 4 : 2)}</span>
                  <span className="text-right text-slate-300 z-10">{bid.amount}</span>
                  <span className="text-right text-slate-500 z-10">{bid.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
