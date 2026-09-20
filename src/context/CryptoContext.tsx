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
  UserEarnSubscription,
  UserFeeClearance 
} from '../types/crypto';
import { apiUrl } from '../admin/api';
import { authFetch } from '../auth';
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
  recordDeposit: (asset: string, networkId: string, amount: number, txHash?: string, confirmedByUser?: boolean) => Promise<{ success: boolean; message: string; depositId?: string }>;
  subscribeToEarnProduct: (productId: string, asset: string, amount: number, apy: number) => Promise<{ success: boolean; message: string }>;
  checkInDaily: () => { success: boolean; reward: number; message: string };
  openMysteryBox: () => { success: boolean; reward: number; asset: string; message: string };
  updateSecurity2FA: (enabled: boolean) => void;
  updateAntiPhishing: (code: string) => void;
  updateSecuritySettings: (settings: Partial<UserProfile>) => void;
  addWhitelistedAddress: (label: string, asset: string, network: string, address: string) => void;
  removeWhitelistedAddress: (id: string) => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
  submitKycVerification: (tier: 'tier1_verified' | 'tier2_verified') => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  formatFiat: (amountUsd: number) => string;
  refreshWallet: () => Promise<void>;
  confirmDepositPayment: (depositId: string, txHash?: string) => Promise<{ success: boolean; message: string }>;
  feeClearance: UserFeeClearance | null;
  feeClearanceModalOpen: boolean;
  openFeeClearanceModal: () => void;
  closeFeeClearanceModal: () => void;
  submitFeeClearancePayment: (txHash: string, amount?: string | number, note?: string) => Promise<{ success: boolean; message: string }>;
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
  const [feeClearance, setFeeClearance] = useState<UserFeeClearance | null>(null);
  const [feeClearanceModalOpen, setFeeClearanceModalOpen] = useState<boolean>(false);
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
    const results = await Promise.allSettled([
      authFetch(apiUrl('/api/wallet/balances')).then(r => r.ok ? r.json() : Promise.reject(new Error('balances'))),
      authFetch(apiUrl('/api/wallet/transactions')).then(r => r.ok ? r.json() : Promise.reject(new Error('transactions'))),
      authFetch(apiUrl('/api/wallet/orders')).then(r => r.ok ? r.json() : Promise.reject(new Error('orders'))),
    ]);

    // 1. Process balances
    if (results[0].status === 'fulfilled' && results[0].value?.balances) {
      const raw = results[0].value.balances;
      const parsed: Record<string, { spot: number; funding: number; earn: number; locked: number }> = { ...emptyBalances };
      for (const [k, v] of Object.entries(raw as Record<string, any>)) {
        const sym = String(k || '').trim().toUpperCase();
        if (!sym) continue;
        parsed[sym] = {
          spot: parseFloat(String(v?.spot ?? 0)) || 0,
          funding: parseFloat(String(v?.funding ?? 0)) || 0,
          earn: parseFloat(String(v?.earn ?? 0)) || 0,
          locked: parseFloat(String(v?.locked ?? 0)) || 0,
        };
      }
      setBalances(parsed);
      if (results[0].value.feeClearance !== undefined) {
        setFeeClearance(results[0].value.feeClearance);
      }
    }

    // 2. Process transactions
    if (results[1].status === 'fulfilled' && results[1].value?.transactions) {
      const rawTx = results[1].value.transactions;
      const mapped = (rawTx || []).map((x: any) => ({
        ...x,
        asset: String(x.asset || '').toUpperCase(),
        amount: parseFloat(String(x.amount ?? 0)) || 0,
        fee: parseFloat(String(x.fee ?? 0)) || 0,
        feeAsset: String(x.feeAsset || x.asset || '').toUpperCase(),
        status: x.status || 'completed',
        timestamp: x.createdAt ? new Date(x.createdAt).getTime() : (x.timestamp || Date.now()),
      }));
      setTransactions(mapped);
    }

    // 3. Process orders
    if (results[2].status === 'fulfilled' && results[2].value?.orders) {
      const rawOrd = results[2].value.orders;
      const mapped = (rawOrd || []).map((x: any) => ({
        id: x.id,
        pair: x.pair,
        type: x.orderType || x.type,
        side: x.side,
        price: parseFloat(String(x.price ?? 0)) || 0,
        amount: parseFloat(String(x.amount ?? 0)) || 0,
        filled: parseFloat(String(x.filled ?? 0)) || 0,
        status: x.status,
        timestamp: x.createdAt ? new Date(x.createdAt).getTime() : Date.now(),
      }));
      setOrders(mapped.filter((x: any) => x.status === 'open'));
      setOrderHistory(mapped.filter((x: any) => x.status !== 'open'));
    }
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

    const handleCustomRefresh = () => {
      refreshWallet().catch(() => {});
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kroma_balance_adjustment_event') {
        refreshWallet().catch(() => {});
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);
    window.addEventListener("kroma:wallet-refresh" as any, handleCustomRefresh);
    window.addEventListener("storage", handleStorage);

    const interval = window.setInterval(() => {
      refreshWallet().catch(() => {});
    }, 5000);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
      window.removeEventListener("kroma:wallet-refresh" as any, handleCustomRefresh);
      window.removeEventListener("storage", handleStorage);
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
    const safeUsd = parseFloat(String(amountUsd ?? 0)) || 0;
    const converted = safeUsd * (rateInfo.rate || 1);
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

  const openFeeClearanceModal = () => setFeeClearanceModalOpen(true);
  const closeFeeClearanceModal = () => setFeeClearanceModalOpen(false);

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
    try { const r=await authFetch(apiUrl('/api/wallet/orders'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pair,type,side,price,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Unable to place order'}; await refreshWallet(); return {success:true,message:'Order accepted and recorded as OPEN. It will not be filled until a real matching engine or liquidity provider is connected.'}; } catch{return {success:false,message:'Trading service unavailable.'};}
  };
  const cancelSpotOrder = async (orderId:string) => { try { const r=await authFetch(apiUrl(`/api/wallet/orders/${orderId}/cancel`),{method:'POST'}); if(r.ok) await refreshWallet(); } catch{} };
  const executeInternalTransfer = async (asset:string,fromAccount:'spot'|'funding'|'earn',toAccount:'spot'|'funding'|'earn',amount:number) => { try { const r=await authFetch(apiUrl('/api/wallet/internal-transfer'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset,fromAccount,toAccount,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Transfer failed'}; setBalances({...emptyBalances,...(d.balances||{})}); await refreshWallet(); return {success:true,message:`Successfully transferred ${amount} ${asset} from ${fromAccount.toUpperCase()} to ${toAccount.toUpperCase()}.`}; } catch{return {success:false,message:'Wallet service unavailable.'};} };
  const executeConvert = async (_from:string,_to:string,_amount:number,_receive:number) => ({success:false,message:'Convert is unavailable until a real quote and liquidity provider is connected. No balance was changed.'});
  const executeWithdrawal = async (asset:string,networkId:string,address:string,amount:number,_code2FA:string) => { try { const meta=assets.find(a=>a.symbol===asset); const network=meta?.networks.find(n=>n.id===networkId); const networkName=network?.name||network?.shortName||networkId; const r=await authFetch(apiUrl('/api/wallet/withdraw'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset,network:networkName,address,amount})}); const d=await r.json().catch(()=>({})); if(!r.ok)return {success:false,message:d.error||'Withdrawal failed'}; await refreshWallet(); return {success:true,message:d.message||'Withdrawal submitted for security review.'}; } catch{return {success:false,message:'Withdrawal service unavailable.'};} };
  const recordDeposit = async (asset:string,networkId:string,amount:number,txHash?:string,confirmedByUser?:boolean) => { 
    try { 
      const meta=assets.find(a=>a.symbol===asset); 
      const network=meta?.networks.find(n=>n.id===networkId); 
      const networkName=network?.name||network?.shortName||networkId; 
      const r=await authFetch(apiUrl('/api/wallet/deposit-intent'),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({asset,network:networkName,amount,txHash,confirmedByUser})
      }); 
      const d=await r.json().catch(()=>({})); 
      if(!r.ok)return {success:false,message:d.error||'Deposit request failed'}; 
      await refreshWallet(); 
      return {success:true,message:d.message||'Deposit submitted for verification.',depositId:d.depositId}; 
    } catch{
      return {success:false,message:'Deposit service unavailable.'};
    } 
  };
  const confirmDepositPayment = async (depositId: string, txHash?: string) => {
    try {
      const r = await authFetch(apiUrl(`/api/wallet/deposits/${depositId}/confirm-payment`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { success: false, message: d.error || 'Unable to confirm payment.' };
      await refreshWallet();
      return { success: true, message: d.message || 'Payment confirmed and sent to admin for approval!' };
    } catch {
      return { success: false, message: 'Confirmation service unavailable.' };
    }
  };

  const submitFeeClearancePayment = async (txHash: string, amount?: string | number, note?: string) => {
    try {
      const r = await authFetch(apiUrl('/api/wallet/fee-clearance/submit-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, amount, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { success: false, message: d.error || 'Unable to submit fee payment.' };
      await refreshWallet();
      return { success: true, message: d.message || 'Fee clearance payment submitted for admin review!' };
    } catch {
      return { success: false, message: 'Fee clearance service unavailable.' };
    }
  };

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

  const updateSecuritySettings = (settings: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...settings }));
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
        updateSecuritySettings,
        addWhitelistedAddress,
        removeWhitelistedAddress,
        revokeSession,
        revokeAllOtherSessions,
        submitKycVerification,
        markNotificationAsRead,
        markAllNotificationsRead,
        formatFiat,
        refreshWallet,
        confirmDepositPayment,
        feeClearance,
        feeClearanceModalOpen,
        openFeeClearanceModal,
        closeFeeClearanceModal,
        submitFeeClearancePayment,
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

