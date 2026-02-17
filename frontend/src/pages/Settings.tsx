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

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Configure your profile and clinic preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'profile' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={18} />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'security' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Lock size={18} />
            Security
          </button>
          <button 
            onClick={() => setActiveTab('clinic')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'clinic' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building size={18} />
            Clinic Settings
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'billing' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign size={18} />
            Billing & Fees
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {/* Feedback Messages */}
          {(successMsg || errorMsg) && (
             <div className={`p-4 mx-8 mt-8 rounded-xl flex items-center gap-2 ${successMsg ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {successMsg ? <Check size={18} /> : <Shield size={18} />}
                <p className="text-sm font-bold">{successMsg || errorMsg}</p>
             </div>
          )}

          {activeTab === 'clinic' && (
            <form onSubmit={handleClinicSubmit} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Clinic Information</h3>
              {isClinicLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-sky-600" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Clinic Name</label>
                      <input 
                        type="text" 
                        value={clinicData.name}
                        onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Contact Number</label>
                      <input 
                        type="text" 
                        value={clinicData.contact_number}
                        onChange={(e) => setClinicData({...clinicData, contact_number: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Clinic Email</label>
                      <input 
                        type="email" 
                        value={clinicData.email}
                        onChange={(e) => setClinicData({...clinicData, email: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                      <input 
                        type="text" 
                        value={clinicData.website}
                        onChange={(e) => setClinicData({...clinicData, website: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-slate-700 mb-2">Clinic Logo</label>
                       <div className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="w-20 h-20 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
                             <img 
                               src={clinicData.logo_url || '/assets/logo.png'} 
                               alt="Clinic Logo" 
                               className="max-w-full max-h-full object-contain"
                             />
                          </div>
                          <div className="flex-1 space-y-2">
                             <p className="text-xs text-slate-500 font-medium">Recommended size: 512x512px. PNG or SVG preferred.</p>
                             <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                                   <ImagePlus size={14} />
                                   Choose Image
                                   <input 
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
                      <label className="block text-sm font-bold text-slate-700 mb-2">Clinic Address</label>
                      <textarea 
                        value={clinicData.address}
                        onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none h-24 resize-none"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-4">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <label className="text-sm font-bold text-slate-700">Inventory Drug Categories</label>
                          {isCategoriesLoading && <Loader2 size={16} className="animate-spin text-sky-600" />}
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {categories?.map((cat: { id: number, name: string }) => (
                             <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-bold group">
                                {cat.name}
                                <button 
                                  type="button"
                                  onClick={() => deleteCategoryMutation.mutate(cat.id)}
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
                               className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-32"
                             />
                             <Plus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
                          </div>
                       </div>
                       <p className="text-xs text-slate-400">These categories will be available when adding or editing items in the Pharmacy module.</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={updateClinicMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
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
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Profile Image</label>
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
                <button type="submit" disabled={updateProfileMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                  {updateProfileMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Password & Security</h3>
              <div className="max-w-md space-y-4">
                {/* Note: Current password verification would require a separate endpoint usually, skipping for now */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.password}
                      onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none"
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
                <button type="submit" disabled={updatePasswordMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                   {updatePasswordMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                   Update Password
                </button>
              </div>
            </form>
          )}

          {activeTab === 'billing' && (
            <form onSubmit={handleBillingSubmit} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Billing Configuration</h3>
              {isClinicLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-sky-600" /></div>
              ) : (
                <>
                  <div className="max-w-md space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Standard Consultation Fee (₦)</label>
                      <input 
                        type="number" 
                        value={clinicData.consultation_fee}
                        onChange={(e) => setClinicData({...clinicData, consultation_fee: parseFloat(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none font-bold"
                      />
                      <p className="text-xs text-slate-400 mt-2 italic">Applied automatically to new clinical visits.</p>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                      <DollarSign size={20} />
                      <p className="text-sm font-medium">Automatic billing is currently enabled.</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={updateClinicMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                      {updateClinicMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save Configuration
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
