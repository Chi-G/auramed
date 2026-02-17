import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Activity } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import type { Patient, ClinicalVisit } from '../types';
import toast from 'react-hot-toast';

const visitSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  height_cm: z.coerce.number().nullable().optional(),
  weight_kg: z.coerce.number().nullable().optional(),
  glucose_level: z.coerce.number().nullable().optional(),
  bp_systolic: z.coerce.number().int().nullable().optional(),
  bp_diastolic: z.coerce.number().int().nullable().optional(),
  bmi: z.coerce.number().nullable().optional(),
  complaints: z.string().min(1, 'Chief complaints are required'),
  diagnosis: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  follow_up_date: z.string().optional().nullable().or(z.literal('')),
  // New fields
  treatment_type: z.string().optional(),
  treatment_notes: z.string().optional(),
  diagnostics: z.record(z.string(), z.boolean()).optional(), // Map of diagnostic types to boolean
  diagnostic_notes: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface RecordVisitModalProps {
  isOpen: boolean;
  onClose: () => void;

  selectedPatientId?: string;
  visit?: ClinicalVisit;
}

const RecordVisitModal: React.FC<RecordVisitModalProps> = ({ isOpen, onClose, selectedPatientId, visit }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState('assessment');
  const isEditing = !!visit;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema) as any,
    defaultValues: {
      patient_id: selectedPatientId || '',
      height_cm: null,
      weight_kg: null,
      glucose_level: null,
      bp_systolic: null,
      bp_diastolic: null,
      bmi: null,
      complaints: '',
      diagnosis: '',
      notes: '',

      follow_up_date: '',
      treatment_type: '',
      treatment_notes: '',
      diagnostics: {},
      diagnostic_notes: '',
    }
  });

  // Pre-fill form when visit or selectedPatientId changes
  useEffect(() => {
    if (isOpen) {
      if (visit) {
        setValue('patient_id', visit.patient_id.toString());
        setValue('height_cm', visit.height_cm);
        setValue('weight_kg', visit.weight_kg);
        setValue('glucose_level', visit.glucose_level);
        setValue('bp_systolic', visit.bp_systolic);
        setValue('bp_diastolic', visit.bp_diastolic);
        setValue('bmi', visit.bmi);
        setValue('complaints', visit.complaints || '');
        setValue('diagnosis', visit.diagnosis || '');
        setValue('notes', visit.notes || '');
        setValue('follow_up_date', visit.follow_up_date ? visit.follow_up_date.toString().split('T')[0] : '');
        
        // Pre-fill Treatment
        if (visit.treatment_records && visit.treatment_records.length > 0) {
            setValue('treatment_type', visit.treatment_records[0].treatment_type);
            setValue('treatment_notes', visit.treatment_records[0].notes || '');
        }
        
        // Pre-fill Diagnostics
        const diagMap: Record<string, boolean> = {};
        if (visit.specialized_diagnostics && visit.specialized_diagnostics.length > 0) {
            visit.specialized_diagnostics.forEach(d => {
                diagMap[d.diagnostic_type] = true;
            });
            // Assuming notes are shared or just taking from the first one for now
            setValue('diagnostic_notes', visit.specialized_diagnostics[0].findings || '');
        }
        setValue('diagnostics', diagMap);

      } else {
        // Reset or set default patient ID
        reset({
          patient_id: selectedPatientId || '',
          height_cm: null,
          weight_kg: null,
          glucose_level: null,
          bp_systolic: null,
          bp_diastolic: null,
          bmi: null,
          complaints: '',
          diagnosis: '',
          notes: '',
          follow_up_date: '',
          treatment_type: '',
          treatment_notes: '',
          diagnostics: {},
          diagnostic_notes: '',
        });
      }
    }
  }, [isOpen, visit, selectedPatientId, setValue, reset]);

  const weight = watch('weight_kg');
  const height = watch('height_cm');

  // Auto-calculate BMI
  useEffect(() => {
    if (weight && height) {
      const w = parseFloat(weight.toString());
      const h = parseFloat(height.toString());
      if (h > 0) {
        const heightInMeters = h / 100;
        const bmi = w / (heightInMeters * heightInMeters);
        setValue('bmi', parseFloat(bmi.toFixed(2)));
      }
    }
  }, [weight, height, setValue]);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients', 'all'], // Changed key to avoid collisions
    queryFn: async () => {
      const response = await apiClient.get('/patients/');
      console.log('RecordVisitModal patients response:', response.data);
      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      return [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (patients && !Array.isArray(patients)) {
        console.error('Patients data is not an array:', patients);
    }
  }, [patients]);

  const mutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const payload = {
        ...data,
        height_cm: data.height_cm || null,
        weight_kg: data.weight_kg || null,
        glucose_level: data.glucose_level || null,
        bp_systolic: data.bp_systolic || null,
        bp_diastolic: data.bp_diastolic || null,
        bmi: data.bmi || null,
        diagnosis: data.diagnosis || null,
        notes: data.notes || null,

        follow_up_date: data.follow_up_date || null,
        
        // Map flat form data to nested structure
        treatments: data.treatment_type ? [{
            treatment_type: data.treatment_type,
            notes: data.treatment_notes
        }] : [],
        
        diagnostics: Object.entries(data.diagnostics || {})
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => ({
                diagnostic_type: type,
                findings: data.diagnostic_notes,
                recommendations: '' 
            }))
      };
      
      if (isEditing && visit) {
        const response = await apiClient.put(`/visits/${visit.id}`, payload);
        return response.data;
      } else {
        const response = await apiClient.post('/visits/', payload);
        return response.data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isEditing ? 'Clinical visit updated successfully' : 'Clinical visit recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      // Also invalidate the specific patient query to sync clinical history on details page
      const patientId = data.patient_id || selectedPatientId || visit?.patient_id;
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ['patient', patientId.toString()] });
      }
      reset();
      onClose();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to record visit');
    }
  });

  const onSubmit = (data: VisitFormData) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Clinical Visit' : 'Record Clinical Visit'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
          <button 
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'assessment' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            Clinical Assessment
          </button>
          <button 
            onClick={() => setActiveTab('treatments')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'treatments' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            Treatments
          </button>
          <button 
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'diagnostics' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            Diagnostics
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'assessment' && (
            <div className="space-y-6">
              {/* Patient Selection */}
              <section className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Patient</label>
                <select 
                  {...register('patient_id')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose a patient --</option>
                  {Array.isArray(patients) ? patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.patient_id})
                    </option>
                  )) : null}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Follow-up Date</label>
                    <input 
                      {...register('follow_up_date')}
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                    placeholder="Any other observations or instructions..."
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
                  <select {...register('treatment_type')} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none">
                    <option value="">Select Treatment...</option>
                    <option value="Nutritional Medicine">Nutritional Medicine</option>
                    <option value="Acupuncture/Acupressure Therapy">Acupuncture/Acupressure Therapy</option>
                    <option value="Chiropractic Therapy">Chiropractic Therapy</option>
                    <option value="Cupping Therapy">Cupping Therapy (Dry, Wet, Fire)</option>
                    <option value="Aromatherapy">Aromatherapy</option>
                    <option value="Manual Therapy">Manual Therapy</option>
                    <option value="Phytoremedies">Phytoremedies</option>
                    <option value="Nutritional Recipes">Nutritional Recipes</option>
                  </select>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Treatment-specific Notes</label>
                    <textarea 
                      {...register('treatment_notes')}
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
                    {['Iridology Diagnosis', 'Sclerology Diagnosis', 'Qrmba'].map((type) => (
                        <label key={type} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="checkbox" {...register(`diagnostics.${type}`)} className="rounded text-sky-600" /> {type}
                        </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                     {['Reflexology Diagnosis', 'Acupuncture Diagnosis', 'Manual Diagnosis', 'Laboratory Test'].map((type) => (
                        <label key={type} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="checkbox" {...register(`diagnostics.${type}`)} className="rounded text-sky-600" /> {type}
                        </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Findings & Observations</label>
                  <textarea 
                    {...register('diagnostic_notes')}
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
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? 'Update Visit Record' : 'Record Visit & Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordVisitModal;
