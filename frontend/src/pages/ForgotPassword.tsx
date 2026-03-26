import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(`/password-recovery/${email}`);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Recovery Error:", err);
      setError(err.response?.data?.detail || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-8 text-emerald-600">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Check your email</h2>
        <p className="text-slate-500 font-medium max-w-sm mb-12">
          We've sent a password reset link to <span className="text-slate-900 font-bold">{email}</span>. Please check your inbox and follow the instructions.
        </p>
        <Link 
          to="/login" 
          className="flex items-center gap-2 text-sky-600 font-bold hover:text-sky-700 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Login
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Reset your password</h2>
          <p className="text-slate-500 font-medium">Enter your email and we'll send you instructions to reset your password.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-sm font-semibold text-rose-600">{error}</p>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                placeholder="name@auramed.com"
                className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={24} className="animate-spin text-white/50" /> : (
              <span>Send Reset Instructions</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
