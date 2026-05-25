import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Save, 
  UserPlus, 
  Users, 
  Store, 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Lock,
  Phone,
  UserCheck
} from 'lucide-react';

const Settings = () => {
  const { user, updateProfileSettings } = useAuth();
  
  // Profile settings state
  const isEmployee = user?.role === 'employee';

  const [profileData, setProfileData] = useState({
    name: isEmployee ? (user?.ownerDetails?.name || '') : (user?.name || ''),
    phone: isEmployee ? (user?.ownerDetails?.phone || '') : (user?.phone || ''),
    shopName: user?.shopName || user?.ownerDetails?.shopName || '',
    shopAddress: user?.shopAddress || user?.ownerDetails?.shopAddress || '',
    upiId: user?.upiId || user?.ownerDetails?.upiId || '',
    smtpHost: isEmployee ? (user?.ownerDetails?.smtpHost || '') : (user?.smtpHost || ''),
    smtpPort: isEmployee ? (user?.ownerDetails?.smtpPort || 587) : (user?.smtpPort || 587),
    smtpUser: isEmployee ? (user?.ownerDetails?.smtpUser || '') : (user?.smtpUser || ''),
    smtpPass: isEmployee ? (user?.ownerDetails?.smtpPass || '') : (user?.smtpPass || '')
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Employees lists state (restricted to owner)
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState('');

  // Add employee form state
  const [empData, setEmpData] = useState({ name: '', email: '', password: '', phone: '' });
  const [addEmpError, setAddEmpError] = useState('');
  const [addEmpSuccess, setAddEmpSuccess] = useState('');
  const [isEmpSubmitting, setIsEmpSubmitting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      setEmpError('');
      const res = await api.get('/auth/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      setEmpError(err.message || 'Failed to fetch employee list.');
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    // Populate profile states if user loads
    if (user) {
      const timer = setTimeout(() => {
        setProfileData({
          name: user.role === 'employee' ? (user.ownerDetails?.name || '') : (user.name || ''),
          phone: user.role === 'employee' ? (user.ownerDetails?.phone || '') : (user.phone || ''),
          shopName: user.shopName || user.ownerDetails?.shopName || '',
          shopAddress: user.shopAddress || user.ownerDetails?.shopAddress || '',
          upiId: user.upiId || user.ownerDetails?.upiId || '',
          smtpHost: user.role === 'employee' ? (user.ownerDetails?.smtpHost || '') : (user.smtpHost || ''),
          smtpPort: user.role === 'employee' ? (user.ownerDetails?.smtpPort || 587) : (user.smtpPort || 587),
          smtpUser: user.role === 'employee' ? (user.ownerDetails?.smtpUser || '') : (user.smtpUser || ''),
          smtpPass: user.role === 'employee' ? (user.ownerDetails?.smtpPass || '') : (user.smtpPass || '')
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    // Fetch employee accounts if role is owner
    if (user?.role === 'owner') {
      const timer = setTimeout(() => {
        fetchEmployees();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, fetchEmployees]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name || !profileData.phone || (user?.role === 'owner' && !profileData.shopName)) {
      return setProfileError('Please fill in all required fields.');
    }

    setIsProfileSubmitting(true);
    setProfileError('');
    setProfileSuccess('');

    const res = await updateProfileSettings(profileData);
    setIsProfileSubmitting(false);

    if (res.success) {
      setProfileSuccess('Shop parameters and settings saved successfully.');
      setTimeout(() => setProfileSuccess(''), 4500);
    } else {
      setProfileError(res.error || 'Failed to save settings.');
    }
  };

  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, phone } = empData;

    if (!name || !email || !password || !phone) {
      return setAddEmpError('Please fill in all employee registration fields.');
    }

    if (password.length < 6) {
      return setAddEmpError('Password must be at least 6 characters.');
    }

    setIsEmpSubmitting(true);
    setAddEmpError('');
    setAddEmpSuccess('');

    try {
      const res = await api.post('/auth/employees', empData);
      if (res.data.success) {
        setAddEmpSuccess(`Employee account for "${name}" registered successfully.`);
        setEmpData({ name: '', email: '', password: '', phone: '' });
        fetchEmployees();
        setTimeout(() => setAddEmpSuccess(''), 4500);
      }
    } catch (err) {
      setAddEmpError(err.message || 'Failed to register employee.');
    } finally {
      setIsEmpSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 md:text-2xl">Shop Settings</h2>
        <p className="text-slate-500 text-sm mt-0.5">Configure store information, UPI addresses, and employee profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile / Shop info card */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-slate-800 text-base">Store & Merchant Profile</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {isEmployee && (
              <div className="p-4 bg-primary-50 text-primary-855 text-xs rounded-xl flex items-center gap-2.5 border border-primary-100/60 animate-fade-in font-medium">
                <AlertCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>You are logged in as a <strong>Staff Employee</strong>. Shop configurations are managed by the merchant owner and are read-only here.</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-danger-50 text-danger-700 text-xs rounded-xl flex items-center gap-1.5 border border-danger-100">
                <AlertCircle className="w-4 h-4" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 border border-emerald-100 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shopkeeper name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Merchant Name *</label>
                <input
                  type="text"
                  required
                  className="input-premium"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={isEmployee}
                />
              </div>

              {/* Merchant Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Merchant Phone *</label>
                <input
                  type="text"
                  required
                  className="input-premium"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={isEmployee}
                />
              </div>

              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Shop Name *</label>
                <input
                  type="text"
                  required
                  className="input-premium"
                  value={profileData.shopName}
                  onChange={(e) => setProfileData({ ...profileData, shopName: e.target.value })}
                  disabled={isEmployee}
                />
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  Merchant UPI ID (for Payment QR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className="input-premium pl-9"
                    placeholder="e.g. shopname@okaxis"
                    value={profileData.upiId}
                    onChange={(e) => setProfileData({ ...profileData, upiId: e.target.value })}
                    disabled={isEmployee}
                  />
                </div>
              </div>

              {/* Shop Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 block">Store Address</label>
                <textarea
                  rows="2"
                  className="input-premium py-2 resize-none"
                  value={profileData.shopAddress}
                  onChange={(e) => setProfileData({ ...profileData, shopAddress: e.target.value })}
                  disabled={isEmployee}
                ></textarea>
              </div>
            </div>

            {/* SMTP Settings Section */}
            <div className="border-t border-slate-100 pt-5 mt-5 space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <Mail className="w-4 h-4 text-primary-600" />
                <h4 className="font-bold text-slate-800 text-sm">SMTP Email Integration (Reminders)</h4>
              </div>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-xl">
                Configure your own business/personal SMTP server credentials to send customer due reminders directly from your email address. If left blank, notifications will gracefully fall back to the ledger's default mailing engine.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SMTP Host */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">SMTP Host</label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g. smtp.gmail.com"
                    value={profileData.smtpHost}
                    onChange={(e) => setProfileData({ ...profileData, smtpHost: e.target.value })}
                    disabled={isEmployee}
                  />
                </div>

                {/* SMTP Port */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">SMTP Port</label>
                  <input
                    type="number"
                    className="input-premium"
                    placeholder="e.g. 587"
                    value={profileData.smtpPort}
                    onChange={(e) => setProfileData({ ...profileData, smtpPort: parseInt(e.target.value) || '' })}
                    disabled={isEmployee}
                  />
                </div>

                {/* SMTP Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">SMTP Username</label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g. storeowner@gmail.com"
                    value={profileData.smtpUser}
                    onChange={(e) => setProfileData({ ...profileData, smtpUser: e.target.value })}
                    disabled={isEmployee}
                  />
                </div>

                {/* SMTP Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">SMTP Password / App Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      className="input-premium pl-8"
                      placeholder="••••••••••••"
                      value={profileData.smtpPass}
                      onChange={(e) => setProfileData({ ...profileData, smtpPass: e.target.value })}
                      disabled={isEmployee}
                    />
                  </div>
                </div>
              </div>
            </div>

            {!isEmployee && (
              <button
                type="submit"
                className="btn-primary py-2 px-5 text-xs self-start"
                disabled={isProfileSubmitting}
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            )}
          </form>
        </div>

        {/* User Account / Role summary */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-slate-800 text-base">Account Terminal</h3>
          </div>

          <div className="space-y-3.5 text-sm font-semibold">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Logged in User</span>
              <span className="text-slate-700 font-bold block mt-0.5">{user?.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Login Email</span>
              <span className="text-slate-500 block mt-0.5">{user?.email}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Role</span>
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Employee Management Section (Owner Only) */}
      {user?.role === 'owner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Register employee form */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-slate-800 text-base">Add Employee</h3>
            </div>

            <form onSubmit={handleEmpSubmit} className="space-y-4">
              {addEmpError && (
                <div className="p-3 bg-danger-50 text-danger-700 text-xs rounded-xl flex items-center gap-1.5 border border-danger-100">
                  <AlertCircle className="w-4 h-4" />
                  <span>{addEmpError}</span>
                </div>
              )}

              {addEmpSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 border border-emerald-100 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{addEmpSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Employee Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Name *</label>
                  <input
                    type="text"
                    required
                    className="input-premium py-2"
                    placeholder="Employee name"
                    value={empData.name}
                    onChange={(e) => setEmpData({ ...empData, name: e.target.value })}
                  />
                </div>

                {/* Employee Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      className="input-premium pl-8 py-2"
                      placeholder="employee@store.com"
                      value={empData.email}
                      onChange={(e) => setEmpData({ ...empData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Employee Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Phone *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      className="input-premium pl-8 py-2"
                      placeholder="Phone number"
                      value={empData.phone}
                      onChange={(e) => setEmpData({ ...empData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Employee Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      required
                      className="input-premium pl-8 py-2"
                      placeholder="Min 6 characters"
                      value={empData.password}
                      onChange={(e) => setEmpData({ ...empData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2 text-xs font-bold mt-2"
                disabled={isEmpSubmitting}
              >
                Onboard Employee
              </button>
            </form>
          </div>

          {/* Employee list card */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-slate-800 text-base">Store Employees</h3>
            </div>

            {empLoading ? (
              <div className="py-8 text-center text-slate-450 text-xs">Loading employee listings...</div>
            ) : empError ? (
              <div className="p-3 bg-danger-50 text-danger-700 text-xs rounded-xl">{empError}</div>
            ) : employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-800 font-bold">{emp.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{emp.email}</td>
                        <td className="py-2.5 px-3 text-slate-500">{emp.phone}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200">
                            Employee
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-xs">No employees onboarded yet.</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Use the onboarding form to create employee terminals.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
