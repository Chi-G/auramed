import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Mail,
  Shield,
  UserPlus,
  Loader2,
  X,
  Check,
  User as UserIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
}

const Staff = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const { data: staff, isLoading } = useQuery<User[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await apiClient.get<User[]>('/users/');
      return response.data;
    },
  });

  const filteredStaff = staff?.filter(s => 
    s.role !== 'super_admin' && (
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight leading-none mb-2">Staff Management</h1>
          <p className="text-[var(--muted)] font-medium">Manage hospital personnel and access roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10 active:scale-95"
        >
          <UserPlus size={20} />
          Register Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card)] p-4 rounded-2xl shadow-sm border border-[var(--border)] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          <input
            type="text"
            placeholder="Search staff by name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--background)]/50"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[var(--background)]/50 rounded"></div>
                  <div className="h-3 w-20 bg-[var(--background)]/50 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                <div className="h-3 w-full bg-[var(--background)]/50 rounded"></div>
              </div>
            </div>
          ))
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[var(--card)] rounded-3xl border border-dashed border-[var(--border)]">
            <div className="w-16 h-16 bg-[var(--input)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
              <UserIcon size={32} />
            </div>
            <p className="text-[var(--muted)] text-sm italic font-medium opacity-60">No staff members match your search.</p>
          </div>
        ) : filteredStaff.map((member) => (
          <div key={member.id} className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group overflow-hidden relative">
             {/* Role Badge - Absolute Top Right */}
             <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  member.role === 'super_admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' :
                  member.role === 'admin' ? 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20' :
                  member.role === 'cashier' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                  'bg-[var(--background)]/50 text-[var(--muted)] border-[var(--border)]'
                }`}>
                  {member.role.replace('_', ' ')}
                </span>
             </div>

             <div className="flex items-center gap-4 mb-6">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-16 h-16 rounded-2xl object-cover border-4 border-white dark:border-[var(--background)] shadow-md group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-xl font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div className="min-w-0 pr-12">
                   <h3 className="font-black text-[var(--foreground)] truncate leading-tight tracking-tight">{member.full_name}</h3>
                   <p className="text-xs text-[var(--muted)] font-medium flex items-center gap-1 mt-1 truncate">
                      <Mail size={12} className="shrink-0" />
                      {member.email}
                   </p>
                </div>
             </div>

             <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                   <div className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[var(--muted)]'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">{member.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStaff(member);
                    setIsDetailsOpen(true);
                  }}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 uppercase tracking-widest px-3 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-all"
                >
                  Details
                </button>
             </div>
          </div>
        ))}
      </div>

      <RegisterStaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUserRole={currentUser?.role || ''}
      />

      <StaffDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        staff={selectedStaff}
      />
    </div>
  );
};

const StaffDetailsModal = ({ isOpen, onClose, staff }: { isOpen: boolean, onClose: () => void, staff: User | null }) => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (data: Partial<User>) => apiClient.put(`/users/${staff?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff details updated');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update staff');
    }
  });

  if (!isOpen || !staff) return null;

  const toggleStatus = () => {
    mutation.mutate({ is_active: !staff.is_active });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-[var(--card)] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border)]">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Staff Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-[var(--background)]/50 rounded-xl transition-colors">
              <X size={20} className="text-[var(--muted)]" />
            </button>
          </div>

          <div className="flex flex-col items-center mb-8">
            {staff.avatar_url ? (
              <img src={staff.avatar_url} className="w-24 h-24 rounded-3xl object-cover mb-4 border-4 border-white dark:border-[var(--background)] shadow-xl" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-xl">
                {staff.full_name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <h3 className="text-xl font-black text-[var(--foreground)]">{staff.full_name}</h3>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 border border-sky-100/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20 mt-2">
              {staff.role.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-[var(--background)]/50 rounded-2xl">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Email</span>
              <span className="text-sm font-bold text-[var(--foreground)]">{staff.email}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[var(--background)]/50 rounded-2xl">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Status</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${staff.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                {staff.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={toggleStatus}
              disabled={mutation.isPending}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                staff.is_active 
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 dark:border-rose-500/20' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:border-emerald-500/20'
              }`}
            >
              {mutation.isPending ? 'Processing...' : staff.is_active ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterStaffModal = ({ isOpen, onClose, currentUserRole }: { isOpen: boolean, onClose: () => void, currentUserRole: string }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'nurse'
  });
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member registered successfully');
      onClose();
      setFormData({ full_name: '', email: '', password: '', role: 'nurse' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to register staff');
    }
  });

  if (!isOpen) return null;

  // Determine available roles based on hierarchy
  const allRoles = [
      { id: 'super_admin', label: 'Super Admin' },
      { id: 'admin', label: 'Admin' },
      { id: 'doctor', label: 'Doctor' },
      { id: 'nurse', label: 'Nurse' },
      { id: 'receptionist', label: 'Receptionist' },
      { id: 'cashier', label: 'Cashier' }
  ];

  let availableRoles: { id: string, label: string }[] = [];
  if (currentUserRole === 'super_admin') {
      availableRoles = allRoles;
  } else if (currentUserRole === 'admin') {
      availableRoles = allRoles.filter(r => ['doctor', 'nurse', 'receptionist', 'cashier'].includes(r.id));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-[var(--card)] rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border)]">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-none mb-1">New Staff</h2>
                <p className="text-xs text-[var(--muted)] font-medium tracking-tight">Access level: {currentUserRole.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--background)]/50 rounded-xl transition-colors">
              <X size={20} className="text-[var(--muted)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input
                required
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-5 py-3.5 bg-[var(--input)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-sm font-bold"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-5 py-3.5 bg-[var(--input)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-sm font-bold"
                placeholder="john@auramed.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-2 ml-1">Temporary Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-5 py-3.5 bg-[var(--input)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-sm font-bold pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-2 ml-1">Assigned Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-5 py-3.5 bg-[var(--input)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
              >
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-[var(--muted)] hover:bg-[var(--background)]/50 transition-all border border-[var(--border)]"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-[1.5] flex items-center justify-center gap-2 bg-sky-600 dark:bg-sky-500 text-white px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-sky-500/25 dark:shadow-sky-500/10 disabled:opacity-50"
              >
                {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Staff;