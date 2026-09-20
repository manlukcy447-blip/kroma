import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, ArrowUpRight, AlertTriangle, CheckCircle2, Lock, ShieldAlert } from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const {
    withdrawModalOpen,
    closeWithdrawModal,
    activeModalAsset,
    assets,
    balances,
    executeWithdrawal,
    refreshWallet,
    feeClearance,
    openFeeClearanceModal,
  } = useCrypto();

  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!withdrawModalOpen) return null;

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];
  const networks = currentAsset.networks || [];
  const currentNetwork = networks.find(n => n.id === selectedNetworkId) || networks[0] || {
    id: 'default',
    name: 'Default Network',
    fee: 0,
    feeAsset: currentAsset.symbol,
  };

  const availableBalance = balances[currentAsset.symbol]?.spot || 0;
  const isHeld = Boolean(feeClearance?.holdActive && feeClearance?.status !== 'cleared');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const numAmount = parseFloat(amount);
    if (!destinationAddress.trim()) {
      setResult({ success: false, message: 'Please enter a valid destination address.' });
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setResult({ success: false, message: 'Please enter an amount greater than 0.' });
      return;
    }
    if (numAmount > availableBalance) {
      setResult({ success: false, message: `Insufficient balance. Available: ${availableBalance} ${currentAsset.symbol}` });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await executeWithdrawal(
        currentAsset.symbol,
        currentNetwork.id,
        destinationAddress.trim(),
        numAmount,
        code2FA.trim()
      );
      setResult(res);
      if (res.success) {
        await refreshWallet();
        setTimeout(() => {
          closeWithdrawModal();
          setResult(null);
          setAmount('');
          setDestinationAddress('');
          setCode2FA('');
        }, 1800);
      }
    } catch {
      setResult({ success: false, message: 'Withdrawal service temporarily unavailable.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0E131D] border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Withdraw Digital Asset</h3>
              <p className="text-[11px] text-slate-400">Transfer funds to an external wallet or exchange</p>
            </div>
          </div>
          <button
            onClick={closeWithdrawModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isHeld && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Balance On Hold — Fee Clearance Required</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {feeClearance?.reason || `Withdrawals are locked until the clearance fee of ${feeClearance?.feeAmount} ${feeClearance?.feeAsset} is deposited into the fee clearance account.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeWithdrawModal();
                  openFeeClearanceModal();
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Deposit Fee &amp; Clear Hold</span>
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Asset</label>
            <select
              value={selectedSymbol}
              onChange={e => {
                setSelectedSymbol(e.target.value);
                setSelectedNetworkId('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              {assets.map(a => (
                <option key={a.symbol} value={a.symbol}>
                  {a.name} ({a.symbol}) — Spot: {balances[a.symbol]?.spot || 0}
                </option>
              ))}
            </select>
          </div>

          {networks.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Network</label>
              <select
                value={currentNetwork.id}
                onChange={e => setSelectedNetworkId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
              >
                {networks.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} (Fee: {n.fee} {n.feeAsset})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">Destination Address</span>
            </div>
            <input
              type="text"
              required
              value={destinationAddress}
              onChange={e => setDestinationAddress(e.target.value)}
              placeholder="Paste recipient wallet address"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">Amount</span>
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

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">2FA Code / Authenticator (Optional)</label>
            <input
              type="text"
              value={code2FA}
              onChange={e => setCode2FA(e.target.value)}
              placeholder="6-digit authenticator code"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
            />
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
              onClick={closeWithdrawModal}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isHeld || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 disabled:opacity-40"
            >
              {isSubmitting ? 'Submitting...' : isHeld ? 'Balance On Hold (Fee Required)' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
