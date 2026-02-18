import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign, 
  Download,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../services/api';

const Reports = () => {
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/summary');
      return response.data;
    },
  });

  const { data: trends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['reports-trends'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/trends');
      return response.data;
    },
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(new Date(), 'PPP');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('AuraMed Clinic', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${dateStr}`, 105, 30, { align: 'center' });

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value', 'Status']],
      body: [
        ['Total Revenue', `N${summary?.total_revenue?.toLocaleString() || '0'}`, 'Active'],
        ['Uncollected Revenue', `N${summary?.pending_revenue?.toLocaleString() || '0'}`, summary?.pending_revenue > 0 ? 'Action Needed' : 'Healthy'],
        ['Total Patient Encounters', summary?.visit_count || '0', 'Active'],
        ['Low Stock Items', summary?.low_stock_count || '0', summary?.low_stock_count > 0 ? 'Critical' : 'Good'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] },
    });

    // Trends Data (Simulated table as we can't easily render charts)
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Recent Performance Trends', 14, finalY);

    const revenueData = trends?.revenue?.map((item: any) => [
      format(new Date(item.date), 'MMM d, yyyy'),
      `N${item.amount.toLocaleString()}`
    ]) || [];

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Revenue']],
      body: revenueData.slice(0, 10), // Limit to last 10 entries for brevity
      theme: 'striped',
    });

    doc.save(`AuraMed_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoadingSummary || isLoadingTrends) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-sky-600 dark:text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Reports & Analytics</h1>
          <p className="text-[var(--muted)] font-medium tracking-tight">Detailed insights into clinic performance</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--background)]/50 transition-all font-black text-xs uppercase tracking-widest shadow-sm"
        >
          <Download size={18} />
          Export PDF
        </button>
      </div>

      {/* Detail Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
          <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-[var(--foreground)]">₦{summary?.total_revenue?.toLocaleString() || '0'}</p>
          <div className="mt-2 flex items-center text-xs font-black text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={12} className="mr-1" /> +12.5% vs last month
          </div>
        </div>
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
          <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Uncollected</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">₦{summary?.pending_revenue?.toLocaleString() || '0'}</p>
          <p className="text-[10px] font-black text-[var(--muted)] mt-1 uppercase tracking-tight italic">Action needed on billing</p>
        </div>
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
          <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Patient Encounters</p>
          <p className="text-3xl font-black text-[var(--foreground)]">{summary?.visit_count || 0}</p>
          <div className="mt-2 flex items-center text-xs font-black text-sky-600 dark:text-sky-400">
            <Activity size={12} className="mr-1" /> Average 5/day
          </div>
        </div>
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
          <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Inventory Health</p>
          <p className="text-3xl font-black text-[var(--foreground)]">{summary?.low_stock_count === 0 ? 'Good' : 'Critical'}</p>
          <p className="text-[10px] font-black text-[var(--muted)] mt-1 uppercase tracking-tight">
            {summary?.low_stock_count || 0} items low on stock
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Performance */}
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
          <h3 className="font-black text-[var(--foreground)] mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <DollarSign size={20} className="text-emerald-500 dark:text-emerald-400" />
            Revenue Growth
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  tick={{fill: 'var(--muted)', fontSize: 10}}
                  className="font-black uppercase"
                />
                <YAxis tick={{fill: 'var(--muted)', fontSize: 12}} className="font-black" />
                <Tooltip 
                   labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)'}}
                   itemStyle={{fontWeight: '900', fontSize: '12px'}}
                   formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="amount" stroke="var(--primary, #10b981)" strokeWidth={4} dot={{r: 4, fill: 'var(--primary, #10b981)', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Distribution */}
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-300">
          <h3 className="font-black text-[var(--foreground)] mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <Users size={20} className="text-sky-500 dark:text-sky-400" />
            Patient Traffic
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.visits || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  tick={{fill: 'var(--muted)', fontSize: 10}}
                  className="font-black uppercase"
                />
                <YAxis tick={{fill: 'var(--muted)', fontSize: 12}} className="font-black" />
                <Tooltip 
                  labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)'}}
                  itemStyle={{fontWeight: '900', fontSize: '12px'}}
                />
                 <Bar dataKey="count" fill="var(--primary, #3b82f6)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;