import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  RefreshCw, 
  DollarSign, 
  Send, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Pencil
} from 'lucide-react';

interface AdminFeeClearanceControlProps {
  users: Array<{ id: string; email: string; status?: string }>;
  onRefreshParent?: () => void;
}

export const AdminFeeClearanceControl: React.FC<AdminFeeClearanceControlProps> = ({ users, onRefreshParent }) => {
  const [feeClearances, setFeeClearances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // Hold & Fee settings form
  const [holdActive, setHoldActive] = useState(true);
  const [feeAmount, setFeeAmount] = useState('500');
  const [feeAsset, setFeeAsset] = useState('USDT');
  const [feeNetwork, setFeeNetwork] = useState('TRC20');
  const [clearanceAddress, setClearanceAddress] = useState('');
  const [reason, setReason] = useState('Account Verification & Security Clearance Fee');
  const [instructions, setInstructions] = useState('Your balance has been placed on hold pending settlement of the account clearance fee. Please deposit the specified fee amount into the dedicated Fee Clearance Account to release your balance.');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadClearances = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any>('/api/admin/fee-clearances');
      setFeeClearances(data.feeClearances || []);
    } catch (e: any) {
      console.error('Failed to load fee clearances:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClearances();
  }, []);

  // When selected user changes, load their current fee clearance record
  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setMessage(null);
    if (!userId) return;

    try {
      const res = await apiFetch<any>(`/api/admin/users/${userId}/fee-clearance`);
      if (res.feeClearance) {
        const fc = res.feeClearance;
        setHoldActive(Boolean(fc.holdActive));
        setFeeAmount(String(fc.feeAmount ?? '500'));
        setFeeAsset(fc.feeAsset || 'USDT');
        setFeeNetwork(fc.feeNetwork || 'TRC20');
        setClearanceAddress(fc.clearanceAddress || '');
        if (fc.reason) setReason(fc.reason);
        if (fc.instructions) setInstructions(fc.instructions);
      }
    } catch (e: any) {
      console.warn('Unable to load user clearance profile:', e.message);
    }
  };

  const handleSaveFeeHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user first.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await apiFetch<any>(`/api/admin/users/${selectedUserId}/fee-clearance`, {
        method: 'POST',
        body: JSON.stringify({
          holdActive,
          feeAmount: feeAmount.trim(),
          feeAsset: feeAsset.trim().toUpperCase(),
          feeNetwork: feeNetwork.trim(),
          clearanceAddress: clearanceAddress.trim(),
          reason: reason.trim(),
          instructions: instructions.trim()
        })
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: holdActive
            ? `Balance HOLD activated for user! Fee set to ${feeAmount} ${feeAsset}.`
            : `Balance hold deactivated for user.`
        });
        await loadClearances();
        if (onRefreshParent) onRefreshParent();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update fee clearance.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Server error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Admin approves fee clearance deposit payment -> releases balance hold
  const handleApprove = async (userId: string) => {
    if (!confirm('Approve fee clearance payment and release balance hold for this user?')) return;
    try {
      const res = await apiFetch<any>(`/api/admin/users/${userId}/fee-clearance/approve`, { method: 'POST' });
      if (res.success) {
        alert(res.message || 'Fee cleared and balance hold released!');
        await loadClearances();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Admin rejects submitted payment
  const handleReject = async (userId: string) => {
    const r = prompt('Enter rejection reason for payment submission:', 'Transaction hash unconfirmed or invalid deposit amount');
    if (r === null) return;
    try {
      const res = await apiFetch<any>(`/api/admin/users/${userId}/fee-clearance/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: r })
      });
      if (res.success) {
        alert(res.message || 'Payment rejected. User set back to unpaid status.');
        await loadClearances();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Direct release hold without requiring payment
  const handleDirectRelease = async (userId: string) => {
    if (!confirm('Directly release balance hold for this user without fee deposit?')) return;
    try {
      const res = await apiFetch<any>(`/api/admin/users/${userId}/fee-clearance/release`, { method: 'POST' });
      if (res.success) {
        alert(res.message || 'User balance hold released.');
        await loadClearances();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Active holds count
  const activeHoldsCount = feeClearances.filter(f => f.holdActive).length;
  const pendingApprovalsCount = feeClearances.filter(f => f.holdActive && f.status === 'submitted').length;

  return (
    <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <span>Individual User Fee Clearance &amp; Balance Hold Control</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                  {pendingApprovalsCount} Awaiting Review
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Hold specific user balances until an administrative clearance fee is deposited into the designated fee account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Active Holds: <strong className="text-amber-400">{activeHoldsCount}</strong>
          </span>
          <button
            onClick={loadClearances}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh fee clearances"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Form: Set User Balance Hold & Fee */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="font-semibold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Configure Individual User Hold &amp; Fee Amount</span>
          </div>
          {selectedUserId && (
            <span className="text-xs text-slate-400 font-mono">
              User ID: {String(selectedUserId || '').slice(0, 8)}...
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFeeHold} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* User Selector */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Select Target User</label>
              <select
                required
                value={selectedUserId}
                onChange={e => handleSelectUser(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Choose User to Manage --</option>
                {(users || []).map(u => {
                  const existing = (feeClearances || []).find(f => f.userId === u.id);
                  const isHeld = existing?.holdActive;
                  return (
                    <option key={u.id} value={u.id}>
                      {u.email} {isHeld ? `🔒 [HOLD ACTIVE: ${existing?.feeAmount} ${existing?.feeAsset}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Hold Switch */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Balance Hold Status</label>
              <button
                type="button"
                onClick={() => setHoldActive(!holdActive)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  holdActive
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-inner'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {holdActive ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>LOCKED / ON HOLD</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span>RELEASED / NORMAL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Fee Amount */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Required Fee Amount
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={feeAmount}
                onChange={e => setFeeAmount(e.target.value)}
                placeholder="500.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Fee Asset */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Fee Asset</label>
              <select
                value={feeAsset}
                onChange={e => setFeeAsset(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="USDC">USDC</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="SOL">SOL (Solana)</option>
                <option value="KROMA">KROMA</option>
              </select>
            </div>

            {/* Fee Network */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Fee Network</label>
              <input
                type="text"
                value={feeNetwork}
                onChange={e => setFeeNetwork(e.target.value)}
                placeholder="TRC20, ERC20, BEP20, Bitcoin..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Designated Fee Clearance Account Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Fee Clearance Receiving Address (Where User Must Deposit)
            </label>
            <input
              type="text"
              value={clearanceAddress}
              onChange={e => setClearanceAddress(e.target.value)}
              placeholder="Paste the dedicated wallet receiving address (leave blank to auto-use active deposit address)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              The user will see this exact address in their wallet along with the required fee amount to deposit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Hold Reason Shown to User
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Account Clearance & Security Settlement Fee Required"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Detailed User Instructions
              </label>
              <input
                type="text"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Instructions displayed to user on deposit view..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="submit"
              disabled={isSaving || !selectedUserId}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors shadow-sm disabled:opacity-40"
            >
              {isSaving ? 'Applying Changes...' : 'Save User Hold & Fee Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Overview Table of Users With Holds / Clearances */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <span>User Fee Clearances &amp; Deposit Approvals Queue</span>
            <span className="text-xs font-mono text-slate-400">({feeClearances.length} records)</span>
          </h3>
        </div>

        {/* Mobile View: Fee Clearance Cards (No horizontal dragging) */}
        <div className="lg:hidden space-y-3">
          {feeClearances.length === 0 ? (
            <div className="p-6 text-center text-slate-500 rounded-xl border border-slate-800 bg-slate-900/50 text-xs">
              No fee clearance records found. Select a user above to create an individual fee clearance hold.
            </div>
          ) : (
            feeClearances.map(fc => {
              const isHeld = fc.holdActive;
              const isSubmitted = fc.status === 'submitted';
              const isCleared = fc.status === 'cleared';

              return (
                <div key={fc.userId} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white text-xs">{fc.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {String(fc.userId || '').slice(0, 8)}...
                      </div>
                    </div>
                    <div>
                      {isHeld ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                          <Lock className="w-3 h-3" /> ON HOLD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <Unlock className="w-3 h-3" /> RELEASED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Required Fee</span>
                      <span className="font-bold text-cyan-300">{fc.feeAmount} {fc.feeAsset}</span>
                      <span className="text-[10px] text-slate-400 block">{fc.feeNetwork}</span>
                    </div>
                    <div className="text-right font-sans">
                      <span className="text-[10px] text-slate-500 block">Status</span>
                      {isCleared ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Cleared
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse">
                          <Clock className="w-3 h-3" /> Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40">
                          <AlertTriangle className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </div>
                  </div>

                  {fc.txHash && (
                    <div className="text-[11px] font-mono bg-slate-950 p-2 rounded border border-slate-800/70 text-slate-300 break-all">
                      <span className="text-slate-500 block font-sans text-[10px]">Tx Hash:</span>
                      {fc.txHash}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => handleSelectUser(fc.userId)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {isSubmitted && (
                      <>
                        <button
                          onClick={() => handleApprove(fc.userId)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(fc.userId)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isHeld && !isSubmitted && (
                      <button
                        onClick={() => handleDirectRelease(fc.userId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Release Hold
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                <th className="p-3">User Email</th>
                <th className="p-3">Hold Status</th>
                <th className="p-3">Required Fee</th>
                <th className="p-3">Deposit Payment Status</th>
                <th className="p-3">Submitted Tx Hash</th>
                <th className="p-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeClearances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No fee clearance records found. Select a user above to create an individual fee clearance hold.
                  </td>
                </tr>
              ) : (
                feeClearances.map(fc => {
                  const isHeld = fc.holdActive;
                  const isSubmitted = fc.status === 'submitted';
                  const isCleared = fc.status === 'cleared';

                  return (
                    <tr key={fc.userId} className="border-b border-slate-800/70 hover:bg-slate-900/80 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white">{fc.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {String(fc.userId || '').slice(0, 8)}...
                        </div>
                      </td>

                      <td className="p-3">
                        {isHeld ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                            <Lock className="w-3 h-3" /> ON HOLD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            <Unlock className="w-3 h-3" /> RELEASED
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-cyan-300 font-mono text-xs">
                          {fc.feeAmount} {fc.feeAsset}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{fc.feeNetwork}</div>
                      </td>

                      <td className="p-3">
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" /> Cleared
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse">
                            <Clock className="w-3 h-3" /> Awaiting Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40">
                            <AlertTriangle className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                      </td>

                      <td className="p-3 max-w-[160px]">
                        {fc.txHash ? (
                          <div className="font-mono text-[10px] text-cyan-300 truncate" title={fc.txHash}>
                            {fc.txHash}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No Tx submitted</span>
                        )}
                        {fc.paymentProofNote && (
                          <div className="text-[9px] text-slate-400 truncate max-w-[140px]" title={fc.paymentProofNote}>
                            Note: {fc.paymentProofNote}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Quick Edit */}
                          <button
                            onClick={() => handleSelectUser(fc.userId)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit User Hold & Fee"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* If payment submitted, give Approve / Reject buttons */}
                          {isSubmitted && (
                            <>
                              <button
                                onClick={() => handleApprove(fc.userId)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] transition-colors"
                              >
                                Approve &amp; Release
                              </button>
                              <button
                                onClick={() => handleReject(fc.userId)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* If hold is active but not submitted, give Direct Release option */}
                          {isHeld && !isSubmitted && (
                            <button
                              onClick={() => handleDirectRelease(fc.userId)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                            >
                              Release Hold
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
