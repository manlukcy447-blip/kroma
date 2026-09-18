import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  ArrowDownToLine, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Send, 
  Search, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronRight 
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const {
    assets,
    balances,
    transactions,
    hideBalances,
    setHideBalances,
    openDepositModal,
    openWithdrawModal,
    openTransferModal,
    openSendReceiveModal,
    setSelectedPair,
    setCurrentTab,
    formatFiat,
    t,
  } = useCrypto();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'spot' | 'funding' | 'earn' | 'history'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSmall, setHideSmall] = useState(false);

  // Aggregated totals
  let totalSpotUsd = 0;
  let totalFundingUsd = 0;
  let totalEarnUsd = 0;

  const balanceEntries = Object.entries(balances) as [string, { spot: number; funding: number; earn: number; locked?: number }][];

  balanceEntries.forEach(([sym, bal]) => {
    const asset = assets.find(a => a.symbol === sym);
    let p = asset?.priceUsd; if (!p || p === 0) { const fallbacks = { USDT: 1, USDC: 1, BTC: 65000, ETH: 3500, KROMA: 2.5 }; p = fallbacks[sym.toUpperCase()] || 1; }
    totalSpotUsd += (bal.spot + (bal.locked || 0)) * p;
    totalFundingUsd += bal.funding * p;
    totalEarnUsd += bal.earn * p;
  });

  const grandTotalUsd = totalSpotUsd + totalFundingUsd + totalEarnUsd;

  const filteredBalances = balanceEntries.filter(([sym, bal]) => {
    const asset = assets.find(a => a.symbol === sym);
    const p = asset?.priceUsd || 1;
    const totalCoin = bal.spot + bal.funding + bal.earn + (bal.locked || 0);
    const totalUsd = totalCoin * p;

    if (hideSmall && totalUsd < 1) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return sym.toLowerCase().includes(q) || (asset?.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Wallet Header Overview Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F1420] via-[#121A2B] to-[#0A0D14] border border-slate-700/80 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('totalBalance')}
              </span>
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {hideBalances ? '••••••••' : formatFiat(grandTotalUsd)}
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => openDepositModal('USDT')}
              className="px-4 py-2 rounded-xl font-bold text-xs text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{t('deposit')}</span>
            </button>

            <button
              onClick={() => openWithdrawModal('USDT')}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>{t('withdraw')}</span>
            </button>

            <button
              onClick={() => openTransferModal('USDT')}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <span>{t('transfer')}</span>
            </button>

            <button
              onClick={() => openSendReceiveModal('send')}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Pay & Send</span>
            </button>
          </div>
        </div>

        {/* Breakdown into Spot, Funding, Earn cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400">{t('spotBalance')}</span>
            <div className="text-xl font-bold text-white font-mono">
              {hideBalances ? '••••' : formatFiat(totalSpotUsd)}
            </div>
            <div className="text-[11px] text-slate-500">Active spot exchange trading</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400">{t('fundingBalance')}</span>
            <div className="text-xl font-bold text-white font-mono">
              {hideBalances ? '••••' : formatFiat(totalFundingUsd)}
            </div>
            <div className="text-[11px] text-slate-500">P2P Escrow & Fiat settlement</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400">{t('earnBalance')}</span>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {hideBalances ? '••••' : formatFiat(totalEarnUsd)}
            </div>
            <div className="text-[11px] text-slate-500">Staking & yield generating vaults</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Overview, Spot, Funding, Earn, History) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          {[
            { id: 'overview', label: 'All Assets' },
            { id: 'spot', label: 'Spot Account' },
            { id: 'funding', label: 'Funding Account' },
            { id: 'earn', label: 'Earn Vault' },
            { id: 'history', label: 'Transaction Records' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab !== 'history' && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideSmall}
                onChange={e => setHideSmall(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Hide small (&lt;$1)</span>
            </label>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search coin..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Assets Table or Transaction History */}
      <div className="rounded-2xl bg-[#0E131D] border border-slate-800 p-4 sm:p-6 shadow-xl">
        {activeSubTab !== 'history' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800 font-sans">
                <tr>
                  <th className="pb-3">Coin</th>
                  <th className="pb-3 text-right">Total Balance</th>
                  <th className="pb-3 text-right">Spot (Available)</th>
                  <th className="pb-3 text-right hidden sm:table-cell">In-Order / Locked</th>
                  <th className="pb-3 text-right hidden sm:table-cell">Funding</th>
                  <th className="pb-3 text-right hidden md:table-cell">Earn</th>
                  <th className="pb-3 text-right">USD Value</th>
                  <th className="pb-3 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredBalances.map(([symbol, bal]) => {
                  const asset = assets.find(a => a.symbol === symbol);
                  const price = asset?.priceUsd || 1;
                  const totalAmount = bal.spot + bal.funding + bal.earn + (bal.locked || 0);
                  const usdValue = totalAmount * price;

                  return (
                    <tr key={symbol} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-sans">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[11px] shadow shrink-0"
                            style={{ backgroundColor: asset?.iconBg || '#2775CA' }}
                          >
                            {symbol.slice(0, 3)}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm">{symbol}</span>
                            <span className="text-[11px] text-slate-400 block">{asset?.name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-right font-bold text-white">
                        {hideBalances ? '••••' : totalAmount.toFixed(asset && asset.decimalPlaces > 2 ? 4 : 2)}
                      </td>

                      <td className="py-3 text-right text-slate-200">
                        {hideBalances ? '••••' : bal.spot.toFixed(asset && asset.decimalPlaces > 2 ? 4 : 2)}
                      </td>

                      <td className="py-3 text-right text-slate-400 hidden sm:table-cell">
                        {hideBalances ? '••••' : (bal.locked || 0).toFixed(asset && asset.decimalPlaces > 2 ? 4 : 2)}
                      </td>

                      <td className="py-3 text-right text-slate-300 hidden sm:table-cell">
                        {hideBalances ? '••••' : bal.funding.toFixed(asset && asset.decimalPlaces > 2 ? 4 : 2)}
                      </td>

                      <td className="py-3 text-right text-cyan-400 hidden md:table-cell">
                        {hideBalances ? '••••' : bal.earn.toFixed(asset && asset.decimalPlaces > 2 ? 4 : 2)}
                      </td>

                      <td className="py-3 text-right font-bold text-slate-200">
                        {hideBalances ? '••••' : formatFiat(usdValue)}
                      </td>

                      <td className="py-3 text-right font-sans">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => openDepositModal(symbol)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 transition-colors"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => openWithdrawModal(symbol)}
                            className="text-xs text-slate-300 hover:text-white font-semibold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                          >
                            Withdraw
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPair(`${symbol}/USDT`);
                              setCurrentTab('trade');
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/60 transition-colors"
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Transaction Records Table */
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 font-sans pb-2 border-b border-slate-800">
              <span className="font-semibold">Recent Multi-Chain & Internal Activity</span>
              <span className="text-[11px] text-cyan-400">Total Records: {transactions.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800 font-sans">
                  <tr>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Asset</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Fee</th>
                    <th className="pb-3">Details / Network</th>
                    <th className="pb-3 text-right">Status</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/30">
                      <td className="py-3 uppercase font-bold text-slate-300">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                          tx.type === 'deposit' ? 'bg-emerald-950 text-emerald-300' :
                          tx.type === 'withdraw' ? 'bg-rose-950 text-rose-300' :
                          tx.type === 'swap' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-white font-sans">{tx.asset}</td>
                      <td className="py-3 text-right font-bold text-slate-200">{tx.amount}</td>
                      <td className="py-3 text-right text-slate-400">{tx.fee} {tx.feeAsset}</td>
                      <td className="py-3 text-slate-400 max-w-xs truncate text-[11px]">
                        {tx.details || tx.network || 'Internal'}
                      </td>
                      <td className="py-3 text-right font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'completed' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' :
                          tx.status === 'pending_security' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {tx.status === 'pending_security' ? 'Security Review' : tx.type === 'deposit' && tx.status === 'pending' ? 'Pending Verification' : tx.status}
                        </span>
                        {tx.type === 'deposit' && tx.status === 'pending' && (
                          <div className="mt-1 text-[10px] text-amber-300/80 max-w-[220px] ml-auto leading-tight">
                            Blockchain transactions can sometimes take longer than expected while network confirmations are being completed and the transaction is reviewed.
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right text-slate-500 text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
