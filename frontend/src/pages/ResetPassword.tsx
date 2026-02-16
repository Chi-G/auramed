import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(`/reset-password/?token=${token}&new_password=${password}`);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error("Reset Error:", err);
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-8 text-emerald-600">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Password reset successful</h2>
        <p className="text-slate-500 font-medium max-w-sm mb-12">
          Your password has been updated. Redirecting you to the login page...
        </p>
        <Link 
          to="/login" 
          className="text-sky-600 font-bold hover:text-sky-700 transition-colors"
        >
          Click here if not redirected
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="max-w-md w-full">
        <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 p-2 rounded-xl bg-white shadow-lg border border-slate-100 flex items-center justify-center">
                <img src="/assets/logo.png" alt="AuraMed Logo" className="w-full h-full object-contain logo-tint-sky" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AuraMed</h1>
            </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Set new password</h2>
          <p className="text-slate-500 font-medium">Please enter your new secure password below.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${token ? 'bg-rose-50 border border-rose-100' : 'bg-amber-50 border border-amber-100'}`}>
              {token ? <AlertCircle className="text-rose-500" /> : <AlertCircle className="text-amber-500" />}
              <p className={`text-sm font-semibold ${token ? 'text-rose-600' : 'text-amber-600'}`}>{error}</p>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all duration-200"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={24} className="animate-spin text-white/50" /> : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        {!token && (
          <p className="mt-8 text-center text-sm font-medium text-slate-400">
            Need a new link? <Link to="/forgot-password" className="text-sky-600 font-bold hover:underline">Request Reset</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
