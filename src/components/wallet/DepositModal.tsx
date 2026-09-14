import React, { useEffect, useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, Copy, Check, AlertTriangle, ArrowDownToLine } from 'lucide-react';
import { apiUrl } from '../../admin/api';

export const DepositModal: React.FC = () => {
  const {
    depositModalOpen,
    closeDepositModal,
    activeModalAsset,
    assets,
  } = useCrypto();

  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [copied, setCopied] = useState(false);
  const [serverAddress, setServerAddress] = useState<any>(null);
  const [addressLoading, setAddressLoading] = useState(false);

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
    fetch(apiUrl(`/api/deposit-addresses/active?asset=${encodeURIComponent(selectedSymbol)}`), { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('No server address')))
      .then(data => {
        const list = data.addresses || [];
        const match = list.find((a:any) => a.network === currentNetwork?.name || a.network === currentNetwork?.shortName || a.network === currentNetwork?.id);
        setServerAddress(match || list[0] || null);
      })
      .catch(() => setServerAddress(null))
      .finally(() => setAddressLoading(false));
    return () => controller.abort();
  }, [depositModalOpen, selectedSymbol, selectedNetworkId, currentNetwork?.id, currentNetwork?.name, currentNetwork?.shortName]);

  if (!depositModalOpen) return null;

  const displayAddress = serverAddress?.address || '';
  const displayNetwork = serverAddress?.network || currentNetwork.shortName;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Deposit Crypto</h3>
              <p className="text-xs text-slate-400">Receive digital assets on multi-chain address</p>
            </div>
          </div>
          <button
            onClick={closeDepositModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* 1. Coin selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Asset</label>
            <div className="grid grid-cols-4 gap-2">
              {['USDT', 'BTC', 'ETH', 'SOL', 'USDC', 'SUI', 'AVAX', 'NEAR'].map(sym => (
                <button
                  key={sym}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    const newAsset = assets.find(a => a.symbol === sym);
                    if (newAsset?.networks.length) setSelectedNetworkId(newAsset.networks[0].id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                    selectedSymbol === sym
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <span>{sym}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Network selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Deposit Network</label>
            <div className="space-y-1.5">
              {networks.map(net => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetworkId(net.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    (selectedNetworkId === net.id || (!selectedNetworkId && currentNetwork.id === net.id))
                      ? 'bg-slate-800/90 border-cyan-500/80 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-100">{net.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Est. Arrival: <span className="text-cyan-400">{net.estimatedTime}</span> • Confirmations: {net.minConfirmations}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    {net.shortName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Address & QR Code */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* SVG QR Code Simulation */}
              <div className="p-2.5 bg-white rounded-xl shadow-md flex items-center justify-center shrink-0">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="30" height="30" fill="black" />
                  <rect x="9" y="9" width="22" height="22" fill="white" />
                  <rect x="13" y="13" width="14" height="14" fill="black" />

                  <rect x="65" y="5" width="30" height="30" fill="black" />
                  <rect x="69" y="9" width="22" height="22" fill="white" />
                  <rect x="73" y="13" width="14" height="14" fill="black" />

                  <rect x="5" y="65" width="30" height="30" fill="black" />
                  <rect x="9" y="69" width="22" height="22" fill="white" />
                  <rect x="13" y="73" width="14" height="14" fill="black" />

                  {/* Randomized matrix dots */}
                  <rect x="42" y="10" width="8" height="8" fill="black" />
                  <rect x="52" y="20" width="6" height="6" fill="black" />
                  <rect x="40" y="40" width="20" height="20" fill="black" />
                  <rect x="45" y="45" width="10" height="10" fill="white" />
                  <rect x="15" y="45" width="8" height="8" fill="black" />
                  <rect x="75" y="45" width="12" height="6" fill="black" />
                  <rect x="45" y="70" width="12" height="8" fill="black" />
                  <rect x="65" y="75" width="16" height="8" fill="black" />
                  <rect x="85" y="65" width="8" height="12" fill="black" />
                </svg>
              </div>

              <div className="flex-1 min-w-0 w-full space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  {currentAsset.symbol} Deposit Address ({displayNetwork})
                </span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                  <span>{addressLoading ? 'Loading secure deposit address…' : displayAddress || 'No active deposit address configured'}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white shrink-0 transition-colors"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <span className="text-[11px] text-emerald-400 font-medium">Address copied to clipboard!</span>}

                {currentNetwork.memoRequired && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs">
                    <span className="text-amber-300 font-bold">Memo / Tag Required:</span>{' '}
                    <span className="font-mono text-amber-200">894210</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Only send {currentAsset.name} ({currentAsset.symbol}) via {currentNetwork.name}.</span>
              </div>
              <p>Sending any other token or using an unsupported network will result in permanent loss.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
