import React from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { Lock, AlertTriangle, Clock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FeeClearanceBannerProps {
  onOpenModal: () => void;
}

export const FeeClearanceBanner: React.FC<FeeClearanceBannerProps> = ({ onOpenModal }) => {
  const { feeClearance } = useCrypto();

  if (!feeClearance || !feeClearance.holdActive || feeClearance.status === 'cleared') {
    return null;
  }

  const isSubmitted = feeClearance.status === 'submitted';

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#1E1708] via-[#2A1D0A] to-[#161208] border-2 border-amber-500/60 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5 shadow-inner">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Account Balance On Hold
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/25 border border-amber-500/40 text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Fee Clearance Required
              </span>
              {isSubmitted && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Deposit Submitted (Reviewing)
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {feeClearance.reason || 'Your account balance has been placed on hold pending settlement of the required clearance fee. Outgoing withdrawals and transfers are temporarily locked until the fee is deposited and cleared.'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <div className="text-slate-400">
                Required Fee:{' '}
                <strong className="text-amber-300 font-mono font-bold text-sm">
                  {feeClearance.feeAmount} {feeClearance.feeAsset}
                </strong>
                <span className="text-slate-500 ml-1">({feeClearance.feeNetwork})</span>
              </div>

              {feeClearance.clearanceAddress && (
                <div className="text-slate-400 hidden sm:block">
                  Designated Account:{' '}
                  <span className="text-slate-200 font-mono text-[11px]">
                    {feeClearance.clearanceAddress.slice(0, 8)}...{feeClearance.clearanceAddress.slice(-6)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            onClick={onOpenModal}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            <span>{isSubmitted ? 'View Deposit Status' : 'Deposit Fee to Release Balance'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
