import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';

export const SecurityView: React.FC = () => {
  const { userProfile, updateSecuritySettings, t } = useCrypto();

  const [tfaEnabled, setTfaEnabled] = useState(userProfile.twoFactorEnabled || false);
  const [antiPhishingCode, setAntiPhishingCode] = useState(userProfile.antiPhishingCode || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecuritySettings({
      twoFactorEnabled: tfaEnabled,
      antiPhishingCode: antiPhishingCode.trim(),
    });
    setSaveStatus('Security settings updated successfully.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const securityScore = (tfaEnabled ? 40 : 0) + (antiPhishingCode ? 40 : 0) + 20;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#141C2E] to-[#0A0D14] border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>ACCOUNT PROTECTION & 2FA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Security Center</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Manage multi-factor authentication, anti-phishing codes, and withdrawal whitelist protection.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[160px]">
          <span className="text-[11px] font-semibold text-slate-400 block">Security Rating</span>
          <span className="text-2xl font-black text-cyan-400 font-mono">{securityScore}%</span>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
            {securityScore >= 70 ? 'High Protection' : 'Needs Attention'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSaveSecurity} className="p-6 sm:p-8 rounded-2xl bg-[#0E131D] border border-slate-800 shadow-xl space-y-6">
        <h3 className="font-bold text-white text-base">Security Features</h3>

        <div className="divide-y divide-slate-800/60">
          {/* Two-Factor Authentication */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Google Authenticator (2FA)</div>
                <p className="text-xs text-slate-400">Used for login verification and authorizing digital asset withdrawals.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={tfaEnabled}
                onChange={e => setTfaEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Anti-Phishing Code */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Anti-Phishing Code</div>
                <p className="text-xs text-slate-400">Ensures all official emails from Kroma contain your secret code phrase.</p>
              </div>
            </div>
            <input
              type="text"
              value={antiPhishingCode}
              onChange={e => setAntiPhishingCode(e.target.value)}
              placeholder="e.g. KromaSafe2025"
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 sm:w-48"
            />
          </div>

          {/* Withdrawal Whitelist */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Withdrawal Address Whitelist</div>
                <p className="text-xs text-slate-400">Restrict outgoing crypto transfers only to pre-approved addresses.</p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 text-cyan-400 font-mono">
              {(userProfile.whitelistedAddresses?.length || 0)} addresses active
            </div>
          </div>
        </div>

        {saveStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
        >
          Save Security Preferences
        </button>
      </form>
    </div>
  );
};
