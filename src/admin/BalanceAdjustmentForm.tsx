import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ShieldAlert } from 'lucide-react';
import { apiFetch } from './api';

type User = { id:string; email:string; status:string };

export const BalanceAdjustmentForm: React.FC<{ users:User[]; onComplete:()=>void }> = ({ users, onComplete }) => {
  const [userId,setUserId]=useState('');
  const [asset,setAsset]=useState('USDT');
  const [accountType,setAccountType]=useState('spot');
  const [amount,setAmount]=useState('');
  const [reason,setReason]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [type,setType]=useState<'credit'|'debit'>('credit');

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); setError(''); setMessage('');
    if(!userId || !amount || !reason.trim()) { setError('Select a user and enter an amount and reason.'); return; }
    if(!confirm(`Confirm ${type} of ${amount} ${asset.toUpperCase()} to ${users.find(u=>u.id===userId)?.email || 'this user'}?`)) return;
    setBusy(true);
    try {
      const r=await apiFetch<any>('/api/admin/adjust-balance',{method:'POST',body:JSON.stringify({userId,asset,accountType,amount,adjustmentType:type,reason})});
      setMessage(`Adjustment applied. Reference: ${r.referenceId}`); setAmount(''); setReason(''); onComplete();
      // Notify client tabs to immediately refresh ledger balances
      try {
        const payload = JSON.stringify({ userId, asset, accountType, type, time: Date.now() });
        localStorage.setItem('kroma_balance_adjustment_event', payload);
        window.dispatchEvent(new CustomEvent('kroma:wallet-refresh', { detail: { userId, asset, accountType } }));
      } catch {}
    } catch(e:any){setError(e.message)} finally{setBusy(false)}
  };

  return <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
    <div className="flex items-start gap-3 mb-4"><div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><ShieldAlert className="w-5 h-5"/></div><div><h2 className="font-bold text-lg">Admin Balance Adjustment</h2><p className="text-xs text-slate-400">Credits/debits change the internal wallet ledger and do not broadcast blockchain transactions.</p></div></div>
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
      <label className="text-xs text-slate-400">User<select value={userId} onChange={e=>setUserId(e.target.value)} className="input mt-1"><option value="">Select user</option>{users.map(u=><option key={u.id} value={u.id}>{u.email}</option>)}</select></label>
      <label className="text-xs text-slate-400">Asset<input value={asset} onChange={e=>setAsset(e.target.value.toUpperCase())} className="input mt-1" placeholder="USDT"/></label>
      <label className="text-xs text-slate-400">Account<select value={accountType} onChange={e=>setAccountType(e.target.value)} className="input mt-1"><option value="spot">Spot</option><option value="funding">Funding</option><option value="earn">Earn</option></select></label>
      <label className="text-xs text-slate-400">Amount<input required value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" className="input mt-1" placeholder="0.00"/></label>
      <div className="md:col-span-2 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setType('credit')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${type==='credit'?'border-emerald-400 bg-emerald-400/10 text-emerald-300':'border-slate-700'}`}><ArrowUpCircle className="w-4 h-4"/> Credit</button><button type="button" onClick={()=>setType('debit')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${type==='debit'?'border-amber-400 bg-amber-400/10 text-amber-300':'border-slate-700'}`}><ArrowDownCircle className="w-4 h-4"/> Debit</button></div>
      <label className="text-xs text-slate-400 md:col-span-2">Reason / reference<input required value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} className="input mt-1" placeholder="e.g. Manual account correction — verified by support"/></label>
      <button disabled={busy} className="md:col-span-2 py-3 rounded-xl bg-cyan-400 text-slate-950 font-bold disabled:opacity-50">{busy?'Processing…':`Apply ${type}`}</button>
    </form>
    {message&&<p className="mt-3 text-sm text-emerald-400">{message}</p>}{error&&<p className="mt-3 text-sm text-red-400">{error}</p>}
  </section>;
};
