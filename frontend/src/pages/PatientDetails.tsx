import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Clock,
  Activity,
  Plus
} from 'lucide-react';
import apiClient from '../services/api';
import type { Patient, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import EditPatientModal from '../components/EditPatientModal';
import RecordVisitModal from '../components/RecordVisitModal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import type { ClinicalVisit, PaginatedResponse } from '../types';


const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordVisitModalOpen, setIsRecordVisitModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: doctors } = useQuery<User[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await apiClient.get('/users/', { params: { role: 'doctor' } });
      return response.data;
    },
    enabled: !!id,
  });

  const reassignMutation = useMutation({
    mutationFn: (assigned_doctor_id: number) => 
      apiClient.put(`/patients/${id}`, { assigned_doctor_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      toast.success('Doctor reassigned successfully');
    },
    onError: () => {
      toast.error('Failed to reassign doctor');
    }
  });

  const { user, permissions } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: visitsData, isLoading: isLoadingVisits } = useQuery<PaginatedResponse<ClinicalVisit>>({
    queryKey: ['visits', id, page],
    queryFn: async () => {
      const response = await apiClient.get(`/visits/?patient_id=${id}&page=${page}&size=${pageSize}`);
      return response.data;
    },
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const visits = visitsData?.items || [];
  const totalPages = visitsData ? Math.ceil(visitsData.total / pageSize) : 0;


  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deleted successfully');
      navigate('/patients');
    },
    onError: () => {
      toast.error('Failed to delete patient');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Patient Not Found</h2>
        <button 
          onClick={() => navigate('/patients')}
          className="mt-4 text-sky-600 font-bold hover:underline"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/patients')}
            className="p-2 bg-[var(--card)] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-[var(--border)] shadow-sm"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {patient.first_name} {patient.last_name}
              </h1>
              <span className="px-2.5 py-1 bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] font-black rounded-full border border-sky-100 dark:border-sky-500/20 uppercase tracking-widest">
                {patient.patient_id}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Patient Details & History</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Edit size={18} />
            Edit
          </button>
          {permissions.delete_patient && (
             <button 
               onClick={() => setIsDeleteModalOpen(true)}
               disabled={deleteMutation.isPending}
               className="flex items-center gap-2 px-4 py-2 border border-rose-100 dark:border-rose-500/20 bg-[var(--card)] rounded-xl text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shadow-sm"
             >
               <Trash2 size={18} />
               Delete
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-6 transition-all duration-300">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-24 h-24 rounded-3xl bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center text-3xl text-sky-600 dark:text-sky-400 font-black shadow-inner">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{patient.first_name} {patient.last_name}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium capitalize">{patient.gender}, {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years old</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[var(--border)]">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Birth Date</p>
                  <p className="text-slate-900 dark:text-slate-200 font-bold">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone</p>
                  <p className="text-slate-900 dark:text-slate-200 font-bold">{patient.phone_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email</p>
                  <p className="text-slate-900 dark:text-slate-200 font-bold truncate max-w-[180px]">{patient.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Address</p>
                  <p className="text-slate-900 dark:text-slate-200 font-bold leading-tight">{patient.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assigned Medical Personnel</h3>
                {isAdmin && doctors && doctors.length > 0 && (
                   <select 
                     onChange={(e) => reassignMutation.mutate(Number(e.target.value))}
                     className="bg-transparent text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest outline-none cursor-pointer hover:underline"
                     defaultValue={patient.assigned_doctor_id || ""}
                   >
                     <option value="" disabled>Reassign</option>
                     {doctors.map(doc => (
                       <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                     ))}
                   </select>
                )}
              </div>
              
              {patient.assigned_doctor ? (
                <div className="flex items-center justify-between group/doc p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-sky-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-emerald-500/20">
                      {patient.assigned_doctor.full_name?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.assigned_doctor.full_name}</p>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Primary Doctor</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                   <p className="text-xs text-slate-400 font-medium italic">No doctor assigned yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-6 italic text-slate-600 dark:text-slate-400 leading-relaxed relative overflow-hidden transition-all duration-300 mb-4">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 text-sky-500">
              <FileText size={48} />
            </div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
              <FileText size={16} className="text-sky-500" />
              Medical History
            </h3>
            <p className="text-sm font-medium">
              {patient.medical_history || 'No medical history recorded for this patient.'}
            </p>
          </div>
        </div>

        {/* Timeline / Clinical Data Placeholder */}
        <div className="lg:col-span-2 space-y-6 mb-4">
          <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-6 h-full min-h-[500px] flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Clinical History</h3>
              </div>
              <button 
                onClick={() => setIsRecordVisitModalOpen(true)}
                className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black hover:bg-sky-50 dark:hover:bg-sky-500/10 px-3 py-1.5 rounded-xl transition-all text-xs uppercase tracking-widest"
              >
                <Plus size={18} />
                Add Record
              </button>
            </div>

            {/* Visits Table */}
            {isLoadingVisits ? (
               <div className="flex items-center justify-center py-20">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
               </div>
            ) : visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                  <Clock size={40} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">No visits recorded yet</p>
                  <p className="text-slate-500 max-w-xs mx-auto">This patient hasn't had any recorded clinical visits or consultations yet.</p>
                </div>
                <button 
                  onClick={() => setIsRecordVisitModalOpen(true)}
                  className="px-6 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-700 transition-all font-bold"
                >
                  Start New Consultation
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 gap-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Diagnosis & Complaints</th>
                                <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Vitals</th>
                                <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 dark:text-slate-300 divide-y divide-[var(--border)]">
                            {visits.map((visit) => (
                                <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {new Date(visit.visit_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                                            {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top max-w-xs">
                                        {visit.diagnosis && (
                                            <div className="mb-1.5 font-black text-sky-700 dark:text-sky-400 text-sm tracking-tight capitalize">
                                                {visit.diagnosis}
                                            </div>
                                        )}
                                        <div className="text-slate-600 dark:text-slate-400 line-clamp-2 text-xs font-medium leading-relaxed">
                                            {visit.complaints}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="space-y-1.5 text-[10px] font-bold">
                                            {visit.bp_systolic && visit.bp_diastolic && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 dark:text-slate-500 uppercase">BP:</span>
                                                    <span className="text-slate-700 dark:text-slate-300">{visit.bp_systolic}/{visit.bp_diastolic}</span>
                                                </div>
                                            )}
                                            {visit.weight_kg && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 dark:text-slate-500 uppercase">Wt:</span>
                                                    <span className="text-slate-700 dark:text-slate-300">{visit.weight_kg} kg</span>
                                                </div>
                                            )}
                                            {visit.bmi && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 dark:text-slate-500 uppercase">BMI:</span>
                                                    <span className="text-slate-700 dark:text-slate-300">{visit.bmi}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top text-right">
                                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest">
                                            Completed
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-auto mb-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-400 bg-[var(--card)] border border-[var(--border)] rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Page <span className="text-slate-900 dark:text-white">{page}</span> / <span className="text-slate-900 dark:text-white">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-400 bg-[var(--card)] border border-[var(--border)] rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditPatientModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        patient={patient}
      />

      <RecordVisitModal
        isOpen={isRecordVisitModalOpen}
        onClose={() => setIsRecordVisitModalOpen(false)}
        selectedPatientId={patient.id}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Patient Record"
        message={`Are you sure you want to delete ${patient.first_name} ${patient.last_name}? All clinical data, visits, and prescriptions will be lost forever.`}
        confirmLabel="Confirm Deletion"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PatientDetails;
