import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  Lock, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  X,
  Copy,
  Check
} from 'lucide-react';

export const SecurityView: React.FC = () => {
  const { userProfile, updateSecuritySettings, t } = useCrypto();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showAntiPhishModal, setShowAntiPhishModal] = useState(false);
  const [antiPhishInput, setAntiPhishInput] = useState(userProfile.antiPhishingCode || '');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sessions, setSessions] = useState([
    { id: '1', device: 'Chrome on Linux (X11)', ip: '198.51.100.24', location: 'San Francisco, US', current: true, time: 'Now' },
    { id: '2', device: 'Kroma iOS App (iPhone 15 Pro)', ip: '172.56.21.9', location: 'San Francisco, US', current: false, time: '2 hours ago' },
    { id: '3', device: 'Firefox on macOS Sonoma', ip: '203.0.113.88', location: 'London, UK', current: false, time: '3 days ago' },
  ]);

  const [whitelist, setWhitelist] = useState([
    { id: 'w1', label: 'Ledger Cold Vault', asset: 'BTC', address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', network: 'Bitcoin' },
    { id: 'w2', label: 'Trezor Hardware', asset: 'ETH', address: '0x71C...4392', network: 'Ethereum' },
  ]);

  const handleToggle2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFaCode.length < 6) return;
    updateSecuritySettings({ twoFactorEnabled: !userProfile.twoFactorEnabled });
    setFeedback(userProfile.twoFactorEnabled ? '2FA disabled.' : 'Google Authenticator 2FA enabled successfully!');
    setShow2FAModal(false);
    setTwoFaCode('');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveAntiPhish = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecuritySettings({ antiPhishingCode: antiPhishInput });
    setFeedback(`Anti-phishing code updated to "${antiPhishInput}". It will be included in all official Kroma emails.`);
    setShowAntiPhishModal(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setFeedback('Session revoked successfully.');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleRevokeAllOthers = () => {
    setSessions(prev => prev.filter(s => s.current));
    setFeedback('All other active sessions have been terminated.');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header with Health Score */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#141C2E] to-[#0A0D14] border border-slate-700/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>KROMA DEFENSE SUITE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Authentication Center
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Protect your exchange assets with multi-factor authentication, cryptographic anti-phishing markers, and hardware address whitelists.
          </p>
        </div>

        {/* Security Score Meter */}
        <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shrink-0">
          <div className="text-center">
            <span className="text-[11px] text-slate-400 block font-semibold">Security Score</span>
            <div className="text-2xl font-black font-mono text-emerald-400">85 / 100</div>
            <span className="text-[10px] text-slate-500">Tier 2 Protection Active</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2. Core Security Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 2FA Card */}
        <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Two-Factor Authentication (2FA)</h4>
                  <p className="text-xs text-slate-400">Google Authenticator or YubiKey OTP</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                userProfile.twoFactorEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950 text-rose-300 border border-rose-800/60'
              }`}>
                {userProfile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Required for crypto withdrawals, API key generation, and modifying sensitive account settings.
            </p>
          </div>

          <button
            onClick={() => setShow2FAModal(true)}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 transition-colors"
          >
            {userProfile.twoFactorEnabled ? 'Manage 2FA Settings' : 'Enable 2FA Now'}
          </button>
        </div>

        {/* Anti-Phishing Code */}
        <div className="p-5 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Anti-Phishing Code</h4>
                  <p className="text-xs text-slate-400">Verify official Kroma communications</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                {userProfile.antiPhishingCode ? 'Configured' : 'Not Set'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When configured, this secret code will be included in the header of all official confirmation emails.
            </p>
          </div>

          <button
            onClick={() => setShowAntiPhishModal(true)}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 transition-colors"
          >
            Configure Anti-Phishing Code
          </button>
        </div>
      </div>

      {/* 3. Whitelist Addresses */}
      <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-white text-sm">Withdrawal Whitelist</h4>
            <p className="text-xs text-slate-400">Restricts withdrawals exclusively to approved verified addresses</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
            Whitelist Protection ON
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800 font-sans">
              <tr>
                <th className="pb-2">Label</th>
                <th className="pb-2">Coin / Network</th>
                <th className="pb-2">Whitelisted Address</th>
                <th className="pb-2 text-right font-sans">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {whitelist.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-bold text-white font-sans">{item.label}</td>
                  <td className="py-2.5 text-slate-300">{item.asset} ({item.network})</td>
                  <td className="py-2.5 text-slate-400">{item.address}</td>
                  <td className="py-2.5 text-right font-sans">
                    <button
                      onClick={() => setWhitelist(prev => prev.filter(w => w.id !== item.id))}
                      className="p-1 rounded text-rose-400 hover:bg-rose-950 transition-colors"
                      title="Remove whitelist address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Active Sessions / Devices */}
      <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-white text-sm">Active Devices & Sessions</h4>
            <p className="text-xs text-slate-400">Manage signed-in web browsers and mobile application instances</p>
          </div>
          <button
            onClick={handleRevokeAllOthers}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
          >
            Revoke All Other Sessions
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map(s => (
            <div
              key={s.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <Laptop className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{s.device}</span>
                    {s.current && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    IP: {s.ip} • {s.location} • Last active: {s.time}
                  </div>
                </div>
              </div>

              {!s.current && (
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  Terminate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Google Authenticator Setup</h3>
              <button onClick={() => setShow2FAModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleToggle2FA} className="space-y-4 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-center">
                <div className="font-mono text-cyan-400 font-bold tracking-widest text-sm">
                  JBSWY3DPEHPK3PXP
                </div>
                <div className="text-[11px] text-slate-400">
                  Scan the QR in Google Authenticator or enter this secret key manually.
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Enter 6-digit verification code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFaCode}
                  onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 shadow-md cursor-pointer"
              >
                {userProfile.twoFactorEnabled ? 'Disable 2FA' : 'Verify & Enable 2FA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Anti-Phish Modal */}
      {showAntiPhishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Set Anti-Phishing Code</h3>
              <button onClick={() => setShowAntiPhishModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAntiPhish} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Secret Code (4-20 alphanumeric characters)</label>
                <input
                  type="text"
                  value={antiPhishInput}
                  onChange={e => setAntiPhishInput(e.target.value)}
                  placeholder="e.g. KR-SAFE-99"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 shadow-md cursor-pointer"
              >
                Save Anti-Phishing Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
