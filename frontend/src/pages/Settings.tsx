import { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Shield, 
  DollarSign, 
  Save,
  Building,
  Loader2,
  Check, 
  Eye, 
  EyeOff,
  ImagePlus,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const Settings = () => {
  const { user, permissions } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  // Clear messages on tab change
  useEffect(() => {
    setSuccessMsg('');
    setErrorMsg('');
  }, [activeTab]);

  // --- Profile Settings ---
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) => apiClient.put('/users/me', data),
    onSuccess: () => {
      setSuccessMsg('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
    onError: (err) => {
      setErrorMsg('Failed to update profile.');
      console.error(err);
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  // --- Security Settings ---
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { password: string }) => apiClient.put('/users/me', data),
    onSuccess: () => {
      setSuccessMsg('Password updated successfully.');
      setPasswordData({ password: '', confirmPassword: '' });
    },
    onError: (err) => {
      setErrorMsg('Failed to update password.');
      console.error(err);
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (passwordData.password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
    }
    updatePasswordMutation.mutate({ password: passwordData.password });
  };

  // --- Clinic & Billing Settings ---
  const { data: clinicSettings, isLoading: isClinicLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/');
      return response.data;
    },
  });

  const [clinicData, setClinicData] = useState({
    name: '',
    contact_number: '',
    email: '',
    website: '',
    address: '',
    consultation_fee: 50,
    logo_url: '',
  });

  useEffect(() => {
    if (clinicSettings) {
      setClinicData({
        name: clinicSettings.name || '',
        contact_number: clinicSettings.contact_number || '',
        email: clinicSettings.email || '',
        website: clinicSettings.website || '',
        address: clinicSettings.address || '',
        consultation_fee: clinicSettings.consultation_fee || 50,
        logo_url: clinicSettings.logo_url || '',
      });
    }
  }, [clinicSettings]);

  const updateClinicMutation = useMutation({
    mutationFn: (data: typeof clinicData) => apiClient.put('/settings/', data),
    onSuccess: () => {
      setSuccessMsg('Settings saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
    },
    onError: (err) => {
      setErrorMsg('Failed to save settings.');
      console.error(err);
    }
  });

  const handleClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicMutation.mutate(clinicData as any);
  };
  
  const handleBillingSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateClinicMutation.mutate(clinicData as any);
  }

  // --- Drug Category Management (Relational) ---
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['drug-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/pharmacy/categories');
      return response.data;
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => apiClient.post('/pharmacy/categories', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drug-categories'] });
      setSuccessMsg('Category added successfully.');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to add category.');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/pharmacy/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drug-categories'] });
      setSuccessMsg('Category removed successfully.');
      setDeletingCategoryId(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to remove category.');
      setDeletingCategoryId(null);
    }
  });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight leading-none mb-2">Settings</h1>
          <p className="text-[var(--muted)] font-medium">Configure your profile and clinic preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${
              activeTab === 'profile' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User size={18} />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${
              activeTab === 'security' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock size={18} />
            Security
          </button>

          {permissions.manage_settings && (
            <button 
              onClick={() => setActiveTab('clinic')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${
                activeTab === 'clinic' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building size={18} />
              Clinic Settings
            </button>
          )}

          {permissions.manage_billing && user?.role !== 'cashier' && (
            <button 
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${
                activeTab === 'billing' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <DollarSign size={18} />
              Billing & Fees
            </button>
          )}

          {permissions.manage_roles && (user?.role === 'super_admin' || user?.role === 'admin') && (
            <button 
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${
                activeTab === 'roles' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shield size={18} />
              Roles & Permissions
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden min-h-[500px] transition-all duration-300">
          {/* Feedback Messages */}
          {(successMsg || errorMsg) && (
             <div className={`p-4 mx-8 mt-8 rounded-xl flex items-center gap-2 ${successMsg ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'}`}>
                {successMsg ? <Check size={18} /> : <Shield size={18} />}
                <p className="text-sm font-black tracking-tight">{successMsg || errorMsg}</p>
             </div>
          )}

          {activeTab === 'clinic' && (
            <form onSubmit={handleClinicSubmit} className="p-8 space-y-6">
              {/* <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-[var(--border)] pb-4 tracking-tight uppercase tracking-widest text-xs opacity-50">Clinic Information</h3> */}
              <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight leading-none mb-2">Clinic Information</h3>
              {isClinicLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-sky-600" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-widest">Clinic Name</label>
                      <input 
                        type="text" 
                        value={clinicData.name}
                        onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-widest">Contact Number</label>
                      <input 
                        type="text" 
                        value={clinicData.contact_number}
                        onChange={(e) => setClinicData({...clinicData, contact_number: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-widest">Clinic Email</label>
                      <input 
                        type="email" 
                        value={clinicData.email}
                        onChange={(e) => setClinicData({...clinicData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-widest">Website</label>
                      <input 
                        type="text" 
                        value={clinicData.website}
                        onChange={(e) => setClinicData({...clinicData, website: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs font-black text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-widest">Clinic Logo</label>
                       <div className="flex items-center gap-6 p-4 bg-[var(--input)] border border-[var(--border)] rounded-2xl transition-all">
                          <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden"> 
                             <img 
                               src={clinicData.logo_url || '/assets/logo.png'} 
                               alt="Clinic Logo" 
                               className="max-w-full max-h-full object-contain"
                             />
                          </div>
                          <div className="flex-1 space-y-2">
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">Recommended size: 512x512px. PNG or SVG preferred.</p>
                             <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm uppercase tracking-widest">
                                   <ImagePlus size={14} />
                                   Choose Image
                                   <input 
// ...
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                          const uploadBase = API_URL.endsWith('/api/v1') ? API_URL.replace('/api/v1', '') : API_URL;
                                          const response = await apiClient.post('/upload/', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                          });
                                          let finalUrl = response.data.url;
                                          if (finalUrl.startsWith('/')) finalUrl = `${uploadBase}${finalUrl}`;
                                          setClinicData({...clinicData, logo_url: finalUrl});
                                          setSuccessMsg('Logo uploaded. Click Save to apply.');
                                        } catch (err) {
                                          console.error(err);
                                          setErrorMsg('Failed to upload logo.');
                                        }
                                      }}
                                   />
                                </label>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-500 mb-2">Clinic Address</label>
                      <textarea 
                        value={clinicData.address}
                        onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none h-24 resize-none"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-4">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <label className="text-sm font-bold text-slate-500">Inventory Drug Categories</label>
                          {isCategoriesLoading && <Loader2 size={16} className="animate-spin text-sky-600" />}
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {categories?.map((cat: { id: number, name: string }) => (
                             <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--input)] text-[var(--foreground)] border border-[var(--border)] rounded-full text-xs font-bold group">
                                {cat.name}
                                <button 
                                  type="button"
                                  onClick={() => setDeletingCategoryId(cat.id)}
                                  className="text-sky-300 hover:text-sky-600 transition-colors"
                                >
                                   <X size={12} />
                                </button>
                             </div>
                          ))}
                          <div className="relative">
                             <input 
                               type="text"
                               placeholder="New Category..."
                               onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                     e.preventDefault();
                                     const val = (e.target as HTMLInputElement).value.trim();
                                     if (val) {
                                        addCategoryMutation.mutate(val);
                                        (e.target as HTMLInputElement).value = '';
                                     }
                                  }
                               }}
                               className="px-4 py-1.5 bg-[var(--input)] border border-[var(--border)] rounded-full text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-32" // adapt it to darkmode
                             />
                             <Plus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
                          </div>
                       </div>
                       <p className="text-xs text-slate-400">These categories will be available when adding or editing items in the Pharmacy module.</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={updateClinicMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary)]/80 transition-all disabled:opacity-50">
                      {updateClinicMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save Settings
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight leading-none mb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    // className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    // className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-500 mb-2">Profile Image</label>
                  <div className="flex items-center gap-4">
                    <img 
                      src={profileData.avatar_url || 'https://via.placeholder.com/150'} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover border border-slate-200"
                    />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append('file', file);

                        try {
                          // Determine API base URL
                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                          const uploadUrl = API_URL.endsWith('/api/v1') ? API_URL.replace('/api/v1', '') : API_URL;

                          const response = await apiClient.post('/upload/', formData, {
                            headers: {
                              'Content-Type': 'multipart/form-data',
                            },
                          });
                          
                          // Construct full URL if relative path returned
                          let avatarUrl = response.data.url;
                          if (avatarUrl.startsWith('/')) {
                             avatarUrl = `${uploadUrl}${avatarUrl}`;
                          }
                          
                          setProfileData({...profileData, avatar_url: avatarUrl});
                          setSuccessMsg('Image uploaded successfully. Click Save to persist.');
                        } catch (err) {
                          console.error(err);
                          setErrorMsg('Failed to upload image.');
                        }
                      }}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-sky-50 file:text-sky-700
                        hover:file:bg-sky-100
                      "
                    />
                  </div>
                  {/* <input 
                    type="text" 
                    value={profileData.avatar_url || ''}
                    onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                  /> */}
                  <p className="text-xs text-slate-400 mt-2">Enter a direct link to your profile image.</p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={updateProfileMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary)]/80 transition-all disabled:opacity-50">
                  {updateProfileMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
              {/* <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Password & Security</h3> */}
              <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight leading-none mb-2">Password & Security</h3>
              <div className="max-w-md space-y-4">
                {/* Note: Current password verification would require a separate endpoint usually, skipping for now */}
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.password}
                      onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                      // className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 transition-colors cursor-pointer outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      // className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sky-600 transition-colors cursor-pointer outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={updatePasswordMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-[var(--primary)] text-[var(--foreground)] rounded-xl font-bold hover:bg-[var(--primary)]/80 transition-all disabled:opacity-50">
                   {updatePasswordMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                   Update Password
                </button>
              </div>
            </form>
          )}

          {activeTab === 'billing' && (
            <form onSubmit={handleBillingSubmit} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight leading-none mb-2">Billing Configuration</h3>
              {isClinicLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-sky-600" /></div>
              ) : (
                <>
                  <div className="max-w-md space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2">Standard Consultation Fee (₦)</label>
                      <input 
                        type="number" 
                        value={clinicData.consultation_fee}
                        onChange={(e) => setClinicData({...clinicData, consultation_fee: parseFloat(e.target.value)})}
                        className="w-full px-4 py-2 bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-bold"
                      />
                      <p className="text-xs text-slate-400 mt-2 italic">Applied automatically to new clinical visits (this includes patients ID Card form fee).</p>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                      <DollarSign size={20} />
                      <p className="text-sm font-medium">Automatic billing is currently enabled.</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={updateClinicMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary)]/80 transition-all disabled:opacity-50">
                      {updateClinicMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save Configuration
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {activeTab === 'roles' && <RolesPermissionsTab setSuccessMsg={setSuccessMsg} setErrorMsg={setErrorMsg} />}
        </div>
      </div>
      <ConfirmModal
        isOpen={!!deletingCategoryId}
        onClose={() => setDeletingCategoryId(null)}
        onConfirm={() => deletingCategoryId && deleteCategoryMutation.mutate(deletingCategoryId)}
        title="Delete Category"
        message="Are you sure you want to delete this drug category? This will affect medication classification."
        confirmLabel="Delete Category"
        isDanger={true}
        isLoading={deleteCategoryMutation.isPending}
      />
    </div>
  );
};

const RolesPermissionsTab = ({ setSuccessMsg, setErrorMsg }: { setSuccessMsg: (msg: string) => void, setErrorMsg: (msg: string) => void }) => {
  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ['roles-permissions'],
    queryFn: async () => {
      const response = await apiClient.get('/permissions/');
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  const updatePermissionMutation = useMutation({
    mutationFn: ({ role, permissions }: { role: string, permissions: Record<string, boolean> }) => 
      apiClient.put(`/permissions/${role}`, permissions),
    onSuccess: () => {
      setSuccessMsg('Permissions updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['roles-permissions'] });
    },
    onError: () => {
      setErrorMsg('Failed to update permissions.');
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sky-600" /></div>;

  const roles = Object.keys(rolePermissions || {});
  const permissions = roles.length > 0 ? Object.keys(rolePermissions[roles[0]]) : [];

  const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight leading-none mb-2">Role Permission Matrix</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2 font-medium">Configure what each user role is allowed to see and do.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest opacity-50">Permission</th>
              {roles.map(role => (
                <th key={role} className="text-center py-4 px-4 text-xs font-black uppercase tracking-widest text-sky-600">{role.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {permissions.map(perm => (
              <tr key={perm} className="hover:bg-slate-50 dark:hover:bg-slate-500/50 transition-colors">
                <td className="py-4 px-4">
                  <span className="text-sm font-black text-slate-500 dark:text-slate-300">{formatKey(perm)}</span>
                </td>
                {roles.map(role => (
                  <td key={`${role}-${perm}`} className="py-4 px-4 text-center">
                    <button
                      onClick={() => {
                        const currentVal = rolePermissions[role][perm];
                        updatePermissionMutation.mutate({
                          role,
                          permissions: { ...rolePermissions[role], [perm]: !currentVal }
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${ 
                        rolePermissions[role][perm] ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-500'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rolePermissions[role][perm] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-sky-50 dark:bg-sky-500/10 rounded-xl border border-sky-100 dark:border-sky-500/20">
         <div className="flex gap-3">
            <Shield className="text-sky-600 shrink-0" size={20} />
            <p className="text-xs text-sky-800 dark:text-sky-300 font-medium leading-relaxed">
               <strong>Note:</strong> Changes to permissions take effect immediately for all users assigned to the modified roles. Some changes may require a page refresh to update sidebar visibility or dashboard charts.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Settings;