import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

// @desc    Get dashboard summary statistics and analytics data
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const shopId = new mongoose.Types.ObjectId(req.user.shopId);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Total Customers Count
    const totalCustomers = await Customer.countDocuments({ shopId });

    // 2. Net Pending Balance (Sum of all customer balances)
    const balanceStats = await Customer.aggregate([
      { $match: { shopId } },
      {
        $group: {
          _id: null,
          totalDue: { $sum: { $cond: [{ $gt: ['$balance', 0] }, '$balance', 0] } },
          totalAdvance: { $sum: { $cond: [{ $lt: ['$balance', 0] }, { $abs: '$balance' }, 0] } }
        }
      }
    ]);
    const totalPendingBalance = balanceStats[0]?.totalDue || 0;
    const totalAdvanceBalance = balanceStats[0]?.totalAdvance || 0;

    // 3. Monthly Collections (Sum of 'debit' transactions in current month)
    const monthlyCollectionsStats = await Transaction.aggregate([
      {
        $match: {
          shopId,
          type: 'debit',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' }
        }
      }
    ]);
    const monthlyCollections = monthlyCollectionsStats[0]?.totalCollected || 0;

    // 4. Monthly Credit Extended (Sum of 'credit' transactions in current month)
    const monthlyCreditStats = await Transaction.aggregate([
      {
        $match: {
          shopId,
          type: 'credit',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalCredit: { $sum: '$amount' }
        }
      }
    ]);
    const monthlyCreditExtended = monthlyCreditStats[0]?.totalCredit || 0;

    // 5. Recent Transactions
    const recentTransactions = await Transaction.find({ shopId })
      .populate('customerId', 'name phone')
      .populate('performedBy', 'name role')
      .sort({ date: -1 })
      .limit(6);

    // 6. Paid vs Unpaid Analytics (Total all-time credit vs total all-time debit)
    const allTimeStats = await Transaction.aggregate([
      { $match: { shopId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalCredit = allTimeStats.find(item => item._id === 'credit')?.total || 0;
    const totalDebit = allTimeStats.find(item => item._id === 'debit')?.total || 0;

    // 7. Last 7 Days Daily Transaction Growth for Chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          shopId,
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type'
          },
          amount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          credits: { $sum: { $cond: [{ $eq: ['$_id.type', 'credit'] }, '$amount', 0] } },
          debits: { $sum: { $cond: [{ $eq: ['$_id.type', 'debit'] }, '$amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalPendingBalance,
        totalAdvanceBalance,
        monthlyCollections,
        monthlyCreditExtended,
        paidVsUnpaid: {
          totalCredit,
          totalDebit,
        },
        recentTransactions,
        dailyStats: dailyStats.map(item => ({
          date: item._id,
          Credit: item.credits,
          Debit: item.debits
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
