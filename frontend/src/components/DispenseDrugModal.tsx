import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Search, Pill, User } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import type { Patient, Drug } from '../types';
import toast from 'react-hot-toast';

const dispenseSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  drug_id: z.number().min(1, 'Drug is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  dosage: z.string().optional(),
  instructions: z.string().optional(),
});

type DispenseFormData = z.infer<typeof dispenseSchema>;

interface DispenseDrugModalProps {
  isOpen: boolean;
  onClose: () => void;
  drug: Drug | null;
}

const DispenseDrugModal: React.FC<DispenseDrugModalProps> = ({ isOpen, onClose, drug }) => {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DispenseFormData>({
    resolver: zodResolver(dispenseSchema) as any,
    defaultValues: {
      patient_id: '',
      drug_id: drug?.id || 0,
      quantity: 1,
      dosage: 'As prescribed',
      instructions: '',
    }
  });

  const selectedQuantity = watch('quantity');

  useEffect(() => {
    if (isOpen && drug) {
      reset({
        patient_id: '',
        drug_id: drug.id,
        quantity: 1,
        dosage: 'As prescribed',
        instructions: '',
      });
    }
  }, [isOpen, drug, reset]);

  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['patients', 'search', patientSearch],
    queryFn: async () => {
      const response = await apiClient.get('/patients/', {
        params: { q: patientSearch, size: 5 }
      });
      return response.data.items || [];
    },
    enabled: isOpen && patientSearch.length > 2,
  });

  // Fallback to recent patients if no search
  const { data: recentPatients } = useQuery<Patient[]>({
    queryKey: ['patients', 'recent'],
    queryFn: async () => {
      const response = await apiClient.get('/patients/', {
        params: { size: 5 }
      });
      return response.data.items || [];
    },
    enabled: isOpen && patientSearch.length <= 2,
  });

  const displayedPatients = patientSearch.length > 2 ? patients : recentPatients;

  const mutation = useMutation({
    mutationFn: async (data: DispenseFormData) => {
      const response = await apiClient.post('/pharmacy/dispense', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Medication dispensed successfully');
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to dispense medication');
    }
  });

  const onSubmit = (data: DispenseFormData) => {
    mutation.mutate(data);
  };

  if (!isOpen || !drug) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Pill size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dispense Medication</h2>
              <p className="text-sm text-slate-500">{drug.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Patient</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search patient by name or ID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
            </div>
            
            <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50">
              {displayedPatients?.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setValue('patient_id', patient.id);
                    setPatientSearch(`${patient.first_name} ${patient.last_name}`);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${watch('patient_id') === patient.id ? 'bg-sky-50 ring-1 ring-sky-500/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{patient.first_name} {patient.last_name}</p>
                      <p className="text-xs text-slate-500">{patient.patient_id}</p>
                    </div>
                  </div>
                  {watch('patient_id') === patient.id && <div className="w-2 h-2 rounded-full bg-sky-500"></div>}
                </button>
              ))}
              {!isLoadingPatients && displayedPatients?.length === 0 && (
                <p className="p-4 text-center text-sm text-slate-400">No patients found</p>
              )}
              {isLoadingPatients && (
                <div className="p-4 flex justify-center">
                  <Loader2 size={20} className="animate-spin text-sky-600" />
                </div>
              )}
            </div>
            {errors.patient_id && <p className="mt-1 text-xs text-rose-500">{errors.patient_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
              <input
                {...register('quantity')}
                type="number"
                max={drug.stock_quantity}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500"
              />
              <p className="mt-1 text-[10px] text-slate-400 uppercase font-bold">Max: {drug.stock_quantity} available</p>
              {errors.quantity && <p className="mt-1 text-xs text-rose-500">{errors.quantity.message}</p>}
            </div>

            {/* Price Preview */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Total Charge</label>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900">
                ₦{(drug.unit_price * (selectedQuantity || 0)).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Dosage</label>
            <input
              {...register('dosage')}
              type="text"
              placeholder="e.g. 1 tablet twice daily"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Instructions (Optional)</label>
            <textarea
              {...register('instructions')}
              rows={2}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
              placeholder="Special instructions for the patient..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirm & Dispense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispenseDrugModal;
