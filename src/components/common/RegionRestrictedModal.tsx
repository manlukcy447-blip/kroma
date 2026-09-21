import React from 'react';
import { ShieldAlert, Globe, ArrowRight, Lock, X, AlertTriangle } from 'lucide-react';
import { useCrypto } from '../../context/CryptoContext';

export const RegionRestrictedModal: React.FC = () => {
  const { regionModalState, closeRegionRestricted, setCurrentTab } = useCrypto();

  if (!regionModalState.open) return null;

  const handleGoHome = () => {
    closeRegionRestricted();
    setCurrentTab('home');
  };

  return (
    <div
      id="region-restricted-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="region-restricted-modal"
        className="w-full max-w-md bg-[#0D121F] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 relative text-slate-100"
      >
        {/* Close Button */}
        <button
          id="close-region-restricted-btn"
          onClick={closeRegionRestricted}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Lock className="w-3 h-3" />
              <span>Jurisdiction Compliance</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Not Available in Your Region
            </h2>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 mb-5">
          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {regionModalState.message ||
                `Access to ${regionModalState.feature || 'this service'} is currently restricted in your geographic jurisdiction due to local financial compliance laws and regulatory mandates.`}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Policy: REG-GEO-RESTRICT</span>
            <span className="text-emerald-400">Funds 100% Safe</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Your wallet assets, spot trading, and standard withdrawals are unaffected. You may continue accessing all unrestricted exchange modules.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            id="region-restricted-home-btn"
            onClick={handleGoHome}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="region-restricted-understand-btn"
            onClick={closeRegionRestricted}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
