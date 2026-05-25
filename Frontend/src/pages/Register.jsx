import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, User, Mail, Lock, Phone, MapPin, AlertCircle, ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    shopName: '',
    shopAddress: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, shopName, phone } = formData;

    if (!name || !email || !password || !shopName || !phone) {
      return setError('Please fill in all required fields');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setIsSubmitting(true);
    setError('');

    const res = await register(formData);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Registration failed. Email might already exist.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans">
      {/* Left Column: Premium Marketing Sidebar (Hidden on small screens) */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden flex-col justify-between p-12 bg-slate-900 text-white premium-gradient">
        {/* Animated Background Mesh & Blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.2),transparent_50%)]" />
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-500/15 blur-[80px] animate-float-reverse" />
        
        {/* Grid Pattern overlay for tech feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

        {/* Brand Logo & Name */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shadow-inner">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              Udhaar Khata <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">Digital</span>
            </span>
          </div>
        </div>

        {/* Hero Features Showcase */}
        <div className="relative z-10 my-auto max-w-md space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3.5 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              Easy Store Setup
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Grow Your Business <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-pink-200 to-white">With Smart Bookkeeping</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Open your free digital ledger account in seconds. Easily monitor customer balances, track transactions, and keep cashflow steady.
            </p>
          </div>

          {/* Core Benefit Checklist */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 text-indigo-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">100% Free Ledger Management</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 text-indigo-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Easy PDF Balance Sheets Export</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 text-indigo-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Instant SMS Notifications</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 text-xs text-slate-400 flex justify-between items-center border-t border-white/10 pt-6">
          <p>© 2026 Udhaar Khata Inc.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[11px]">ISO 27001 Certified Security</span>
          </div>
        </div>
      </div>

      {/* Right Column: Elegant Auth Panel */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-slate-50/70">
        
        {/* Floating background decorative blur for right column on smaller screens */}
        <div className="absolute top-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-200/40 blur-[80px] pointer-events-none lg:hidden" />
        
        {/* Small Screen Brand Logo Header */}
        <div className="lg:hidden text-center mb-8 flex flex-col items-center z-10">
          <div className="bg-primary-600 p-3 rounded-2xl shadow-lg shadow-primary-500/20 text-white mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Udhaar Khata</h2>
          <p className="text-slate-500 text-xs mt-0.5">Open your Digital Ledger Book in seconds</p>
        </div>

        {/* Register Card */}
        <div className="w-full max-w-2xl bg-white border border-slate-100/80 rounded-3xl shadow-premium p-8 sm:p-10 transition-all duration-300 hover:shadow-premium-hover relative z-10 animate-fade-in">
          
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Register Your Business</h2>
            <p className="text-slate-400 text-xs mt-1">Join thousands of smart shopkeepers managing bookkeeping digitally</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 bg-danger-50 text-danger-700 text-xs rounded-xl flex items-center gap-2.5 border border-danger-100/60 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Personal Details Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                    Owner Details
                  </h3>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      name="name"
                      type="text"
                      className="input-premium pl-11"
                      placeholder="Rajesh Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Email Address *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      className="input-premium pl-11"
                      placeholder="rajesh@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      className="input-premium pl-11"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Shop / Business Info Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                    Shop / Store Details
                  </h3>
                </div>

                {/* Shop Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Shop Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-4.5 h-4.5" />
                    </div>
                    <input
                      name="shopName"
                      type="text"
                      className="input-premium pl-11"
                      placeholder="Kumar Kirana Store"
                      value={formData.shopName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Store Phone Number *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <input
                      name="phone"
                      type="text"
                      className="input-premium pl-11"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Store Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <input
                      name="shopAddress"
                      type="text"
                      className="input-premium pl-11"
                      placeholder="Main Street, Sector 4, New Delhi"
                      value={formData.shopAddress}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="btn-primary w-full py-3 mt-4 text-xs font-bold tracking-wider uppercase transition-all duration-300 transform active:scale-[0.98] hover:translate-y-[-1px] hover:shadow-indigo-500/10 shadow-lg bg-gradient-to-r from-indigo-600 to-primary-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Register & Create Free Account
                  <ArrowRight className="w-4.5 h-4.5 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch page */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-extrabold hover:text-indigo-700 hover:underline transition-colors duration-200">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security certification info */}
        <div className="mt-8 text-center text-[11px] text-slate-400 z-10 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <p>Your ledger data is encrypted & secure.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
