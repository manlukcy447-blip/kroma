import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'icon';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact', className = '' }) => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already installed, don't show the button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setModalOpen(true)}
          className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition-all ${className}`}
          title="Install App on Device"
          aria-label="Install App"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : variant === 'full' ? (
        <button
          onClick={() => setModalOpen(true)}
          className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/15 to-teal-500/15 hover:from-cyan-500/25 hover:to-teal-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all ${className}`}
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Install Kroma App</span>
        </button>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className={`py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-500/5 ${className}`}
        >
          {isIOS ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
          <span>Install App</span>
        </button>
      )}

      {modalOpen && (
        <PWAInstallModal forceOpen={true} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
};
