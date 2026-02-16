import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Search, 
  Receipt, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Download,
  Printer,
  Mail,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePaystackPayment } from 'react-paystack';
import apiClient from '../services/api';
import type { Bill, PaginatedResponse } from '../types';
import Pagination from '../components/Pagination';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const queryClient = useQueryClient();
  // const { user } = useAuth();

  const { data, isLoading } = useQuery<PaginatedResponse<Bill>>({
    queryKey: ['bills', page, searchTerm, filterStatus],
    queryFn: async () => {
      const statusParam = filterStatus !== 'all' ? filterStatus : undefined;
      const response = await apiClient.get<PaginatedResponse<Bill>>('/billing/', {
        params: { 
          page, 
          size: 10, 
          q: searchTerm,
          status: statusParam
        }
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number, amount: number }) => 
      apiClient.put(`/billing/${id}`, { amount_paid: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });

  const bills = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Note: Stats are page-local or placeholder since backend doesn't provide global stats yet.
  // Using page data for now.
  const totalPending = bills.reduce((acc, bill) => acc + (bill.status !== 'paid' ? bill.balance : 0), 0);

  // Helper to trigger Paystack
  const PayButton = ({ bill }: { bill: Bill }) => {
    const config = {
        reference: (new Date()).getTime().toString(),
        email: "user@example.com", // Valid default email if user email is missing
        amount: bill.balance * 100, // Amount in kobo
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    };
    
    // We need to get the user's email if possible
    // Since we don't have direct access to user here easily without prop drilling or context, 
    // let's assume we can get it from the bill's patient or the logged in user.
    // For now, using a placeholder or we can try to use the logged in user email if we import useAuth.
    
    const initializePayment = usePaystackPayment({...config, email: bill.visit?.patient?.email || "patient@example.com"});

    const onSuccess = (reference: any) => {
        // Implementation for whatever you want to do with reference and after success call.
        console.log(reference);
        updatePaymentMutation.mutate({ 
            id: bill.id, 
            amount: bill.balance 
        });
    };

    const onClose = () => {
        // implementation for  whatever you want to do when the Paystack dialog closed.
        console.log('closed')
    }

    return (
        <button 
            onClick={() => {
                initializePayment({onSuccess, onClose})
            }}
            disabled={updatePaymentMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
            {updatePaymentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
            Pay
        </button>
    )
  }

  const handleDownloadPDF = (bill: Bill) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('AuraMed Clinic', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Invoice', 105, 30, { align: 'center' });
    
    // Bill Details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice ID: #${bill.id.toString().padStart(6, '0')}`, 14, 45);
    doc.text(`Date: ${format(new Date(bill.created_at), 'PPP')}`, 14, 52);
    
    const patientName = bill.visit?.patient ? `${bill.visit.patient.first_name} ${bill.visit.patient.last_name}` : 'Unknown Patient';
    doc.text(`Patient: ${patientName}`, 14, 59);
    doc.text(`Patient ID: ${bill.visit?.patient?.patient_id || 'N/A'}`, 14, 66);

    // Table
    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Amount (₦)']],
      body: [
        ['Consultation Fee', bill.consultation_fee.toFixed(2)],
        ['Medications / Drugs', bill.drug_cost.toFixed(2)],
        ['Total Amount', bill.total_amount.toFixed(2)],
        ['Amount Paid', bill.amount_paid.toFixed(2)],
        ['Balance Due', bill.balance.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] }, // Sky-600
      footStyles: { fillColor: [241, 245, 249] }, // Slate-100
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing AuraMed Clinic.', 105, finalY, { align: 'center' });
    
    doc.save(`Invoice_${bill.id}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Payments</h1>
          <p className="text-slate-500">Track patient invoices and record payments</p>
        </div>
      </div>

      {/* Stats - Page Local */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending (Page)</p>
            <p className="text-2xl font-bold text-slate-900">₦{totalPending.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Items (Page)</p>
            <p className="text-2xl font-bold text-slate-900">{bills.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Invoices</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name or invoice ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 bg-white focus:ring-2 focus:ring-sky-500/20 outline-none font-semibold"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice / Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-48 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : bills.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-sky-600 uppercase">#{bill.id.toString().padStart(6, '0')}</p>
                        <p className="font-bold text-slate-900">
                          {bill.visit?.patient ? `${bill.visit.patient.first_name} ${bill.visit.patient.last_name}` : 'Unknown Patient'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {bill.created_at ? format(new Date(bill.created_at), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ₦{bill.total_amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${bill.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ₦{bill.balance?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      bill.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {bill.status === 'paid' ? <CheckCircle2 size={12} /> : 
                       bill.status === 'partial' ? <Clock size={12} /> : <AlertCircle size={12} />}
                      {bill.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {bill.status !== 'paid' && (
                        <PayButton bill={bill} />
                      )}
                      <button 
                        onClick={() => handleDownloadPDF(bill)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                        title="Download Invoice PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all group/menu relative">
                        <MoreVertical size={20} />
                        <div className="hidden group-hover/menu:block absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-10">
                          <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2">
                             <Printer size={14} /> Print
                          </button>
                          <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2">
                             <Mail size={14} /> Email
                          </button>
                        </div>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};
export default Billing;
