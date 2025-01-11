'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { db } from '@/utils/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore/lite';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  LogOut,
  User,
  School,
  Download,
  Activity,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PAYSTACK_PUBLIC_KEY = "your_paystack_public_key";

const paymentOptions = [
  {
    id: 1,
    name: "Departmental Fee",
    amount: 2500,
    description: "Annual departmental fee for NACOS members",
    deadline: "2025-03-31",
    required: true
  },
  {
    id: 2,
    name: "Department Week Fee",
    amount: 3500,
    description: "Fee for departmental week activities and events",
    deadline: "2025-02-28",
    required: true
  }
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingPayments: [],
    completedPayments: []
  });

  const calculateStats = useCallback(() => {
    const totalPaid = transactions.reduce((sum, trans) => 
      trans.status === 'success' ? sum + trans.amount : sum, 0
    );

    const completed = paymentOptions.filter(option =>
      transactions.some(trans => 
        trans.paymentType === option.name && trans.status === 'success'
      )
    );

    const pending = paymentOptions.filter(option =>
      !transactions.some(trans => 
        trans.paymentType === option.name && trans.status === 'success'
      )
    );

    setStats({
      totalPaid,
      completedPayments: completed,
      pendingPayments: pending
    });
  }, [transactions]);

  const fetchTransactions = async (userId) => {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const transactionData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const sortedTransactions = transactionData.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchTransactions(parsedUser.id);
  }, [router]);

  useEffect(() => {
    if (transactions.length > 0) {
      calculateStats();
    }
  }, [transactions, calculateStats]);

  const generateReceipt = (transaction) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.text('NACOS Payment Receipt', pageWidth / 2, 20, { align: 'center' });
    
    // Logo placeholder
    doc.setFontSize(12);
    doc.text('Department of Computer Science', pageWidth / 2, 30, { align: 'center' });
    
    // Receipt details
    doc.setFontSize(12);
    const details = [
      ['Receipt No:', transaction.reference],
      ['Date:', new Date(transaction.createdAt).toLocaleDateString()],
      ['Student Name:', `${transaction.studentName}`],
      ['Matric Number:', transaction.matricNumber],
      ['Level:', transaction.level.toUpperCase()],
      ['Payment Type:', transaction.paymentType],
      ['Amount:', `₦${transaction.amount.toLocaleString()}`],
      ['Status:', transaction.status.toUpperCase()],
    ];

    doc.autoTable({
      startY: 40,
      head: [],
      body: details,
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 40 },
        1: { width: 60 }
      }
    });

    // Footer
    doc.setFontSize(10);
    doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, doc.lastAutoTable.finalY + 20, { align: 'center' });
    
    // Save the PDF
    doc.save(`NACOS_Receipt_${transaction.reference}.pdf`);
  };

  const handlePaymentSuccess = async (reference) => {
    if (!user || !selectedPayment) {
      toast.error('Unable to process payment. Please try again.');
      return;
    }

    try {
      const transactionData = {
        userId: user.id,
        paymentType: selectedPayment.name,
        amount: selectedPayment.amount,
        reference: reference.reference,
        status: 'success',
        createdAt: new Date().toISOString(),
        studentName: `${user.firstName} ${user.surname}`,
        matricNumber: user.matricNumber,
        level: user.level
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      if (!docRef.id) {
        throw new Error('Failed to save transaction');
      }

      toast.success('Payment successful!');
      await fetchTransactions(user.id);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error(
        'Payment was successful but there was an error saving the record. ' +
        'Please contact support with your reference: ' + reference.reference
      );
    }
  };

  const initializePayment = (payment) => usePaystackPayment({
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: payment?.amount * 100 || 0,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      paymentType: payment?.name,
      matricNumber: user?.matricNumber
    }
  });

  const handlePaymentInit = () => {
    if (!selectedPayment || !user) {
      toast.error('Unable to initialize payment. Please try again.');
      return;
    }

    const paystack = initializePayment(selectedPayment);
    paystack({
      onSuccess: handlePaymentSuccess,
      onClose: () => {
        toast.info('Payment cancelled');
        setSelectedPayment(null);
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <ToastContainer theme="dark" />

      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <School className="h-8 w-8 text-blue-500" />
              <div>
                <span className="text-xl font-bold text-white">NACOS Dashboard</span>
                <p className="text-xs text-gray-400">Computer Science Department</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-full">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">{user?.firstName} {user?.surname}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-1 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-lg rounded-lg p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Total Paid</h3>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white mt-2">₦{stats.totalPaid.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-lg rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Completed Payments</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white mt-2">{stats.completedPayments.length}</p>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 backdrop-blur-lg rounded-lg p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Pending Payments</h3>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white mt-2">{stats.pendingPayments.length}</p>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Student Information</h2>
            <div className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
              {user?.level?.toUpperCase()}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400">Full Name</p>
              <p className="text-white font-medium">
                {user?.firstName} {user?.middleName} {user?.surname}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Matric Number</p>
              <p className="text-white font-medium">{user?.matricNumber}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <h2 className="text-xl font-bold text-white mb-4">Payment Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {paymentOptions.map((option) => {
            const isPaid = transactions.some(
              t => t.paymentType === option.name && t.status === 'success'
            );
            const daysToDeadline = Math.ceil(
              (new Date(option.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={option.id}
                className={`${
                  isPaid 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-white/5 border-gray-700 hover:border-blue-500'
                } backdrop-blur-lg rounded-lg p-6 border transition-colors relative overflow-hidden`}
              >
                {isPaid && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">
                    Paid
                  </div>
                )}
                {!isPaid && daysToDeadline <= 14 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">
                    {daysToDeadline} days left
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{option.name}</h3>
                  <CreditCard className={`h-6 w-6 ${isPaid ? 'text-green-500' : 'text-blue-500'}`} />
                </div>
                <p className="text-gray-400 mb-4">{option.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">₦{option.amount.toLocaleString()}</span>
                  {!isPaid && (
                    <button
                      onClick={() => {
                        setSelectedPayment(option);
                        handlePaymentInit();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-400">
                    Deadline: {new Date(option.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transaction History */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Transaction History</h2>
          <div className="text-sm text-gray-400">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Payment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="text-gray-400">Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center text-gray-400 py-4">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No transactions found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {transaction.paymentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ₦{transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'success'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {transaction.status === 'success' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {transaction.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {transaction.status === 'success' && (
                          <button
                            onClick={() => generateReceipt(transaction)}
                            className="text-blue-500 hover:text-blue-400 flex items-center justify-end space-x-1"
                          >
                            <span>Receipt</span>
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}   