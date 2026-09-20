import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, Send, QrCode, ArrowDownToLine, Copy, Check } from 'lucide-react';

export const SendReceiveModal: React.FC = () => {
  const {
    sendReceiveModalOpen,
    closeSendReceiveModal,
    activeModalAsset,
    assets,
    openDepositModal,
    openWithdrawModal,
  } = useCrypto();

  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');

  if (!sendReceiveModalOpen) return null;

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0E131D] border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Send & Receive Crypto</h3>
              <p className="text-[11px] text-slate-400">Direct transfer via blockchain address or UID</p>
            </div>
          </div>
          <button
            onClick={closeSendReceiveModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setMode('send')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'send' ? 'bg-cyan-500 text-slate-900 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Send (Withdraw)
          </button>
          <button
            onClick={() => setMode('receive')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'receive' ? 'bg-cyan-500 text-slate-900 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Receive (Deposit)
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Asset</label>
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

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            {mode === 'send' ? (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Send {currentAsset.name} ({currentAsset.symbol}) to another external wallet or Kroma user with zero internal transfer fees.
                </p>
                <button
                  onClick={() => {
                    closeSendReceiveModal();
                    openWithdrawModal(selectedSymbol);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Open Full Withdrawal Form</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deposit {currentAsset.name} ({currentAsset.symbol}) into your multi-chain vault address with instant confirmations.
                </p>
                <button
                  onClick={() => {
                    closeSendReceiveModal();
                    openDepositModal(selectedSymbol);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Open Deposit & QR Code</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
