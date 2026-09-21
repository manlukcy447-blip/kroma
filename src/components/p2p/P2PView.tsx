import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { P2POffer } from '../../types/crypto';
import { P2P_OFFERS } from '../../data/mockData';
import { ShieldCheck, CheckCircle, Search, Filter, AlertCircle, X } from 'lucide-react';

export const P2PView: React.FC = () => {
  const {
    fiatCurrency,
    setFiatCurrency,
    balances,
    t,
    regionalRestrictions,
    triggerRegionRestricted,
    checkP2PAvailable,
  } = useCrypto();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedCoin, setSelectedCoin] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [activeTradeModal, setActiveTradeModal] = useState<P2POffer | null>(null);
  const [fiatInput, setFiatInput] = useState<string>('500');
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);

  const isGlobalRegionRestricted = Boolean(regionalRestrictions['p2p']);

  const handleOpenTrade = async (merchant: P2POffer) => {
    if (isGlobalRegionRestricted) {
      triggerRegionRestricted('P2P Express Trading');
      return;
    }
    const allowed = await checkP2PAvailable();
    if (!allowed) return;
    setActiveTradeModal(merchant);
  };

  const paymentMethods = ['All', 'Bank Transfer', 'Revolut', 'Wise', 'SEPA Instant', 'Zelle'];

  const filteredMerchants = P2P_OFFERS.filter(m => {
    if (m.type !== tradeType) return false;
    if (m.crypto !== selectedCoin) return false;
    if (selectedPayment !== 'All' && !m.paymentMethods.includes(selectedPayment)) return false;
    return true;
  });

  const handleStartTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTradeModal) return;

    if (isGlobalRegionRestricted) {
      triggerRegionRestricted('P2P Express Trading');
      return;
    }

    const val = parseFloat(fiatInput);
    if (!val || val < activeTradeModal.minLimit || val > activeTradeModal.maxLimit) {
      setTradeStatus(`Order must be between $${activeTradeModal.minLimit} and $${activeTradeModal.maxLimit}`);
      return;
    }

    if (tradeType === 'sell') {
      const cryptoNeeded = val / activeTradeModal.price;
      const userSpotBal = balances[activeTradeModal.crypto]?.spot || 0;
      if (cryptoNeeded > userSpotBal) {
        setTradeStatus(`Insufficient ${activeTradeModal.crypto} balance in Spot Wallet. (Available: ${userSpotBal})`);
        return;
      }
    }

    const orderId = Math.floor(100000 + Math.random() * 900000);
    setTradeStatus(`Escrow order #${orderId} initiated successfully. Merchant payment window opened with 15-minute escrow lock.`);
    setTimeout(() => {
      setActiveTradeModal(null);
      setTradeStatus(null);
    }, 2800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Global Regional Restriction Notice Banner if restricted */}
      {isGlobalRegionRestricted && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Notice: P2P Trading participation is restricted in your geographic jurisdiction by exchange administration.
            </span>
          </div>
          <button
            onClick={() => triggerRegionRestricted('P2P Express Trading')}
            className="px-3 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-bold shrink-0"
          >
            View Policy
          </button>
        </div>
      )}
      {/* 1. Header Banner with Escrow Trust Guarantee */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1420] to-[#141C2E] border border-slate-700/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>KROMA 100% ESCROW PROTECTED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            P2P Crypto Marketplace
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Buy and sell crypto directly with verified global merchants using your preferred local bank, e-wallet, or cash payment. Zero platform fees.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tradeType === 'buy' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Buy {selectedCoin}
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tradeType === 'sell' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sell {selectedCoin}
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E131D] border border-slate-800">
        {/* Coin selector */}
        <div className="flex items-center space-x-2">
          {(['USDT', 'BTC', 'ETH'] as const).map(coin => (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCoin === coin
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {coin}
            </button>
          ))}
        </div>

        {/* Payment filter (Wrapping on mobile, no horizontal drag) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] uppercase mr-1">Payment:</span>
          {paymentMethods.map(pm => (
            <button
              key={pm}
              onClick={() => setSelectedPayment(pm)}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPayment === pm
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Merchants Table or Mobile Cards */}
      <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4 sm:p-6 shadow-xl overflow-hidden">
        {/* Mobile View: Merchant Cards with zero horizontal drag */}
        <div className="md:hidden divide-y divide-slate-800/60">
          {filteredMerchants.map(merchant => (
            <div key={merchant.id} className="py-4 space-y-3">
              {/* Header: Merchant info & Unit Price */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center border border-slate-700 shrink-0">
                    {merchant.merchantName.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 font-bold text-white text-sm">
                      <span className="truncate">{merchant.merchantName}</span>
                      {merchant.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {merchant.ordersCompleted} orders • {merchant.completionRate}%
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-white font-mono">
                    ${merchant.price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400">Best rate</div>
                </div>
              </div>

              {/* Limits and Response Time */}
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div>
                  <span className="text-slate-500 font-sans text-[11px] block">Limits</span>
                  <span>${merchant.minLimit.toLocaleString()} - ${merchant.maxLimit.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-sans text-[11px] block">Response</span>
                  <span className="text-slate-400">{merchant.responseTime}</span>
                </div>
              </div>

              {/* Payment methods badges */}
              <div className="flex flex-wrap gap-1.5">
                {merchant.paymentMethods.map(pm => (
                  <span
                    key={pm}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300"
                  >
                    {pm}
                  </span>
                ))}
              </div>

              {/* Action Button: Full width on mobile */}
              <button
                onClick={() => handleOpenTrade(merchant)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow active:scale-95 cursor-pointer ${
                  isGlobalRegionRestricted
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700'
                    : tradeType === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {isGlobalRegionRestricted
                  ? 'Not Available in Region'
                  : tradeType === 'buy'
                  ? `Buy ${selectedCoin}`
                  : `Sell ${selectedCoin}`}
              </button>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="pb-3">Merchant</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Available / Limits</th>
                <th className="pb-3">Payment Options</th>
                <th className="pb-3 text-right">Trade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredMerchants.map(merchant => (
                <tr key={merchant.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Merchant column */}
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center border border-slate-700">
                        {merchant.merchantName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5 font-bold text-white text-sm">
                          <span>{merchant.merchantName}</span>
                          {merchant.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {merchant.ordersCompleted} orders • {merchant.completionRate}% completion
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-4 text-right font-mono">
                    <div className="text-base font-bold text-white">
                      ${merchant.price.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-400">Best market rate</div>
                  </td>

                  {/* Limits */}
                  <td className="py-4 text-right font-mono">
                    <div className="text-slate-300">
                      Limit: <strong>${merchant.minLimit.toLocaleString()} - ${merchant.maxLimit.toLocaleString()}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Response: {merchant.responseTime}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {merchant.paymentMethods.map(pm => (
                        <span
                          key={pm}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300"
                        >
                          {pm}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Trade Action */}
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleOpenTrade(merchant)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow active:scale-95 cursor-pointer ${
                        isGlobalRegionRestricted
                          ? 'bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700'
                          : tradeType === 'buy'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-rose-500 hover:bg-rose-400 text-white'
                      }`}
                    >
                      {isGlobalRegionRestricted
                        ? 'Restricted Region'
                        : tradeType === 'buy'
                        ? `Buy ${selectedCoin}`
                        : `Sell ${selectedCoin}`}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Modal / Drawer */}
      {activeTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {activeTradeModal.crypto} with {activeTradeModal.merchantName}
                </h3>
                <p className="text-[11px] text-emerald-400">Escrow Protected • 0 Fees</p>
              </div>
              <button
                onClick={() => setActiveTradeModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartTrade} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  {tradeType === 'buy' ? 'I want to pay (USD)' : 'I want to sell (USDT)'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={fiatInput}
                  onChange={e => setFiatInput(e.target.value)}
                  min={activeTradeModal.minLimit}
                  max={activeTradeModal.maxLimit}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Unit Price:</span>
                  <span className="text-white">${activeTradeModal.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Receive Approx:</span>
                  <span className="text-cyan-400 font-bold">
                    {(parseFloat(fiatInput) / activeTradeModal.price || 0).toFixed(4)} {activeTradeModal.crypto}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Window:</span>
                  <span className="text-slate-200">15 minutes</span>
                </div>
              </div>

              {tradeStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-[11px]">
                  {tradeStatus}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md active:scale-98 cursor-pointer"
              >
                Initiate Escrow Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
