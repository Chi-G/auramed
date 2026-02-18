import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDeniedModal = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-md overflow-hidden animate-modal-pop border border-slate-100 dark:border-slate-800">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-100 dark:border-rose-500/20">
            <ShieldAlert size={40} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Protected Area
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Oops! It looks like you don't have the required permissions to access this page. Please contact your administrator if you believe this is a mistake.
          </p>

          <button 
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-900/20 dark:shadow-white/10 uppercase tracking-widest text-xs"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedModal;
