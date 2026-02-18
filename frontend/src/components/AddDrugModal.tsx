import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Pill } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import type { Drug } from '../types';

import toast from 'react-hot-toast';

const drugSchema = z.object({
  name: z.string().min(2, 'Medication name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit_price: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().positive('Price must be greater than 0')
  ),
  stock_quantity: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, 'Stock cannot be negative')
  ),
  low_stock_threshold: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, 'Threshold cannot be negative')
  ),
  expiry_date: z.string().min(1, 'Expiry date is required'),
});

interface AddDrugModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugToEdit?: Drug | null;
}

const AddDrugModal: React.FC<AddDrugModalProps> = ({ isOpen, onClose, drugToEdit }) => {
  const queryClient = useQueryClient();

  // Fetch Categories from the new relational table
  const { data: categories } = useQuery({
    queryKey: ['drug-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/pharmacy/categories');
      return response.data;
    }
  });

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
      toast.success(drugToEdit ? 'Medication updated successfully' : 'Medication added successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || (drugToEdit ? 'Failed to update medication' : 'Failed to add medication'));
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Pill className="text-sky-600 dark:text-sky-400" size={20} />
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {drugToEdit ? 'Edit Medication' : 'Add New Medication'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Medication Name *</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                placeholder="e.g., Amoxicillin 500mg"
              />
              {errors.name?.message && (
                <p className="mt-1 text-xs text-rose-500">{String(errors.name.message)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Category</label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                >
                  <option value="">Select Category</option>
                  {(categories || []).map((cat: {id: number, name: string}) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  {(!categories || categories.length === 0) && ["Antibiotics", "Analgesics", "Supplements", "First Aid"].map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category?.message && (
                  <p className="mt-1 text-xs text-rose-500">{String(errors.category.message)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Unit Price ($) *</label>
                <input
                  {...register('unit_price')}
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
                {errors.unit_price?.message && (
                  <p className="mt-1 text-xs text-rose-500">{String(errors.unit_price.message)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Stock Quantity *</label>
                <input
                  {...register('stock_quantity')}
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
                {errors.stock_quantity?.message && (
                  <p className="mt-1 text-xs text-rose-500">{String(errors.stock_quantity.message)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Low Stock Alert *</label>
                <input
                  {...register('low_stock_threshold')}
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
                {errors.low_stock_threshold?.message && (
                  <p className="mt-1 text-xs text-rose-500">{String(errors.low_stock_threshold.message)}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Expiry Date</label>
              <input
                {...register('expiry_date')}
                type="date"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              />
              {errors.expiry_date?.message && (
                <p className="mt-1 text-xs text-rose-500">{String(errors.expiry_date.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                placeholder="Dosage info, storage instructions..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/50 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-8 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 uppercase tracking-widest"
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
