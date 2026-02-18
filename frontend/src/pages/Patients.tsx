import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Phone,
  Calendar,
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react';
import apiClient from '../services/api';
import type { Patient, PaginatedResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import RegisterPatientModal from '../components/RegisterPatientModal';
import EditPatientModal from '../components/EditPatientModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const Patients = () => {
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Patient>>({
    queryKey: ['patients', page, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Patient>>('/patients/', {
        params: { page, size: 10, q: searchTerm }
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deleted successfully');
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete patient');
    }
  });

  const handleDeleteClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const patients = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Patient Directory</h1>
          <p className="text-[var(--muted)] font-medium">Manage and view all registered patients</p>
        </div>
        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10"
        >
          <Plus size={20} />
          Register Patient
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-[var(--card)] p-4 rounded-2xl shadow-sm border border-[var(--border)] flex flex-col md:flex-row gap-4 transition-all duration-300">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          <input
            type="text"
            placeholder="Search by name or patient ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to page 1 on search
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-black text-[var(--muted)] uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--muted)] uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--muted)] uppercase tracking-widest">Date of Birth</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--muted)] uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--muted)] uppercase tracking-widest">Doctor</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--muted)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-32 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-32 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-[var(--background)]/50 rounded-full"></div></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)] text-sm italic font-medium opacity-60">
                    No patients found.
                  </td>
                </tr>
              ) : patients.map((patient) => (
                <tr 
                  key={patient.id} 
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="hover:bg-[var(--background)]/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-500/10 border border-sky-100/50 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold group-hover:scale-110 transition-transform">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--foreground)]">{patient.first_name} {patient.last_name}</p>
                        <p className="text-xs text-[var(--muted)] lowercase font-medium">{patient.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--foreground)] font-medium">
                        <Phone size={14} className="text-[var(--muted)]" />
                        {patient.phone_number || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-[var(--foreground)] font-medium">
                      <Calendar size={14} className="text-[var(--muted)]" />
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[var(--background)]/50 text-[var(--muted)] text-[10px] font-black rounded-lg uppercase tracking-wider border border-[var(--border)]">
                      {patient.patient_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {patient.assigned_doctor ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                          {patient.assigned_doctor.full_name?.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-xs font-bold text-[var(--foreground)] truncate">
                          {patient.assigned_doctor.full_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted)] font-medium italic opacity-70">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => handleEdit(e, patient)}
                        className="p-2 text-[var(--muted)] hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-all"
                        title="Edit Patient"
                      >
                        <Pencil size={18} />
                      </button>
                      {permissions.delete_patient && (
                        <button 
                           onClick={(e) => handleDeleteClick(e, patient)}
                           className="p-2 text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                           title="Delete Patient"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/50 rounded-lg transition-all"
                      >
                        <ChevronRight size={20} />
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

      <RegisterPatientModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />

      <EditPatientModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }} 
        patient={selectedPatient}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => patientToDelete && deleteMutation.mutate(patientToDelete.id)}
        title="Delete Patient"
        message={`Are you sure you want to delete ${patientToDelete?.first_name} ${patientToDelete?.last_name}? This will permanently remove all their clinical records.`}
        confirmLabel="Delete Patient"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Patients;