import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  ChevronRight, 
  Trash2, 
  AlertCircle,
  Phone,
  MapPin
} from 'lucide-react';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name_asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', email: '' });
  const [addError, setAddError] = useState('');
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);

  // Delete modal state
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Fetch customers list
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = `/customers?sort=${sortBy === 'name_asc' ? 'name' : sortBy}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (filterDueOnly) {
        url += `&minBalance=0.01`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve customers.');
    } finally {
      setLoading(false);
    }
  }, [sortBy, searchTerm, filterDueOnly]);

  useEffect(() => {
    // Debounce search input to avoid hitting database on every keystroke
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchCustomers]);

  // Handle Create Customer submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      return setAddError('Name and phone number are required fields.');
    }

    setIsAddSubmitting(true);
    setAddError('');

    try {
      const res = await api.post('/customers', newCustomer);
      if (res.data.success) {
        setNewCustomer({ name: '', phone: '', address: '', email: '' });
        setIsAddModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      setAddError(err.message || 'Failed to add customer.');
    } finally {
      setIsAddSubmitting(false);
    }
  };

  // Handle Delete Customer submit
  const handleDeleteSubmit = async () => {
    if (!customerToDelete) return;
    setIsDeleteSubmitting(true);

    try {
      const res = await api.delete(`/customers/${customerToDelete._id}`);
      if (res.data.success) {
        setCustomerToDelete(null);
        fetchCustomers();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete customer.');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">Customer Books</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage customer profiles and credit statements</p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* 2. Search and Filters Header */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="input-premium pl-10"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setFilterDueOnly(!filterDueOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
              filterDueOnly 
                ? 'bg-danger-50 border-danger-200 text-danger-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Show Pending Due Only
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="balance_desc">Highest Due</option>
              <option value="balance_asc">Lowest Due</option>
              <option value="updated_desc">Recently Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main content area */}
      {error && (
        <div className="p-4 bg-danger-50 text-danger-700 text-sm rounded-xl border border-danger-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-xs">Retrieving customer logs...</p>
        </div>
      ) : customers.length > 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Name & Contact</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Address</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Balance Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Last Payment Date</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name & Contact */}
                    <td className="py-4 px-6">
                      <Link 
                        to={`/customers/${c._id}`} 
                        className="text-slate-800 font-bold hover:text-primary-600 transition-colors block"
                      >
                        {c.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-semibold">
                        <Phone className="w-3.5 h-3.5" />
                        {c.phone}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-4 px-6 text-slate-500 font-semibold max-w-xs truncate">
                      {c.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {c.address}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium">No address provided</span>
                      )}
                    </td>

                    {/* Balance Status */}
                    <td className="py-4 px-6 text-right">
                      {c.balance > 0 ? (
                        <div>
                          <span className="text-danger-600 font-extrabold text-base">₹{c.balance.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-bold text-danger-500 uppercase tracking-widest block mt-0.5">Pending Due</span>
                        </div>
                      ) : c.balance < 0 ? (
                        <div>
                          <span className="text-primary-600 font-extrabold text-base">₹{Math.abs(c.balance).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mt-0.5">Paid Advance</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-success-600 font-extrabold text-base">₹0</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success-500 uppercase tracking-widest block mt-0.5">
                            Settled
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Last Payment Date */}
                    <td className="py-4 px-6 text-slate-500 font-semibold text-xs">
                      {c.lastPaymentDate ? (
                        new Date(c.lastPaymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      ) : (
                        <span className="text-slate-400 italic font-medium">No payments received</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <Link 
                          to={`/customers/${c._id}`}
                          className="btn-secondary py-1.5 px-3 rounded-lg text-xs font-semibold hover:border-primary-600/30 hover:bg-primary-50/50 hover:text-primary-600"
                        >
                          Ledger
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        
                        {user?.role === 'owner' && (
                          <button
                            onClick={() => setCustomerToDelete(c)}
                            className="p-2 border border-slate-100 text-slate-400 hover:text-danger-600 hover:bg-danger-50 hover:border-danger-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer & Ledger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 py-16 text-center rounded-2xl shadow-premium">
          <UserPlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Customers Found</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            {searchTerm || filterDueOnly 
              ? 'Try modifying your search query or removing the filters.' 
              : 'Add your first customer to begin recording credit and debit ledger entries.'}
          </p>
        </div>
      )}

      {/* 4. Create Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-md w-full overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Add New Customer</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-4">
                {addError && (
                  <div className="p-3 bg-danger-50 text-danger-700 text-xs rounded-xl flex items-center gap-1.5 border border-danger-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Customer Name *</label>
                  <input
                    type="text"
                    required
                    className="input-premium"
                    placeholder="e.g. Ramesh Sharma"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="input-premium"
                    placeholder="10-digit number, e.g. 9898989898"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                  <input
                    type="email"
                    className="input-premium"
                    placeholder="e.g. customer@email.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Billing Address</label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g. House No 4, Street 1, Colony"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary py-2"
                  disabled={isAddSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2"
                  disabled={isAddSubmitting}
                >
                  {isAddSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Save Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Delete Customer?</h3>
              <p className="text-slate-500 text-xs mt-2 px-2 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-700">"{customerToDelete.name}"</span>? 
                This will delete their customer profile and **all of their transaction history** permanently. This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="btn-secondary py-2 text-xs"
                disabled={isDeleteSubmitting}
              >
                Keep Ledger
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="btn-danger py-2 text-xs"
                disabled={isDeleteSubmitting}
              >
                {isDeleteSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
