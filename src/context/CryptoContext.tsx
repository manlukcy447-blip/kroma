import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  NavigationTab, 
  FiatCurrency, 
  LanguageCode, 
  CryptoAsset, 
  SpotOrder, 
  TradeHistoryItem, 
  TransactionRecord, 
  UserProfile, 
  AppNotification,
  UserEarnSubscription 
} from '../types/crypto';
import { apiUrl } from '../admin/api';
import { 
  CRYPTO_ASSETS, 
  INITIAL_USER_PROFILE, 
  NOTIFICATIONS, 
  FIAT_RATES, 
  UI_TRANSLATIONS 
} from '../data/mockData';

interface CryptoContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  fiatCurrency: FiatCurrency;
  setFiatCurrency: (fiat: FiatCurrency) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  hideBalances: boolean;
  setHideBalances: (hide: boolean) => void;
  assets: CryptoAsset[];
  balances: Record<string, { spot: number; funding: number; earn: number; locked: number }>;
  userProfile: UserProfile;
  orders: SpotOrder[];
  orderHistory: SpotOrder[];
  recentTrades: TradeHistoryItem[];
  transactions: TransactionRecord[];
  notifications: AppNotification[];
  earnSubscriptions: UserEarnSubscription[];
  unreadNotifsCount: number;
  featureFlags: Record<string, boolean>;
  isFeatureEnabled: (key: string) => boolean;
  
  // Modals state
  depositModalOpen: boolean;
  openDepositModal: (assetSymbol?: string) => void;
  closeDepositModal: () => void;
  withdrawModalOpen: boolean;
  openWithdrawModal: (assetSymbol?: string) => void;
  closeWithdrawModal: () => void;
  transferModalOpen: boolean;
  openTransferModal: (assetSymbol?: string) => void;
  closeTransferModal: () => void;
  sendReceiveModalOpen: boolean;
  openSendReceiveModal: (mode?: 'send' | 'receive', assetSymbol?: string) => void;
  closeSendReceiveModal: () => void;
  activeModalAsset: string;
  sendReceiveMode: 'send' | 'receive';
  
  // Actions
  placeSpotOrder: (order: {
    pair: string;
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
  }) => Promise<{ success: boolean; message: string }>;
  cancelSpotOrder: (orderId: string) => Promise<void>;
  executeInternalTransfer: (asset: string, fromAccount: 'spot' | 'funding' | 'earn', toAccount: 'spot' | 'funding' | 'earn', amount: number) => Promise<{ success: boolean; message: string }>;
  executeConvert: (fromAsset: string, toAsset: string, fromAmount: number, toAmount: number) => Promise<{ success: boolean; message: string }>;
  executeWithdrawal: (asset: string, networkId: string, address: string, amount: number, code2FA: string) => Promise<{ success: boolean; message: string }>;
  recordDeposit: (asset: string, networkId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  subscribeToEarnProduct: (productId: string, asset: string, amount: number, apy: number) => Promise<{ success: boolean; message: string }>;
  checkInDaily: () => { success: boolean; reward: number; message: string };
  openMysteryBox: () => { success: boolean; reward: number; asset: string; message: string };
  updateSecurity2FA: (enabled: boolean) => void;
  updateAntiPhishing: (code: string) => void;
  addWhitelistedAddress: (label: string, asset: string, network: string, address: string) => void;
  removeWhitelistedAddress: (id: string) => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
  submitKycVerification: (tier: 'tier1_verified' | 'tier2_verified') => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  formatFiat: (amountUsd: number) => string;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USDT');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('USD');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [assets, setAssets] = useState<CryptoAsset[]>(CRYPTO_ASSETS);
  const emptyBalances = Object.fromEntries(CRYPTO_ASSETS.map(a => [a.symbol, { spot: 0, funding: 0, earn: 0, locked: 0 }])) as Record<string, {spot:number;funding:number;earn:number;locked:number}>;
  const [balances, setBalances] = useState<Record<string, { spot: number; funding: number; earn: number; locked: number }>>(emptyBalances);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [notifications, setNotifications] = useState<AppNotification[]>(NOTIFICATIONS);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    deposits:true, withdrawals:true, trading:true, p2p:false, buySell:false, convert:false, earn:false, rewards:false, referrals:false, kyc:true
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/features`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('feature service unavailable')))
      .then(data => setFeatureFlags(prev => ({ ...prev, ...(data.features || {}) })))
      .catch(() => {});
  }, []);

  const refreshWallet = async () => {
    const [b,t,o] = await Promise.all([
      fetch(apiUrl('/api/wallet/balances'), {credentials:'include'}).then(r=>r.ok?r.json():Promise.reject(new Error('balances'))),
      fetch(apiUrl('/api/wallet/transactions'), {credentials:'include'}).then(r=>r.ok?r.json():Promise.reject(new Error('transactions'))),
      fetch(apiUrl('/api/wallet/orders'), {credentials:'include'}).then(r=>r.ok?r.json():Promise.reject(new Error('orders'))),
    ]);
    setBalances({...emptyBalances,...(b.balances||{})});
    setTransactions((t.transactions||[]).map((x:any)=>({...x,timestamp:new Date(x.createdAt).getTime(),fee:0,feeAsset:x.asset})));
    const mapped=(o.orders||[]).map((x:any)=>({id:x.id,pair:x.pair,type:x.orderType,side:x.side,price:Number(x.price||0),amount:Number(x.amount),filled:Number(x.filled||0),status:x.status,timestamp:new Date(x.createdAt).getTime()}));
    setOrders(mapped.filter((x:any)=>x.status==='open'));
    setOrderHistory(mapped.filter((x:any)=>x.status!=='open'));
  };
  useEffect(() => {
  refreshWallet().catch(() => {});

  const refreshOnFocus = () => {
    refreshWallet().catch(() => {});
  };

  const refreshOnVisibility = () => {
    if (document.visibilityState === "visible") {
      refreshWallet().catch(() => {});
    }
  };

  window.addEventListener("focus", refreshOnFocus);
  document.addEventListener("visibilitychange", refreshOnVisibility);

  const interval = window.setInterval(() => {
    refreshWallet().catch(() => {});
  }, 15000);

  return () => {
    window.removeEventListener("focus", refreshOnFocus);
    document.removeEventListener("visibilitychange", refreshOnVisibility);
    window.clearInterval(interval);
  };
}, []);
  
  // Modals state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [sendReceiveModalOpen, setSendReceiveModalOpen] = useState(false);
  const [activeModalAsset, setActiveModalAsset] = useState('USDT');
  const [sendReceiveMode, setSendReceiveMode] = useState<'send' | 'receive'>('send');

  // Server-backed orders/history/transactions.
  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<SpotOrder[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [earnSubscriptions, setEarnSubscriptions] = useState<UserEarnSubscription[]>([]);

  // Market prices are reference data only. No client-side price simulation is used.

  const t = (key: string): string => {
    const langDict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS['en'];
    return langDict[key] || UI_TRANSLATIONS['en'][key] || key;
  };

  const formatFiat = (amountUsd: number): string => {
    const rateInfo = FIAT_RATES[fiatCurrency] || FIAT_RATES['USD'];
    const converted = amountUsd * rateInfo.rate;
    return `${rateInfo.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const openDepositModal = (assetSymbol = 'USDT') => {
    setActiveModalAsset(assetSymbol);
    setDepositModalOpen(true);
  };
  const closeDepositModal = () => setDepositModalOpen(false);

  const openWithdrawModal = (assetSymbol = 'USDT') => {
    setActiveModalAsset(assetSymbol);
    setWithdrawModalOpen(true);
  };
  const closeWithdrawModal = () => setWithdrawModalOpen(false);

  const openTransferModal = (assetSymbol = 'USDT') => {
    setActiveModalAsset(assetSymbol);
    setTransferModalOpen(true);
  };
  const closeTransferModal = () => setTransferModalOpen(false);

  const openSendReceiveModal = (mode: 'send' | 'receive' = 'send', assetSymbol = 'USDT') => {
    setSendReceiveMode(mode);
    setActiveModalAsset(assetSymbol);
    setSendReceiveModalOpen(true);
  };
  const closeSendReceiveModal = () => setSendReceiveModalOpen(false);

  // Server-backed financial actions. The database is authoritative.
  const placeSpotOrder = async ({pair,type,side,price,amount}:{pair:string;type:'limit'|'market';side:'buy'|'sell';price:number;amount:number}) => {
    try { const r=await fetch(apiUrl('/api/wallet/orders'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({pair,type,side,price,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Unable to place order'}; await refreshWallet(); return {success:true,message:'Order accepted and recorded as OPEN. It will not be filled until a real matching engine or liquidity provider is connected.'}; } catch{return {success:false,message:'Trading service unavailable.'};}
  };
  const cancelSpotOrder = async (orderId:string) => { try { const r=await fetch(apiUrl(`/api/wallet/orders/${orderId}/cancel`),{method:'POST',credentials:'include'}); if(r.ok) await refreshWallet(); } catch{} };
  const executeInternalTransfer = async (asset:string,fromAccount:'spot'|'funding'|'earn',toAccount:'spot'|'funding'|'earn',amount:number) => { try { const r=await fetch(apiUrl('/api/wallet/internal-transfer'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({asset,fromAccount,toAccount,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Transfer failed'}; setBalances({...emptyBalances,...(d.balances||{})}); await refreshWallet(); return {success:true,message:`Successfully transferred ${amount} ${asset} from ${fromAccount.toUpperCase()} to ${toAccount.toUpperCase()}.`}; } catch{return {success:false,message:'Wallet service unavailable.'};} };
  const executeConvert = async (_from:string,_to:string,_amount:number,_receive:number) => ({success:false,message:'Convert is unavailable until a real quote and liquidity provider is connected. No balance was changed.'});
  const executeWithdrawal = async (asset:string,networkId:string,address:string,amount:number,_code2FA:string) => { try { const meta=assets.find(a=>a.symbol===asset); const network=meta?.networks.find(n=>n.id===networkId); const networkName=network?.name||network?.shortName||networkId; const r=await fetch(apiUrl('/api/wallet/withdraw'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({asset,network:networkName,address,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Withdrawal failed'}; await refreshWallet(); return {success:true,message:d.message||'Withdrawal submitted for security review.'}; } catch{return {success:false,message:'Withdrawal service unavailable.'};} };
  const recordDeposit = async (asset:string,networkId:string,amount:number) => { try { const meta=assets.find(a=>a.symbol===asset); const network=meta?.networks.find(n=>n.id===networkId); const networkName=network?.name||network?.shortName||networkId; const r=await fetch(apiUrl('/api/wallet/deposit-intent'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({asset,network:networkName,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Deposit request failed'}; await refreshWallet(); return {success:true,message:d.message||'Deposit submitted for verification.'}; } catch{return {success:false,message:'Deposit service unavailable.'};} };

  // Earn/rewards are intentionally non-custodial until their real provider/ledger rules are configured.
  const subscribeToEarnProduct = async (_productId:string, asset:string, amount:number, _apy:number) => {
    const result = await executeInternalTransfer(asset,'spot','earn',amount);
    if (result.success) setEarnSubscriptions(prev => [{id:`sub-${Date.now()}`,productId:_productId,asset,amount,apy:_apy,startDate:Date.now(),interestAccrued:0,autoRenew:true},...prev]);
    return result.success ? {success:true,message:`${amount} ${asset} moved to Earn Wallet. Yield accrual is disabled until a real Earn provider is connected.`} : result;
  };
  const checkInDaily = () => ({success:false,reward:0,message:'Rewards are disabled until a server-side rewards program is configured.'});
  const openMysteryBox = () => ({success:false,reward:0,asset:'USDT',message:'Rewards are disabled until a server-side rewards program is configured.'});

  const updateSecurity2FA = (enabled: boolean) => {
    setUserProfile(prev => ({ ...prev, twoFactorEnabled: enabled }));
  };

  const updateAntiPhishing = (code: string) => {
    setUserProfile(prev => ({ ...prev, antiPhishingCode: code }));
  };

  const addWhitelistedAddress = (label: string, asset: string, network: string, address: string) => {
    const newEntry = {
      id: `w-${Date.now()}`,
      label,
      asset,
      network,
      address,
    };
    setUserProfile(prev => ({
      ...prev,
      whitelistedAddresses: [newEntry, ...prev.whitelistedAddresses],
    }));
  };

  const removeWhitelistedAddress = (id: string) => {
    setUserProfile(prev => ({
      ...prev,
      whitelistedAddresses: prev.whitelistedAddresses.filter(w => w.id !== id),
    }));
  };

  const revokeSession = (sessionId: string) => {
    setUserProfile(prev => ({
      ...prev,
      activeSessions: prev.activeSessions.filter(s => s.id !== sessionId),
    }));
  };

  const revokeAllOtherSessions = () => {
    setUserProfile(prev => ({
      ...prev,
      activeSessions: prev.activeSessions.filter(s => s.isCurrent),
    }));
  };

  const submitKycVerification = (tier: 'tier1_verified' | 'tier2_verified') => {
    setUserProfile(prev => ({ ...prev, kycStatus: tier }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <CryptoContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        selectedPair,
        setSelectedPair,
        fiatCurrency,
        setFiatCurrency,
        language,
        setLanguage,
        t,
        hideBalances,
        setHideBalances,
        assets,
        balances,
        userProfile,
        orders,
        orderHistory,
        recentTrades,
        transactions,
        notifications,
        earnSubscriptions,
        unreadNotifsCount,
        featureFlags,
        isFeatureEnabled: (key: string) => featureFlags[key] !== false,
        depositModalOpen,
        openDepositModal,
        closeDepositModal,
        withdrawModalOpen,
        openWithdrawModal,
        closeWithdrawModal,
        transferModalOpen,
        openTransferModal,
        closeTransferModal,
        sendReceiveModalOpen,
        openSendReceiveModal,
        closeSendReceiveModal,
        activeModalAsset,
        sendReceiveMode,
        placeSpotOrder,
        cancelSpotOrder,
        executeInternalTransfer,
        executeConvert,
        executeWithdrawal,
        recordDeposit,
        subscribeToEarnProduct,
        checkInDaily,
        openMysteryBox,
        updateSecurity2FA,
        updateAntiPhishing,
        addWhitelistedAddress,
        removeWhitelistedAddress,
        revokeSession,
        revokeAllOtherSessions,
        submitKycVerification,
        markNotificationAsRead,
        markAllNotificationsRead,
        formatFiat,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};

