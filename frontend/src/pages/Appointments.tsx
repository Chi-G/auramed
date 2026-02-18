import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 

  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import apiClient from '../services/api';
import type { Appointment, AppointmentStatus, PaginatedResponse } from '../types';
import ScheduleAppointmentModal from '../components/ScheduleAppointmentModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const statusStyles: Record<AppointmentStatus, string> = {
  scheduled: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  confirmed: 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  arrived: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  in_consultation: 'bg-indigo-50 text-indigo-600 border-indigo-100/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  no_show: 'bg-slate-100 text-slate-400 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700',
};

const statusIcons: Record<AppointmentStatus, React.ReactNode> = {
  scheduled: <CalendarIcon size={14} />,
  confirmed: <Clock size={14} />,
  arrived: <AlertCircle size={14} />,
  in_consultation: <Activity size={14} />,
  completed: <CheckCircle2 size={14} />,
  cancelled: <XCircle size={14} />,
  no_show: <XCircle size={14} />,
};

const Appointments = () => {
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [currentWeekOnly, setCurrentWeekOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const startDate = currentWeekOnly ? format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') : undefined; // weekStartsOn: 1 (Monday)
  const endDate = currentWeekOnly ? format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') : undefined;

  const { data, isLoading } = useQuery<PaginatedResponse<Appointment>>({
    queryKey: ['appointments', page, searchTerm, currentWeekOnly, filterStatus],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Appointment>>('/appointments/', {
        params: { 
          page, 
          size: 10, 
          q: searchTerm,
          start_date: startDate,
          end_date: endDate,
          status: filterStatus || undefined
        }
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const appointments = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => 
      apiClient.put(`/appointments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status updated');
    },
    onError: () => {
        toast.error('Failed to update status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled successfully');
      setDeletingAppointmentId(null);
    },
    onError: () => {
      toast.error('Failed to cancel appointment');
    }
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingAppointmentId(id);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Appointments</h1>
          <p className="text-[var(--muted)]">Scheduled consultations and follow-ups</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10"
        >
          <Plus size={20} />
          Schedule Appointment
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-[var(--card)] p-4 rounded-2xl shadow-sm border border-[var(--border)] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => {
            setCurrentWeekOnly(!currentWeekOnly);
            setPage(1);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-xl transition-all font-semibold ${
            currentWeekOnly 
              ? 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20' 
              : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)]/50'
          }`}
        >
          <Filter size={20} />
          Current Week
        </button>
        <select
          value={filterStatus}
          onChange={(e) => {
             setFilterStatus(e.target.value as AppointmentStatus | '');
             setPage(1);
          }}
          className="px-4 py-2 border border-[var(--border)] rounded-xl text-[var(--foreground)] bg-[var(--input)] focus:ring-2 focus:ring-sky-500/20 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="arrived">Arrived</option>
          <option value="in_consultation">In-Consultation</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No-Show</option>
        </select>
      </div>

      {/* Appointment Grid/List */}
      <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-32 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-40 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-[var(--background)]/50 rounded-lg"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)] text-sm italic font-medium opacity-60">
                    No appointments found matching your search.
                  </td>
                </tr>
              ) : appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-[var(--background)]/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--background)]/50 flex items-center justify-center text-[var(--muted)]">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--foreground)]">
                          {apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-[var(--muted)]">ID: {apt.patient?.patient_id || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]">
                        <CalendarIcon size={14} className="text-sky-600 dark:text-sky-400" />
                        {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <Clock size={14} />
                        {format(new Date(apt.appointment_date), 'hh:mm a')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--foreground)] line-clamp-1">{apt.reason_for_visit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusStyles[apt.status]}`}>
                      {statusIcons[apt.status]}
                      {apt.status === 'in_consultation' ? 'In Consultation' : apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <select
                        value={apt.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: apt.id,
                            status: e.target.value as AppointmentStatus,
                          })
                        }
                        className="
                          text-xs 
                          bg-[var(--input)] 
                          border border-[var(--border)] 
                          text-[var(--foreground)] 
                          
                          /* Dark-mode fallbacks */
                          dark:bg-slate-800 
                          dark:border-slate-700 
                          dark:text-slate-200 

                          rounded-lg p-1 outline-none 
                          opacity-0 group-hover:opacity-100 transition-opacity 
                          focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 
                          dark:focus:ring-sky-400/30 dark:focus:border-sky-400
                        "
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="arrived">Arrived</option>
                        <option value="in_consultation">In-Consultation</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No-Show</option>
                      </select>


                         <button 
                            onClick={() => handleEdit(apt)}
                            className="p-2 text-[var(--muted)] hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-all"
                            title="Edit Appointment"
                         >
                           <Edit size={18} />
                         </button>
                          {permissions.delete_appointment && (
                            <button 
                               onClick={() => handleDelete(apt.id)}
                               className="p-2 text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                               title="Cancel Appointment"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
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

      <ScheduleAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEditingAppointment(undefined);
        }}
        appointment={editingAppointment}
      />

      <ConfirmModal
        isOpen={!!deletingAppointmentId}
        onClose={() => setDeletingAppointmentId(null)}
        onConfirm={() => {
            if (deletingAppointmentId) deleteMutation.mutate(deletingAppointmentId);
        }}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Yes, Cancel Appointment"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Appointments;