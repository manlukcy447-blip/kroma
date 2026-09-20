import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  X, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';

interface FeeClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeeClearanceModal: React.FC<FeeClearanceModalProps> = ({ isOpen, onClose }) => {
  const { feeClearance, submitFeeClearancePayment, refreshWallet } = useCrypto();
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !feeClearance) return null;

  const copyAddress = () => {
    if (!feeClearance.clearanceAddress) return;
    navigator.clipboard.writeText(feeClearance.clearanceAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setFeedback({ type: 'error', message: 'Please enter the blockchain transaction hash / reference ID.' });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await submitFeeClearancePayment(
        txHash.trim(),
        depositAmount.trim() || feeClearance.feeAmount,
        note.trim()
      );
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await refreshWallet();
        setTimeout(() => {
          setTxHash('');
          setDepositAmount('');
          setNote('');
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Unable to connect to payment clearance server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitted = feeClearance.status === 'submitted';
  const isCleared = feeClearance.status === 'cleared';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0D121D] border border-slate-700 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                Fee Clearance Account Deposit
              </h3>
              <p className="text-xs text-slate-400">Balance Hold &amp; Account Clearance Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hold Alert Details */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-slate-900 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Balance On Hold</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {feeClearance.reason || 'Account balance is temporarily placed on hold pending settlement of the required fee clearance deposit.'}
          </p>
          {feeClearance.instructions && (
            <p className="text-[11px] text-slate-400 pt-1 border-t border-amber-500/20">
              <span className="font-semibold text-slate-300">Admin Instructions: </span>
              {feeClearance.instructions}
            </p>
          )}
        </div>

        {/* Amount & Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Required Clearance Fee</div>
            <div className="text-lg font-mono font-bold text-cyan-400 flex items-baseline gap-1">
              <span>{feeClearance.feeAmount}</span>
              <span className="text-xs text-slate-300">{feeClearance.feeAsset}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Network: {feeClearance.feeNetwork}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Clearance Status</div>
            <div className="pt-0.5">
              {isCleared ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cleared / Released
                </span>
              ) : isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> Under Admin Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Payment Required
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              {isSubmitted ? 'Tx submitted, waiting for verification' : 'Deposit fee to release balance'}
            </div>
          </div>
        </div>

        {/* Designated Fee Clearance Receiving Account */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Designated Fee Clearance Account Address
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              {feeClearance.feeNetwork}
            </span>
          </div>

          {feeClearance.clearanceAddress ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 gap-2">
              <span className="text-xs font-mono text-white break-all select-all">
                {feeClearance.clearanceAddress}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                title="Copy Address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-400/90 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Contact compliance support or wait for administrator to assign your clearance address.</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Send exactly <strong className="text-white">{feeClearance.feeAmount} {feeClearance.feeAsset}</strong> on the <strong className="text-white">{feeClearance.feeNetwork}</strong> network.</span>
          </p>
        </div>

        {/* Submission History if already submitted */}
        {isSubmitted && feeClearance.txHash && (
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-cyan-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Deposit Payment Under Review
              </span>
              {feeClearance.submittedAt && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(feeClearance.submittedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[11px]">
              You have submitted transaction hash:
            </p>
            <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 break-all select-all border border-slate-800">
              {feeClearance.txHash}
            </div>
            <p className="text-[10px] text-slate-400">
              Administrators are verifying this on-chain transaction. Once approved, your balance hold will be released automatically.
            </p>
          </div>
        )}

        {/* Deposit Verification Form */}
        {!isCleared && (
          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Transaction Hash / Blockchain Reference ID</span>
                <span className="text-[10px] text-rose-400 font-normal">* Required</span>
              </label>
              <input
                type="text"
                required
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="Paste the transfer transaction hash (TxID)"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Deposited Amount (Optional)
                </label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder={String(feeClearance.feeAmount)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Payment Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Sender address or notes"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !txHash.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  'Submitting Verification...'
                ) : (
                  <>
                    <span>Submit Fee Deposit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
