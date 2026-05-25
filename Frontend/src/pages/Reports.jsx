import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  Search, 
  AlertCircle,
  FileDown
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, due, advance, settled
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchCustomersReport = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch all customers sorted alphabetically
        const res = await api.get('/customers?sort=name');
        if (res.data.success) {
          setCustomers(res.data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersReport();
  }, []);

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    if (filterType === 'due') return c.balance > 0;
    if (filterType === 'advance') return c.balance < 0;
    if (filterType === 'settled') return c.balance === 0;
    return true; // 'all'
  });

  // Calculate totals
  const totalOutstanding = customers
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalAdvance = customers
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  // PDF Monthly Transaction Report Exporter
  const exportToPDF = async () => {
    try {
      setExporting(true);
      // Fetch all transactions for the selected month/year
      const res = await api.get(`/transactions?month=${selectedMonth}&year=${selectedYear}`);
      const transactions = res.data.data;

      if (!transactions || transactions.length === 0) {
        alert('No transactions were found for the selected month and year.');
        return;
      }

      const doc = new jsPDF();
      const shopName = user?.shopName || 'Digital Udhaar Khata';
      const shopPhone = user?.phone || '';
      const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-IN', { month: 'long' });

      // Title & Header Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(26, 86, 219); // Primary SaaS blue
      doc.text(shopName.toUpperCase(), 14, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Monthly Transaction Statement - ${monthName} ${selectedYear}`, 14, 26);
      if (shopPhone) doc.text(`Contact: ${shopPhone}`, 14, 31);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, 196, 35); // divider

      // Calculate totals for summary cards
      const totalCredits = transactions
        .filter(tx => tx.type === 'credit')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalDebits = transactions
        .filter(tx => tx.type === 'debit')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const netCashFlow = totalDebits - totalCredits; // Repayments - Credits

      // Summary Box Header
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 39, 182, 24, 3, 3, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL CREDIT GIVEN (UDHAAR)', 20, 46);
      doc.text('TOTAL REPAYMENTS RECEIVED', 82, 46);
      doc.text('NET CASHFLOW BALANCE CHANGE', 140, 46);

      doc.setFontSize(11);
      doc.setTextColor(239, 68, 68); // Red for Credit Out
      doc.text(`Rs. ${totalCredits.toLocaleString('en-IN')}`, 20, 54);
      
      doc.setTextColor(16, 185, 129); // Green for Payments In
      doc.text(`Rs. ${totalDebits.toLocaleString('en-IN')}`, 82, 54);

      if (netCashFlow >= 0) {
        doc.setTextColor(16, 185, 129); // Green
        doc.text(`+Rs. ${netCashFlow.toLocaleString('en-IN')} (Surplus)`, 140, 54);
      } else {
        doc.setTextColor(239, 68, 68); // Red
        doc.text(`-Rs. ${Math.abs(netCashFlow).toLocaleString('en-IN')} (Deficit)`, 140, 54);
      }

      // Date Generated Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')} | Total Entries Logged: ${transactions.length}`, 14, 69);

      // Transactions Table construction
      const tableHeaders = [['Date & Time', 'Customer Info', 'Description', 'Type', 'Amount (INR)', 'Recorded By']];
      const tableRows = transactions.map(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const timeStr = new Date(tx.date).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        return [
          `${dateStr}, ${timeStr}`,
          `${tx.customerId?.name || 'Deleted Customer'}\n(${tx.customerId?.phone || 'N/A'})`,
          tx.description || 'N/A',
          tx.type === 'credit' ? 'CREDIT (Given)' : 'DEBIT (Repaid)',
          `Rs. ${tx.amount.toLocaleString('en-IN')}`,
          tx.performedBy?.name || 'Staff'
        ];
      });

      const runAutoTable = (pdfDoc, options) => {
        if (typeof autoTable === 'function') {
          autoTable(pdfDoc, options);
        } else if (typeof pdfDoc.autoTable === 'function') {
          pdfDoc.autoTable(options);
        } else if (window.jspdf && typeof window.jspdf.autoTable === 'function') {
          window.jspdf.autoTable(pdfDoc, options);
        } else {
          console.error('AutoTable plugin is not available.');
        }
      };

      runAutoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 74,
        styles: { fontSize: 8.5, font: 'helvetica' },
        headStyles: { fillColor: [26, 86, 219], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          3: { fontStyle: 'bold' },
          4: { fontStyle: 'bold', halign: 'right' }
        }
      });

      const filename = `Udhaar_Khata_Monthly_Statement_${monthName}_${selectedYear}.pdf`;
      doc.save(filename);
    } catch (err) {
      alert(err.message || 'Failed to export monthly transaction ledger PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">Consolidated Ledger Reports</h2>
          <p className="text-slate-500 text-sm mt-0.5">Audit global customer balances and export accounting spreadsheets</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Month selector */}
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input-premium py-2 px-3 text-sm font-bold bg-white border border-slate-200 rounded-xl"
            style={{ width: 'auto' }}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(2000, i, 1);
              return (
                <option key={i + 1} value={i + 1}>
                  {date.toLocaleString('en-IN', { month: 'short' })}
                </option>
              );
            })}
          </select>
          
          {/* Year selector */}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-premium py-2 px-3 text-sm font-bold bg-white border border-slate-200 rounded-xl"
            style={{ width: 'auto' }}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>

          <button 
            onClick={exportToPDF}
            disabled={exporting}
            className="btn-primary py-2 px-4 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* 2. Quick stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-premium">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Book Outstanding</span>
          <span className="text-2xl font-black text-danger-600 block mt-1.5">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-2">Active collectables due</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-premium">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Advances Paid</span>
          <span className="text-2xl font-black text-primary-600 block mt-1.5">₹{totalAdvance.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-2">Paid surplus customer advances</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-premium">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Filtered Records</span>
          <span className="text-2xl font-black text-slate-700 block mt-1.5">{filteredCustomers.length}</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-2">Customers listing count</span>
        </div>
      </div>

      {/* 3. Search and filtering tool */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="input-premium pl-10"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'due', label: 'Pending Due' },
            { id: 'advance', label: 'Surplus Advance' },
            { id: 'settled', label: 'Settled Balance' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                filterType === opt.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table data listing */}
      {error && (
        <div className="p-4 bg-danger-50 text-danger-700 text-sm rounded-xl border border-danger-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-xs">Assembling ledger reports...</p>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6 text-right">Credit Balance</th>
                  <th className="py-4 px-6">Last Active</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {filteredCustomers.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <Link to={`/customers/${c._id}`} className="text-slate-800 font-bold hover:text-primary-600 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-semibold">{c.phone}</td>
                    <td className="py-4 px-6 text-right">
                      {c.balance > 0 ? (
                        <span className="text-danger-600 font-extrabold text-base">₹{c.balance.toLocaleString('en-IN')}</span>
                      ) : c.balance < 0 ? (
                        <span className="text-primary-600 font-extrabold text-base">₹{Math.abs(c.balance).toLocaleString('en-IN')} (Adv)</span>
                      ) : (
                        <span className="text-success-600 font-bold text-sm">Settled</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-semibold">
                      {new Date(c.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link 
                        to={`/customers/${c._id}`}
                        className="text-primary-600 font-bold hover:underline text-xs"
                      >
                        View Ledger Timeline
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 py-16 text-center rounded-2xl shadow-premium">
          <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No matching logs found</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or modifying filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
