import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import type { Patient } from '../types';

const patientSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  middle_name: z.string().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone_number: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  medical_history: z.string().optional(),
  next_of_kin_name: z.string().optional(),
  next_of_kin_relation: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ isOpen, onClose, patient }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  useEffect(() => {
    if (patient) {
      reset({
        first_name: patient.first_name,
        last_name: patient.last_name,
        middle_name: patient.middle_name || '',
        date_of_birth: patient.date_of_birth,
        gender: patient.gender as 'Male' | 'Female' | 'Other',
        phone_number: patient.phone_number || '',
        email: patient.email || '',
        address: patient.address || '',
        medical_history: patient.medical_history || '',
        next_of_kin_name: patient.next_of_kin_name || '',
        next_of_kin_relation: patient.next_of_kin_relation || '',
        next_of_kin_phone: patient.next_of_kin_phone || '',
      });
    }
  }, [patient, reset]);

  const mutation = useMutation({
    mutationFn: (data: PatientFormData) => apiClient.put(`/patients/${patient?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (patient) queryClient.invalidateQueries({ queryKey: ['patients', patient.id] });

      toast.success('Patient details updated successfully');
      onClose();
    },
  });

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Edit Patient: {patient.patient_id}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="overflow-y-auto p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20 
                  outline-none transition-all"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-rose-500">{errors.first_name.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20 
                  outline-none transition-all"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-rose-500">{errors.last_name.message}</p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Middle Name
              </label>
              <input
                {...register('middle_name')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                {...register('date_of_birth')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-xs text-rose-500">{errors.date_of_birth.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-white dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              >
                <option value="Male" className="dark:text-slate-900">Male</option>
                <option value="Female" className="dark:text-slate-900">Female</option>
                <option value="Other" className="dark:text-slate-900">Other</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                {...register('phone_number')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 rounded-lg 
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Home Address
              </label>
              <textarea
                rows={2}
                {...register('address')}
                className="w-full px-4 py-2 rounded-lg resize-none
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              />
            </div>

            {/* Medical History */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medical History Summary
              </label>
              <textarea
                rows={3}
                {...register('medical_history')}
                className="w-full px-4 py-2 rounded-lg resize-none
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
              />
            </div>

            {/* Next of Kin */}
            <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                Next of Kin Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NOK Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    {...register('next_of_kin_name')}
                    className="w-full px-4 py-2 rounded-lg 
                      bg-slate-50 dark:bg-slate-800
                      border border-slate-300 dark:border-slate-700
                      text-slate-900 dark:text-slate-100
                      focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
                  />
                </div>

                {/* NOK Relation */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relationship
                  </label>
                  <input
                    {...register('next_of_kin_relation')}
                    className="w-full px-4 py-2 rounded-lg 
                      bg-slate-50 dark:bg-slate-800
                      border border-slate-300 dark:border-slate-700
                      text-slate-900 dark:text-slate-100
                      focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
                  />
                </div>

                {/* NOK Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    {...register('next_of_kin_phone')}
                    className="w-full px-4 py-2 rounded-lg 
                      bg-slate-50 dark:bg-slate-800
                      border border-slate-300 dark:border-slate-700
                      text-slate-900 dark:text-slate-100
                      focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-400/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold 
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800 
                rounded-lg transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-8 py-2 rounded-lg 
                bg-sky-600 hover:bg-sky-700 
                text-white text-sm font-bold 
                transition-all shadow-lg shadow-sky-500/25 
                flex items-center gap-2 disabled:opacity-70"
            >
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;
