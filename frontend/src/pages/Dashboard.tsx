import React from 'react';
import { 
  Users, 
  Calendar, 
  Receipt, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Pill
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// StatCard with full dark mode support using CSS variables and dark: prefixes
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'sky' }: any) => {
  const colorMap: Record<string, { light: string; dark: string; iconClass: string }> = {
    sky: { 
      light: 'text-sky-600 bg-sky-50 border-sky-100/50',
      dark: 'dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20',
      iconClass: 'text-sky-600 dark:text-sky-400'
    },
    emerald: { 
      light: 'text-emerald-600 bg-emerald-50 border-emerald-100/50',
      dark: 'dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      iconClass: 'text-emerald-600 dark:text-emerald-400'
    },
    rose: { 
      light: 'text-rose-600 bg-rose-50 border-rose-100/50',
      dark: 'dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20',
      iconClass: 'text-rose-600 dark:text-rose-400'
    },
    amber: { 
      light: 'text-amber-600 bg-amber-50 border-amber-100/50',
      dark: 'dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
      iconClass: 'text-amber-600 dark:text-amber-400'
    },
  };

  const colors = colorMap[color] || colorMap.sky;
  const trendColor = trend === 'up' 
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' 
    : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10';
  const trendDot = trend === 'up' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400';

  return (
    <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl border ${colors.light} ${colors.dark}`}>
          <Icon size={24} className={colors.iconClass} />
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${trendDot}`} />
          {trendValue}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-[var(--muted)] text-sm font-bold tracking-tight uppercase tracking-widest">{title}</h3>
        <p className="text-3xl font-black text-[var(--foreground)] mt-1 mb-1">{value}</p>
        <div className="flex items-center gap-2 mt-2">
           <span className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full ${trendColor}`}>
             {trend === 'up' ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
             Growth
           </span>
           <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-tight opacity-70">vs last month</span>
        </div>
      </div>
    </div>
  );
};

// Custom tooltip with dark mode support
const CustomTooltip = ({ active, payload, label, valuePrefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl p-3">
        <p className="text-[var(--muted)] text-[11px] font-bold uppercase tracking-wider mb-1">
          {format(new Date(label), 'MMM d, yyyy')}
        </p>
        <p className="text-[var(--foreground)] text-[13px] font-black">
          {valuePrefix}{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  
  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/summary');
      return response.data;
    },
    enabled: !!permissions.view_reports,
  });

  const { data: trends } = useQuery({
    queryKey: ['reports-trends'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/trends');
      return response.data;
    },
    enabled: !!permissions.view_reports,
  });

  // Use CSS variable for chart color, assuming --primary adjusts in dark mode (e.g., lighter shade)
  const chartColor = "var(--primary, #0ea5e9)"; // Adjust fallback if needed; ensure CSS defines --primary for dark

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-[var(--foreground)] leading-tight tracking-tight">Clinic Overview</h1>
        <p className="text-[var(--muted)] font-medium mt-1">Welcome back, {user?.full_name}. Here's what's happening at AuraMed today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {permissions.manage_patients && (
          <StatCard 
            title="Total Patients" 
            value={summary?.total_patients?.toLocaleString() || '0'}
            icon={Users} 
            trend="up" 
            trendValue="Live"
            color="sky"
          />
        )}
        {permissions.manage_clinical_visits && (
          <StatCard 
            title="Today's Visits" 
            value={summary?.visit_count?.toLocaleString() || '0'}
            icon={Activity} 
            trend="up" 
            trendValue="Total" 
            color="amber"
          />
        )}
        {permissions.manage_appointments && (
          <StatCard 
            title="Total Appointments" 
            value={summary?.total_appointments?.toLocaleString() || '0'} 
            icon={Calendar} 
            trend="up" 
            trendValue="Active" 
            color="sky"
          />
        )}
        {permissions.manage_billing && (
          <StatCard 
            title="Revenue (Total)" 
            value={`₦${summary?.total_revenue?.toLocaleString() || '0'}`} 
            icon={Receipt} 
            trend="up" 
            trendValue="Total Billed" 
            color="emerald"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart with dark mode adjustments */}
        {permissions.view_reports && permissions.manage_billing && (
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Revenue Trends</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] opacity-70">Last 7 Days</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                <AreaChart data={trends?.revenue || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} 
                    dy={10}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} 
                    dx={-10} 
                  />
                  <Tooltip content={<CustomTooltip valuePrefix="₦" />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={chartColor} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Patients Visit Volume with dark mode adjustments */}
        {permissions.manage_clinical_visits && (
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Visit Volume</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] opacity-70">Activity Level</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                <BarChart data={trends?.visits || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} 
                    dy={10}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} 
                    dx={-10} 
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--foreground)', opacity: 0.05}}
                    content={<CustomTooltip />}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={chartColor} 
                    radius={[6, 6, 0, 0]} 
                    barSize={32} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts with optimized dark mode */}
        {permissions.manage_pharmacy && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-300">
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-black text-[var(--foreground)] tracking-tight text-xs uppercase opacity-70">Inventory Status</h3>
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border border-[var(--border)] uppercase tracking-wider ${
                (summary?.low_stock_count || 0) > 0 
                ? 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              }`}>
                {summary?.low_stock_count || 0} Low Stock
              </span>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/50 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/20">
                  <Pill size={24} className="text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest opacity-80">Inventory Health</p>
                  <p className="text-lg font-black text-[var(--foreground)] mt-0.5">
                    {summary?.low_stock_count > 0 ? 'Action Required' : 'All Stock Healthy'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/pharmacy')}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10"
              >
                Manage
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions with optimized dark mode */}
        {permissions.manage_billing && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden p-6 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20">
                <Receipt size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest leading-none opacity-80">Unpaid Invoices</p>
                <p className="text-2xl font-black text-[var(--foreground)] mt-1 leading-none">₦{summary?.pending_revenue?.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/billing')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/10 active:scale-[0.98]"
            >
              Go to Billing
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity with optimized dark mode */}
      {permissions.manage_appointments && (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-300">
          <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-black text-[var(--foreground)] tracking-tight uppercase text-xs">Recent Appointments</h3>
            <button 
              onClick={() => navigate('/appointments')} 
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:opacity-80 transition-opacity uppercase tracking-widest"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {summary?.recent_appointments?.length > 0 ? (
              summary.recent_appointments.map((appt: any) => (
                <div key={appt.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--background)]/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <Clock size={20} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">{appt.patient_name}</p>
                      <p className="text-xs text-[var(--muted)] font-medium opacity-80">
                        {appt.reason} • {appt.appointment_date ? format(new Date(appt.appointment_date), 'h:mm a') : 'No time'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                    appt.status === 'confirmed' 
                      ? 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/20' :
                    appt.status === 'scheduled' 
                      ? 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/20' :
                    appt.status === 'arrived' 
                      ? 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20' :
                    appt.status === 'in_consultation' 
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/20' :
                    appt.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20' :
                    appt.status === 'cancelled' 
                      ? 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20' :
                    'bg-slate-50 text-slate-400 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700'
                  }`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-[var(--muted)] text-sm italic font-medium opacity-60">
                No recent appointments found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;