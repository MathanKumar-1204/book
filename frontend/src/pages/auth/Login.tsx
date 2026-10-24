import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { BookMarked, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithEmail, loginAsDemo, resendVerificationEmail, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Unverified email handling
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'author') {
      navigate('/author/dashboard', { replace: true });
    }
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(false);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      const msg = err.message || 'Failed to authenticate. Please check your credentials.';
      setError(msg);
      if (msg.toLowerCase().includes('verif') || msg.toLowerCase().includes('confirm')) {
        setUnverifiedEmail(email.trim());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await resendVerificationEmail(unverifiedEmail);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation link.');
    } finally {
      setResending(false);
    }
  };

  const handleDemoLogin = async (type: 'admin' | 'author_priya' | 'author_rohit' | 'author_sneha') => {
    setError(null);
    setSubmitting(true);
    try {
      await loginAsDemo(type);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white shadow-md mb-3">
          <BookMarked className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">BookLeaf Publishing</h2>
        <p className="mt-1 text-sm text-slate-600">Author Support & Operations Communication Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
                {unverifiedEmail && (
                  <div className="mt-2.5 pt-2.5 border-t border-red-200/60">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      {resending ? 'Resending verification email...' : 'Click here to resend verification link'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verification email sent! Please check your inbox and click the link to verify.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="author@email.com or admin@bookleaf.in"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Technical Evaluation Demo
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('author_priya')}
                disabled={submitting}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold">Author: Priya Sharma</span>
                  <span className="text-[11px] text-slate-400">(2 books, royalties active)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('author_sneha')}
                disabled={submitting}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="font-semibold">Author: Sneha Kulkarni</span>
                  <span className="text-[11px] text-slate-400">(3 books, 1 in production)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={submitting}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-navy-900 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Operations Lead (Admin)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              New author? Register an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
