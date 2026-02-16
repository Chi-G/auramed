import React, { useState } from 'react';
import { X, Send, CheckCircle2, Loader2, ClipboardList } from 'lucide-react';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    clinicName: '',
    email: '',
    role: '',
    details: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call for lead generation
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-6 right-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-8 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Request sent successfully</h2>
            <p className="text-slate-500 font-medium mb-12">
              Thank you for your interest in AuraMed. Our clinical onboarding team will review your request and reach out to <span className="text-slate-900 font-bold">{formData.email}</span> within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Close and wait for email
            </button>
          </div>
        ) : (
          <>
            <div className="px-10 pt-12 pb-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-sky-100 rounded-3xl flex items-center justify-center text-sky-600">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Staff Access</h2>
                  <p className="text-slate-500 font-medium">Request access for your medical practice.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                      placeholder="Dr. John Doe"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Practice/Clinic Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                      placeholder="City General Hospital"
                      value={formData.clinicName}
                      onChange={e => setFormData({...formData, clinicName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Work Email</label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                    placeholder="john@clinic-website.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Professional Role</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="">Select your role</option>
                    <option value="doctor">Medical Doctor</option>
                    <option value="nurse">Registered Nurse</option>
                    <option value="admin">Administrator</option>
                    <option value="other">Other Healthcare Professional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Additional Details</label>
                  <textarea
                    rows={3}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all resize-none"
                    placeholder="Tell us about your practice needs..."
                    value={formData.details}
                    onChange={e => setFormData({...formData, details: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin text-white/50" /> : (
                      <>
                        <span>Submit Registration Request</span>
                        <Send size={20} />
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    AuraMed Secure Onboarding Protocol
                  </p>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestAccessModal;
