import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Hash, ExternalLink, X } from 'lucide-react';

export interface DepositItem {
  id: string;
  userId: string;
  email?: string;
  asset: string;
  network: string;
  amount: number | string;
  txHash?: string;
  status: string;
  createdAt: string | number;
}

interface AdminDepositApprovalModalProps {
  deposit: DepositItem | null;
  mode: 'approve' | 'reject' | null;
  onClose: () => void;
  onApprove: (id: string, txHash: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const AdminDepositApprovalModal: React.FC<AdminDepositApprovalModalProps> = ({
  deposit,
  mode,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!deposit || !mode) return null;

  const [txHash, setTxHash] = useState(
    deposit.txHash || `ADMIN_VERIFIED_${Date.now()}`
  );
  const [rejectReason, setRejectReason] = useState(
    'Transfer verification failed or invalid payment proof'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const isApprove = mode === 'approve';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    try {
      if (isApprove) {
        await onApprove(deposit.id, txHash.trim() || `ADMIN_VERIFIED_${Date.now()}`);
      } else {
        if (!rejectReason.trim()) {
          setError('Please provide a reason for rejection.');
          setIsProcessing(false);
          return;
        }
        await onReject(deposit.id, rejectReason.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="admin-deposit-approval-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        id="admin-deposit-approval-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-[#101522] border border-slate-700 shadow-2xl p-6 text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isApprove
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {isApprove ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isApprove ? 'Approve & Credit Deposit' : 'Reject Deposit Request'}
              </h3>
              <p className="text-xs text-slate-400">
                {isApprove
                  ? 'Verifying transaction will instantly credit user balance'
                  : 'Declining this request will update deposit status'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deposit Summary Card */}
        <div className="my-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">User Email:</span>
            <span className="font-medium text-white select-all">{deposit.email || deposit.userId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Asset & Amount:</span>
            <span className="font-bold text-cyan-300">
              {deposit.amount} {deposit.asset}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Network:</span>
            <span className="font-mono text-slate-300">{deposit.network || 'Standard'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Current Status:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {deposit.status}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {isApprove ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Blockchain Tx Hash / Settlement Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x... or ADMIN_VERIFIED_xxx"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                The user and audit ledger will display this transaction hash.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for declining payment..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                This notice will be recorded in the transaction history and logs.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                isApprove
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20'
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                <span>Processing…</span>
              ) : isApprove ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Approval &amp; Credit Balance</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
