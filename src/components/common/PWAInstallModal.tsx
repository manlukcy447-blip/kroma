import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  BellRing,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  // Allow external control if triggered from Header or Navigation
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ forceOpen, onClose }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isMacSafari,
    isDesktop,
    browserName,
    install,
    markAsInstalled,
    showModal,
    setShowModal,
    dismissForSession,
  } = usePWAInstall();

  const [installing, setInstalling] = useState(false);
  const [showManualSteps, setShowManualSteps] = useState(false);

  // CRITICAL REQUIREMENT: Stop showing as soon as user completely and successfully installs the app
  if (isInstalled && !forceOpen) {
    return null;
  }

  const isVisible = forceOpen || showModal;
  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    if (onClose) onClose();
    dismissForSession();
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        if (onClose) onClose();
      } else {
        // Fallback to manual steps if native dialog didn't trigger
        setShowManualSteps(true);
      }
    } catch {
      setShowManualSteps(true);
    } finally {
      setInstalling(false);
    }
  };

  const handleManualComplete = () => {
    markAsInstalled();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md transition-all animate-in fade-in duration-200">
      {/* Click outside to dismiss for session */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="relative w-full max-w-md bg-[#0B0F19] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden z-10 text-white animate-in zoom-in-95 duration-200"
      >
        {/* Top ambient banner gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Dismiss installation prompt"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header with App Icon */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 p-2 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
                <img
                  src="/icon.svg"
                  alt="Kroma App Icon"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    // Fallback to PNG if SVG render fails
                    (e.target as HTMLImageElement).src = '/pwa-192x192.png';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Download className="w-3 h-3" />
                <span>Install Application</span>
              </div>
              <h2 id="pwa-install-title" className="text-lg font-bold text-white leading-tight">
                Install Kroma on Your Device
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIOS ? 'iPhone & iPad App' : isAndroid ? 'Android Native App' : isDesktop ? 'Desktop Application' : 'Fast Standalone App'}
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
              <Zap className="w-4 h-4 text-cyan-400 mx-auto" />
              <div className="text-[11px] font-bold text-slate-200">Zero Lag</div>
              <div className="text-[9px] text-slate-400">Offline cached</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
              {isDesktop ? (
                <Laptop className="w-4 h-4 text-emerald-400 mx-auto" />
              ) : (
                <Smartphone className="w-4 h-4 text-emerald-400 mx-auto" />
              )}
              <div className="text-[11px] font-bold text-slate-200">Full Screen</div>
              <div className="text-[9px] text-slate-400">No browser bars</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
              <ShieldCheck className="w-4 h-4 text-teal-400 mx-auto" />
              <div className="text-[11px] font-bold text-slate-200">Hardware Keys</div>
              <div className="text-[9px] text-slate-400">Encrypted vault</div>
            </div>
          </div>

          {/* Installation Details based on Browser & Device */}
          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-3">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simple 2-Step Installation for Apple iOS:</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                <li className="leading-relaxed">
                  Tap the <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><Share2 className="w-3 h-3 text-cyan-400 inline" /> Share</strong> button at the bottom of Safari.
                </li>
                <li className="leading-relaxed">
                  Scroll down and tap <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><PlusSquare className="w-3 h-3 text-cyan-400 inline" /> Add to Home Screen</strong>.
                </li>
                <li className="leading-relaxed">
                  Tap <strong className="text-cyan-400">Add</strong> in the top right corner.
                </li>
              </ol>

              <button
                onClick={handleManualComplete}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>I've Added It to My Home Screen</span>
              </button>
            </div>
          ) : isMacSafari ? (
            /* macOS Safari Instructions */
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-3">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" />
                <span>Install on macOS Safari:</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                <li className="leading-relaxed">
                  Click <strong className="text-white">File</strong> in the top Safari menu bar.
                </li>
                <li className="leading-relaxed">
                  Click <strong className="text-white">Add to Dock...</strong>
                </li>
                <li className="leading-relaxed">
                  Click <strong className="text-cyan-400">Add</strong> to launch Kroma as a standalone Mac app.
                </li>
              </ol>

              <button
                onClick={handleManualComplete}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>I've Added It to Dock</span>
              </button>
            </div>
          ) : showManualSteps ? (
            /* Fallback Manual Instructions */
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-2.5">
              <div className="text-xs font-bold text-cyan-300">
                Install via {browserName} Menu:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click your browser menu (<strong>⋮</strong> or <strong>⋯</strong>) at the top right, then select <strong className="text-white">"Install Kroma"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
              </p>
              <button
                onClick={handleManualComplete}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>I Have Installed The App</span>
              </button>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {(!isIOS && !isMacSafari) && (
              <button
                onClick={handleNativeInstall}
                disabled={installing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:opacity-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download className={`w-4 h-4 ${installing ? 'animate-bounce' : ''}`} />
                <span>{installing ? 'Preparing Installation...' : 'Install App Now'}</span>
              </button>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
              >
                Maybe Later
              </button>

              <button
                onClick={handleManualComplete}
                className="py-2 px-3 rounded-xl text-slate-500 hover:text-slate-300 text-[11px] font-medium transition-colors"
                title="Mark as installed if you already installed this app"
              >
                Already Installed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
