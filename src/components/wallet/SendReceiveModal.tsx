import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, Send, QrCode, Copy, Check, Users, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const SendReceiveModal: React.FC = () => {
  const {
    sendReceiveModalOpen,
    closeSendReceiveModal,
    activeModalAsset,
    sendReceiveMode,
    assets,
    balances,
    userProfile,
    executeInternalTransfer,
  } = useCrypto();

  const [mode, setMode] = useState<'send' | 'receive'>(sendReceiveMode || 'send');
  const [sendMethod, setSendMethod] = useState<'kroma_pay' | 'on_chain'>('kroma_pay');
  const [selectedAsset, setSelectedAsset] = useState(activeModalAsset || 'USDT');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!sendReceiveModalOpen) return null;

  const currentBal = balances[selectedAsset]?.funding || balances[selectedAsset]?.spot || 0;
  const currentAsset = assets.find(a => a.symbol === selectedAsset) || assets[0];

  const handleCopyUid = () => {
    navigator.clipboard.writeText(userProfile.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const num = parseFloat(amount);
    if (!recipient.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a recipient Kroma UID, Email, or Wallet Address.' });
      return;
    }
    if (!num || num <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid transfer amount.' });
      return;
    }
    if (num > currentBal) {
      setStatusMsg({ type: 'error', text: `Insufficient balance. Available: ${currentBal} ${selectedAsset}` });
      return;
    }

    setStatusMsg({
      type: 'success',
      text: `Sent ${num} ${selectedAsset} to ${recipient} via ${sendMethod === 'kroma_pay' ? 'Kroma Instant Pay (0 Fee)' : 'On-Chain Gateway'}!`,
    });
    setAmount('');
    setRecipient('');
    setTimeout(() => {
      closeSendReceiveModal();
      setStatusMsg(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('send')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'send' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Send
            </button>
            <button
              onClick={() => setMode('receive')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'receive' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Receive
            </button>
          </div>
          <button
            onClick={closeSendReceiveModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'send' ? (
          <form onSubmit={handleSend} className="space-y-4 pt-4">
            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSendMethod('kroma_pay')}
                className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                  sendMethod === 'kroma_pay'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Kroma Pay (Internal)</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5 font-normal">Instant • 0 Gas Fee</div>
              </button>
              <button
                type="button"
                onClick={() => setSendMethod('on_chain')}
                className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                  sendMethod === 'on_chain'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>On-Chain Direct</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-normal">External blockchain wallet</div>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {sendMethod === 'kroma_pay' ? 'Recipient Kroma UID or Email' : 'Recipient Wallet Address'}
              </label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={sendMethod === 'kroma_pay' ? 'e.g. KR-882941 or user@kroma.io' : '0x... or sol...'}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Asset Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Asset</label>
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
              <div className="flex justify-between text-xs mb-1">
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
                  onClick={() => setAmount(currentBal.toString())}
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
              Send {selectedAsset}
            </button>
          </form>
        ) : (
          /* Receive View */
          <div className="space-y-4 pt-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-32 h-32 mx-auto p-2 bg-white rounded-xl shadow-md flex items-center justify-center">
                {/* SVG QR representation */}
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <rect x="5" y="5" width="28" height="28" fill="black" />
                  <rect x="9" y="9" width="20" height="20" fill="white" />
                  <rect x="13" y="13" width="12" height="12" fill="black" />
                  <rect x="67" y="5" width="28" height="28" fill="black" />
                  <rect x="71" y="9" width="20" height="20" fill="white" />
                  <rect x="75" y="13" width="12" height="12" fill="black" />
                  <rect x="5" y="67" width="28" height="28" fill="black" />
                  <rect x="9" y="71" width="20" height="20" fill="white" />
                  <rect x="13" y="75" width="12" height="12" fill="black" />
                  <rect x="42" y="42" width="16" height="16" fill="black" />
                  <rect x="45" y="15" width="10" height="10" fill="black" />
                  <rect x="15" y="45" width="10" height="10" fill="black" />
                  <rect x="75" y="45" width="10" height="10" fill="black" />
                  <rect x="45" y="75" width="10" height="10" fill="black" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Your Kroma Pay UID
                </span>
                <div className="inline-flex items-center space-x-2 mt-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sm text-cyan-400 font-bold">
                  <span>{userProfile.uid}</span>
                  <button onClick={handleCopyUid} className="hover:text-white transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {copied && <div className="text-[11px] text-emerald-400 mt-1">UID copied!</div>}
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Other Kroma users can send any asset directly to this UID with zero gas fees.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
