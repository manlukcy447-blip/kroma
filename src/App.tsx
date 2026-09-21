/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { FeeClearanceModal } from './components/wallet/FeeClearanceModal';
import { RegionRestrictedModal } from './components/common/RegionRestrictedModal';
import { AdminView } from './admin/AdminView';
import { AuthProvider, useAuth } from './auth';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from './auth/AuthPages';

const UnavailableView: React.FC<{label:string}> = ({label}) => {
  const { setCurrentTab } = useCrypto();
  return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
    <div className="surface-card p-8 sm:p-12 text-center">
      <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><ShieldAlert className="h-7 w-7 text-amber-400"/></div>
      <div className="eyebrow">Service Temporarily Paused</div>
      <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{label} is Currently Offline</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400 max-w-xl mx-auto">This service has been temporarily paused by exchange administration for scheduled maintenance or regulatory compliance. All account balances remain secure.</p>
      <button onClick={() => setCurrentTab('home')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">Back to dashboard <ArrowRight className="w-4 h-4"/></button>
    </div>
  </div>;
};

const AppContent: React.FC = () => {
  const { currentTab, featureFlags, feeClearanceModalOpen, closeFeeClearanceModal } = useCrypto();

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
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-900 pb-16 md:pb-0 overflow-x-hidden w-full max-w-full">
      {/* Top Main Navigation Bar */}
      <Header />

      {/* Main View Router Stage */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {renderCurrentView()}
      </main>

      {/* Global Modals for Crypto Operations */}
      <DepositModal />
      <WithdrawModal />
      <TransferModal />
      <SendReceiveModal />
      <FeeClearanceModal isOpen={feeClearanceModalOpen} onClose={closeFeeClearanceModal} />
      <RegionRestrictedModal />

      {/* Footer */}
      <Footer />

      {/* Bottom Dock for Mobile Screens */}
      <MobileNav />
    </div>
  );
};

function ProtectedApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
    }
  }, [loading, user, onNavigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A10] text-slate-400 flex items-center justify-center">
        Loading secure session…
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <CryptoProvider>
      <AppContent />
    </CryptoProvider>
  );
}

function MainRouter() {
  const [path, setPath] = useState(() => window.location.pathname);
  const { user } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    setPath(newPath);
  };

  if (path.startsWith('/admin')) {
    return <AdminView />;
  }

  // If user is already authenticated and visits /login or /signup, immediately show the protected app
  if (user && (path === '/login' || path === '/signup')) {
    return <ProtectedApp onNavigate={navigate} />;
  }

  if (path === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }
  if (path === '/signup') {
    return <SignupPage onNavigate={navigate} />;
  }
  if (path === '/forgot-password') {
    return <ForgotPasswordPage />;
  }
  if (path === '/reset-password') {
    return <ResetPasswordPage />;
  }

  return <ProtectedApp onNavigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

