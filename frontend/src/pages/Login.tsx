import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api';
import RequestAccessModal from '../components/RequestAccessModal';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 1) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await apiClient.post('/login/access-token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Transition to elegant loader
      setLoading(true);
      
      // Delay navigation to show off the premium branding
      setTimeout(async () => {
        await login(response.data.access_token);
        navigate('/');
      }, 4000);
      
    } catch (err: any) {
      setLoading(false);
      console.error("Login Error:", err);
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
        // Clear password on failed login for security/UX
        setPassword('');
      } else if (err.code === 'ERR_NETWORK') {
         setError('Unable to connect to server. Please check your internet or try again later.');
      } else {
        setError(err.response?.data?.detail || 'An unexpected error occurred during login.');
      }
    }
  };

  if (loading && email && password && !error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="relative mb-12">
          {/* Outer Ring */}
          <div className="w-32 h-32 rounded-full border-[1px] border-slate-200 animate-[spin_10s_linear_infinite]" />
          
          {/* Modern Spinner */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="modern-spinner" />
          </div>
          
          {/* Logo Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 p-3 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
            <img src="/assets/logo.png" alt="AuraMed" className="w-full h-full object-contain logo-tint-sky" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">AuraMed</h2>
          <p className="text-slate-500 font-medium tracking-wide">Securely initializing clinical workspace...</p>
        </div>

        <div className="mt-12 w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 animate-[progress_2.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Left Side: Modern Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-24 xl:px-32 z-10 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-14 h-14 p-2 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center">
                <img src="/assets/logo.png" alt="AuraMed Logo" className="w-full h-full object-contain logo-tint-sky" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none group">
                  AuraMed
                </h1>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-[0.2em]">Clinical Suite</span>
              </div>
            </div>
            <p className="text-slate-500 font-medium max-w-sm">Welcome back. Please enter your details to access your secure clinical workspace.</p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-3xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-sm font-semibold text-rose-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-sky-600">
                    <Mail className="h-5 w-5 text-slate-400" />
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

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" title="Recover your password" className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-sky-600">
                    <Lock className="h-5 w-5 text-slate-400" />
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
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 transition-colors cursor-pointer outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
 
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={24} className="animate-spin text-white/50" /> : (
                    <>
                      <span>Sign In to Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* Quick Login Section */}
            <div className="mt-10 border-t border-slate-100 pt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                Quick Login Access (Demo Mode)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Admin', email: 'admin@auramed.com', pass: 'admin123', icon: 'bg-slate-900' },
                  { label: 'Doctor', email: 'doctor@auramed.com', pass: 'doctor123', icon: 'bg-sky-600' },
                  { label: 'Nurse', email: 'nurse@auramed.com', pass: 'nurse123', icon: 'bg-indigo-600' },
                  { label: 'Receptionist', email: 'receptionist@auramed.com', pass: 'reception123', icon: 'bg-emerald-600' }
                ].map((role) => (
                  <button
                    key={role.label}
                    type="button"
                    onClick={() => {
                      setEmail(role.email);
                      setPassword(role.pass);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all group group-hover:shadow-sm text-left"
                  >
                    <div className={`w-2 h-2 rounded-full ${role.icon}`} />
                    <span className="text-xs font-bold text-slate-700">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-center text-sm font-medium text-slate-400">
              Not part of the clinical staff? <span onClick={() => setIsRequestModalOpen(true)} className="text-slate-700 font-bold hover:underline cursor-pointer">Request Access</span>
            </p>
          </div>
        </div>
        
        {/* Footer info for staff */}
        <div className="mt-auto pt-10 text-center md:text-left">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">AuraMed CMS v1.0 • Secure Health Data Management</p>
        </div>
      </div>

      {/* Right Side: Professional Imagery */}
      <div className="hidden md:flex flex-1 relative bg-sky-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/login-bg.png" 
            alt="Doctor and Patient" 
            className="w-full h-full object-cover opacity-80 mix-blend-overlay scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-sky-900/40 to-transparent" />
        </div>
        
        <div className="relative z-10 px-12 lg:px-24">
          <div className="max-w-lg">
            <div className="w-16 h-1 rounded-full bg-sky-400 mb-8" />
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              Empowering healthcare with seamless <span className="text-sky-400">patient care.</span>
            </h2>
            <p className="text-lg text-sky-100 font-medium leading-relaxed">
              Integrative medicine meets modern technology. Management simplified, so you can focus on healing.
            </p>
          </div>
        </div>
        
        {/* Floating Accent */}
        <div className="absolute bottom-10 right-10 flex gap-4">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-xs font-bold text-sky-200 uppercase tracking-wider mb-1">Clinic Performance</p>
            <p className="text-2xl font-black text-white">+24%</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-xs font-bold text-sky-200 uppercase tracking-wider mb-1">Active Patients</p>
            <p className="text-2xl font-black text-white">1,280</p>
          </div>
        </div>
      </div>
      <RequestAccessModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
};

export default Login;
