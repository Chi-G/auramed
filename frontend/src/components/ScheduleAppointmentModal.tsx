import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import type { Patient, Appointment } from '../types';

import toast from 'react-hot-toast';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Patient selection is required'),
  appointment_date: z.string().min(1, 'Date and time are required'),
  reason_for_visit: z.string().min(3, 'Reason is required'),
  status: z.enum(['scheduled', 'confirmed', 'arrived', 'in_consultation', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
});

type AppointmentFormData = {
  patient_id: string;
  appointment_date: string;
  reason_for_visit: string;
  status: 'scheduled' | 'confirmed' | 'arrived' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
};

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment;
}

const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({ isOpen, onClose, appointment }) => {
  const queryClient = useQueryClient();
  const isEditing = !!appointment;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      status: 'scheduled',
    }
  });

  // Reset form when modal opens or appointment changes
  React.useEffect(() => {
    if (isOpen) {
      if (appointment) {
        setValue('patient_id', appointment.patient_id.toString()); // Ensure string
        setValue('appointment_date', appointment.appointment_date.slice(0, 16)); // Format for datetime-local
        setValue('reason_for_visit', appointment.reason_for_visit || '');
        setValue('status', appointment.status);
        setValue('notes', appointment.notes || '');
      } else {
        reset({
          status: 'scheduled',
          patient_id: '',
          appointment_date: '',
          reason_for_visit: '',
          notes: ''
        });
      }
    }
  }, [isOpen, appointment, setValue, reset]);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await apiClient.get('/patients/');
      return response.data.items;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: AppointmentFormData) => {
      if (isEditing && appointment) {
        return apiClient.put(`/appointments/${appointment.id}`, {
          ...data,
          patient_id: data.patient_id
        });
      }
      return apiClient.post('/appointments/', {
        ...data,
        patient_id: data.patient_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(isEditing ? 'Appointment updated successfully' : 'Appointment scheduled successfully');
      reset();
      onClose();
    },
    onError: () => {
      toast.error(isEditing ? 'Failed to update appointment' : 'Failed to schedule appointment');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                {...register('patient_id')}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-white"
              >
                <option value="">-- Choose a patient --</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.patient_id})
                  </option>
                ))}
              </select>
              {errors.patient_id && <p className="mt-1 text-xs text-rose-500">{errors.patient_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date & Time *</label>
              <input
                {...register('appointment_date')}
                type="datetime-local"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
              {errors.appointment_date && <p className="mt-1 text-xs text-rose-500">{errors.appointment_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Visit *</label>
              <input
                {...register('reason_for_visit')}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                placeholder="e.g., Annual Checkup, Follow-up"
              />
              {errors.reason_for_visit && <p className="mt-1 text-xs text-rose-500">{errors.reason_for_visit.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="arrived">Arrived</option>
                <option value="in_consultation">In-Consultation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No-Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-8 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? 'Update Schedule' : 'Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleAppointmentModal;
