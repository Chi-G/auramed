import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Pill, 
  Package, 
  AlertTriangle, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  PackageCheck,
  TrendingDown,
  ChevronDown,
  History,
  Undo2,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import apiClient from '../services/api';
import { toast } from 'react-hot-toast';
import type { Drug, PaginatedResponse, Prescription } from '../types';
import AddDrugModal from '../components/AddDrugModal';
import DispenseDrugModal from '../components/DispenseDrugModal';
import Pagination from '../components/Pagination';

const CATEGORIES = [
  "Antibiotics", 
  "Analgesics", 
  "Supplements", 
  "First Aid", 
  "Cardiology",
  "Antimalarial",
  "Pediatric"
];

const Pharmacy = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);
  const [drugToDispense, setDrugToDispense] = useState<Drug | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Drug>>({
    queryKey: ['drugs', page, searchTerm, selectedCategory],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Drug>>('/pharmacy/', {
        params: { 
          page, 
          size: 10, 
          q: searchTerm,
          category: selectedCategory 
        }
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const drugs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Note: Stats (low stock, etc.) ideally should come from a stats endpoint or metadata in response
  // For now, these counts will only reflect the current page which is a limitation of simple pagination without separate stats API
  // I will check if I can get these counts from backend or just remove/hide them or accept they are page-local.
  // Given the requirement is pagination, page-local stats might be confusing.
  // But for now I'll calculate based on current page to avoid breaking the UI, or I could fetch all for stats separately?
  // Fetching all for stats defeats the purpose of pagination optimization.
  // I'll leave them as page-local for now or hide if 0.
  const lowStockCount = drugs.filter(d => d.stock_quantity <= d.low_stock_threshold).length;
  const expiredCount = drugs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/pharmacy/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
      toast.success('Medication deleted successfully');
    },
  });

  const { data: historyData } = useQuery<Prescription[]>({
    queryKey: ['dispense-history'],
    queryFn: async () => {
      const response = await apiClient.get<Prescription[]>('/pharmacy/dispense');
      return response.data;
    }
  });

  const undoDispenseMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/pharmacy/dispense/${id}`),
    onSuccess: () => {
      toast.success('Dispense undone successfully');
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
      queryClient.invalidateQueries({ queryKey: ['dispense-history'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to undo dispense');
    }
  });

  const recentDispenses = historyData || [];

  const handleEdit = (drug: Drug) => {
    setDrugToEdit(drug);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDrugToEdit(null);
  };

  const handleDispense = (drug: Drug) => {
    setDrugToDispense(drug);
    setIsDispenseModalOpen(true);
  };

  const handleCloseDispenseModal = () => {
    setIsDispenseModalOpen(false);
    setDrugToDispense(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory</h1>
          <p className="text-slate-500">Manage medical stock and supplies</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25"
        >
          <Plus size={20} />
          Add Medication
        </button>
      </div>

      {/* Quick Stats - Note: These are for current page only due to pagination */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Items (Page)</p>
            <p className="text-2xl font-bold text-slate-900">{drugs.length}</p>
          </div>
        </div>
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 ${lowStockCount > 0 ? 'ring-2 ring-amber-500/20' : ''}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Low Stock (Page)</p>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStockCount}</p>
          </div>
        </div>
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 ${expiredCount > 0 ? 'ring-2 ring-rose-500/20' : ''}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${expiredCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Expired (Page)</p>
            <p className={`text-2xl font-bold ${expiredCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by medication name or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-xl transition-all font-semibold ${
              selectedCategory ? 'bg-sky-50 text-sky-700 border-sky-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={20} />
            {selectedCategory || 'Categories'}
            <ChevronDown size={16} />
          </button>
          
          {isCategoryOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-10">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setIsCategoryOpen(false);
                  setPage(1);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${!selectedCategory ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
              >
                All Categories
              </button>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsCategoryOpen(false);
                    setPage(1);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${selectedCategory === category ? 'text-sky-600 font-bold' : 'text-slate-600'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Medication</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Levels</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price (Unit)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-32 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : drugs.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No medications found in inventory.
                  </td>
                </tr>
              ) : drugs.map((drug) => {
                const isLowStock = drug.stock_quantity <= drug.low_stock_threshold;
                const isExpired = drug.expiry_date && new Date(drug.expiry_date) < new Date();
                
                return (
                  <tr key={drug.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'}`}>
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{drug.name}</p>
                          {isExpired && <span className="text-[10px] font-bold text-rose-600 uppercase">Expired</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{drug.category || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isLowStock ? <TrendingDown size={12} /> : <PackageCheck size={12} />}
                          {drug.stock_quantity} in stock
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-sm ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        <Calendar size={14} className={isExpired ? 'text-rose-500' : 'text-slate-400'} />
                        {drug.expiry_date ? format(new Date(drug.expiry_date), 'MMM d, yyyy') : 'No date'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">₦{drug.unit_price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDispense(drug)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all transition-all opacity-0 group-hover:opacity-100 mr-2"
                        >
                          <Pill size={14} />
                          Dispense
                        </button>
                        <button 
                          onClick={() => handleEdit(drug)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={18} />
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
                                        <p className="text-lg font-bold text-slate-900">Delete Medication?</p>
                                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                          Are you sure you want to delete this medication? This item will be permanently removed from inventory.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                      <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => {
                                          deleteMutation.mutate(drug.id);
                                          toast.dismiss(t.id);
                                        }}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-200"
                                      >
                                        Yes, Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ), { duration: Infinity });
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Dispensing</h2>
              <p className="text-sm text-slate-500">Last 20 transactions appear here</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {recentDispenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No recent dispensing activity.
            </div>
          ) : (
            recentDispenses.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Pill size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{item.drug?.name || 'Unknown Medication'}</p>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-slate-500 uppercase font-medium">
                        Patient: {item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : item.patient_id}
                      </p>
                    </div>
                  </div>
                </div>
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
                                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                  <History size={28} />
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <p className="text-lg font-bold text-slate-900">Undo Action?</p>
                                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                  Are you sure you want to undo this dispensing? Stock and billing will be reverted.
                                </p>
                              </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  undoDispenseMutation.mutate(item.id);
                                  toast.dismiss(t.id);
                                }}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-100"
                              >
                                Confirm Undo
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ), { duration: Infinity });
                  }}
                  disabled={undoDispenseMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-rose-100 disabled:opacity-50"
                >
                  {undoDispenseMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                  Undo
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <AddDrugModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        drugToEdit={drugToEdit}
      />

      <DispenseDrugModal
        isOpen={isDispenseModalOpen}
        onClose={handleCloseDispenseModal}
        drug={drugToDispense}
      />
    </div>
  );
};

export default Pharmacy;
