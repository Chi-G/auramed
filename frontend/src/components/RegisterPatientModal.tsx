import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../services/api';

const patientSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  middle_name: z.string().optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
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

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: 'Male',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PatientFormData) => apiClient.post('/patients/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient registered successfully');
      reset();
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Register New Patient
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} className="text-slate-500 dark:text-slate-300" />
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                First Name *
              </label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                placeholder="John"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Last Name *
              </label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.last_name.message}
                </p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Middle Name
              </label>
              <input
                {...register('middle_name')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Date of Birth *
              </label>
              <input
                {...register('date_of_birth')}
                type="date"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              >
                <option value="Male" className="dark:bg-slate-900">
                  Male
                </option>
                <option value="Female" className="dark:bg-slate-900">
                  Female
                </option>
                <option value="Other" className="dark:bg-slate-900">
                  Other
                </option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Phone Number
              </label>
              <input
                {...register('phone_number')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                placeholder="+234 ..."
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                placeholder="patient@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Home Address
              </label>
              <textarea
                {...register('address')}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
            </div>

            {/* Medical History */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Medical History Summary
              </label>
              <textarea
                {...register('medical_history')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                placeholder="Known allergies, chronic conditions, etc."
              />
            </div>

            {/* Next of Kin */}
            <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                Next of Kin Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Full Name
                  </label>
                  <input
                    {...register('next_of_kin_name')}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                    placeholder="Emergency Contact Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Relationship
                  </label>
                  <input
                    {...register('next_of_kin_relation')}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Phone Number
                  </label>
                  <input
                    {...register('next_of_kin_phone')}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                    placeholder="Emergency Contact Phone"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-8 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Register Patient'
              )}
            </button>
          </div> 
        </form>
      </div>
    </div>
  );
};

export default RegisterPatientModal;
