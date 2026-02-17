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
import type { Patient } from '../types';
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
            className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <span className="px-2.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                {patient.patient_id}
              </span>
            </div>
            <p className="text-slate-500">Patient Details & History</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all font-bold"
          >
            <Edit size={18} />
            Edit
          </button>
           <button 
             onClick={() => setIsDeleteModalOpen(true)}
             disabled={deleteMutation.isPending}
             className="flex items-center gap-2 px-4 py-2 border border-rose-100 bg-white rounded-xl text-rose-600 font-bold hover:bg-rose-50 transition-all"
           >
             <Trash2 size={18} />
             Delete
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-24 h-24 rounded-3xl bg-sky-100 flex items-center justify-center text-3xl text-sky-600 font-bold shadow-inner">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{patient.first_name} {patient.last_name}</h2>
                <p className="text-slate-500 capitalize">{patient.gender}, {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years old</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Birth Date</p>
                  <p className="text-slate-700 font-semibold">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                  <p className="text-slate-700 font-semibold">{patient.phone_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                  <p className="text-slate-700 font-semibold">{patient.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Address</p>
                  <p className="text-slate-700 font-semibold leading-relaxed">{patient.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 italic text-slate-600 leading-relaxed relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText size={48} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-sky-500" />
              Medical History Summary
            </h3>
            <p className="text-sm">
              {patient.medical_history || 'No medical history recorded for this patient.'}
            </p>
          </div>
        </div>

        {/* Timeline / Clinical Data Placeholder */}
        <div className="lg:col-span-2 space-y-6 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Clinical History</h3>
              </div>
              <button 
                onClick={() => setIsRecordVisitModalOpen(true)}
                className="flex items-center gap-2 text-sky-600 font-bold hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-all text-sm"
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
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Diagnosis & Complaints</th>
                                <th className="p-4">Vitals</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-50">
                            {visits.map((visit) => (
                                <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="font-bold text-slate-900">
                                            {new Date(visit.visit_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top max-w-xs">
                                        {visit.diagnosis && (
                                            <div className="mb-1 font-semibold text-sky-700">
                                                {visit.diagnosis}
                                            </div>
                                        )}
                                        <div className="text-slate-600 line-clamp-2">
                                            {visit.complaints}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="space-y-1 text-xs">
                                            {visit.bp_systolic && visit.bp_diastolic && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-400">BP:</span>
                                                    <span>{visit.bp_systolic}/{visit.bp_diastolic}</span>
                                                </div>
                                            )}
                                            {visit.weight_kg && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-400">Wt:</span>
                                                    <span>{visit.weight_kg} kg</span>
                                                </div>
                                            )}
                                            {visit.bmi && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-400">BMI:</span>
                                                    <span>{visit.bmi}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
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
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto mb-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
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
