import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { CreditCard, Landmark, Apple, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { FIAT_RATES } from '../../data/mockData';
import { FiatCurrency } from '../../types/crypto';

export const BuySellView: React.FC = () => {
  const {
    assets,
    fiatCurrency,
    setFiatCurrency,
    formatFiat,
    t,
  } = useCrypto();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [cryptoSymbol, setCryptoSymbol] = useState('USDT');
  const [fiatAmount, setFiatAmount] = useState('250');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'apple_pay'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  const currentAsset = assets.find(a => a.symbol === cryptoSymbol) || assets[0];
  const fiatRateInfo = FIAT_RATES[fiatCurrency] || FIAT_RATES['USD'];

  // Calculate equivalent crypto
  const numericFiat = parseFloat(fiatAmount) || 0;
  const fiatInUsd = numericFiat / fiatRateInfo.rate;
  const cryptoAmount = fiatInUsd / currentAsset.priceUsd;

  const paymentOptions = [
    {
      id: 'card',
      title: 'Credit / Debit Card',
      desc: 'Visa, Mastercard, Maestro • Instant settlement',
      fee: '1.2%',
      icon: <CreditCard className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'apple_pay',
      title: 'Apple Pay / Google Pay',
      desc: 'Fast biometric checkout • Instant settlement',
      fee: '1.4%',
      icon: <Apple className="w-5 h-5 text-white" />,
    },
    {
      id: 'bank',
      title: 'SEPA / Wire Transfer',
      desc: 'Direct bank transfer • 0% Deposit Fee',
      fee: '0.0%',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericFiat <= 0) return;

    setIsProcessing(true);
    setTimeout(async () => {
      setIsProcessing(false);
      if (mode === 'buy') {
        setSuccessReceipt(`Buy request prepared for ${cryptoAmount.toFixed(currentAsset.decimalPlaces > 2 ? 4 : 2)} ${cryptoSymbol}. Payment processing is not connected yet, so no funds or balance were changed.`);
      } else {
        setSuccessReceipt(
          `Sell request prepared for ${cryptoAmount.toFixed(4)} ${cryptoSymbol}. Fiat payout is not connected yet, so no funds were moved.`
        );
      }
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <div className="rounded-3xl bg-[#0E131D] border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Toggle Buy / Sell */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('buy'); setSuccessReceipt(null); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'buy' ? 'bg-emerald-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Buy Crypto
            </button>
            <button
              onClick={() => { setMode('sell'); setSuccessReceipt(null); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'sell' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sell Crypto
            </button>
          </div>

          <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> PCI-DSS Gateway
          </span>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          {/* Fiat Amount Input */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold uppercase text-[11px]">
                {mode === 'buy' ? 'I want to spend' : 'I want to receive'}
              </span>
              <span>Available limits: $50,000 / day</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                step="any"
                value={fiatAmount}
                onChange={e => setFiatAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-bold text-white font-mono placeholder:text-slate-600 focus:outline-none"
              />

              <select
                value={fiatCurrency}
                onChange={e => setFiatCurrency(e.target.value as FiatCurrency)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              >
                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'].map(curr => (
                  <option key={curr} value={curr}>
                    {curr} ({FIAT_RATES[curr]?.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Crypto Equivalent Display */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold uppercase text-[11px]">
                {mode === 'buy' ? 'Estimated Receive' : 'You will sell'}
              </span>
              <span className="text-slate-400 font-mono">
                1 {cryptoSymbol} ≈ {fiatRateInfo.symbol}{(currentAsset.priceUsd * fiatRateInfo.rate).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {cryptoAmount > 0 ? cryptoAmount.toFixed(currentAsset.decimalPlaces > 2 ? 4 : 2) : '0.00'}
              </div>

              <select
                value={cryptoSymbol}
                onChange={e => setCryptoSymbol(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.name} ({a.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Payment Method</label>
            <div className="space-y-2">
              {paymentOptions.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                    paymentMethod === opt.id
                      ? 'bg-slate-800 border-cyan-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{opt.title}</div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    Fee: {opt.fee}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {successReceipt && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successReceipt}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-98 cursor-pointer ${
              mode === 'buy'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-rose-500/20'
            }`}
          >
            {isProcessing ? 'Processing Payment...' : mode === 'buy' ? `Buy ${cryptoSymbol} Now` : `Sell ${cryptoSymbol} for ${fiatCurrency}`}
          </button>
        </form>
      </div>
    </div>
  );
};
