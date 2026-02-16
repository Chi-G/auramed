import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Pill } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import type { Drug } from '../types';

const drugSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  unit_price: z.coerce.number().min(0, 'Price must be positive'),
  stock_quantity: z.coerce.number().min(0, 'Stock must be 0 or more'),
  low_stock_threshold: z.coerce.number().min(0, 'Threshold must be 0 or more'),
  expiry_date: z.string().optional().or(z.literal('')),
});

interface AddDrugModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugToEdit?: Drug | null;
}

const AddDrugModal: React.FC<AddDrugModalProps> = ({ isOpen, onClose, drugToEdit }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(drugSchema),
    values: drugToEdit ? {
      name: drugToEdit.name,
      description: drugToEdit.description || '',
      category: drugToEdit.category || '',
      unit_price: drugToEdit.unit_price,
      stock_quantity: drugToEdit.stock_quantity,
      low_stock_threshold: drugToEdit.low_stock_threshold,
      expiry_date: drugToEdit.expiry_date ? drugToEdit.expiry_date.split('T')[0] : '',
    } : {
      name: '',
      description: '',
      category: '',
      unit_price: 0,
      stock_quantity: 0,
      low_stock_threshold: 10,
      expiry_date: '',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        expiry_date: data.expiry_date || null
      };
      if (drugToEdit) {
        return apiClient.put(`/pharmacy/${drugToEdit.id}`, payload);
      }
      return apiClient.post('/pharmacy/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
      reset();
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Pill className="text-sky-600" size={20} />
            <h2 className="text-xl font-bold text-slate-900">
              {drugToEdit ? 'Edit Medication' : 'Add New Medication'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Medication Name *</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                placeholder="e.g., Amoxicillin 500mg"
              />
              {errors.name?.message && (
                <p className="mt-1 text-xs text-rose-500">{String(errors.name.message)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <input
                  {...register('category')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  placeholder="e.g., Antibiotic"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Price ($) *</label>
                <input
                  {...register('unit_price')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                <input
                  {...register('stock_quantity')}
                  type="number"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Low Stock Alert *</label>
                <input
                  {...register('low_stock_threshold')}
                  type="number"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                {...register('expiry_date')}
                type="date"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                placeholder="Dosage info, storage instructions..."
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
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : (drugToEdit ? 'Update' : 'Add Medication')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDrugModal;
