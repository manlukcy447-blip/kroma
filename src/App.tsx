/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CryptoProvider, useCrypto } from './context/CryptoContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileNav } from './components/common/MobileNav';

// View Components
import { HomeView } from './components/home/HomeView';
import { MarketsView } from './components/markets/MarketsView';
import { SpotTradingView } from './components/trade/SpotTradingView';
import { WalletView } from './components/wallet/WalletView';
import { BuySellView } from './components/buysell/BuySellView';
import { ConvertView } from './components/convert/ConvertView';
import { P2PView } from './components/p2p/P2PView';
import { EarnView } from './components/earn/EarnView';
import { RewardsView } from './components/rewards/RewardsView';
import { SecurityView } from './components/security/SecurityView';
import { KycView } from './components/kyc/KycView';
import { ProfileView } from './components/profile/ProfileView';

// Global Action Modals
import { DepositModal } from './components/wallet/DepositModal';
import { WithdrawModal } from './components/wallet/WithdrawModal';
import { TransferModal } from './components/wallet/TransferModal';
import { SendReceiveModal } from './components/wallet/SendReceiveModal';
import { AdminView } from './admin/AdminView';
import { AuthProvider, useAuth } from './auth';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from './auth/AuthPages';

const UnavailableView: React.FC<{label:string}> = ({label}) => {
  const { setCurrentTab } = useCrypto();
  return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
    <div className="surface-card p-8 sm:p-12 text-center">
      <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><ShieldAlert className="h-7 w-7 text-amber-400"/></div>
      <div className="eyebrow">Provider not connected</div>
      <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{label} is not live yet</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400 max-w-xl mx-auto">Kroma keeps this feature disabled until the required external provider, liquidity, custody or payment rail is connected. Your wallet balance is not changed by this screen.</p>
      <button onClick={() => setCurrentTab('home')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">Back to dashboard <ArrowRight className="w-4 h-4"/></button>
    </div>
  </div>;
};

const AppContent: React.FC = () => {
  const { currentTab, featureFlags } = useCrypto();

  const disabledLabels: Record<string,string> = {
    p2p: 'P2P trading', buySell: 'Fiat Buy / Sell', convert: 'Convert', earn: 'Earn', rewards: 'Rewards'
  };
  const gatedTab = currentTab === 'p2p' ? 'p2p' : currentTab === 'buysell' ? 'buySell' : currentTab === 'convert' ? 'convert' : currentTab === 'earn' ? 'earn' : currentTab === 'rewards' ? 'rewards' : null;
  if (gatedTab && featureFlags[gatedTab] === false) return <UnavailableView label={disabledLabels[gatedTab]} />;

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView />;
      case 'markets':
        return <MarketsView />;
      case 'trade':
        return <SpotTradingView />;
      case 'wallet':
        return <WalletView />;
      case 'buysell':
        return <BuySellView />;
      case 'convert':
        return <ConvertView />;
      case 'p2p':
        return <P2PView />;
      case 'earn':
        return <EarnView />;
      case 'rewards':
        return <RewardsView />;
      case 'security':
        return <SecurityView />;
      case 'kyc':
        return <KycView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-900 pb-16 md:pb-0">
      {/* Top Main Navigation Bar */}
      <Header />

      {/* Main View Router Stage */}
      <main className="flex-1">
        {renderCurrentView()}
      </main>

      {/* Global Modals for Crypto Operations */}
      <DepositModal />
      <WithdrawModal />
      <TransferModal />
      <SendReceiveModal />

      {/* Footer */}
      <Footer />

      {/* Bottom Dock for Mobile Screens */}
      <MobileNav />
    </div>
  );
};

function ProtectedApp(){ const {user,loading}=useAuth(); if(loading) return <div className="min-h-screen bg-[#070A10] text-slate-400 flex items-center justify-center">Loading secure session…</div>; if(!user){ window.location.replace('/login'); return null; } return <CryptoProvider><AppContent /></CryptoProvider>; }

export default function App() {
  const path=window.location.pathname;
  if (path.startsWith('/admin')) return <AdminView />;
  return <AuthProvider>{path==='/login'?<LoginPage/>:path==='/signup'?<SignupPage/>:path==='/forgot-password'?<ForgotPasswordPage/>:path==='/reset-password'?<ResetPasswordPage/>:<ProtectedApp/>}</AuthProvider>;
}

