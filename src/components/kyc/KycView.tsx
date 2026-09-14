import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { ShieldCheck, CheckCircle2, Upload, Camera, FileText, AlertCircle, X, ChevronRight } from 'lucide-react';

export const KycView: React.FC = () => {
  const { userProfile, updateSecuritySettings, t } = useCrypto();
  const [showModal, setShowModal] = useState(false);
  const [idType, setIdType] = useState<'passport' | 'drivers_license' | 'national_id'>('passport');
  const [idNumber, setIdNumber] = useState('');
  const [country, setCountry] = useState('United States');
  const [uploadedFront, setUploadedFront] = useState(false);
  const [uploadedBack, setUploadedBack] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      setStatusMsg('Please provide your identity document number.');
      return;
    }

    updateSecuritySettings({ kycTier: 2 });
    setStatusMsg('Verification documents submitted! Verification is automated and typically completes in under 2 minutes.');
    setTimeout(() => {
      setShowModal(false);
      setStatusMsg(null);
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1420] via-[#141C2E] to-[#0A0D14] border border-slate-700/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>GLOBAL COMPLIANCE & IDENTITY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Identity Verification (KYC)
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Upgrade your verification level to unlock higher daily withdrawal limits, fiat bank wire deposits, and access to the OTC liquidity desk.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/80 px-4 py-3 rounded-2xl border border-slate-800 shrink-0 font-mono text-xs">
          <span className="text-slate-400">Current Status:</span>
          <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
            Tier {userProfile.kycTier} Verified
          </span>
        </div>
      </div>

      {/* 2. Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tier 1 */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xl ${
          userProfile.kycTier >= 1
            ? 'bg-[#0E131D] border-emerald-500/40'
            : 'bg-[#0E131D] border-slate-800'
        }`}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-base">Tier 1: Standard</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Active
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Crypto deposits & withdrawals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Spot & P2P Trading</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>$50,000 daily withdrawal limit</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified via Email & Phone
            </span>
          </div>
        </div>

        {/* Tier 2 */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xl ${
          userProfile.kycTier >= 2
            ? 'bg-[#0E131D] border-cyan-500/40'
            : 'bg-[#0E131D] border-slate-800 hover:border-slate-700'
        }`}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-base">Tier 2: Advanced</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Recommended
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Government ID verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>$2,000,000 daily withdrawal limit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>SEPA & SWIFT Bank Wire access</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow cursor-pointer"
          >
            {userProfile.kycTier >= 2 ? 'Verified (Update Info)' : 'Upgrade to Tier 2'}
          </button>
        </div>

        {/* Tier 3 */}
        <div className="p-6 rounded-2xl bg-[#0E131D] border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-base">Tier 3: Institutional</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Enterprise
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Corporate entity onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Unlimited daily withdrawals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Dedicated key account manager</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Contacting Institutional Desk: support@kroma.exchange')}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          >
            Contact OTC Desk
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Tier 2 Identity Verification</h3>
                <p className="text-[11px] text-slate-400">Fast automated AI document verification</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Country of Issuance</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Japan">Japan</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Document Type</label>
                  <select
                    value={idType}
                    onChange={e => setIdType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Document Number</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  placeholder="e.g. A92834190"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Upload Dropzones */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setUploadedFront(!uploadedFront)}
                  className={`p-4 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                    uploadedFront
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-400'
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1" />
                  <span className="font-semibold block">{uploadedFront ? 'Front Uploaded ✓' : 'Upload Front'}</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG or PDF</span>
                </div>

                <div
                  onClick={() => setUploadedBack(!uploadedBack)}
                  className={`p-4 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                    uploadedBack
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-400'
                  }`}
                >
                  <Camera className="w-5 h-5 mx-auto mb-1" />
                  <span className="font-semibold block">{uploadedBack ? 'Back / Selfie ✓' : 'Upload Back'}</span>
                  <span className="text-[10px] text-slate-500">Liveness verification</span>
                </div>
              </div>

              {statusMsg && (
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[11px]">
                  {statusMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:opacity-95 shadow-md active:scale-98 cursor-pointer"
              >
                Submit Documents for Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
