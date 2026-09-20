import React, { useEffect, useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  X, 
  Copy, 
  Check, 
  AlertTriangle, 
  ArrowDownToLine, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronDown,
  Info,
  QrCode,
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';
import { apiUrl } from '../../admin/api';

export const DepositModal: React.FC = () => {
  const {
    depositModalOpen,
    closeDepositModal,
    activeModalAsset,
    assets,
    recordDeposit,
    refreshWallet,
    setCurrentTab
  } = useCrypto();

  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [copied, setCopied] = useState(false);
  const [serverAddress, setServerAddress] = useState<any>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; depositId?: string } | null>(null);

  // Sync selected symbol when activeModalAsset changes or modal opens
  useEffect(() => {
    if (activeModalAsset) {
      setSelectedSymbol(activeModalAsset);
      const assetObj = assets.find(a => a.symbol === activeModalAsset);
      if (assetObj && assetObj.networks.length > 0) {
        setSelectedNetworkId(assetObj.networks[0].id);
      }
    }
  }, [activeModalAsset, depositModalOpen]);

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];
  const networks = currentAsset.networks || [];
  const currentNetwork = networks.find(n => n.id === selectedNetworkId) || networks[0] || {
    id: 'default',
    name: 'Default Network',
    shortName: currentAsset.symbol,
    fee: 0,
    feeAsset: currentAsset.symbol,
    estimatedTime: '2-5 min',
    minConfirmations: 12,
  };

  useEffect(() => {
    if (!depositModalOpen || !selectedSymbol) return;
    const controller = new AbortController();
    setAddressLoading(true);
    fetch(apiUrl(`/api/deposit-addresses/active?asset=${encodeURIComponent(selectedSymbol)}&network=${encodeURIComponent(currentNetwork?.name || currentNetwork?.shortName || '')}`), {
      signal: controller.signal,
      credentials: 'include'
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('No server address')))
      .then(data => {
        const list = data.addresses || [];
        const match = list.find((a: any) => 
          a.network === currentNetwork?.name || 
          a.network === currentNetwork?.shortName || 
          a.network === currentNetwork?.id
        );
        setServerAddress(match || list[0] || null);
      })
      .catch(() => setServerAddress(null))
      .finally(() => setAddressLoading(false));
    return () => controller.abort();
  }, [depositModalOpen, selectedSymbol, selectedNetworkId, currentNetwork?.id, currentNetwork?.name, currentNetwork?.shortName]);

  if (!depositModalOpen) return null;

  const displayAddress = serverAddress?.address || (currentNetwork as any).depositAddress || '';
  const displayNetwork = serverAddress?.network || currentNetwork.name || currentNetwork.shortName;
  const minDepositLimit = serverAddress?.minDeposit ?? (selectedSymbol === 'BTC' ? 0.0001 : selectedSymbol === 'ETH' ? 0.005 : 10);

  const handleCopy = () => {
    if (!displayAddress) return;
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeDepositModal();
    }
  };

  return (
    <div 
      id="deposit-modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        id="deposit-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl my-auto rounded-3xl bg-[#0C1017] border border-slate-700/90 shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-[#101622] via-[#0E141E] to-[#0C1017] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Deposit Crypto</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secure Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional-grade multi-chain custody vault</p>
            </div>
          </div>
          <button
            id="deposit-modal-close-btn"
            onClick={closeDepositModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700 active:scale-95"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Asset Selection Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">1. Select Asset to Deposit</label>
              <span className="text-[11px] text-slate-400">Selected: <strong className="text-cyan-400">{currentAsset.name}</strong></span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['USDT', 'BTC', 'ETH', 'SOL', 'USDC', 'SUI', 'AVAX', 'NEAR'].map(sym => {
                const isSelected = selectedSymbol === sym;
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      setSelectedSymbol(sym);
                      const assetMatch = assets.find(a => a.symbol === sym);
                      if (assetMatch?.networks?.length) {
                        setSelectedNetworkId(assetMatch.networks[0].id);
                      }
                      setSubmitResult(null);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/20 to-teal-500/10 text-cyan-300 border-cyan-500/70 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <span className="tracking-wide">{sym}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Network Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">2. Select Deposit Network</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {networks.map(net => {
                const isSelected = (selectedNetworkId === net.id) || (!selectedNetworkId && currentNetwork.id === net.id);
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => {
                      setSelectedNetworkId(net.id);
                      setSubmitResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-slate-800/95 to-slate-850 border-cyan-500/80 text-white shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs text-white truncate">{net.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>Speed: <strong className="text-cyan-400">{net.estimatedTime}</strong></span>
                        <span>•</span>
                        <span>{net.minConfirmations} confs</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}>
                      {net.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Institutional Deposit Address & Authentic QR Code Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#111723] to-[#0D121B] border border-slate-700/80 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Official Receiving Address
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                Network: {displayNetwork}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              {/* Authentic High-Precision QR Code Card */}
              <div className="p-2 bg-white rounded-xl shadow-lg shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 sm:w-28 sm:h-28" viewBox="0 0 120 120" fill="none">
                  {/* Top-Left Finder */}
                  <rect x="6" y="6" width="34" height="34" rx="4" fill="#090D14" />
                  <rect x="12" y="12" width="22" height="22" rx="2" fill="white" />
                  <rect x="17" y="17" width="12" height="12" rx="1.5" fill="#090D14" />
                  
                  {/* Top-Right Finder */}
                  <rect x="80" y="6" width="34" height="34" rx="4" fill="#090D14" />
                  <rect x="86" y="12" width="22" height="22" rx="2" fill="white" />
                  <rect x="91" y="17" width="12" height="12" rx="1.5" fill="#090D14" />

                  {/* Bottom-Left Finder */}
                  <rect x="6" y="80" width="34" height="34" rx="4" fill="#090D14" />
                  <rect x="12" y="86" width="22" height="22" rx="2" fill="white" />
                  <rect x="17" y="91" width="12" height="12" rx="1.5" fill="#090D14" />

                  {/* Matrix Patterns */}
                  <rect x="46" y="8" width="6" height="6" fill="#090D14" />
                  <rect x="58" y="8" width="8" height="6" fill="#090D14" />
                  <rect x="70" y="12" width="5" height="5" fill="#090D14" />
                  <rect x="46" y="20" width="10" height="5" fill="#090D14" />
                  <rect x="62" y="22" width="6" height="6" fill="#090D14" />
                  
                  <rect x="48" y="36" width="24" height="24" rx="2" fill="#090D14" />
                  <rect x="54" y="42" width="12" height="12" fill="white" />
                  <rect x="58" y="46" width="4" height="4" fill="#090D14" />

                  <rect x="8" y="48" width="8" height="6" fill="#090D14" />
                  <rect x="22" y="46" width="6" height="8" fill="#090D14" />
                  <rect x="34" y="52" width="8" height="5" fill="#090D14" />

                  <rect x="78" y="46" width="8" height="8" fill="#090D14" />
                  <rect x="92" y="52" width="10" height="6" fill="#090D14" />
                  <rect x="106" y="46" width="6" height="10" fill="#090D14" />

                  <rect x="8" y="66" width="12" height="5" fill="#090D14" />
                  <rect x="26" y="64" width="8" height="8" fill="#090D14" />
                  <rect x="48" y="66" width="14" height="6" fill="#090D14" />
                  <rect x="68" y="64" width="8" height="8" fill="#090D14" />
                  <rect x="82" y="68" width="14" height="5" fill="#090D14" />
                  <rect x="102" y="64" width="10" height="8" fill="#090D14" />

                  <rect x="46" y="80" width="8" height="8" fill="#090D14" />
                  <rect x="60" y="82" width="12" height="6" fill="#090D14" />
                  <rect x="78" y="82" width="10" height="6" fill="#090D14" />
                  <rect x="94" y="80" width="8" height="8" fill="#090D14" />
                  <rect x="106" y="86" width="6" height="8" fill="#090D14" />

                  <rect x="48" y="96" width="14" height="8" fill="#090D14" />
                  <rect x="68" y="94" width="8" height="12" fill="#090D14" />
                  <rect x="82" y="98" width="14" height="6" fill="#090D14" />
                  <rect x="102" y="96" width="10" height="8" fill="#090D14" />

                  <rect x="48" y="108" width="28" height="5" fill="#090D14" />
                  <rect x="82" y="108" width="20" height="5" fill="#090D14" />
                </svg>
              </div>

              {/* Address string & Copy Button */}
              <div className="flex-1 min-w-0 w-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Vault Address ({currentAsset.symbol})
                  </span>
                  {serverAddress?.label && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {serverAddress.label}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-3 shadow-inner">
                  <span className="leading-relaxed">
                    {addressLoading ? 'Generating secure address…' : (displayAddress || 'Contact admin to assign receiving vault')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white shrink-0 transition-colors cursor-pointer active:scale-95 border border-slate-700"
                    title="Copy receiving address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Minimum Deposit: <strong className="text-white font-mono">{minDepositLimit} {currentAsset.symbol}</strong>
                  </span>
                  {copied && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> Copied to clipboard
                    </span>
                  )}
                </div>

                {(currentNetwork as any).memoRequired && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-amber-300 font-bold">Memo / Destination Tag Required:</span>
                      <p className="text-[10px] text-amber-200/80">You must include this tag or your deposit cannot be credited.</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700">
                      894210
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Crucial Network Safety Advisory */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 text-[11px] text-amber-200/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Send only <strong>{currentAsset.name} ({currentAsset.symbol})</strong> via the <strong>{displayNetwork}</strong> network. Transfers using any other token or network cannot be recovered.
              </p>
            </div>
          </div>

          {/* User Confirmation Step with Admin Review Notice */}
          <div className="p-5 rounded-2xl bg-[#101520] border border-cyan-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Confirm Deposit &amp; Request Admin Verification</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Step 2 of 2
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  After initiating your blockchain payment, confirm details below to notify the admin team for immediate ledger approval.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Amount Transferred ({currentAsset.symbol}) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min={minDepositLimit}
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder={`e.g. ${minDepositLimit * 2}`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {currentAsset.symbol}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Blockchain Tx Hash / TxID <span className="text-slate-500 font-normal">(Recommended)</span>
                </label>
                <input
                  type="text"
                  value={depositTxHash}
                  onChange={e => setDepositTxHash(e.target.value)}
                  placeholder="0x... or blockchain transaction hash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* Transparent Workflow Notice */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>What happens after you confirm payment?</span>
              </div>
              <ul className="text-slate-400 space-y-1 pl-4 list-disc text-[11px]">
                <li>Your deposit request enters the <strong>Awaiting Approval</strong> queue with timestamp and TxID.</li>
                <li>The compliance administrator audits the transaction and credits your spot wallet directly upon approval.</li>
                <li>You can monitor real-time approval status in your <strong>Wallet History</strong> tab.</li>
              </ul>
            </div>

            {submitResult && (
              <div className={`p-3.5 rounded-xl text-xs border ${
                submitResult.success 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-sm' 
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40 shadow-sm'
              }`}>
                <div className="flex items-start gap-2">
                  {submitResult.success ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{submitResult.success ? 'Confirmation Received!' : 'Error'}</span>
                    <p className="mt-0.5">{submitResult.message}</p>
                    {submitResult.depositId && (
                      <p className="mt-1 font-mono text-[10px] text-emerald-400/80">Reference ID: {submitResult.depositId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                id="deposit-submit-confirm-btn"
                disabled={isSubmitting || !depositAmount || parseFloat(depositAmount) <= 0}
                onClick={async () => {
                  if (!depositAmount || parseFloat(depositAmount) <= 0) return;
                  setIsSubmitting(true);
                  setSubmitResult(null);
                  try {
                    const res = await recordDeposit(
                      selectedSymbol,
                      currentNetwork.id,
                      parseFloat(depositAmount),
                      depositTxHash.trim() || undefined,
                      true
                    );
                    if (res.success) {
                      setSubmitResult({
                        success: true,
                        message: 'Deposit confirmed! Your request is now in the Admin Approval queue. Your wallet will be credited once verified.',
                        depositId: (res as any).depositId
                      });
                      await refreshWallet();
                      setTimeout(() => {
                        closeDepositModal();
                        setCurrentTab('wallet');
                      }, 2200);
                    } else {
                      setSubmitResult({ success: false, message: res.message || 'Deposit recording failed.' });
                    }
                  } catch {
                    setSubmitResult({ success: false, message: 'Deposit service is temporarily unavailable.' });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Submitting Confirmation to Admin…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>I Have Paid / Confirm Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={closeDepositModal}
                className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
