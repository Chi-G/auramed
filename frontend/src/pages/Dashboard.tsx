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
import type { Patient } from '../types';
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

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon size={24} className="text-sky-600" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </div>
    </div>
    <div className="mt-4">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/summary');
      return response.data;
    },
  });

  const { data: trends } = useQuery({
    queryKey: ['reports-trends'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/trends');
      return response.data;
    },
  });


  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await apiClient.get('/patients/');
      return response.data;
    },
  });

  const { data: appointments } = useQuery<any[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await apiClient.get('/appointments/');
      return response.data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Overview</h1>
        <p className="text-slate-500 text-sm">Welcome back, {user?.full_name}. Here's what's happening at AuraMed today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={patients?.length?.toLocaleString() || '0'} 
          icon={Users} 
          trend="up" 
          trendValue="Live" 
        />
        <StatCard 
          title="Today's Visits" 
          value={summary?.visit_count?.toLocaleString() || '0'} 
          icon={Activity} 
          trend="up" 
          trendValue="Total" 
        />
        <StatCard 
          title="Total Appointments" 
          value={appointments?.length?.toLocaleString() || '0'} 
          icon={Calendar} 
          trend="up" 
          trendValue="Active" 
        />
          <StatCard 
          title="Revenue (Total)" 
          value={`₦${summary?.total_revenue?.toLocaleString() || '0'}`} 
          icon={Receipt} 
          trend="up" 
          trendValue="Total Collected" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">Revenue Trends (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.revenue || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}} 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patients Visit Volume */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">Visit Volume</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.visits || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}} 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Inventory Status</h3>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 uppercase">
              {summary?.low_stock_count || 0} Low Stock
            </span>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Pill size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Inventory Health</p>
                <p className="text-lg font-bold text-slate-900">
                  {summary?.low_stock_count > 0 ? 'Action Required' : 'All Stock Healthy'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/pharmacy')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
            >
              Manage Inventory
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Unpaid Invoices</p>
              <p className="text-xl font-bold text-slate-900">₦{summary?.pending_revenue?.toLocaleString()}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            Go to Billing
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Appointments</h3>
          <button className="text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-wider">View All</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[1,2,3,4].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Clock size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Patient #{1000 + i}</p>
                  <p className="text-xs text-slate-500">Iridology Session • 10:30 AM</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                Confirmed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
