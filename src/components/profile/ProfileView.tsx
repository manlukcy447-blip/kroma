import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  Sparkles, 
  Clock, 
  Settings, 
  X,
  Lock
} from 'lucide-react';
import { LanguageCode, FiatCurrency } from '../../types/crypto';

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    language,
    setLanguage,
    fiatCurrency,
    setFiatCurrency,
    t,
  } = useCrypto();

  const [activeTab, setActiveTab] = useState<'profile' | 'fees' | 'api'>('profile');
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiName, setApiName] = useState('');
  const [apiPerms, setApiPerms] = useState({ read: true, trade: true, withdraw: false });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState([
    { id: 'k1', name: 'TradingBot-Pro', key: 'kr_live_89f1a238b...990d', created: '2025-01-15', perms: ['Read', 'Spot Trade'] },
    { id: 'k2', name: 'PortfolioTracker', key: 'kr_live_44e991cb1...120a', created: '2025-02-01', perms: ['Read'] },
  ]);

  const vipTiers = [
    { tier: 'VIP 0', volume: '< $10,000', maker: '0.100%', taker: '0.100%', current: false },
    { tier: 'VIP 1', volume: '≥ $10,000', maker: '0.080%', taker: '0.090%', current: false },
    { tier: 'VIP 2', volume: '≥ $50,000', maker: '0.060%', taker: '0.080%', current: true },
    { tier: 'VIP 3', volume: '≥ $250,000', maker: '0.040%', taker: '0.060%', current: false },
    { tier: 'VIP 4', volume: '≥ $1,000,000', maker: '0.020%', taker: '0.040%', current: false },
    { tier: 'VIP 5', volume: '≥ $5,000,000', maker: '0.000%', taker: '0.020%', current: false },
  ];

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiName.trim()) return;

    const newKey = {
      id: `k-${Date.now()}`,
      name: apiName,
      key: `kr_live_${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split('T')[0],
      perms: Object.entries(apiPerms)
        .filter(([_, v]) => v)
        .map(([k]) => k === 'read' ? 'Read' : k === 'trade' ? 'Spot Trade' : 'Withdraw'),
    };

    setApiKeys([newKey, ...apiKeys]);
    setShowApiModal(false);
    setApiName('');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header Profile Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#141C2E] to-[#0A0D14] border border-slate-700/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-lg">
            <div className="w-full h-full rounded-2xl bg-[#111622] flex items-center justify-center text-cyan-400 font-extrabold text-2xl">
              {userProfile.nickname.slice(0, 1)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{userProfile.nickname}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                VIP Tier {userProfile.vipTier}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              UID: <strong className="text-cyan-400">{userProfile.uid}</strong> • {userProfile.email}
            </div>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'profile' ? 'bg-cyan-500 text-slate-900 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'fees' ? 'bg-cyan-500 text-slate-900 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            VIP Fee Rates
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'api' ? 'bg-cyan-500 text-slate-900 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            API Management
          </button>
        </div>
      </div>

      {/* Tab: Preferences */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Account Settings</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Display Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as LanguageCode)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="zh">简体中文</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Reference Fiat Currency</label>
                <select
                  value={fiatCurrency}
                  onChange={e => setFiatCurrency(e.target.value as FiatCurrency)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Security Summary</h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">KYC Status:</span>
                <span className="text-emerald-400 font-bold">Tier {userProfile.kycTier} Verified</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">2FA Authenticator:</span>
                <span className={userProfile.twoFactorEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {userProfile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Anti-Phishing Code:</span>
                <span className="text-cyan-400 font-mono font-bold">{userProfile.antiPhishingCode || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Current Login IP:</span>
                <span className="font-mono text-slate-300">198.51.100.24 (San Francisco)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: VIP Fee Schedule */}
      {activeTab === 'fees' && (
        <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Trading Fee Schedule</h3>
              <p className="text-xs text-slate-400">Higher 30-day trading volume automatically unlocks discounted maker/taker fees</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Your Current Level: VIP 2
            </span>
          </div>

          {/* Mobile View: VIP Tier Cards */}
          <div className="md:hidden divide-y divide-slate-800/60 font-mono">
            {vipTiers.map(tier => (
              <div key={tier.tier} className={`py-3.5 space-y-2 ${tier.current ? 'bg-cyan-950/20 px-3 rounded-xl border border-cyan-800/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm font-sans">{tier.tier}</span>
                  {tier.current ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Current Tier
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Tier</span>
                  )}
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 font-sans">Volume: </span>
                  <span>{tier.volume}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 font-sans">Maker: </span>
                    <span className="text-emerald-400 font-bold">{tier.maker}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-sans">Taker: </span>
                    <span className="text-cyan-400 font-bold">{tier.taker}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Full Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800 font-sans">
                <tr>
                  <th className="pb-3">VIP Tier</th>
                  <th className="pb-3">30-Day Trading Volume</th>
                  <th className="pb-3 text-right">Maker Fee</th>
                  <th className="pb-3 text-right">Taker Fee</th>
                  <th className="pb-3 text-right font-sans">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {vipTiers.map(tier => (
                  <tr key={tier.tier} className={tier.current ? 'bg-cyan-950/20' : 'hover:bg-slate-800/30'}>
                    <td className="py-3 font-bold text-white font-sans">{tier.tier}</td>
                    <td className="py-3 text-slate-300">{tier.volume}</td>
                    <td className="py-3 text-right text-emerald-400 font-bold">{tier.maker}</td>
                    <td className="py-3 text-right text-cyan-400 font-bold">{tier.taker}</td>
                    <td className="py-3 text-right font-sans">
                      {tier.current ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Current Tier
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: API Management */}
      {activeTab === 'api' && (
        <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">API Key Management</h3>
              <p className="text-xs text-slate-400">Create programmatic API keys to connect algorithmic bots and portfolio tracking apps</p>
            </div>
            <button
              onClick={() => setShowApiModal(true)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create API Key</span>
            </button>
          </div>

          {/* Mobile View: API Key Cards */}
          <div className="md:hidden divide-y divide-slate-800/60 font-mono">
            {apiKeys.map(k => (
              <div key={k.id} className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-sans text-sm">{k.name}</span>
                  <button
                    onClick={() => setApiKeys(prev => prev.filter(item => item.id !== k.id))}
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-950 transition-colors"
                    title="Delete Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-xs">
                  <span className="text-cyan-400 truncate mr-2">{k.key}</span>
                  <button
                    onClick={() => handleCopyKey(k.key)}
                    className="text-slate-400 hover:text-white shrink-0 flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === k.key ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <div className="flex gap-1">
                    {k.perms.map(p => (
                      <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                  <span>{k.created}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Full Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-800 font-sans">
                <tr>
                  <th className="pb-3">Label</th>
                  <th className="pb-3">API Key (Public)</th>
                  <th className="pb-3">Permissions</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {apiKeys.map(k => (
                  <tr key={k.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-bold text-white font-sans">{k.name}</td>
                    <td className="py-3 text-cyan-400">
                      <div className="flex items-center space-x-1.5">
                        <span>{k.key}</span>
                        <button
                          onClick={() => handleCopyKey(k.key)}
                          className="hover:text-white transition-colors"
                        >
                          {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 font-sans">
                      <div className="flex gap-1">
                        {k.perms.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">{k.created}</td>
                    <td className="py-3 text-right font-sans">
                      <button
                        onClick={() => setApiKeys(prev => prev.filter(item => item.id !== k.id))}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950 transition-colors"
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
      )}

      {/* Create API Key Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New API Key</h3>
              <button onClick={() => setShowApiModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Key Label / Purpose</label>
                <input
                  type="text"
                  value={apiName}
                  onChange={e => setApiName(e.target.value)}
                  placeholder="e.g. My Hummingbot Instance"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiPerms.read}
                      onChange={e => setApiPerms({ ...apiPerms, read: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                    />
                    <span>Read Account Data & Order History</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiPerms.trade}
                      onChange={e => setApiPerms({ ...apiPerms, trade: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                    />
                    <span>Enable Spot Order Placement & Cancellation</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiPerms.withdraw}
                      onChange={e => setApiPerms({ ...apiPerms, withdraw: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                    />
                    <span className="text-rose-400">Enable Crypto Withdrawals (High Risk)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow cursor-pointer"
              >
                Generate API Key Pair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
