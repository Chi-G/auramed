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
import ConfirmModal from '../components/ConfirmModal';

import { useAuth } from '../hooks/useAuth';

const Pharmacy = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);
  const [drugToDispense, setDrugToDispense] = useState<Drug | null>(null);
  const [deletingDrugId, setDeletingDrugId] = useState<number | null>(null);
  const [undoDispenseId, setUndoDispenseId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch Categories from the new relational table
  const { data: categoryData } = useQuery({
    queryKey: ['drug-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/pharmacy/categories');
      return response.data;
    }
  });

  const categories = (categoryData || []).map((c: any) => c.name);
  if (categories.length === 0) {
    categories.push("Antibiotics", "Analgesics", "Supplements", "First Aid");
  }

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

  const lowStockCount = drugs.filter(d => d.stock_quantity <= d.low_stock_threshold).length;
  const expiredCount = drugs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/pharmacy/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
      toast.success('Medication deleted successfully');
      setDeletingDrugId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete medication');
      setDeletingDrugId(null);
    }
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
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
      queryClient.invalidateQueries({ queryKey: ['dispense-history'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setUndoDispenseId(null);
      toast.success('Dispense undone successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to undo dispense');
      setUndoDispenseId(null);
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Pharmacy Inventory</h1>
          <p className="text-[var(--muted)] font-medium">Manage medical stock and supplies</p>
        </div>
        {user?.role !== 'cashier' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10"
          >
            <Plus size={20} />
            Add Medication
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] font-black uppercase tracking-widest text-[10px]">Items (Page)</p>
            <p className="text-3xl font-black text-[var(--foreground)]">{drugs.length}</p>
          </div>
        </div>
        <div className={`bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-4 transition-all duration-300 ${lowStockCount > 0 ? 'ring-2 ring-amber-500/20' : ''}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-[var(--background)]/50 text-[var(--muted)]'}`}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] font-black uppercase tracking-widest text-[10px]">Low Stock (Page)</p>
            <p className={`text-3xl font-black ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--foreground)]'}`}>{lowStockCount}</p>
          </div>
        </div>
        <div className={`bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-4 transition-all duration-300 ${expiredCount > 0 ? 'ring-2 ring-rose-500/20' : ''}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expiredCount > 0 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-[var(--background)]/50 text-[var(--muted)]'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] font-black uppercase tracking-widest text-[10px]">Expired (Page)</p>
            <p className={`text-3xl font-black ${expiredCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--foreground)]'}`}>{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[var(--card)] p-4 rounded-2xl shadow-sm border border-[var(--border)] flex flex-col md:flex-row gap-4 transition-all duration-300">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          <input
            type="text"
            placeholder="Search by medication name or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl transition-all font-bold text-sm ${
              selectedCategory ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100/50 dark:border-sky-500/20' : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)]/50'
            }`}
          >
            <Filter size={18} />
            {selectedCategory || 'Categories'}
            <ChevronDown size={16} />
          </button>
          
          {isCategoryOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] py-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setIsCategoryOpen(false);
                  setPage(1);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--background)]/50 transition-colors ${!selectedCategory ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-[var(--foreground)]'}`}
              >
                All Categories
              </button>
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsCategoryOpen(false);
                    setPage(1);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--background)]/50 transition-colors ${selectedCategory === category ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-[var(--foreground)]'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Medication</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Stock Levels</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Expiry</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Price (Unit)</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-32 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : drugs.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)] text-sm italic font-medium opacity-60">
                    No medications found in inventory.
                  </td>
                </tr>
              ) : drugs.map((drug) => {
                const isLowStock = drug.stock_quantity <= drug.low_stock_threshold;
                const isExpired = drug.expiry_date && new Date(drug.expiry_date) < new Date();
                
                return (
                  <tr key={drug.id} className="hover:bg-[var(--background)]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isExpired ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'}`}>
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--foreground)]">{drug.name}</p>
                          {isExpired && <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Expired</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[var(--foreground)] font-medium capitalize">{drug.category || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${
                          isLowStock ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/20'
                        }`}>
                          {isLowStock ? <TrendingDown size={12} /> : <PackageCheck size={12} />}
                          {drug.stock_quantity} in stock
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--foreground)]'}`}>
                        <Calendar size={14} className={isExpired ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--muted)]'} />
                        {drug.expiry_date ? format(new Date(drug.expiry_date), 'MMM d, yyyy') : 'No date'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-[var(--foreground)]">₦{drug.unit_price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDispense(drug)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-[10px] font-black transition-all opacity-0 group-hover:opacity-100 mr-2 uppercase tracking-widest"
                        >
                          <Pill size={14} />
                          Dispense
                        </button>
                        {user?.role !== 'cashier' && (
                          <>
                            <button 
                              onClick={() => handleEdit(drug)}
                              className="p-2 text-[var(--muted)] hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => setDeletingDrugId(drug.id)}
                              className="p-2 text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/50 rounded-lg transition-all">
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
      <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight">Recent Dispensing</h2>
              <p className="text-xs text-[var(--muted)] font-medium">Last 20 transactions appear here</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recentDispenses.length === 0 ? (
            <div className="p-12 text-center text-[var(--muted)] text-sm italic font-medium opacity-60">
              No recent dispensing activity recorded.
            </div>
          ) : (
            recentDispenses.map((item) => (
              <div key={item.id} className="p-5 flex items-center justify-between hover:bg-[var(--background)]/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Pill size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--foreground)]">{item.drug?.name || 'Unknown Medication'}</p>
                      <span className="px-2 py-0.5 bg-[var(--background)]/50 text-[var(--muted)] rounded text-[10px] font-black uppercase tracking-widest border border-[var(--border)]">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-[var(--muted)] flex items-center gap-1 font-bold uppercase tracking-tight">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] uppercase font-black tracking-widest opacity-60">
                        Patient: {item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : item.patient_id}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setUndoDispenseId(item.id)}
                  disabled={undoDispenseMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-xs font-black transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20 disabled:opacity-50 uppercase tracking-widest"
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

      <ConfirmModal
        isOpen={!!deletingDrugId}
        onClose={() => setDeletingDrugId(null)}
        onConfirm={() => deletingDrugId && deleteMutation.mutate(deletingDrugId)}
        title="Delete Medication"
        message="Are you sure you want to delete this medication? This item will be permanently removed from inventory."
        confirmLabel="Delete Medication"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!undoDispenseId}
        onClose={() => setUndoDispenseId(null)}
        onConfirm={() => undoDispenseId && undoDispenseMutation.mutate(undoDispenseId)}
        title="Undo Dispense"
        message="Are you sure you want to undo this dispensing? Stock and billing will be reverted."
        confirmLabel="Confirm Undo"
        isDanger={false}
        isLoading={undoDispenseMutation.isPending}
      />
    </div>
  );
};

export default Pharmacy;