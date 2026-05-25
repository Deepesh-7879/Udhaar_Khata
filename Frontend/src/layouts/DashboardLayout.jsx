import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Store,
  User as UserIcon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers Book', href: '/customers', icon: Users },
    { name: 'Reports Log', href: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-white flex-shrink-0 border-r border-slate-800">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Udhaar Khata</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">SaaS Ledger</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-900/10' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserIcon className="w-5 h-5 text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user?.role === 'owner' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-900/60 text-primary-200 border border-primary-800">
                    <ShieldCheck className="w-3 h-3" /> Owner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-200 border border-emerald-900">
                    <UserCheck className="w-3 h-3" /> Staff
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-800 hover:border-danger-700/40 hover:bg-danger-900/10 text-slate-400 hover:text-danger-400 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-64 bg-slate-900 text-white flex flex-col animate-fade-in">
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Shop Header */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
              <Store className="w-6 h-6 text-primary-500" />
              <div>
                <h1 className="font-bold text-base">{user?.shopName || 'Udhaar Ledger'}</h1>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      active 
                        ? 'bg-primary-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Nav Footer */}
            <div className="p-4 border-t border-slate-800">
              <p className="text-xs text-slate-400 mb-2">Signed in as</p>
              <p className="text-sm font-semibold truncate mb-4">{user?.email}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-danger-600/10 text-danger-400 hover:bg-danger-600 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Header */}
        <header className="glass-header h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-600" />
              <span className="font-bold text-slate-800 text-lg hidden sm:inline-block">
                {user?.shopName || 'Kirana Store'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Stats Banner */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span>GSTIN: Exempt</span>
              <span className="h-4 w-px bg-slate-200"></span>
              <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg uppercase">
                {user?.role === 'owner' ? 'Shop Admin Portal' : 'Staff Terminal'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-inner uppercase">
                {user?.name?.[0]}
              </span>
              <span className="text-sm font-medium text-slate-700 hidden md:inline-block">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
