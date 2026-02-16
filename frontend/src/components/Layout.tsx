import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  Pill, 
  Receipt, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Patients', icon: Users, path: '/patients' },
    { title: 'Appointments', icon: Calendar, path: '/appointments' },
    { title: 'Clinical Visits', icon: Stethoscope, path: '/visits' },
    { title: 'Pharmacy', icon: Pill, path: '/pharmacy' },
    { title: 'Billing', icon: Receipt, path: '/billing' },
    { title: 'Reports', icon: TrendingUp, path: '/reports' },
    { title: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-md overflow-hidden animate-modal-pop">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-100">
                <LogOut size={40} className="ml-1" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Ready to leave?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Are you sure you want to sign out of your AuraMed workspace?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/25 transition-all active:scale-[0.98]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header / Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <img src="/assets/logo.png" alt="AuraMed" className="w-full h-full object-contain logo-tint-sky" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">AuraMed</span>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Slide-over) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
        ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-64'}
      `}>
        {/* Brand Logo */}
        <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 p-1.5 rounded-xl bg-white shadow-lg flex items-center justify-center">
                  <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain logo-tint-sky" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent leading-none">
                    AuraMed
                  </h1>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
                    Clinical Suite
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 p-2.5 rounded-xl bg-white shadow-xl flex items-center justify-center">
                <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain logo-tint-sky" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center group relative px-3 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                ? 'bg-sky-500 font-bold text-white shadow-lg shadow-sky-500/25' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={22} className={location.pathname === item.path ? 'text-white' : 'group-hover:text-white transition-colors'} />
              {!isCollapsed && <span className="ml-3 text-[15px]">{item.title}</span>}
              
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap uppercase tracking-widest">
                  {item.title}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 ${isCollapsed ? 'justify-center p-2' : ''}`}>
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name} 
                className="h-9 w-9 rounded-xl object-cover shadow-inner bg-slate-800"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-black text-xs text-white shadow-inner">
                {user?.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate leading-none mb-1">{user?.full_name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">{user?.role}</p>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 mt-3 px-3 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            {!isCollapsed && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`
        flex-1 flex flex-col min-w-0 h-screen transition-all duration-300
        ${isMobileMenuOpen ? 'blur-sm lg:blur-none' : ''}
      `}>
        <div className="flex-1 overflow-auto pt-16 lg:pt-10 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
