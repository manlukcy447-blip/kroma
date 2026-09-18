import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from '../auth';

export type AuthUser = { id: string; email: string; status: string; kycStatus: string; createdAt: string };

type CryptoContextValue = {
  balances: Record<string, { spot: number; funding: number; earn: number; locked: number }>;
  refreshWallet: () => Promise<void>;
  executeInternalTransfer: (asset: string, fromAccount: 'spot' | 'funding' | 'earn', toAccount: 'spot' | 'funding' | 'earn', amount: number) => Promise<{ success: boolean; message: string }>;
};

const CryptoContext = createContext<CryptoContextValue | null>(null);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const emptyBalances = {
    USDT: { spot: 0, funding: 0, earn: 0, locked: 0 },
    BTC: { spot: 0, funding: 0, earn: 0, locked: 0 },
    ETH: { spot: 0, funding: 0, earn: 0, locked: 0 },
    KROMA: { spot: 0, funding: 0, earn: 0, locked: 0 }
  };
  const [balances, setBalances] = useState<any>(emptyBalances);

  const refreshWallet = async () => {
    try {
      const r = await fetch(apiUrl('/api/wallet/balances'), { credentials: 'include' });
      if (!r.ok) return;
      const d = await r.json();
      
      const newBalances = JSON.parse(JSON.stringify(emptyBalances));
      if (d.balances) {
        Object.keys(d.balances).forEach(asset => {
          const sym = asset.toUpperCase();
          if (!newBalances[sym]) newBalances[sym] = { spot: 0, funding: 0, earn: 0, locked: 0 };
          newBalances[sym].spot = parseFloat(d.balances[asset].spot || 0);
          newBalances[sym].funding = parseFloat(d.balances[asset].funding || 0);
          newBalances[sym].earn = parseFloat(d.balances[asset].earn || 0);
          newBalances[sym].locked = parseFloat(d.balances[asset].locked || 0);
        });
      }
      setBalances(newBalances);
    } catch (e) {
      console.error(e);
    }
  };

  const executeInternalTransfer = async (asset: string, fromAccount: string, toAccount: string, amount: number) => {
    try {
      const r = await fetch(apiUrl('/api/wallet/internal-transfer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ asset, fromAccount, toAccount, amount })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { success: false, message: d.error || 'Transfer failed' };
      await refreshWallet();
      return { success: true, message: 'Transfer successful' };
    } catch {
      return { success: false, message: 'Wallet service unavailable.' };
    }
  };

  useEffect(() => { refreshWallet().catch(() => {}); }, []);

  return (
    <CryptoContext.Provider value={{ balances, refreshWallet, executeInternalTransfer }}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const c = useContext(CryptoContext);
  if (!c) throw new Error('useCrypto must be used inside CryptoProvider');
  return c;
};
