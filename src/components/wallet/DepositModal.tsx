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
  QrCode,
  Info,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { apiUrl } from '../../admin/api';
import { LiveQRCode } from '../common/LiveQRCode';

export const DepositModal: React.FC = () => {
  const {
    depositModalOpen,
    closeDepositModal,
    notifyIntendedDeposit,
    activeModalAsset,
    assets
  } = useCrypto();

  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [copied, setCopied] = useState(false);
  const [adminNotified, setAdminNotified] = useState(false);
  const [serverAddress, setServerAddress] = useState<any>(null);
  const [addressLoading, setAddressLoading] = useState(false);

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

  const handleCopy = async () => {
    if (!displayAddress) return;
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setAdminNotified(true);
    setTimeout(() => setCopied(false), 2500);

    // Notify backend & administration desk of intended deposit with timestamp
    try {
      await notifyIntendedDeposit(selectedSymbol, displayNetwork, displayAddress);
    } catch (e) {
      console.warn('Notice to admin dispatch failed:', e);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeDepositModal();
    }
  };

  return (
    <div 
      id="receive-modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        id="receive-modal-card"
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
                <h3 className="text-base font-bold text-white tracking-tight">Receive Crypto</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secure Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">Multi-chain institutional custody & receiving address</p>
            </div>
          </div>
          <button
            id="receive-modal-close-btn"
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
              <label className="text-xs font-semibold text-slate-300">1. Select Asset to Receive</label>
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
                      setAdminNotified(false);
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
            <label className="text-xs font-semibold text-slate-300">2. Select Receiving Network</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {networks.map(net => {
                const isSelected = (selectedNetworkId === net.id) || (!selectedNetworkId && currentNetwork.id === net.id);
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => {
                      setSelectedNetworkId(net.id);
                      setAdminNotified(false);
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

          {/* Institutional Receiving Address & Real Live QR Code */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#111723] to-[#0D121B] border border-slate-700/80 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Official Receiving Address &amp; Live QR
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                Network: {displayNetwork}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              {/* Real Live Dynamic QR Code */}
              <div className="p-2 bg-white rounded-xl shadow-lg shrink-0 flex items-center justify-center">
                <LiveQRCode 
                  value={displayAddress || `${selectedSymbol}:${displayNetwork}`} 
                  size={120} 
                  alt={`${selectedSymbol} receiving address live QR code`}
                />
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
                    id="btn-copy-receive-address"
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white shrink-0 transition-colors cursor-pointer active:scale-95 border border-slate-700 shadow"
                    title="Copy receiving address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Minimum Receive: <strong className="text-white font-mono">{minDepositLimit} {currentAsset.symbol}</strong>
                  </span>
                  {copied && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> Address copied!
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

            {/* Live Intended Deposit Notice Status */}
            {adminNotified && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Admin Notified:</strong> Your intended deposit for {currentAsset.symbol} on {displayNetwork} and timestamp have been automatically recorded with compliance administration.
                </span>
              </div>
            )}

            {/* Crucial Network Safety Advisory */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 text-[11px] text-amber-200/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Send only <strong>{currentAsset.name} ({currentAsset.symbol})</strong> via the <strong>{displayNetwork}</strong> network. Transfers using any other token or network cannot be recovered.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/90 bg-[#0A0E17] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Average block arrival: {currentNetwork.estimatedTime}
          </span>
          <button
            type="button"
            onClick={closeDepositModal}
            className="px-5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
