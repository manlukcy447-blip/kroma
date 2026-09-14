import React, { useState, useEffect } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { ArrowDownUp, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Info, ShieldCheck } from 'lucide-react';

export const ConvertView: React.FC = () => {
  const {
    assets,
    balances,
    executeConvert,
    t,
  } = useCrypto();

  const [fromSymbol, setFromSymbol] = useState('USDT');
  const [toSymbol, setToSymbol] = useState('BTC');
  const [fromAmount, setFromAmount] = useState('1000');
  const [slippage, setSlippage] = useState('0.1');
  const [quoteTimer, setQuoteTimer] = useState(6);
  const [swapResult, setSwapResult] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fromAsset = assets.find(a => a.symbol === fromSymbol) || assets[0];
  const toAsset = assets.find(a => a.symbol === toSymbol) || assets[1];

  const fromBalance = balances[fromSymbol]?.spot || 0;
  const toBalance = balances[toSymbol]?.spot || 0;

  // Rate calculation
  const exchangeRate = fromAsset.priceUsd / toAsset.priceUsd;
  const numericFromAmount = parseFloat(fromAmount) || 0;
  const estimatedToAmount = numericFromAmount * exchangeRate;

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteTimer(prev => (prev <= 1 ? 6 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInvert = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFromAmount(estimatedToAmount.toFixed(toAsset.decimalPlaces > 2 ? 4 : 2));
  };

  const handleMax = () => {
    setFromAmount(fromBalance.toString());
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    setSwapResult(null);

    if (numericFromAmount <= 0) {
      setSwapResult({ type: 'error', text: 'Please enter an amount to convert.' });
      return;
    }
    if (numericFromAmount > fromBalance) {
      setSwapResult({ type: 'error', text: `Insufficient ${fromSymbol} balance in Spot Wallet.` });
      return;
    }

    const res = executeConvert(fromSymbol, toSymbol, numericFromAmount, estimatedToAmount);
    if (res.success) {
      setSwapResult({ type: 'success', text: res.message });
      setFromAmount('');
      setQuoteTimer(6);
    } else {
      setSwapResult({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="rounded-3xl bg-[#0E131D] border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Kroma Convert
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero Fees
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Instant asset conversion with zero slippage</p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Guaranteed quote: {quoteTimer}s</span>
          </div>
        </div>

        <form onSubmit={handleConvert} className="space-y-4">
          {/* From Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400 uppercase text-[11px]">From (Pay)</span>
              <span className="text-slate-400 text-[11px]">
                Available: <strong className="text-cyan-400 font-mono">{fromBalance} {fromSymbol}</strong>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                step="any"
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-bold text-white font-mono placeholder:text-slate-600 focus:outline-none"
              />

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleMax}
                  className="px-2 py-1 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-950/60 transition-colors"
                >
                  MAX
                </button>
                <select
                  value={fromSymbol}
                  onChange={e => {
                    const newSym = e.target.value;
                    if (newSym === toSymbol) setToSymbol(fromSymbol);
                    setFromSymbol(newSym);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ≈ ${(numericFromAmount * fromAsset.priceUsd).toFixed(2)} USD
            </div>
          </div>

          {/* Swap divider button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleInvert}
              className="p-2.5 rounded-full bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 active:scale-90 transition-all cursor-pointer"
              title="Flip currencies"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* To Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400 uppercase text-[11px]">To (Receive)</span>
              <span className="text-slate-400 text-[11px]">
                Available: <strong className="text-slate-300 font-mono">{toBalance} {toSymbol}</strong>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {estimatedToAmount > 0 ? estimatedToAmount.toFixed(toAsset.decimalPlaces > 2 ? 6 : 2) : '0.00'}
              </div>

              <select
                value={toSymbol}
                onChange={e => {
                  const newSym = e.target.value;
                  if (newSym === fromSymbol) setFromSymbol(toSymbol);
                  setToSymbol(newSym);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 shrink-0"
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ≈ ${(estimatedToAmount * toAsset.priceUsd).toFixed(2)} USD
            </div>
          </div>

          {/* Rate Breakdown Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Conversion Rate:</span>
              <span className="font-mono text-slate-200">
                1 {fromSymbol} ≈ {exchangeRate.toFixed(toAsset.decimalPlaces > 2 ? 6 : 4)} {toSymbol}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Execution Fee:</span>
              <span className="font-mono text-emerald-400 font-bold">0.00% (Free Instant Swap)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Deposit to:</span>
              <span className="text-slate-200">Spot Wallet</span>
            </div>
          </div>

          {/* Feedback status */}
          {swapResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                swapResult.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              }`}
            >
              {swapResult.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{swapResult.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-900 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            Confirm Swap ({fromSymbol} → {toSymbol})
          </button>
        </form>
      </div>
    </div>
  );
};
