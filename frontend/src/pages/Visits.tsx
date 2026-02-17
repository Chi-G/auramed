import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Activity, 
  Calendar, 
  User, 
  ChevronRight,
  Filter,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../services/api';
import type { ClinicalVisit, PaginatedResponse } from '../types';
import RecordVisitModal from '../components/RecordVisitModal';
import ViewVisitModal from '../components/ViewVisitModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const Visits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingVisit, setViewingVisit] = useState<ClinicalVisit | undefined>(undefined);
  const [editingVisit, setEditingVisit] = useState<ClinicalVisit | undefined>(undefined);
  const [deletingVisitId, setDeletingVisitId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<ClinicalVisit>>({
    queryKey: ['visits', page, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ClinicalVisit>>('/visits/', {
        params: { page, size: 10, q: searchTerm }
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/visits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Clinical record deleted successfully');
      setDeletingVisitId(null);
    },
    onError: () => {
      toast.error('Failed to delete clinical record');
    }
  });

  const handleView = (visit: ClinicalVisit) => {
    setViewingVisit(visit);
  };

  const handleEdit = (visit: ClinicalVisit) => {
    setEditingVisit(visit);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingVisitId(id);
  };

  const visits = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Visits</h1>
          <p className="text-slate-500">Record and track patient clinical encounters</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25"
        >
          <Plus size={20} />
          Record New Visit
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search clinical records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => {
            setSearchTerm('');
            setPage(1);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-semibold"
        >
          <Filter size={20} />
          All Visits
        </button>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vitals (BP / BMI)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnosis / Complaints</th>
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
                    <td className="px-6 py-4"><div className="h-5 w-48 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : visits.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No clinical records found.
                  </td>
                </tr>
              ) : visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {visit.patient ? `${visit.patient.first_name} ${visit.patient.last_name}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500">{visit.patient?.patient_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Activity size={12} className="text-rose-500" />
                        {visit.bp_systolic}/{visit.bp_diastolic} mmHg
                      </div>
                      <div className="text-[10px] text-slate-400">
                        BMI: <span className="font-bold text-slate-600">{visit.bmi || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {visit.diagnosis || 'No diagnosis recorded'}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{visit.complaints}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleView(visit)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(visit)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                        title="Edit Record"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(visit.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
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

      <RecordVisitModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEditingVisit(undefined);
        }}
        visit={editingVisit}
      />

      <ViewVisitModal
        isOpen={!!viewingVisit}
        onClose={() => setViewingVisit(undefined)}
        visit={viewingVisit}
      />

      <ConfirmModal
        isOpen={!!deletingVisitId}
        onClose={() => setDeletingVisitId(null)}
        onConfirm={() => {
            if (deletingVisitId) deleteMutation.mutate(deletingVisitId);
        }}
        title="Delete Clinical Record"
        message="Are you sure you want to delete this clinical record? This action cannot be undone."
        confirmLabel="Delete Record"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Visits;
