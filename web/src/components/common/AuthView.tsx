import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Waves,
  Mail,
  Lock,
  User,
  Phone,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { LanguageCode } from '@aquasustain/shared';

export const AuthView: React.FC = () => {
  const { login, register, resetPassword, showToast, language, setLanguage, t, resetDemoData } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || (mode !== 'forgot' && !password.trim())) {
      showToast('Please fill in all mandatory fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) throw res.error;
        showToast('Password recovery instructions dispatched to your email', 'info');
        setMode('login');
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          showToast('Passwords do not match', 'error');
          setLoading(false);
          return;
        }
        if (!fullName.trim()) {
          showToast('Please enter your full name', 'warning');
          setLoading(false);
          return;
        }
        const res = await register(email, password, {
          name: fullName.trim(),
          phone: phone.trim(),
          role: 'farmer',
        });
        if (res.error) throw res.error;
        showToast('Account registered successfully! Welcome to AquaSustain.', 'success');
      } else {
        const res = await login(email, password);
        if (res.error) throw res.error;
        showToast('Signed in successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F7] flex flex-col justify-between">
      {/* Top Bar with Brand & Language */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo-mark.png"
            alt="AquaSustain"
            className="w-10 h-10 rounded-xl object-contain shadow-sm"
          />
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-ocean-900 leading-none block">
              Aqua<span className="text-ocean-600">Sustain</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500 tracking-tight leading-none mt-0.5 block">
              {t('tagline')}
            </span>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
          <Globe2 className="w-4 h-4 text-ocean-600" />
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-0.5 rounded-md transition ${
                  language === l.code
                    ? 'bg-ocean-700 text-white'
                    : 'text-slate-600 hover:text-ocean-800 hover:bg-slate-100'
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Login / Register Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Header Graphic */}
          <div className="bg-gradient-to-r from-ocean-900 via-ocean-800 to-ocean-700 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-44 h-44 bg-ocean-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-3 shadow-inner p-2">
              <img
                src="/assets/logo-mark.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-extrabold font-heading tracking-tight">
              {mode === 'login' && (language === 'te' ? 'రైతు లాగిన్' : language === 'hi' ? 'किसान लॉगिन' : 'Farmer Sign In')}
              {mode === 'register' && (language === 'te' ? 'రైతు నమోదు' : language === 'hi' ? 'किसान पंजीकरण' : 'Register New Farmer')}
              {mode === 'forgot' && (language === 'te' ? 'పాస్‌వర్డ్ రీసెట్' : language === 'hi' ? 'पासवर्ड रीसेट' : 'Reset Password')}
            </h2>
            <p className="text-xs text-ocean-100/90 mt-1 max-w-xs mx-auto">
              {t('signInSubtitle')}
            </p>

            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' && (
              <div className="flex bg-white/10 p-1 rounded-xl mt-6 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    mode === 'login' ? 'bg-white text-ocean-900 shadow-sm' : 'text-ocean-100 hover:text-white'
                  }`}
                >
                  {language === 'te' ? 'లాగిన్' : language === 'hi' ? 'साइन इन' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    mode === 'register' ? 'bg-white text-ocean-900 shadow-sm' : 'text-ocean-100 hover:text-white'
                  }`}
                >
                  {language === 'te' ? 'కొత్త ఖాతా' : language === 'hi' ? 'नया खाता' : 'New Account'}
                </button>
              </div>
            )}
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'te' ? 'పూర్తి పేరు *' : language === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ocean-900 font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'te' ? 'ఫోన్ నంబర్' : language === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ocean-900 font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'te' ? 'ఈమెయిల్ చిరునామా *' : language === 'hi' ? 'ईमेल पता *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="farmer@aquasustain.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ocean-900 font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {language === 'te' ? 'పాస్‌వర్డ్ *' : language === 'hi' ? 'पासवर्ड *' : 'Password *'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-ocean-600 hover:text-ocean-800 font-semibold"
                    >
                      {language === 'te' ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ocean-900 font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'te' ? 'పాస్‌వర్డ్‌ను నిర్ధారించండి *' : language === 'hi' ? 'पासवर्ड की पुष्टि करें *' : 'Confirm Password *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ocean-900 font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-ocean-700 to-ocean-800 hover:from-ocean-800 hover:to-ocean-900 text-white font-bold text-sm shadow-md shadow-ocean-800/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && (language === 'te' ? 'సైన్ ఇన్ చేయండి' : language === 'hi' ? 'साइन इन करें' : 'Sign In')}
                    {mode === 'register' && (language === 'te' ? 'ఖాతాను సృష్టించండి' : language === 'hi' ? 'खाता बनाएं' : 'Create Farmer Account')}
                    {mode === 'forgot' && (language === 'te' ? 'రీసెట్ లింక్ పంపండి' : language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send Recovery Link')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs font-bold text-ocean-700 hover:text-ocean-900 pt-2"
              >
                &larr; Back to Sign In
              </button>
            )}
          </form>

          {/* Footer Demo Option for Evaluators */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                showToast('Loaded demo demonstration session', 'info');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-ocean-800 underline transition"
            >
              Explore interactive demo session without signing in
            </button>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} AquaSustain • Smart Coastal Aquaculture & Pond Intelligence System
      </footer>
    </div>
  );
};
