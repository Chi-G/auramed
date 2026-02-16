import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, Activity } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import type { Patient } from '../types';

type VisitFormData = {
  patient_id: string;
  height_cm?: string;
  weight_kg?: string;
  glucose_level?: string;
  bp_systolic?: string;
  bp_diastolic?: string;
  bmi?: number;
  complaints: string;
  diagnosis?: string;
  notes?: string;
  follow_up_date?: string;
};

interface RecordVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatientId?: number;
}

const RecordVisitModal: React.FC<RecordVisitModalProps> = ({ isOpen, onClose, selectedPatientId }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitFormData>();

  const weight = watch('weight_kg');
  const height = watch('height_cm');

  // Auto-calculate BMI
  React.useEffect(() => {
    if (weight && height) {
      const w = Number(weight);
      const h = Number(height);
      if (h > 0) {
        const heightInMeters = h / 100;
        const bmi = w / (heightInMeters * heightInMeters);
        setValue('bmi', parseFloat(bmi.toFixed(2)));
      }
    }
  }, [weight, height, setValue]);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await apiClient.get('/patients/');
      return response.data.items;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: VisitFormData) => 
      apiClient.post('/visits/', {
        ...data,
        patient_id: data.patient_id,
        follow_up_date: data.follow_up_date || null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      reset();
      onClose();
    },
  });

  const [activeTab, setActiveTab] = React.useState('vitals');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity className="text-sky-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Record Clinical Visit</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-100 bg-white flex gap-6">
          <button 
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'vitals' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Vitals & Findings
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('treatments')}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'treatments' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Treatments
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'diagnostics' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Specialized Diagnostics
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="overflow-y-auto p-6 space-y-6">
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              {/* Patient Selection */}
              <section>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  {...register('patient_id')}
                  disabled={!!selectedPatientId}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-white disabled:bg-slate-50"
                >
                  <option value="">-- Choose a patient --</option>
                  {patients?.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.patient_id})
                    </option>
                  ))}
                </select>
                {errors.patient_id && <p className="mt-1 text-xs text-rose-500">{errors.patient_id.message}</p>}
              </section>

              {/* Vitals Section */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-sky-600" />
                  Primary Vitals
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Height (cm)</label>
                    <input {...register('height_cm')} type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Weight (kg)</label>
                    <input {...register('weight_kg')} type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">BMI</label>
                    <input {...register('bmi')} type="number" readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">BP (Sys/Dia)</label>
                    <div className="flex items-center gap-2">
                      <input {...register('bp_systolic')} type="number" placeholder="Sys" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500" />
                      <span className="text-slate-400">/</span>
                      <input {...register('bp_diastolic')} type="number" placeholder="Dia" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Glucose (mg/dL)</label>
                    <input {...register('glucose_level')} type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500" />
                  </div>
                </div>
              </section>

              {/* Clinical Findings */}
              <section className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Chief Complaints *</label>
                  <textarea
                    {...register('complaints')}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                    placeholder="Patient's primary health concerns..."
                  />
                  {errors.complaints && <p className="mt-1 text-xs text-rose-500">{errors.complaints.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis</label>
                  <textarea
                    {...register('diagnosis')}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                    placeholder="Preliminary or final diagnosis..."
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Proposed Treatments</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Treatment Method</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none">
                    <option>Nutritional Medicine</option>
                    <option>Acupuncture/Acupressure Therapy</option>
                    <option>Chiropractic Therapy</option>
                    <option>Cupping Therapy (Dry, Wet, Fire)</option>
                    <option>Aromatherapy</option>
                    <option>Manual Therapy</option>
                    <option>Phytoremedies</option>
                    <option>Nutritional Recipes</option>
                  </select>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Treatment-specific Notes</label>
                    <textarea 
                      rows={4} 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-sky-500" 
                      placeholder="Dosage, frequency, or specific method details..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Specialized Diagnostics</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" className="rounded text-sky-600" /> Iridology Diagnosis
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" className="rounded text-sky-600" /> Sclerology Diagnosis
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" className="rounded text-sky-600" /> Qrmba Analysis
                    </label>
                  </div>
                  <div className="space-y-2">
                     <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" className="rounded text-sky-600" /> Reflexology Diagnosis
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" className="rounded text-sky-600" /> Acupuncture Diagnosis
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Findings & Observations</label>
                  <textarea 
                    rows={5} 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-sky-500" 
                    placeholder="Describe specific findings from specialized diagnostics..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-auto">
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
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Record Visit & Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordVisitModal;
