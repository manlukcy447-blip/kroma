import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const TransferModal: React.FC = () => {
  const {
    transferModalOpen,
    closeTransferModal,
    activeModalAsset,
    assets,
    balances,
    executeInternalTransfer,
  } = useCrypto();

  const [selectedAsset, setSelectedAsset] = useState(activeModalAsset || 'USDT');
  const [fromAccount, setFromAccount] = useState<'spot' | 'funding' | 'earn'>('spot');
  const [toAccount, setToAccount] = useState<'spot' | 'funding' | 'earn'>('funding');
  const [amount, setAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!transferModalOpen) return null;

  const currentBal = balances[selectedAsset]?.[fromAccount] || 0;

  const handleSwapAccounts = () => {
    const temp = fromAccount;
    setFromAccount(toAccount);
    setToAccount(temp);
  };

  const handleMax = () => {
    setAmount(currentBal.toString());
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      setStatusMsg({ type: 'error', text: 'Enter a valid transfer amount.' });
      return;
    }

    const res = await executeInternalTransfer(selectedAsset, fromAccount, toAccount, numAmt);
    if (!res.success) {
      setStatusMsg({ type: 'error', text: res.message });
    } else {
      setStatusMsg({ type: 'success', text: res.message });
      setAmount('');
      setTimeout(() => {
        closeTransferModal();
        setStatusMsg(null);
      }, 2000);
    }
  };

  const accountLabels = {
    spot: 'Spot Wallet (Trading)',
    funding: 'Funding Wallet (P2P / Fiat)',
    earn: 'Earn Vault (Yield Staking)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Internal Transfer</h3>
              <p className="text-xs text-slate-400">Zero fees • Instant execution</p>
            </div>
          </div>
          <button
            onClick={closeTransferModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4 pt-4">
          {/* Account routing */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">From</label>
              <select
                value={fromAccount}
                onChange={e => setFromAccount(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="spot">{accountLabels.spot}</option>
                <option value="funding">{accountLabels.funding}</option>
                <option value="earn">{accountLabels.earn}</option>
              </select>
            </div>

            <div className="flex justify-center -my-1 relative z-10">
              <button
                type="button"
                onClick={handleSwapAccounts}
                className="p-1.5 rounded-full bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-md transition-all active:scale-90 cursor-pointer"
                title="Switch direction"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">To</label>
              <select
                value={toAccount}
                onChange={e => setToAccount(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="funding">{accountLabels.funding}</option>
                <option value="spot">{accountLabels.spot}</option>
                <option value="earn">{accountLabels.earn}</option>
              </select>
            </div>
          </div>

          {/* Asset Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Asset</label>
            <select
              value={selectedAsset}
              onChange={e => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
            >
              {assets.map(a => (
                <option key={a.symbol} value={a.symbol}>
                  {a.name} ({a.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold text-slate-300">Amount</span>
              <span className="text-slate-400 text-[11px]">
                Available: <strong className="text-cyan-400 font-mono">{currentBal} {selectedAsset}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 pr-16"
              />
              <button
                type="button"
                onClick={handleMax}
                className="absolute right-2.5 top-2 px-2 py-1 rounded text-xs font-bold text-cyan-400 hover:bg-cyan-950/60"
              >
                MAX
              </button>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              }`}
            >
              {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
          >
            Confirm Transfer
          </button>
        </form>
      </div>
    </div>
  );
};
