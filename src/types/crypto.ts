export type NavigationTab = 
  | 'home' 
  | 'markets' 
  | 'trade' 
  | 'convert' 
  | 'wallet' 
  | 'buysell' 
  | 'p2p' 
  | 'earn' 
  | 'rewards' 
  | 'security' 
  | 'kyc' 
  | 'profile';

export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF';
export type LanguageCode = 'en' | 'es' | 'de' | 'fr' | 'ja' | 'zh' | 'pt';

export interface CryptoNetwork {
  id: string;
  name: string;
  shortName: string;
  fee: number;
  feeAsset: string;
  estimatedTime: string;
  minConfirmations: number;
  depositAddress: string;
  memoRequired?: boolean;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  category: 'Layer 1' | 'DeFi' | 'AI & Data' | 'Layer 2' | 'Meme' | 'Stablecoin';
  priceUsd: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  iconBg: string;
  networks: CryptoNetwork[];
  sparkline: number[];
  decimalPlaces: number;
}

export interface WalletBalance {
  symbol: string;
  spot: number;
  funding: number;
  earn: number;
  locked: number;
}

export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  spread: number;
  spreadPercent: number;
}

export interface SpotOrder {
  id: string;
  pair: string;
  type: 'limit' | 'market';
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  filled: number;
  status: 'open' | 'filled' | 'canceled';
  timestamp: number;
}

export interface TradeHistoryItem {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  time: string;
  timestamp: number;
}

export interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'trade' | 'swap' | 'earn_yield' | 'admin_credit' | 'admin_debit' | (string & {});
  asset: string;
  amount: number;
  fee: number;
  feeAsset: string;
  status: 'completed' | 'processing' | 'pending' | 'pending_security' | 'awaiting_approval' | 'pending_verification' | 'failed' | (string & {});
  timestamp: number;
  txHash?: string;
  network?: string;
  destination?: string;
  details?: string;
}

export interface P2POffer {
  id: string;
  merchantName: string;
  verified: boolean;
  ordersCompleted: number;
  completionRate: number;
  type: 'buy' | 'sell';
  crypto: string;
  fiat: FiatCurrency;
  price: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  responseTime: string;
}

export interface EarnProduct {
  id: string;
  asset: string;
  type: 'flexible' | 'locked' | 'dual';
  durationDays: number; // 0 for flexible
  apy: number;
  minDeposit: number;
  maxDeposit: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
}

export interface UserEarnSubscription {
  id: string;
  productId: string;
  asset: string;
  amount: number;
  apy: number;
  startDate: number;
  interestAccrued: number;
  autoRenew: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  email: string;
  vipTier: number;
  kycTier?: number;
  kycStatus: 'unverified' | 'tier1_verified' | 'tier2_verified' | 'under_review';
  twoFactorEnabled: boolean;
  antiPhishingCode: string;
  activeSessions: ActiveSession[];
  whitelistedAddresses: {
    id: string;
    label: string;
    asset: string;
    network: string;
    address: string;
  }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'trade' | 'security' | 'reward';
  timestamp: number;
  read: boolean;
}

export interface UserFeeClearance {
  id?: string;
  userId?: string;
  holdActive: boolean;
  feeAmount: string | number;
  feeAsset: string;
  feeNetwork: string;
  clearanceAddress: string;
  reason?: string;
  instructions?: string;
  clearedAmount?: string | number;
  status: 'unpaid' | 'submitted' | 'cleared';
  txHash?: string | null;
  paymentProofNote?: string | null;
  submittedAt?: string | null;
  clearedAt?: string | null;
  updatedAt?: string | null;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  type: string;
  rewardAmount: string;
  rewardValueUsd: number;
  minInvestment: number;
  roiPercentage: number;
  status: 'active' | 'paused';
  regionRestricted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradingPairConfig {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  status: 'active' | 'halted' | 'maintenance';
  regionRestricted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradingSettingsConfig {
  makerFee?: number;
  takerFee?: number;
  makerFeePercent?: number;
  takerFeePercent?: number;
  minOrderSizeUsd?: number;
  maxSlippagePercent?: number;
  haltAllTrading: boolean;
  regionRestricted: boolean;
}

export interface FeatureSettingItem {
  key: string;
  enabled: boolean;
  regionRestricted: boolean;
  restrictionMessage?: string;
  updatedAt?: string;
}

