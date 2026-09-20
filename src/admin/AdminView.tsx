import React, { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { BalanceAdjustmentForm } from './BalanceAdjustmentForm';
import { AdminDepositApprovalModal, DepositItem } from './AdminDepositApprovalModal';
import { ShieldCheck, KeyRound, Plus, Pencil, Trash2, RefreshCw, LogOut, Activity, Users, ArrowDownToLine, ScrollText, CheckCircle, XCircle } from 'lucide-react';

type Address={id:string;asset:string;network:string;address:string;label?:string;minDeposit:number|string;instructions?:string;enabled:boolean};
type Feature={key:string;enabled:boolean};
const FEATURES=['deposits','withdrawals','trading','p2p','buySell','convert','earn','rewards','referrals','kyc'];

export const AdminView:React.FC=()=>{
 const [loggedIn,setLoggedIn]=useState(Boolean(sessionStorage.getItem('kroma_admin_session')));
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState('');
 const [addresses,setAddresses]=useState<Address[]>([]); const [features,setFeatures]=useState<Feature[]>([]); const [users,setUsers]=useState<any[]>([]); const [transactions,setTransactions]=useState<any[]>([]); const [logs,setLogs]=useState<any[]>([]); const [wallets,setWallets]=useState<any[]>([]); const [deposits,setDeposits]=useState<any[]>([]); const [withdrawals,setWithdrawals]=useState<any[]>([]);
 const [editing,setEditing]=useState<Address|null>(null); const blank={asset:'USDT',network:'TRC20',address:'',label:'',minDeposit:'0',instructions:'',enabled:true}; const [form,setForm]=useState(blank);
 const [showRecovery,setShowRecovery]=useState(false); const [recoveryKey,setRecoveryKey]=useState(''); const [newAdminEmail,setNewAdminEmail]=useState(''); const [newAdminPassword,setNewAdminPassword]=useState(''); const [recoveryMsg,setRecoveryMsg]=useState('');
 const [selectedUserId,setSelectedUserId]=useState(''); const [userAddresses,setUserAddresses]=useState<any[]>([]); const [userAddrForm,setUserAddrForm]=useState({asset:'USDT',network:'TRC20',address:'',label:'',minDeposit:'0',instructions:'',enabled:true}); const [editingUserAddr,setEditingUserAddr]=useState<any|null>(null);
 const load=async()=>{try{const [a,f,u,t,l,w,d,wd]=await Promise.all([apiFetch<any>('/api/admin/deposit-addresses'),apiFetch<any>('/api/admin/features'),apiFetch<any>('/api/admin/users'),apiFetch<any>('/api/admin/transactions'),apiFetch<any>('/api/admin/audit-logs'),apiFetch<any>('/api/admin/wallets'),apiFetch<any>('/api/admin/deposits'),apiFetch<any>('/api/admin/withdrawals')]);setAddresses(a.addresses);setFeatures(f.features);setUsers(u.users);setTransactions(t.transactions);setLogs(l.logs);setWallets(w.wallets);setDeposits(d.deposits);setWithdrawals(wd.withdrawals);setError('')}catch(e:any){setError(e.message)}};
 useEffect(()=>{if(loggedIn)load()},[loggedIn]);
 const loadUserAddresses=async(id:string)=>{setSelectedUserId(id);setUserAddresses([]);if(!id)return;try{const r=await apiFetch<any>(`/api/admin/users/${id}/deposit-addresses`);setUserAddresses(r.addresses)}catch(e:any){setError(e.message)}};
 const saveUserAddress=async()=>{try{const body={...userAddrForm,minDeposit:Number(userAddrForm.minDeposit)||0};if(editingUserAddr)await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${editingUserAddr.id}`,{method:'PUT',body:JSON.stringify(body)});else await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses`,{method:'POST',body:JSON.stringify(body)});setEditingUserAddr(null);setUserAddrForm({asset:'USDT',network:'TRC20',address:'',label:'',minDeposit:'0',instructions:'',enabled:true});await loadUserAddresses(selectedUserId)}catch(e:any){setError(e.message)}};
 const removeUserAddress=async(id:string)=>{if(!confirm('Delete this user-specific deposit address?'))return;try{await apiFetch(`/api/admin/users/${selectedUserId}/deposit-addresses/${id}`,{method:'DELETE'});await loadUserAddresses(selectedUserId)}catch(e:any){setError(e.message)}};
 const login=async(e:React.FormEvent)=>{e.preventDefault();setError('');try{await apiFetch('/api/admin/login',{method:'POST',body:JSON.stringify({email,password})});sessionStorage.setItem('kroma_admin_session','1');setLoggedIn(true);setPassword('')}catch(e:any){setError(e.message)}};
 const logout=async()=>{try{await apiFetch('/api/admin/logout',{method:'POST'})}catch{}sessionStorage.removeItem('kroma_admin_session');sessionStorage.removeItem('kroma_admin_token');setLoggedIn(false)};
 const save=async()=>{try{const body={...form,minDeposit:Number(form.minDeposit)||0};if(editing)await apiFetch(`/api/admin/deposit-addresses/${editing.id}`,{method:'PUT',body:JSON.stringify(body)});else await apiFetch('/api/admin/deposit-addresses',{method:'POST',body:JSON.stringify(body)});setEditing(null);setForm(blank);await load()}catch(e:any){setError(e.message)}};
 const remove=async(id:string)=>{if(!confirm('Delete this deposit address?'))return;try{await apiFetch(`/api/admin/deposit-addresses/${id}`,{method:'DELETE'});await load()}catch(e:any){setError(e.message)}};
 const toggle=async(f:Feature)=>{try{await apiFetch(`/api/admin/features/${f.key}`,{method:'PUT',body:JSON.stringify({enabled:!f.enabled})});await load()}catch(e:any){setError(e.message)}};
 const confirmDepositAdmin=async(id:string,currentTxHash?:string)=>{
   const hash=prompt('Enter Blockchain Tx Hash (or keep default for Admin Verified):',currentTxHash||`ADMIN_VERIFIED_${Date.now()}`);
   if(hash===null)return;
   try{await apiFetch(`/api/admin/deposits/${id}/confirm`,{method:'POST',body:JSON.stringify({txHash:hash.trim()||`ADMIN_VERIFIED_${Date.now()}`})});await load();try{localStorage.setItem('kroma_balance_adjustment_event',JSON.stringify({type:'deposit_confirmed',id,time:Date.now()}));window.dispatchEvent(new CustomEvent('kroma:wallet-refresh',{detail:{id,type:'deposit_confirmed'}}));}catch{}}catch(e:any){setError(e.message)}
 };
 const rejectDepositAdmin=async(id:string)=>{
   const reason=prompt('Enter rejection reason:','Invalid transfer or payment verification failed');
   if(reason===null)return;
   try{await apiFetch(`/api/admin/deposits/${id}/reject`,{method:'POST',body:JSON.stringify({reason})});await load();try{localStorage.setItem('kroma_balance_adjustment_event',JSON.stringify({type:'deposit_rejected',id,time:Date.now()}));window.dispatchEvent(new CustomEvent('kroma:wallet-refresh',{detail:{id,type:'deposit_rejected'}}));}catch{}}catch(e:any){setError(e.message)}
 };
 const recover=async(e:React.FormEvent)=>{e.preventDefault();setRecoveryMsg('');setError('');try{const r=await apiFetch<any>('/api/admin/recovery',{method:'POST',body:JSON.stringify({recoveryKey,newEmail:newAdminEmail,newPassword:newAdminPassword})});setRecoveryMsg(r.message);setRecoveryKey('');setNewAdminPassword('');setNewAdminEmail('');setShowRecovery(false);await logout()}catch(e:any){setError(e.message)}};
 if(!loggedIn)return <div className="min-h-screen bg-[#070A10] flex items-center justify-center p-4 text-slate-100"><div className="w-full max-w-md bg-[#111622] border border-slate-700 rounded-2xl p-7 shadow-2xl"><form onSubmit={login}><div className="flex items-center gap-3 mb-6"><div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400"><ShieldCheck/></div><div><h1 className="text-xl font-bold">Admin Control Center</h1><p className="text-xs text-slate-400">Secure server-side administration</p></div></div><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email" className="w-full mb-3 p-3 rounded-lg bg-slate-900 border border-slate-700"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Admin password" className="w-full mb-4 p-3 rounded-lg bg-slate-900 border border-slate-700"/><button className="w-full py-3 rounded-lg bg-cyan-400 text-slate-950 font-bold">Sign in</button></form><button onClick={()=>setShowRecovery(!showRecovery)} className="w-full mt-3 py-2 text-sm text-cyan-400"><KeyRound className="w-4 h-4 inline mr-1"/>Admin Recovery</button>{showRecovery&&<form onSubmit={recover} className="mt-4 pt-4 border-t border-slate-800 space-y-3"><p className="text-xs text-slate-400">Use the recovery key configured in the server environment. This changes the admin email and password.</p><input required type="password" value={recoveryKey} onChange={e=>setRecoveryKey(e.target.value)} placeholder="Recovery key" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700"/><input required type="email" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} placeholder="New admin email" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700"/><input required type="password" value={newAdminPassword} onChange={e=>setNewAdminPassword(e.target.value)} placeholder="New password (10+ chars)" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700"/><button className="w-full py-3 rounded-lg bg-amber-400 text-slate-950 font-bold">Reset admin credentials</button></form>}{(error||recoveryMsg)&&<p className={`text-sm mt-3 ${error?'text-red-400':'text-emerald-400'}`}>{error||recoveryMsg}</p>}</div></div>;
 return <div className="min-h-screen bg-[#070A10] text-slate-100 p-4 md:p-8"><div className="max-w-7xl mx-auto space-y-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h1 className="text-2xl md:text-3xl font-bold">Admin Control Center</h1><p className="text-sm text-slate-400 mt-1">Monitor and control the live platform configuration.</p></div><div className="flex gap-2"><button onClick={load} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"><RefreshCw className="w-4 h-4 inline mr-2"/>Refresh</button><button onClick={logout} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"><LogOut className="w-4 h-4 inline mr-2"/>Logout</button></div></div>{error&&<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">{error}</div>}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Stat icon={<Users/>} label="Users" value={users.length}/><Stat icon={<Activity/>} label="Transactions" value={transactions.length}/><Stat icon={<ArrowDownToLine/>} label="Deposit Addresses" value={addresses.filter(a=>a.enabled).length}/><Stat icon={<ScrollText/>} label="Audit Events" value={logs.length}/></div>
 <BalanceAdjustmentForm users={users} onComplete={load}/>
 <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5"><div className="flex items-center gap-2 mb-4"><Users className="text-cyan-400"/><div><h2 className="font-bold text-lg">Individual User Deposit Addresses</h2><p className="text-xs text-slate-400">Assign a receiving address to a specific user. Their address takes priority over the platform-wide address.</p></div></div><select value={selectedUserId} onChange={e=>loadUserAddresses(e.target.value)} className="input mb-4"><option value="">Select a user</option>{users.map(u=><option key={u.id} value={u.id}>{u.email}</option>)}</select>{selectedUserId&&<><div className="grid md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800"><Field label="Asset"><input value={userAddrForm.asset} onChange={e=>setUserAddrForm({...userAddrForm,asset:e.target.value})} className="input"/></Field><Field label="Network"><input value={userAddrForm.network} onChange={e=>setUserAddrForm({...userAddrForm,network:e.target.value})} className="input"/></Field><Field label="Receiving Address"><input value={userAddrForm.address} onChange={e=>setUserAddrForm({...userAddrForm,address:e.target.value})} className="input"/></Field><Field label="Label"><input value={userAddrForm.label} onChange={e=>setUserAddrForm({...userAddrForm,label:e.target.value})} className="input"/></Field><Field label="Minimum Deposit"><input type="number" min="0" value={userAddrForm.minDeposit} onChange={e=>setUserAddrForm({...userAddrForm,minDeposit:e.target.value})} className="input"/></Field><Field label="Instructions"><input value={userAddrForm.instructions} onChange={e=>setUserAddrForm({...userAddrForm,instructions:e.target.value})} className="input"/></Field><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={userAddrForm.enabled} onChange={e=>setUserAddrForm({...userAddrForm,enabled:e.target.checked})}/> Active</label><div><button onClick={saveUserAddress} className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold">{editingUserAddr?'Save Address':'Add User Address'}</button>{editingUserAddr&&<button onClick={()=>{setEditingUserAddr(null);setUserAddrForm({asset:'USDT',network:'TRC20',address:'',label:'',minDeposit:'0',instructions:'',enabled:true})}} className="ml-2 px-4 py-2 rounded-lg bg-slate-800">Cancel</button>}</div></div><div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="text-slate-400 border-b border-slate-800"><th className="text-left p-3">Asset</th><th className="text-left p-3">Network</th><th className="text-left p-3">Address</th><th className="text-left p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{userAddresses.map(a=><tr key={a.id} className="border-b border-slate-800/70"><td className="p-3">{a.asset}</td><td className="p-3">{a.network}</td><td className="p-3 font-mono text-xs break-all">{a.address}</td><td className="p-3">{a.enabled?<span className="text-emerald-400">Active</span>:<span className="text-red-400">Disabled</span>}</td><td className="p-3 flex justify-end gap-2"><button onClick={()=>{setEditingUserAddr(a);setUserAddrForm({asset:a.asset,network:a.network,address:a.address,label:a.label||'',minDeposit:String(a.minDeposit),instructions:a.instructions||'',enabled:a.enabled})}} className="p-2 bg-slate-800 rounded"><Pencil className="w-4 h-4"/></button><button onClick={()=>removeUserAddress(a.id)} className="p-2 bg-red-500/10 text-red-400 rounded"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div></>}</section>
 <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5"><div className="flex items-center gap-2 mb-4"><KeyRound className="text-amber-400"/><div><h2 className="font-bold text-lg">Admin Recovery</h2><p className="text-xs text-slate-400">Recovery changes the primary admin credentials and expires existing sessions.</p></div></div><button onClick={()=>setShowRecovery(!showRecovery)} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">{showRecovery?'Close':'Open recovery form'}</button>{showRecovery&&<form onSubmit={recover} className="grid md:grid-cols-2 gap-3 mt-4"><input required type="password" value={recoveryKey} onChange={e=>setRecoveryKey(e.target.value)} placeholder="Recovery key" className="input"/><input required type="email" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} placeholder="New admin email" className="input"/><input required type="password" value={newAdminPassword} onChange={e=>setNewAdminPassword(e.target.value)} placeholder="New admin password" className="input"/><button className="py-3 rounded-lg bg-amber-400 text-slate-950 font-bold">Reset admin credentials</button></form>}</section>
 <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5"><h2 className="font-bold text-lg mb-4">Frontend Feature Controls</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{FEATURES.map(k=>{const f=features.find(x=>x.key===k)||{key:k,enabled:true};return <button key={k} onClick={()=>toggle(f)} className={`p-3 rounded-xl border text-left ${f.enabled?'border-emerald-500/30 bg-emerald-500/10':'border-red-500/30 bg-red-500/10'}`}><div className="text-sm font-semibold">{k}</div><div className={`text-xs mt-1 ${f.enabled?'text-emerald-400':'text-red-400'}`}>{f.enabled?'Enabled':'Disabled'}</div></button>})}</div></section>
 <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5"><div className="flex items-center justify-between mb-4"><div><h2 className="font-bold text-lg">Deposit Wallet Addresses</h2><p className="text-xs text-slate-400">Users receive the active address from the server.</p></div><button onClick={()=>{setEditing(null);setForm(blank)}} className="px-3 py-2 rounded-lg bg-cyan-400 text-slate-950 font-bold"><Plus className="w-4 h-4 inline mr-1"/>Add Address</button></div>{(editing!==null||form.address==='')&&<div className="grid md:grid-cols-2 gap-3 p-4 mb-5 rounded-xl bg-slate-900 border border-slate-800"><Field label="Asset"><input value={form.asset} onChange={e=>setForm({...form,asset:e.target.value})} className="input"/></Field><Field label="Network"><input value={form.network} onChange={e=>setForm({...form,network:e.target.value})} className="input"/></Field><Field label="Wallet Address"><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="input"/></Field><Field label="Label"><input value={form.label} onChange={e=>setForm({...form,label:e.target.value})} className="input"/></Field><Field label="Minimum Deposit"><input type="number" min="0" value={form.minDeposit} onChange={e=>setForm({...form,minDeposit:e.target.value})} className="input"/></Field><Field label="Instructions"><input value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} className="input"/></Field><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/> Active</label><div className="md:text-right"><button onClick={save} className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold">{editing?'Save Changes':'Create Address'}</button>{editing&&<button onClick={()=>setEditing(null)} className="ml-2 px-4 py-2 rounded-lg bg-slate-800">Cancel</button>}</div></div>}<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-slate-400 border-b border-slate-800"><th className="text-left p-3">Asset</th><th className="text-left p-3">Network</th><th className="text-left p-3">Address</th><th className="text-left p-3">Min</th><th className="text-left p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{addresses.map(a=><tr key={a.id} className="border-b border-slate-800/70"><td className="p-3 font-bold">{a.asset}</td><td className="p-3">{a.network}</td><td className="p-3 font-mono text-xs max-w-xs break-all">{a.address}</td><td className="p-3">{String(a.minDeposit)}</td><td className="p-3">{a.enabled?<span className="text-emerald-400">Active</span>:<span className="text-red-400">Disabled</span>}</td><td className="p-3 flex justify-end gap-2"><button onClick={()=>{setEditing(a);setForm({asset:a.asset,network:a.network,address:a.address,label:a.label||'',minDeposit:String(a.minDeposit),instructions:a.instructions||'',enabled:a.enabled})}} className="p-2 bg-slate-800 rounded"><Pencil className="w-4 h-4"/></button><button onClick={()=>remove(a.id)} className="p-2 bg-red-500/10 text-red-400 rounded"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div></section>
 <section className="grid lg:grid-cols-2 gap-6"><Data title="Recent Users" rows={users} cols={['email','status','kycStatus']}/><Data title="Recent Transactions" rows={transactions} cols={['type','asset','amount','status']}/></section>
 <section className="grid lg:grid-cols-2 gap-6">
   <Data title="Wallet Ledger Balances" rows={wallets} cols={['email','asset','accountType','available','locked']}/>
   <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5">
     <div className="flex items-center justify-between mb-3">
       <div>
         <h2 className="font-bold text-lg">User Deposit Requests & Approvals</h2>
         <p className="text-xs text-slate-400">Review pending user payments and credit wallet balances</p>
       </div>
       <span className="text-xs text-cyan-400 font-mono font-semibold">{deposits.length} Total</span>
     </div>
     <div className="overflow-auto max-h-80">
       <table className="w-full text-xs">
         <thead>
           <tr className="text-slate-400 border-b border-slate-800 text-left">
             <th className="p-2">User / Email</th>
             <th className="p-2">Asset</th>
             <th className="p-2">Amount</th>
             <th className="p-2">Status</th>
             <th className="p-2 text-right">Action</th>
           </tr>
         </thead>
         <tbody>
           {deposits.length === 0 ? (
             <tr><td colSpan={5} className="p-4 text-center text-slate-500">No deposit requests recorded</td></tr>
           ) : (
             deposits.map((d: any) => {
               const canReview = d.status === 'pending' || d.status === 'awaiting_approval';
               return (
                 <tr key={d.id} className="border-b border-slate-800/70 hover:bg-slate-900/50">
                   <td className="p-2">
                     <div className="font-medium text-white">{d.email || d.userId}</div>
                     <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{d.network}</div>
                   </td>
                   <td className="p-2 font-bold text-cyan-300">{d.asset}</td>
                   <td className="p-2 font-mono">{d.amount}</td>
                   <td className="p-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                       d.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                       d.status === 'awaiting_approval' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse' :
                       d.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                       'bg-amber-950 text-amber-300 border border-amber-800/40'
                     }`}>
                       {d.status === 'awaiting_approval' ? 'Awaiting Approval' : d.status}
                     </span>
                   </td>
                   <td className="p-2 text-right">
                     {canReview ? (
                       <div className="flex items-center justify-end gap-1.5">
                         <button
                           onClick={() => confirmDepositAdmin(d.id, d.txHash)}
                           className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[11px] font-bold transition-colors"
                         >
                           Approve &amp; Credit
                         </button>
                         <button
                           onClick={() => rejectDepositAdmin(d.id)}
                           className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded text-[11px] font-bold transition-colors"
                         >
                           Reject
                         </button>
                       </div>
                     ) : (
                       <span className="text-slate-500 text-[11px] font-mono">{d.status}</span>
                     )}
                   </td>
                 </tr>
               );
             })
           )}
         </tbody>
       </table>
     </div>
   </section>
 </section>
 <section className="grid lg:grid-cols-1 gap-6">
   <Data title="Withdrawal Queue" rows={withdrawals} cols={['email','asset','amount','status']}/>
 </section>
 <section className="bg-[#111622] border border-slate-800 rounded-2xl p-5"><h2 className="font-bold text-lg mb-3">Audit Log</h2><div className="space-y-2 max-h-72 overflow-auto">{logs.map(l=><div key={l.id} className="p-3 rounded-lg bg-slate-900 text-xs"><span className="text-cyan-400">{l.action}</span> {l.entityType} <span className="text-slate-500">{new Date(l.createdAt).toLocaleString()}</span></div>)}</div></section>
 </div></div>;
};
const Stat=({icon,label,value}:{icon:React.ReactNode;label:string;value:number})=><div className="bg-[#111622] border border-slate-800 rounded-xl p-4"><div className="text-cyan-400 mb-2">{icon}</div><div className="text-2xl font-bold">{value}</div><div className="text-xs text-slate-400">{label}</div></div>;
const Field=({label,children}:{label:string;children:React.ReactNode})=><label className="text-xs text-slate-400 space-y-1"><span>{label}</span>{children}</label>;
const Data=({title,rows,cols}:{title:string;rows:any[];cols:string[]})=><section className="bg-[#111622] border border-slate-800 rounded-2xl p-5"><h2 className="font-bold text-lg mb-3">{title}</h2><div className="overflow-auto"><table className="w-full text-xs"><tbody>{rows.slice(0,20).map((r,i)=><tr key={i} className="border-b border-slate-800/70">{cols.map(c=><td key={c} className="p-2">{String(r[c]??'—')}</td>)}</tr>)}</tbody></table></div></section>;
