import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Aggregating ledger statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger-50 text-danger-700 rounded-2xl border border-danger-100 flex items-center gap-3 max-w-2xl mx-auto my-8">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h4 className="font-bold">Error Loading Dashboard</h4>
          <p className="text-sm mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  const {
    totalCustomers,
    totalPendingBalance,
    monthlyCollections,
    monthlyCreditExtended,
    paidVsUnpaid,
    recentTransactions,
    dailyStats
  } = stats;

  // Prepare Pie Chart data (Total Credit represents goods given, Total Debit represents collection)
  const pieData = [
    { name: 'Collected', value: paidVsUnpaid.totalDebit || 0.1 },
    { name: 'Pending Due', value: totalPendingBalance || 0 }
  ];
  const COLORS = ['#16a34a', '#ef4444'];

  const cardData = [
    {
      title: 'Total Customers',
      value: totalCustomers,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
      description: 'Active buyers in ledger'
    },
    {
      title: 'Total Pending Balance',
      value: `₹${totalPendingBalance.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-danger-50 text-danger-600 border-danger-100/50',
      description: 'Collectable credit outstanding'
    },
    {
      title: 'Monthly Collection',
      value: `₹${monthlyCollections.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'bg-success-50 text-success-600 border-success-100/50',
      description: 'Payments received this month'
    },
    {
      title: 'Monthly Credit Given',
      value: `₹${monthlyCreditExtended.toLocaleString('en-IN')}`,
      icon: Activity,
      color: 'bg-sky-50 text-sky-600 border-sky-100/50',
      description: 'New credit issued this month'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header welcome */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time statistics of your shop credit ledger</p>
        </div>
        
        <Link to="/customers" className="btn-primary self-start sm:self-auto">
          View Customers Book
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium hover:shadow-premium-hover transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 font-medium">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Credits vs Debits) */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Weekly Credit vs Debit</h3>
            <p className="text-slate-400 text-xs mt-0.5">Timeline of credit issued vs collections in the last 7 days</p>
          </div>
          
          <div className="h-72">
            {dailyStats && dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="Credit" name="Udhaar (Credit)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCredit)" />
                  <Area type="monotone" dataKey="Debit" name="Payment (Debit)" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorDebit)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No recent transaction data to plot charts.
              </div>
            )}
          </div>
        </div>

        {/* Paid vs Unpaid Pie Chart */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Collection Efficiency</h3>
            <p className="text-slate-400 text-xs mt-0.5">Ratio of payments collected vs outstanding credit due</p>
          </div>

          <div className="h-52 my-4 relative flex items-center justify-center">
            {totalPendingBalance === 0 && paidVsUnpaid.totalDebit === 0 ? (
              <div className="text-slate-400 text-sm">No credit history logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Math.round(value).toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center Text */}
            {(totalPendingBalance > 0 || paidVsUnpaid.totalDebit > 0) && (
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-400">Recovery</span>
                <span className="text-lg font-extrabold text-slate-700">
                  {Math.round((paidVsUnpaid.totalDebit / (paidVsUnpaid.totalDebit + totalPendingBalance)) * 100) || 0}%
                </span>
              </div>
            )}
          </div>

          {/* Custom Legends */}
          <div className="space-y-2 text-xs font-medium">
            <div className="flex justify-between items-center bg-success-50/50 p-2.5 rounded-xl border border-success-100/50">
              <span className="flex items-center gap-2 text-success-700">
                <span className="w-2.5 h-2.5 bg-success-500 rounded-full"></span> Total Collections
              </span>
              <span className="font-bold text-slate-700">₹{paidVsUnpaid.totalDebit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center bg-danger-50/50 p-2.5 rounded-xl border border-danger-100/50">
              <span className="flex items-center gap-2 text-danger-700">
                <span className="w-2.5 h-2.5 bg-danger-500 rounded-full"></span> Total Outstanding
              </span>
              <span className="font-bold text-slate-700">₹{totalPendingBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Transactions List */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
            <p className="text-slate-400 text-xs mt-0.5">Auditing logs of last 6 ledger entries across the store</p>
          </div>
        </div>

        {recentTransactions && recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Customer</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Type</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Amount</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Date</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      {tx.customerId ? (
                        <Link 
                          to={`/customers/${tx.customerId._id}`} 
                          className="text-primary-600 font-semibold hover:underline block"
                        >
                          {tx.customerId.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Deleted Customer</span>
                      )}
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">{tx.customerId?.phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-50 text-danger-700 border border-danger-100">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Udhaar (Credit)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-50 text-success-700 border border-success-100">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Paid (Debit)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">
                      {tx.performedBy?.name || 'Store Manager'}
                      {tx.performedBy?.role && (
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5 uppercase tracking-wider">
                          {tx.performedBy.role === 'owner' ? 'Owner' : 'Employee'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">No transactions logged yet.</p>
            <p className="text-slate-400 text-xs mt-1">Transactions recorded in customer books will list here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
