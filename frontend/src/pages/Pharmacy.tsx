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
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../services/api';
import type { Drug, PaginatedResponse } from '../types';
import AddDrugModal from '../components/AddDrugModal';
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
  const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);
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
    },
  });

  const handleEdit = (drug: Drug) => {
    setDrugToEdit(drug);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDrugToEdit(null);
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
                [...Array(5)].map((_, i) => (
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
                          onClick={() => handleEdit(drug)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this medication?')) {
                              deleteMutation.mutate(drug.id);
                            }
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

      <AddDrugModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        drugToEdit={drugToEdit}
      />
    </div>
  );
};

export default Pharmacy;
