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
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  X,
  Copy,
  Check
} from 'lucide-react';
import { TransactionRecord } from '../../types/crypto';
import { FeeClearanceBanner } from './FeeClearanceBanner';

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
    refreshWallet,
    confirmDepositPayment,
    openFeeClearanceModal,
    t,
  } = useCrypto();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'spot' | 'funding' | 'earn' | 'history'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSmall, setHideSmall] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Deposit confirmation modal state
  const [confirmingTx, setConfirmingTx] = useState<TransactionRecord | null>(null);
  const [confirmTxHash, setConfirmTxHash] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWallet();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingTx) return;
    setIsSubmittingConfirm(true);
    setConfirmMsg(null);
    try {
      const res = await confirmDepositPayment(confirmingTx.id, confirmTxHash.trim() || undefined);
      if (res.success) {
        setConfirmMsg({ type: 'success', text: res.message || 'Payment confirmed! Admin notified for review.' });
        setTimeout(() => {
          setConfirmingTx(null);
          setConfirmTxHash('');
          setConfirmMsg(null);
        }, 1800);
      } else {
        setConfirmMsg({ type: 'error', text: res.message || 'Unable to confirm payment.' });
      }
    } catch {
      setConfirmMsg({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe price dictionary fallback
  const fallbacks: Record<string, number> = {
    USDT: 1.0,
    USDC: 1.0,
    BTC: 65000.0,
    ETH: 3500.0,
    SOL: 180.0,
    KROMA: 2.5,
    SUI: 3.42,
    AVAX: 34.15,
    LINK: 18.92,
    NEAR: 6.84,
    XRP: 2.15,
    PEPE: 0.0000184,
  };

  const getPrice = (sym: string): number => {
    const symbol = (sym || '').toUpperCase();
    const asset = assets.find(a => a.symbol.toUpperCase() === symbol);
    if (asset && typeof asset.priceUsd === 'number' && asset.priceUsd > 0) {
      return asset.priceUsd;
    }
    return fallbacks[symbol] ?? 1.0;
  };

  // Aggregate totals across all accounts safely
  let totalSpotUsd = 0;
  let totalFundingUsd = 0;
  let totalEarnUsd = 0;

  // Build a complete list of symbols merging assets catalog and actual balance entries
  const allSymbols = Array.from(
    new Set([...assets.map(a => a.symbol.toUpperCase()), ...Object.keys(balances).map(s => s.toUpperCase())])
  );

  allSymbols.forEach(sym => {
    const bal = balances[sym] || { spot: 0, funding: 0, earn: 0, locked: 0 };
    const p = getPrice(sym);
    const spot = parseFloat(String(bal.spot ?? 0)) || 0;
    const funding = parseFloat(String(bal.funding ?? 0)) || 0;
    const earn = parseFloat(String(bal.earn ?? 0)) || 0;
    const locked = parseFloat(String(bal.locked ?? 0)) || 0;

    totalSpotUsd += (spot + locked) * p;
    totalFundingUsd += funding * p;
    totalEarnUsd += earn * p;
  });

  const grandTotalUsd = totalSpotUsd + totalFundingUsd + totalEarnUsd;

  // Filtered symbols for table
  const filteredSymbols = allSymbols.filter(sym => {
    const bal = balances[sym] || { spot: 0, funding: 0, earn: 0, locked: 0 };
    const asset = assets.find(a => a.symbol.toUpperCase() === sym);
    const p = getPrice(sym);

    const spot = parseFloat(String(bal.spot ?? 0)) || 0;
    const funding = parseFloat(String(bal.funding ?? 0)) || 0;
    const earn = parseFloat(String(bal.earn ?? 0)) || 0;
    const locked = parseFloat(String(bal.locked ?? 0)) || 0;

    let totalCoin = spot + funding + earn + locked;
    if (activeSubTab === 'spot') totalCoin = spot + locked;
    if (activeSubTab === 'funding') totalCoin = funding;
    if (activeSubTab === 'earn') totalCoin = earn;

    const totalUsd = totalCoin * p;

    if (hideSmall && totalUsd < 1) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return sym.toLowerCase().includes(q) || (asset?.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Pending deposits awaiting user confirmation or admin approval
  const pendingDeposits = transactions.filter(
    tx => tx.type === 'deposit' && (tx.status === 'pending' || tx.status === 'awaiting_approval')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Fee Clearance Balance Hold Banner */}
      <FeeClearanceBanner onOpenModal={openFeeClearanceModal} />

      {/* Pending Deposits Notice Banner */}
      {pendingDeposits.length > 0 && (
        <div className="rounded-2xl bg-cyan-950/40 border border-cyan-500/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{pendingDeposits.length} Pending Deposit{pendingDeposits.length > 1 ? 's' : ''} in Progress</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">Action Available</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Transferred funds? Click &quot;Confirm Payment&quot; in transaction records to notify administrators to credit your account immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('history')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shrink-0 shadow-sm"
          >
            Review Pending Deposits
          </button>
        </div>
      )}

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
                title={hideBalances ? 'Show balances' : 'Hide balances'}
              >
                {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-slate-400 hover:text-cyan-400 transition-colors p-1 rounded-lg hover:bg-slate-800/60"
                title="Refresh balances now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
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
          <button
            onClick={() => setActiveSubTab('spot')}
            className={`p-4 rounded-2xl text-left border transition-all ${
              activeSubTab === 'spot'
                ? 'bg-cyan-950/30 border-cyan-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t('spotBalance')}</span>
              {activeSubTab === 'spot' && <span className="text-[10px] text-cyan-400 font-bold uppercase">Selected</span>}
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {hideBalances ? '••••' : formatFiat(totalSpotUsd)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active spot exchange trading</div>
          </button>

          <button
            onClick={() => setActiveSubTab('funding')}
            className={`p-4 rounded-2xl text-left border transition-all ${
              activeSubTab === 'funding'
                ? 'bg-cyan-950/30 border-cyan-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t('fundingBalance')}</span>
              {activeSubTab === 'funding' && <span className="text-[10px] text-cyan-400 font-bold uppercase">Selected</span>}
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {hideBalances ? '••••' : formatFiat(totalFundingUsd)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">P2P Escrow & Fiat settlement</div>
          </button>

          <button
            onClick={() => setActiveSubTab('earn')}
            className={`p-4 rounded-2xl text-left border transition-all ${
              activeSubTab === 'earn'
                ? 'bg-cyan-950/30 border-cyan-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t('earnBalance')}</span>
              {activeSubTab === 'earn' && <span className="text-[10px] text-cyan-400 font-bold uppercase">Selected</span>}
            </div>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
              {hideBalances ? '••••' : formatFiat(totalEarnUsd)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Staking & yield generating vaults</div>
          </button>
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
            { id: 'history', label: `Transaction Records (${transactions.length})` },
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
                  <th className="pb-3 text-right">
                    {activeSubTab === 'spot' ? 'Spot Available' :
                     activeSubTab === 'funding' ? 'Funding Available' :
                     activeSubTab === 'earn' ? 'Earn Staked' : 'Total Balance'}
                  </th>
                  {activeSubTab === 'overview' && (
                    <>
                      <th className="pb-3 text-right">Spot (Avail)</th>
                      <th className="pb-3 text-right hidden sm:table-cell">In-Order</th>
                      <th className="pb-3 text-right hidden sm:table-cell">Funding</th>
                      <th className="pb-3 text-right hidden md:table-cell">Earn</th>
                    </>
                  )}
                  {activeSubTab === 'spot' && (
                    <th className="pb-3 text-right">In-Order (Locked)</th>
                  )}
                  <th className="pb-3 text-right">USD Value</th>
                  <th className="pb-3 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredSymbols.map(symbol => {
                  const bal = balances[symbol] || { spot: 0, funding: 0, earn: 0, locked: 0 };
                  const asset = assets.find(a => a.symbol.toUpperCase() === symbol);
                  const price = getPrice(symbol);

                  const spot = parseFloat(String(bal.spot ?? 0)) || 0;
                  const funding = parseFloat(String(bal.funding ?? 0)) || 0;
                  const earn = parseFloat(String(bal.earn ?? 0)) || 0;
                  const locked = parseFloat(String(bal.locked ?? 0)) || 0;

                  const totalCoin = spot + funding + earn + locked;
                  const targetCoin = 
                    activeSubTab === 'spot' ? spot :
                    activeSubTab === 'funding' ? funding :
                    activeSubTab === 'earn' ? earn : totalCoin;

                  const targetUsd = (
                    activeSubTab === 'spot' ? (spot + locked) :
                    activeSubTab === 'funding' ? funding :
                    activeSubTab === 'earn' ? earn : totalCoin
                  ) * price;

                  const decimals = asset?.decimalPlaces && asset.decimalPlaces > 2 ? 4 : 2;

                  return (
                    <tr key={symbol} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-sans">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[11px] shadow shrink-0"
                            style={{ backgroundColor: asset?.iconBg || '#2775CA' }}
                          >
                            {symbol.slice(0, 3)}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm">{symbol}</span>
                            <span className="text-[11px] text-slate-400 block">{asset?.name || symbol}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 text-right font-bold text-white">
                        {hideBalances ? '••••' : targetCoin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                      </td>

                      {activeSubTab === 'overview' && (
                        <>
                          <td className="py-3.5 text-right text-slate-200">
                            {hideBalances ? '••••' : spot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                          </td>
                          <td className="py-3.5 text-right text-slate-400 hidden sm:table-cell">
                            {hideBalances ? '••••' : locked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                          </td>
                          <td className="py-3.5 text-right text-slate-300 hidden sm:table-cell">
                            {hideBalances ? '••••' : funding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                          </td>
                          <td className="py-3.5 text-right text-cyan-400 hidden md:table-cell">
                            {hideBalances ? '••••' : earn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                          </td>
                        </>
                      )}

                      {activeSubTab === 'spot' && (
                        <td className="py-3.5 text-right text-slate-400">
                          {hideBalances ? '••••' : locked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                        </td>
                      )}

                      <td className="py-3.5 text-right font-bold text-slate-200">
                        {hideBalances ? '••••' : formatFiat(targetUsd)}
                      </td>

                      <td className="py-3.5 text-right font-sans">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => openDepositModal(symbol)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 transition-colors"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => openWithdrawModal(symbol)}
                            className="text-xs text-slate-300 hover:text-white font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                          >
                            Withdraw
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPair(`${symbol}/USDT`);
                              setCurrentTab('trade');
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 transition-colors"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-sans pb-2 border-b border-slate-800">
              <span className="font-semibold">Recent Multi-Chain & Internal Activity</span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-cyan-400">Total Records: {transactions.length}</span>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
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
                    <th className="pb-3 text-right">Status / Confirmation</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => {
                      const isPendingDeposit = tx.type === 'deposit' && (tx.status === 'pending' || tx.status === 'intent');
                      const isAwaitingApproval = tx.type === 'deposit' && tx.status === 'awaiting_approval';
                      const isCompleted = tx.status === 'completed';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 uppercase font-bold text-slate-300">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-sans font-bold ${
                              tx.type === 'deposit' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                              tx.type === 'withdraw' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                              tx.type === 'admin_credit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' :
                              tx.type === 'swap' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' : 
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {tx.type === 'admin_credit' ? 'Admin Credit' : tx.type}
                            </span>
                          </td>

                          <td className="py-3.5 font-bold text-white font-sans">{tx.asset}</td>

                          <td className="py-3.5 text-right font-bold text-slate-200">
                            {(parseFloat(String(tx.amount ?? 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </td>

                          <td className="py-3.5 text-right text-slate-400">
                            {parseFloat(String(tx.fee ?? 0)) > 0 ? `${tx.fee} ${tx.feeAsset || tx.asset}` : 'Free'}
                          </td>

                          <td className="py-3.5 text-slate-400 max-w-xs text-[11px]">
                            <div className="truncate font-sans font-medium text-slate-300">
                              {tx.network || tx.details || 'Blockchain Network'}
                            </div>
                            {tx.txHash && (
                              <div className="flex items-center gap-1 text-[10px] text-cyan-400/80 font-mono mt-0.5 truncate">
                                <span>Tx: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}</span>
                                <button
                                  onClick={() => copyToClipboard(tx.txHash || '', tx.id)}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy Tx Hash"
                                >
                                  {copiedId === tx.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 text-right font-sans">
                            {isCompleted && (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            )}

                            {isAwaitingApproval && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 inline-flex items-center gap-1.5 shadow-sm">
                                  <Clock className="w-3 h-3 animate-spin text-cyan-400" /> Awaiting Admin Approval
                                </span>
                                <span className="text-[10px] text-cyan-400/70">Payment Confirmed by User</span>
                              </div>
                            )}

                            {isPendingDeposit && (
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending Confirmation
                                </span>
                                <button
                                  onClick={() => {
                                    setConfirmingTx(tx);
                                    setConfirmTxHash(tx.txHash || '');
                                    setConfirmMsg(null);
                                  }}
                                  className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow transition-all active:scale-95 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm Payment</span>
                                </button>
                              </div>
                            )}

                            {!isCompleted && !isAwaitingApproval && !isPendingDeposit && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.status === 'pending_security' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50' :
                                tx.status === 'failed' || tx.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {tx.status === 'pending_security' ? 'Security Review' : tx.status === 'rejected' ? 'Admin Rejected' : tx.status}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 text-right text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Payment Confirmation Modal Dialog */}
      {confirmingTx && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmingTx(null);
              setConfirmMsg(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#111724] border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Confirm Deposit Payment</h3>
                  <p className="text-xs text-slate-400">Notify admin team to credit your wallet</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmingTx(null);
                  setConfirmMsg(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Asset:</span>
                <span className="font-bold text-white">{confirmingTx.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-cyan-400">
                  {(parseFloat(String(confirmingTx.amount ?? 0)) || 0)} {confirmingTx.asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="font-bold text-white">{confirmingTx.network || 'Standard Network'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Record ID:</span>
                <span className="font-mono text-slate-400 truncate max-w-[200px]">{confirmingTx.id}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Transaction ID / Hash (TxID) <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={confirmTxHash}
                  onChange={e => setConfirmTxHash(e.target.value)}
                  placeholder="e.g. 0x7f2a... or blockchain transaction hash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Providing your transaction hash helps the admin team verify your transfer faster.
                </p>
              </div>

              {confirmMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  confirmMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  {confirmMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{confirmMsg.text}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingTx(null);
                    setConfirmMsg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingConfirm ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
