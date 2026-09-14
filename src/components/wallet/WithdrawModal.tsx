import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { X, ArrowUpRight, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const {
    withdrawModalOpen,
    closeWithdrawModal,
    activeModalAsset,
    assets,
    balances,
    userProfile,
    executeWithdrawal,
  } = useCrypto();

  const [selectedSymbol, setSelectedSymbol] = useState(activeModalAsset || 'USDT');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isWhitelistingOpen, setIsWhitelistingOpen] = useState(false);

  if (!withdrawModalOpen) return null;

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];
  const spotBalance = balances[selectedSymbol]?.spot || 0;
  const networks = currentAsset.networks || [];
  const currentNetwork = networks.find(n => n.id === selectedNetworkId) || networks[0] || {
    id: 'default',
    name: 'Default',
    shortName: currentAsset.symbol,
    fee: 0.5,
    feeAsset: currentAsset.symbol,
    estimatedTime: '2-5 min',
    minConfirmations: 12,
    depositAddress: '',
  };

  const numericAmount = parseFloat(withdrawAmount) || 0;
  const networkFee = currentNetwork.fee || 0;
  const receiveAmount = Math.max(0, numericAmount - networkFee);

  const handlePercentage = (pct: number) => {
    const calculated = (spotBalance * pct).toFixed(currentAsset.decimalPlaces > 2 ? 4 : 2);
    setWithdrawAmount(calculated);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (numericAmount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }
    if (!destinationAddress || destinationAddress.length < 10) {
      setErrorMsg('Please provide a valid destination blockchain address.');
      return;
    }
    if (numericAmount <= networkFee) {
      setErrorMsg(`Amount must exceed the network gas fee (${networkFee} ${currentNetwork.feeAsset}).`);
      return;
    }
    if (userProfile.twoFactorEnabled && (!totpCode || totpCode.trim().length !== 6)) {
      setErrorMsg('Please enter the 6-digit Google Authenticator 2FA code.');
      return;
    }

    const result = await executeWithdrawal(
      selectedSymbol,
      currentNetwork.id,
      destinationAddress,
      numericAmount,
      totpCode
    );

    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setSuccessMsg(result.message);
      setWithdrawAmount('');
      setTotpCode('');
      setTimeout(() => {
        closeWithdrawModal();
        setSuccessMsg('');
      }, 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Withdraw Crypto</h3>
              <p className="text-xs text-slate-400">On-chain settlement to external custody</p>
            </div>
          </div>
          <button
            onClick={closeWithdrawModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-4">
          {/* Asset picker */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-semibold text-slate-300">Select Asset</span>
              <span className="text-slate-400">
                Available in Spot: <strong className="text-cyan-400 font-mono">{spotBalance} {selectedSymbol}</strong>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['USDT', 'BTC', 'ETH', 'SOL', 'USDC', 'SUI', 'AVAX', 'NEAR'].map(sym => (
                <button
                  type="button"
                  key={sym}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    const newAsset = assets.find(a => a.symbol === sym);
                    if (newAsset?.networks.length) setSelectedNetworkId(newAsset.networks[0].id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedSymbol === sym
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Destination Network</label>
            <div className="space-y-1.5">
              {networks.map(net => (
                <button
                  type="button"
                  key={net.id}
                  onClick={() => setSelectedNetworkId(net.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    (selectedNetworkId === net.id || (!selectedNetworkId && currentNetwork.id === net.id))
                      ? 'bg-slate-800/90 border-rose-500/80 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200">{net.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Est. Time: {net.estimatedTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      Fee: {net.fee} {net.feeAsset}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Destination Address */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-semibold text-slate-300">Recipient Address</span>
              {userProfile.whitelistedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsWhitelistingOpen(!isWhitelistingOpen)}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Address Book
                </button>
              )}
            </div>

            {isWhitelistingOpen && (
              <div className="mb-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Whitelisted Addresses</div>
                {userProfile.whitelistedAddresses.map(w => (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => {
                      setDestinationAddress(w.address);
                      setIsWhitelistingOpen(false);
                    }}
                    className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800 text-xs flex justify-between items-center"
                  >
                    <span className="font-semibold text-white">{w.label}</span>
                    <span className="font-mono text-[11px] text-cyan-400 truncate max-w-[200px]">{w.address}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={destinationAddress}
              onChange={e => setDestinationAddress(e.target.value)}
              placeholder={`Enter or paste ${currentNetwork.shortName} address`}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-semibold text-slate-300">Withdrawal Amount</span>
              <div className="flex gap-1.5">
                {[0.25, 0.5, 0.75, 1.0].map(pct => (
                  <button
                    type="button"
                    key={pct}
                    onClick={() => handlePercentage(pct)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-rose-400 pr-16"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                {selectedSymbol}
              </span>
            </div>
          </div>

          {/* Fee & Net Summary */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Network Gas Fee:</span>
              <span className="font-mono text-slate-200">{networkFee} {currentNetwork.feeAsset}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-200 border-t border-slate-800/80 pt-2">
              <span>Estimated Receive:</span>
              <span className="font-mono text-emerald-400 text-sm">
                {receiveAmount.toFixed(currentAsset.decimalPlaces > 2 ? 4 : 2)} {selectedSymbol}
              </span>
            </div>
          </div>

          {/* 2FA Security check */}
          {userProfile.twoFactorEnabled && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Google Authenticator 2FA (6 digits)
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center tracking-widest text-lg font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                For test verification, you can enter any 6 digits (e.g. 123456).
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg shadow-rose-500/20 active:scale-98 cursor-pointer"
          >
            Confirm Withdrawal Request
          </button>
        </form>
      </div>
    </div>
  );
};
