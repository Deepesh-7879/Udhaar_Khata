import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Mail,
  IndianRupee, 
  QrCode, 
  FileDown, 
  Plus, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Smartphone,
  Save,
  CheckCircle2
} from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & Action Forms state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txData, setTxData] = useState({ type: 'credit', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [txError, setTxError] = useState('');
  const [isTxSubmitting, setIsTxSubmitting] = useState(false);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [customQrAmount, setCustomQrAmount] = useState('');
  const [upiStep, setUpiStep] = useState('qr'); // 'qr', 'verifying', 'success'
  const [upiTxAmount, setUpiTxAmount] = useState(0);



  // Reminders Trigger State
  const [isReminderSending, setIsReminderSending] = useState(false);

  // Customer Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '', email: '' });
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch customer record
      const customerRes = await api.get(`/customers/${id}`);
      if (customerRes.data.success) {
        setCustomer(customerRes.data.data);
        setEditData({
          name: customerRes.data.data.name,
          phone: customerRes.data.data.phone,
          address: customerRes.data.data.address || '',
          email: customerRes.data.data.email || '',
        });
      }

      // Fetch transaction history
      const txRes = await api.get(`/transactions/${id}`);
      if (txRes.data.success) {
        setTransactions(txRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve customer ledger details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomerDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCustomerDetails]);

  const handleOpenQrModal = () => {
    setCustomQrAmount(customer?.balance > 0 ? customer.balance : 0);
    setUpiStep('qr');
    setIsQrModalOpen(true);
  };

  const handleSimulateUpiPayment = async () => {
    const amount = parseFloat(customQrAmount);
    if (!amount || amount <= 0) {
      alert('Please specify a valid payment amount to simulate.');
      return;
    }

    setUpiTxAmount(amount);
    setUpiStep('verifying');

    try {
      const res = await api.post('/transactions', {
        customerId: id,
        type: 'debit',
        amount: amount,
        description: 'Repayment via UPI QR Code',
        date: new Date()
      });

      if (res.data.success) {
        // 1.5 seconds verification delay for a realistic loading flow
        setTimeout(() => {
          setUpiStep('success');
          fetchCustomerDetails();
        }, 1500);
      }
    } catch (err) {
      setUpiStep('qr');
      alert(err.message || 'Failed to record simulated UPI payment.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData.name || !editData.phone) {
      return setEditError('Name and phone are required fields.');
    }

    setIsEditSubmitting(true);
    setEditError('');

    try {
      const res = await api.put(`/customers/${id}`, editData);
      if (res.data.success) {
        setCustomer(res.data.data);
        setIsEditing(false);
        setSuccessMsg('Customer details updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update customer details.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleAddTxSubmit = async (e) => {
    e.preventDefault();
    const { amount, type, description, date } = txData;
    
    if (!amount || parseFloat(amount) <= 0) {
      return setTxError('Please enter a valid amount greater than zero.');
    }

    setIsTxSubmitting(true);
    setTxError('');

    try {
      const res = await api.post('/transactions', {
        customerId: id,
        type,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
      });

      if (res.data.success) {
        setIsTxModalOpen(false);
        setTxData({ type: 'credit', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
        fetchCustomerDetails();
        setSuccessMsg(`Transaction of ₹${amount} recorded successfully.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setTxError(err.message || 'Failed to record transaction.');
    } finally {
      setIsTxSubmitting(false);
    }
  };

  // Trigger twilio dispatch
  const handleSendReminder = async (channel) => {
    if (customer.balance <= 0) {
      alert('This customer has a settled balance.');
      return;
    }

    setIsReminderSending(true);
    setSuccessMsg('');

    try {
      const res = await api.post('/reminders/send', {
        customerId: id,
        channel,
      });

      if (res.data.success) {
        const isSimulated = res.data.simulated;
        setSuccessMsg(
          isSimulated 
            ? `[Simulator] Payment reminder logged in server console.`
            : `Payment reminder successfully dispatched via Twilio ${channel.toUpperCase()}!`
        );
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      alert(err.message || 'Failed to send payment reminder.');
    } finally {
      setIsReminderSending(false);
    }
  };

  // PDF Generation Function
  const generatePDFStatement = () => {
    if (!customer) return;

    const doc = new jsPDF();
    const shopName = user?.shopName || 'Digital Udhaar Khata';
    const shopPhone = user?.phone || '';
    
    // Title & Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(26, 86, 219); // Primary SaaS blue
    doc.text(shopName.toUpperCase(), 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Digital Udhaar Ledger Statement`, 14, 26);
    if (shopPhone) doc.text(`Contact: ${shopPhone}`, 14, 31);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35); // divider

    // Customer & Statement Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('STATEMENT ISSUED TO:', 14, 43);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer Name: ${customer.name}`, 14, 49);
    doc.text(`Phone Number:  ${customer.phone}`, 14, 54);
    if (customer.address) doc.text(`Billing Address: ${customer.address}`, 14, 59);

    // Summary Box Right Aligned
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, 39, 76, 24, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    
    let balanceLabel = 'TOTAL OUTSTANDING DUE:';
    let balanceValue = `Rs. ${customer.balance.toLocaleString('en-IN')}/-`;
    let balanceColor = [239, 68, 68]; // Red

    if (customer.balance < 0) {
      balanceLabel = 'TOTAL ADVANCE PAID:';
      balanceValue = `Rs. ${Math.abs(customer.balance).toLocaleString('en-IN')}/-`;
      balanceColor = [16, 185, 129]; // Emerald Green
    } else if (customer.balance === 0) {
      balanceLabel = 'ACCOUNT BALANCE STATUS:';
      balanceValue = 'Settled (Rs. 0/-)';
      balanceColor = [37, 99, 235]; // Royal Blue
    }

    doc.text(balanceLabel, 124, 46);
    
    doc.setFontSize(14);
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(balanceValue, 124, 55);

    // Date Generated
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 69);

    // Transactions Table
    const tableHeaders = [['Date & Time', 'Description', 'Type', 'Amount (INR)', 'Recorded By']];
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
        tx.description || 'N/A',
        tx.type === 'credit' ? 'CREDIT (Udhaar)' : 'DEBIT (Payment)',
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
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [26, 86, 219], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        2: { fontStyle: 'bold' },
        3: { fontStyle: 'bold', halign: 'right' }
      }
    });

    // Save File
    const filename = `${customer.name.replace(/\s+/g, '_')}_Statement_${new Date().getMonth() + 1}.pdf`;
    doc.save(filename);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Loading ledger details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger-50 text-danger-700 rounded-2xl border border-danger-100 flex items-center gap-3 max-w-2xl mx-auto my-8">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h4 className="font-bold">Error Loading Details</h4>
          <p className="text-sm mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  // Construct UPI URL for Collect QR Code
  // upi://pay?pa=address&pn=name&am=amount&cu=INR&tn=message
  const shopkeeperUpiId = user?.upiId || user?.ownerDetails?.upiId || '';
  const shopNameEncoded = encodeURIComponent(user?.shopName || user?.ownerDetails?.shopName || 'Kirana Shop');
  const upiUrl = `upi://pay?pa=${shopkeeperUpiId}&pn=${shopNameEncoded}&am=${parseFloat(customQrAmount) > 0 ? customQrAmount : 0}&cu=INR&tn=${encodeURIComponent('Udhaar Payment')}`;

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <button 
          onClick={() => navigate('/customers')}
          className="btn-secondary self-start flex items-center gap-1.5 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Book
        </button>

        <div className="flex flex-wrap gap-3">
          {/* Quick statement PDF */}
          <button 
            onClick={generatePDFStatement}
            className="btn-secondary py-2"
          >
            <FileDown className="w-4 h-4" />
            PDF Statement
          </button>

          {/* QR payment */}
          <button 
            onClick={handleOpenQrModal}
            className="btn-secondary py-2"
          >
            <QrCode className="w-4 h-4" />
            UPI QR Code
          </button>

          {/* Add credit/debit */}
          <button 
            onClick={() => setIsTxModalOpen(true)}
            className="btn-primary py-2"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-100 flex items-center gap-2 animate-fade-in font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* 2. Customer profile summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer bio info */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium lg:col-span-2">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
            <div>
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-3 max-w-md">
                  {editError && <p className="text-xs text-danger-600 font-semibold">{editError}</p>}
                  <input
                    type="text"
                    required
                    className="input-premium"
                    placeholder="Customer Name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                  <input
                    type="text"
                    required
                    className="input-premium"
                    placeholder="Phone Number"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                  <input
                    type="email"
                    className="input-premium"
                    placeholder="Email Address"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="Billing Address"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary py-1.5 px-3 rounded-lg text-xs" disabled={isEditSubmitting}>
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary py-1.5 px-3 rounded-lg text-xs">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                    >
                      (Edit Info)
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mt-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {customer.phone}
                    </span>
                    {customer.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {customer.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {customer.address || <span className="text-slate-400 italic">No address listed</span>}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Last Action Date</span>
              <span className="text-sm font-semibold text-slate-700 block mt-1">
                {new Date(customer.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Last Payment Log</span>
              <span className="text-sm font-semibold text-slate-700 block mt-1">
                {customer.lastPaymentDate ? (
                  new Date(customer.lastPaymentDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                ) : (
                  <span className="text-slate-400 italic font-medium">No repayments yet</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Balance Box */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Balance</h4>
            <div className="mt-3">
              {customer.balance > 0 ? (
                <div>
                  <span className="text-3xl font-black text-danger-600">₹{customer.balance.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-danger-500 uppercase tracking-wider block mt-1">Pending Payment Due</span>
                </div>
              ) : customer.balance < 0 ? (
                <div>
                  <span className="text-3xl font-black text-primary-600">₹{Math.abs(customer.balance).toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-primary-500 uppercase tracking-wider block mt-1">Advance Credit Paid</span>
                </div>
              ) : (
                <div>
                  <span className="text-3xl font-black text-success-600">₹0</span>
                  <span className="text-xs font-bold text-success-500 uppercase tracking-wider block mt-1">Ledger Settled</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Reminders dispatch actions */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Send Payment Reminder</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSendReminder('whatsapp')}
                disabled={customer.balance <= 0 || isReminderSending}
                className="btn-secondary py-2 px-1 text-[11px] flex items-center justify-center gap-1 hover:border-success-600/30 hover:bg-success-50/50 hover:text-success-700 disabled:opacity-50"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                onClick={() => handleSendReminder('sms')}
                disabled={customer.balance <= 0 || isReminderSending}
                className="btn-secondary py-2 px-1 text-[11px] flex items-center justify-center gap-1 hover:border-primary-600/30 hover:bg-primary-50/50 hover:text-primary-600 disabled:opacity-50"
              >
                <Smartphone className="w-3.5 h-3.5" />
                SMS Alert
              </button>
              <button
                onClick={() => handleSendReminder('email')}
                disabled={customer.balance <= 0 || !customer.email || isReminderSending}
                className="btn-secondary py-2 px-1 text-[11px] flex items-center justify-center gap-1 hover:border-violet-600/30 hover:bg-violet-50/50 hover:text-violet-600 disabled:opacity-50"
                title={!customer.email ? "Add email address to send email notifications" : "Send Email Reminder"}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transaction Timeline */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-premium">
        <div>
          <h3 className="text-base font-bold text-slate-800">Ledger Statement Timeline</h3>
          <p className="text-slate-400 text-xs mt-0.5">Chronological record of credit transactions and payments</p>
        </div>

        <div className="mt-6">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Description</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">
                        <div className="flex items-start gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span>
                              {new Date(tx.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                              {new Date(tx.date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">
                        {tx.description || <span className="text-slate-400 italic font-medium">No description</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.type === 'credit' ? (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-50 text-danger-700 border border-danger-100">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Credit Given
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-50 text-success-700 border border-success-100">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Payment Recd
                          </span>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 text-base font-extrabold ${tx.type === 'credit' ? 'text-danger-600' : 'text-success-600'}`}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">
                        {tx.performedBy?.name || 'Store Admin'}
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5 uppercase tracking-wider">{tx.performedBy?.role || 'staff'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
              <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">No ledger logs yet.</p>
              <p className="text-slate-400 text-xs mt-1">Record a credit or payment transaction above to populate details.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Add Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-md w-full overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Record New Entry</h3>
              <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddTxSubmit}>
              <div className="p-6 space-y-4">
                {txError && (
                  <div className="p-3 bg-danger-50 text-danger-700 text-xs rounded-xl flex items-center gap-1.5 border border-danger-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{txError}</span>
                  </div>
                )}

                {/* Entry type selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Entry Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTxData({ ...txData, type: 'credit' })}
                      className={`py-3 px-4 rounded-xl font-bold border text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        txData.type === 'credit'
                          ? 'bg-danger-50 border-danger-200 text-danger-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Credit (Given)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxData({ ...txData, type: 'debit' })}
                      className={`py-3 px-4 rounded-xl font-bold border text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        txData.type === 'debit'
                          ? 'bg-success-50 border-success-200 text-success-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Payment (Recd)
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Amount (INR) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-premium pl-8 font-bold text-slate-700"
                      placeholder="0.00"
                      value={txData.amount}
                      onChange={(e) => setTxData({ ...txData, amount: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Note / Description</label>
                  <input
                    type="text"
                    className="input-premium"
                    placeholder="e.g. Bought flour, Rice bag, Cash payment"
                    value={txData.description}
                    onChange={(e) => setTxData({ ...txData, description: e.target.value })}
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 block">Transaction Date</label>
                  <input
                    type="date"
                    required
                    className="input-premium text-slate-600"
                    value={txData.date}
                    onChange={(e) => setTxData({ ...txData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsTxModalOpen(false)} className="btn-secondary py-2" disabled={isTxSubmitting}>Cancel</button>
                <button type="submit" className="btn-primary py-2" disabled={isTxSubmitting}>
                  {isTxSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Record Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. UPI QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium max-w-sm w-full overflow-hidden animate-fade-in">
            {/* Header */}
            {upiStep === 'qr' && (
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base">UPI Payment QR Code</h3>
                <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
              </div>
            )}

            {/* Content */}
            <div className="p-6 text-center space-y-4">
              {upiStep === 'qr' ? (
                shopkeeperUpiId ? (
                  <>
                    <p className="text-xs text-slate-500 font-semibold px-2">
                      Scan this QR code using any UPI app (GPay, PhonePe, Paytm) to transfer the due balance.
                    </p>
                    
                    {/* QR rendering */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-block">
                      <QRCodeSVG value={upiUrl} size={180} />
                    </div>

                    {/* Dynamic Amount Input Column */}
                    <div className="space-y-1.5 max-w-xs mx-auto border-t border-slate-100 pt-4 mt-4 text-left">
                      <label className="text-xs font-bold text-slate-500 block">Amount to Receive (₹)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                          ₹
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          className="input-premium pl-8 font-black text-slate-700 text-sm py-1.5"
                          placeholder="Enter amount"
                          value={customQrAmount}
                          onChange={(e) => setCustomQrAmount(e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">
                        Total pending due is ₹{customer.balance.toLocaleString('en-IN')}.
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                      <span className="font-bold">Payee UPI:</span> {shopkeeperUpiId}
                    </div>

                    <button
                      onClick={handleSimulateUpiPayment}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Simulate Receive Payment
                    </button>
                  </>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed px-4">
                      UPI ID is not configured. Please configure your store's UPI address in settings.
                    </p>
                  </div>
                )
              ) : (
                <div className="py-10 flex flex-col items-center justify-center space-y-5 animate-scale-up">
                  <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-xl">Payment Received!</h4>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">UPI BANK TRANSACTION SUCCESSFUL</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100/50 px-6 py-2.5 rounded-2xl">
                    <span className="text-2xl font-black text-emerald-600">₹{parseFloat(customQrAmount) > 0 ? parseFloat(customQrAmount).toLocaleString('en-IN') : 0}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold italic">
                    Customer ledger balance has been automatically updated.
                  </p>
                  
                  <button
                    onClick={() => setIsQrModalOpen(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {upiStep === 'qr' && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setIsQrModalOpen(false)} className="btn-secondary py-1.5 text-xs">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
