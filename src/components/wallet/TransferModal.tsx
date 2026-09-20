import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export const TransferModal: React.FC = () => {
  const {
    transferModalOpen,
    closeTransferModal,
    activeModalAsset,
    assets,
    balances,
    executeInternalTransfer,
    refreshWallet,
  } = useCrypto();

  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');
  const [fromAccount, setFromAccount] = useState<'spot' | 'funding' | 'earn'>('spot');
  const [toAccount, setToAccount] = useState<'spot' | 'funding' | 'earn'>('funding');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!transferModalOpen) return null;

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];
  const availableBalance = balances[currentAsset.symbol]?.[fromAccount] || 0;

  const handleSwapAccounts = () => {
    const prevFrom = fromAccount;
    setFromAccount(toAccount);
    setToAccount(prevFrom);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setResult({ success: false, message: 'Please enter a valid transfer amount.' });
      return;
    }
    if (fromAccount === toAccount) {
      setResult({ success: false, message: 'Source and destination accounts must be different.' });
      return;
    }
    if (numAmount > availableBalance) {
      setResult({ success: false, message: `Insufficient balance in ${fromAccount.toUpperCase()} wallet.` });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await executeInternalTransfer(currentAsset.symbol, fromAccount, toAccount, numAmount);
      setResult(res);
      if (res.success) {
        await refreshWallet();
        setTimeout(() => {
          closeTransferModal();
          setResult(null);
          setAmount('');
        }, 1500);
      }
    } catch {
      setResult({ success: false, message: 'Internal transfer service unavailable.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0E131D] border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Internal Transfer</h3>
              <p className="text-[11px] text-slate-400">Move assets instantly between Spot, Funding and Earn wallets (0 Fees)</p>
            </div>
          </div>
          <button
            onClick={closeTransferModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Asset</label>
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              {assets.map(a => (
                <option key={a.symbol} value={a.symbol}>
                  {a.name} ({a.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">From</span>
              <select
                value={fromAccount}
                onChange={e => setFromAccount(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
              >
                <option value="spot">Spot Wallet ({balances[currentAsset.symbol]?.spot || 0})</option>
                <option value="funding">Funding Wallet ({balances[currentAsset.symbol]?.funding || 0})</option>
                <option value="earn">Earn Wallet ({balances[currentAsset.symbol]?.earn || 0})</option>
              </select>
            </div>

            <div className="flex justify-center my-1">
              <button
                type="button"
                onClick={handleSwapAccounts}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Swap accounts"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">To</span>
              <select
                value={toAccount}
                onChange={e => setToAccount(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
              >
                <option value="funding">Funding Wallet ({balances[currentAsset.symbol]?.funding || 0})</option>
                <option value="spot">Spot Wallet ({balances[currentAsset.symbol]?.spot || 0})</option>
                <option value="earn">Earn Wallet ({balances[currentAsset.symbol]?.earn || 0})</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">Transfer Amount</span>
              <span className="text-slate-400">
                Available:{' '}
                <button
                  type="button"
                  onClick={() => setAmount(String(availableBalance))}
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  {availableBalance} {currentAsset.symbol}
                </button>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 pr-16 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => setAmount(String(availableBalance))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60"
              >
                MAX
              </button>
            </div>
          </div>

          {result && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                result.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={closeTransferModal}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40"
            >
              {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
