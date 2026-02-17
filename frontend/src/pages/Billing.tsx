import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
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
  Trash2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../services/api';
import type { Bill, PaginatedResponse, Patient } from '../types';
import Pagination from '../components/Pagination';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  
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

  const addFeeMutation = useMutation({
    mutationFn: (patient_id: string) => apiClient.post('/billing/add-consultation', { patient_id }),
    onSuccess: () => {
      toast.success('Consultation fee added successfully');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setIsFeeModalOpen(false);
      setSelectedPatientId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add consultation fee');
    }
  });

  const { data: patientsData } = useQuery<PaginatedResponse<Patient>>({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Patient>>('/patients/', {
        params: { size: 5, q: patientSearch }
      });
      return response.data;
    },
    enabled: isFeeModalOpen && patientSearch.length > 0
  });

  const patients = patientsData?.items || [];


  const bills = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Note: Stats are page-local or placeholder since backend doesn't provide global stats yet.
  // Using page data for now.
  const totalPending = bills.reduce((acc, bill) => acc + (bill.status !== 'paid' ? bill.balance : 0), 0);

  // Pay Button with Redirection
  const PayButton = ({ bill }: { bill: Bill }) => {
    const initializeMutation = useMutation({
      mutationFn: () => apiClient.post(`/billing/${bill.id}/initialize-payment`),
      onSuccess: (response) => {
        const { authorization_url } = response.data;
        if (authorization_url) {
          window.location.href = authorization_url;
        } else {
          toast.error('Failed to get payment URL');
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to initialize payment');
      }
    });

    return (
        <button 
            onClick={() => initializeMutation.mutate()}
            disabled={initializeMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
            {initializeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
            Pay Now
        </button>
    )
  }

  // Handle payment status from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const invoice = params.get('invoice');

    if (status === 'success') {
      toast.success(`Payment successful for invoice #${invoice?.padStart(6, '0')}`);
      // Clear params without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    } else if (status === 'failed') {
      toast.error('Payment failed or was cancelled');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      toast.error(params.get('msg') || 'An error occurred during payment');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  const sendEmailMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/billing/${id}/send-email`),
    onSuccess: () => {
      toast.success('Invoice email sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send invoice email');
    }
  });

  const deleteBillMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/billing/${id}`),
    onSuccess: () => {
      toast.success('Bill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete bill');
    }
  });

  const handlePrint = (bill: Bill) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('AuraMed Clinic', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Medical Invoice', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice ID: #${bill.id.toString().padStart(6, '0')}`, 14, 45);
    doc.text(`Date: ${format(new Date(bill.created_at || new Date()), 'PPP')}`, 14, 52);
    
    const patient = bill.patient || bill.visit?.patient;
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
    doc.text(`Patient: ${patientName}`, 14, 59);
    doc.text(`Patient ID: ${patient?.patient_id || 'N/A'}`, 14, 66);

    const drugItems = bill.visit?.prescriptions
      ?.filter(p => p.is_dispensed)
      .map(p => [
        `${p.drug?.name || 'Medication'} (Qty: ${p.quantity} × ₦${(p.drug?.unit_price || 0).toFixed(2)})`,
        ((p.drug?.unit_price || 0) * p.quantity).toFixed(2)
      ]) || [];

    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Amount (₦)']],
      body: [
        ['Consultation Fee', (bill.consultation_fee || 0).toFixed(2)],
        ...drugItems,
        ['Total Amount', (bill.total_amount || 0).toFixed(2)],
        ['Amount Paid', (bill.amount_paid || 0).toFixed(2)],
        ['Balance Due', (bill.balance || 0).toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing AuraMed Clinic.', 105, finalY, { align: 'center' });
    
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleDownloadPDF = (bill: Bill) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('AuraMed Clinic', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Medical Invoice', 105, 30, { align: 'center' });
    
    const patient = bill.patient || bill.visit?.patient;
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
    doc.setFontSize(10);
    doc.text(`Invoice ID: #${bill.id.toString().padStart(6, '0')}`, 14, 45);
    doc.text(`Date: ${format(new Date(bill.created_at || new Date()), 'PPP')}`, 14, 52);
    doc.text(`Patient: ${patientName}`, 14, 59);

    const drugItems = bill.visit?.prescriptions
      ?.filter(p => p.is_dispensed)
      .map(p => [
        `${p.drug?.name || 'Medication'} (Qty: ${p.quantity} × ₦${(p.drug?.unit_price || 0).toFixed(2)})`,
        ((p.drug?.unit_price || 0) * p.quantity).toFixed(2)
      ]) || [];

    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Amount (₦)']],
      body: [
        ['Consultation Fee', (bill.consultation_fee || 0).toFixed(2)],
        ...drugItems,
        ['Total Amount', (bill.total_amount || 0).toFixed(2)],
        ['Amount Paid', (bill.amount_paid || 0).toFixed(2)],
        ['Balance Due', (bill.balance || 0).toFixed(2)],
      ],
      headStyles: { fillColor: [2, 132, 199] },
    });

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
        <button 
          onClick={() => setIsFeeModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-all shadow-sm"
        >
          <Receipt size={20} />
          Add Consultation Fee
        </button>
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
                [...Array(10)].map((_, i) => (
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
                          {bill.patient ? `${bill.patient.first_name} ${bill.patient.last_name}` : 
                           bill.visit?.patient ? `${bill.visit.patient.first_name} ${bill.visit.patient.last_name}` : 
                           'Unknown Patient'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {bill.created_at ? format(new Date(bill.created_at), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ₦{bill.total_amount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${(bill.balance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ₦{bill.balance?.toFixed(2) || '0.00'}
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
                      {bill.status?.toUpperCase() || 'UNPAID'}
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
                      <div className="relative group/menu">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={20} />
                        </button>
                        <div className="invisible group-hover/menu:visible absolute right-0 top-0 mt-8 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 transition-all opacity-0 group-hover/menu:opacity-100">
                          <button 
                            onClick={() => handlePrint(bill)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-600 transition-colors"
                          >
                             <Printer size={16} className="text-sky-600" /> Print
                          </button>
                          <button 
                            onClick={() => sendEmailMutation.mutate(bill.id)}
                            disabled={sendEmailMutation.isPending}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-600 transition-colors disabled:opacity-50"
                          >
                             {sendEmailMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} className="text-sky-600" />} Email
                          </button>
                          <button 
                            onClick={() => {
                              toast.custom((t) => (
                                <div className={`${t.visible ? 'animate-in fade-in duration-300' : 'animate-out fade-out duration-300'} fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm`}>
                                  <div 
                                    className={`${t.visible ? 'animate-in zoom-in-95 duration-300' : 'animate-out zoom-out-95 duration-300'} max-w-md w-full m-4 bg-white shadow-2xl rounded-2xl pointer-events-auto border border-slate-100 overflow-hidden relative z-[10000]`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="p-6">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                            <AlertCircle size={28} />
                                          </div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                          <p className="text-lg font-bold text-slate-900">Delete Bill Record?</p>
                                          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                            Are you sure you want to delete this bill record? This action is permanent and cannot be undone.
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-6 flex justify-end gap-3">
                                        <button
                                          onClick={() => toast.dismiss(t.id)}
                                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                                        >
                                          No, Keep It
                                        </button>
                                        <button
                                          onClick={() => {
                                            deleteBillMutation.mutate(bill.id);
                                            toast.dismiss(t.id);
                                          }}
                                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-200"
                                        >
                                          Yes, Delete Record
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ), { duration: Infinity });
                            }}
                            disabled={deleteBillMutation.isPending}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-rose-50 flex items-center gap-2 text-rose-600 transition-colors disabled:opacity-50 border-t border-slate-50"
                          >
                             {deleteBillMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                          </button>
                        </div>
                      </div>
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

      {/* Manual Fee Modal */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Add Consultation Fee</h2>
              <button 
                onClick={() => {
                  setIsFeeModalOpen(false);
                  setPatientSearch('');
                  setSelectedPatientId('');
                }} 
                className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                <Loader2 size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (selectedPatientId) setSelectedPatientId('');
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                  {selectedPatientId && (
                    <button 
                      onClick={() => {
                        setSelectedPatientId('');
                        setPatientSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-600 hover:text-sky-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {patients.length > 0 && !selectedPatientId && (
                  <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden shadow-lg bg-white absolute z-10 w-[calc(100%-3rem)] max-h-60 overflow-y-auto">
                    {patients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearch(`${p.first_name} ${p.last_name}`);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-slate-500 uppercase">{p.patient_id}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-slate-200 group-hover:text-sky-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                <p className="text-sm text-sky-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  This will add the clinic's standard consultation fee to the patient's current unpaid bill or create a new one.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => addFeeMutation.mutate(selectedPatientId)}
                disabled={!selectedPatientId || addFeeMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addFeeMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Apply Fee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Billing;
