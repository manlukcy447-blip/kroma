import React, { useState, useEffect } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { apiUrl } from '../../admin/api';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  FileCheck, 
  ShieldCheck, 
  ArrowDownToLine, 
  ArrowUpRight, 
  RefreshCw,
  Info,
  Hash,
  MessageSquare
} from 'lucide-react';

interface DepositRecord {
  id: string;
  asset: string;
  network: string;
  amount: number | null;
  txHash: string | null;
  status: string;
  confirmations: number;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawalRecord {
  id: string;
  asset: string;
  network: string;
  address: string;
  amount: number;
  fee: number;
  status: string;
  txHash: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TransactionConfirmationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionConfirmationHubModal: React.FC<TransactionConfirmationHubModalProps> = ({
  isOpen,
  onClose
}) => {
  const { assets, refreshWallet } = useCrypto();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits');
  
  // Records state
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // New Deposit Confirmation Form state
  const [assetSymbol, setAssetSymbol] = useState('USDT');
  const [networkName, setNetworkName] = useState('Ethereum (ERC20)');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Withdrawal inquiry modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);
  const [inquiryFeedback, setInquiryFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/wallet/confirmation-hub/transactions'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error('Failed to fetch confirmation hub records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
      setSubmitFeedback(null);
      setInquiryFeedback(null);
    }
  }, [isOpen]);

  const currentAsset = assets.find(a => a.symbol === assetSymbol) || assets[0];
  const networks = currentAsset?.networks || [];

  useEffect(() => {
    if (networks.length > 0 && !networks.some(n => n.name === networkName)) {
      setNetworkName(networks[0].name);
    }
  }, [assetSymbol]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch(apiUrl('/api/wallet/confirmation-hub/deposit-confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          asset: assetSymbol,
          network: networkName,
          amount: amount ? parseFloat(amount) : null,
          txHash: txHash.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitFeedback({
          success: true,
          message: data.message || 'Deposit confirmation dispatched to the administration desk.'
        });
        setAmount('');
        setTxHash('');
        setNotes('');
        await fetchRecords();
        await refreshWallet();
      } else {
        setSubmitFeedback({
          success: false,
          message: data.error || 'Failed to submit deposit confirmation.'
        });
      }
    } catch (err: any) {
      setSubmitFeedback({
        success: false,
        message: err?.message || 'Network error submitting confirmation.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    setIsInquirySubmitting(true);
    setInquiryFeedback(null);

    try {
      const res = await fetch(apiUrl('/api/wallet/confirmation-hub/withdrawal-inquiry'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          txHash: selectedWithdrawal.txHash || undefined,
          notes: inquiryNotes.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInquiryFeedback({
          success: true,
          message: data.message || 'Withdrawal confirmation notice sent to admin desk.'
        });
        setInquiryNotes('');
        setTimeout(() => {
          setSelectedWithdrawal(null);
          setInquiryFeedback(null);
        }, 1800);
      } else {
        setInquiryFeedback({
          success: false,
          message: data.error || 'Failed to send inquiry.'
        });
      }
    } catch (err: any) {
      setInquiryFeedback({
        success: false,
        message: err?.message || 'Network error sending notice.'
      });
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved & Credited
          </span>
        );
      case 'awaiting_approval':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-pulse" /> Awaiting Admin Approval
          </span>
        );
      case 'pending':
      case 'pending_security':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'rejected':
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl my-auto rounded-3xl bg-[#0B0F17] border border-slate-700/80 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-[#101725] via-[#0D131F] to-[#0A0D15] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">User Transaction Confirmation Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Compliance Desk
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct user confirmation & on-chain verification ledger</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
              title="Refresh ledger records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-800/30 text-xs text-cyan-300/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Admin Notification Active: Every confirmation submitted here triggers an immediate high-priority alert to the administrative desk.</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 flex border-b border-slate-800/90 gap-2 shrink-0 bg-[#0C111C]">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'deposits'
                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Receiving / Deposit Confirmations ({deposits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdrawal Verification & Records ({withdrawals.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

          {/* TAB 1: DEPOSITS / RECEIVE CONFIRMATIONS */}
          {activeTab === 'deposits' && (
            <div className="space-y-6">
              
              {/* Submission Form Card */}
              <div className="p-5 rounded-2xl bg-[#0F1522] border border-slate-700/80 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-cyan-400" />
                      Submit New Deposit Payment Confirmation
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Notify administration that you have transferred funds to an official receiving address.
                    </p>
                  </div>
                </div>

                {submitFeedback && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    submitFeedback.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    {submitFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{submitFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitDeposit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Asset Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Asset Transferred</label>
                      <select
                        value={assetSymbol}
                        onChange={(e) => setAssetSymbol(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {['USDT', 'BTC', 'ETH', 'SOL', 'USDC', 'SUI', 'AVAX', 'NEAR'].map(sym => (
                          <option key={sym} value={sym}>{sym}</option>
                        ))}
                      </select>
                    </div>

                    {/* Network Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Transfer Network</label>
                      <select
                        value={networkName}
                        onChange={(e) => setNetworkName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {networks.map(n => (
                          <option key={n.id} value={n.name}>{n.name} ({n.shortName})</option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Amount Sent ({assetSymbol})
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 500.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    {/* TxHash Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Blockchain TxID / Hash (Optional but Recommended)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0x8f2d4e7a..."
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Additional Memo / Notes to Administrator
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sent from personal cold storage; please credit to Spot account."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching to Admin...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Submit Deposit Confirmation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Deposit History Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Receiving / Deposit History
                  </h4>
                  <span className="text-[11px] text-slate-500">{deposits.length} recorded submissions</span>
                </div>

                {deposits.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#0F1420] border border-slate-800 text-center space-y-2">
                    <ArrowDownToLine className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-400">No deposit confirmations recorded yet.</p>
                    <p className="text-[11px] text-slate-500">
                      When you send funds to a receiving address, submit your confirmation above to notify administration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {deposits.map((dep) => (
                      <div 
                        key={dep.id} 
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                              {dep.asset}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {dep.amount != null ? `${dep.amount} ${dep.asset}` : 'Intended / Unspecified Amount'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              via {dep.network}
                            </span>
                          </div>
                          <div>
                            {getStatusBadge(dep.status)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2 pt-1 border-t border-slate-800/60">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-slate-500">TxID:</span>
                            {dep.txHash ? (
                              <span className="font-mono text-cyan-400 flex items-center space-x-1 truncate max-w-xs">
                                <span className="truncate">{dep.txHash}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(dep.txHash!, dep.id)}
                                  className="text-slate-400 hover:text-white p-0.5"
                                  title="Copy hash"
                                >
                                  {copiedHash === dep.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">None provided (Manual audit)</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 shrink-0">
                            <span>Confs: <strong className="text-slate-300">{dep.confirmations || 0}</strong></span>
                            <span>{new Date(dep.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WITHDRAWAL CONFIRMATIONS & RECORDS */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Withdrawal Records & Disbursements
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Track security review, disbursement hashes, or forward supplementary confirmation to the desk.
                  </p>
                </div>
                <span className="text-[11px] text-slate-500">{withdrawals.length} withdrawals</span>
              </div>

              {withdrawals.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F1420] border border-slate-800 text-center space-y-2">
                  <ArrowUpRight className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-400">No withdrawal records found.</p>
                  <p className="text-[11px] text-slate-500">
                    All outbound transfer requests and security clearance milestones will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div 
                      key={w.id} 
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            {w.asset}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {w.amount} {w.asset}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Fee: {w.fee || 0} {w.asset}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusBadge(w.status)}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setInquiryNotes('');
                              setInquiryFeedback(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 text-cyan-400" />
                            <span>Notify Admin</span>
                          </button>
                        </div>
                      </div>

                      {/* Destination Address & Network */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Destination ({w.network}):</span>
                          <span className="text-slate-500">{new Date(w.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="font-mono text-slate-300 truncate flex items-center justify-between">
                          <span className="truncate">{w.address}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(w.address, `addr-${w.id}`)}
                            className="text-slate-500 hover:text-white ml-2 p-0.5 shrink-0"
                            title="Copy destination address"
                          >
                            {copiedHash === `addr-${w.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Hash & Failure Reason if any */}
                      {w.txHash && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                          <span className="text-slate-500">Broadcast Hash:</span>
                          <span className="font-mono text-cyan-400 flex items-center space-x-1 truncate max-w-sm">
                            <span className="truncate">{w.txHash}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(w.txHash!, `tx-${w.id}`)}
                              className="text-slate-500 hover:text-white p-0.5"
                            >
                              {copiedHash === `tx-${w.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </span>
                        </div>
                      )}

                      {w.failureReason && (
                        <div className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                          Notice: {w.failureReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inquiry / Confirmation Dialog for Selected Withdrawal */}
              {selectedWithdrawal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-[#0E1422] border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        Send Withdrawal Confirmation / Notice
                      </h4>
                      <button
                        onClick={() => setSelectedWithdrawal(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div>Withdrawal: <strong className="text-white">{selectedWithdrawal.amount} {selectedWithdrawal.asset}</strong></div>
                      <div>Network: <span className="text-slate-400">{selectedWithdrawal.network}</span></div>
                      <div>Status: <span className="text-cyan-400 capitalize">{selectedWithdrawal.status}</span></div>
                    </div>

                    {inquiryFeedback && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        inquiryFeedback.success ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/50 text-rose-300 border border-rose-500/40'
                      }`}>
                        {inquiryFeedback.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{inquiryFeedback.message}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitInquiry} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Message / Supplementary Verification Details for Admin
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={inquiryNotes}
                          onChange={(e) => setInquiryNotes(e.target.value)}
                          placeholder="e.g. Please confirm disbursement status or verify destination wallet..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedWithdrawal(null)}
                          className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-850"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isInquirySubmitting || !inquiryNotes.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all flex items-center space-x-1.5"
                        >
                          {isInquirySubmitting ? (
                            <span>Sending...</span>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch to Admin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/90 bg-[#0A0E17] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            256-bit Ledger Audit Verification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
          >
            Close Hub
          </button>
        </div>

      </div>
    </div>
  );
};
