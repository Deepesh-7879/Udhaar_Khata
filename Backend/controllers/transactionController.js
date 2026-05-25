import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import { ErrorResponse } from '../middleware/error.js';

// @desc    Add a credit/debit transaction
// @route   POST /api/transactions
// @access  Private
export const addTransaction = async (req, res, next) => {
  const { customerId, type, amount, description, date } = req.body;

  let session = null;
  // If we haven't disabled transactions globally, try starting a session
  if (!global.disableMongoTransactions) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = null;
    }
  }

  // We define a helper to perform the operations
  const executeOperations = async (useSession) => {
    // 1. Verify customer exists and belongs to this shop
    const customerQuery = Customer.findOne({
      _id: customerId,
      shopId: req.user.shopId
    });
    if (useSession && session) {
      customerQuery.session(session);
    }
    const customer = await customerQuery;

    if (!customer) {
      throw new ErrorResponse('Customer not found or access denied', 404);
    }

    // 2. Parse and validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new ErrorResponse('Invalid amount specified', 400);
    }

    // 3. Precise datetime creation
    let transactionDate = date ? new Date(date) : new Date();
    // If a custom date was selected, it will be at midnight. Inject the current clock time
    // components so same-day entries have precise chronological ordering.
    if (date) {
      const now = new Date();
      transactionDate.setHours(now.getHours());
      transactionDate.setMinutes(now.getMinutes());
      transactionDate.setSeconds(now.getSeconds());
      transactionDate.setMilliseconds(now.getMilliseconds());
    }

    // 4. Create the transaction log
    let transaction;
    if (useSession && session) {
      const created = await Transaction.create([{
        shopId: req.user.shopId,
        customerId,
        type, // 'credit' or 'debit'
        amount: parsedAmount,
        description: description || '',
        date: transactionDate,
        performedBy: req.user.id
      }], { session });
      transaction = created[0];
    } else {
      transaction = await Transaction.create({
        shopId: req.user.shopId,
        customerId,
        type,
        amount: parsedAmount,
        description: description || '',
        date: transactionDate,
        performedBy: req.user.id
      });
    }

    // 5. Recalculate customer balance
    if (type === 'credit') {
      customer.balance += parsedAmount;
    } else if (type === 'debit') {
      customer.balance -= parsedAmount;
      customer.lastPaymentDate = transactionDate;
    }

    if (useSession && session) {
      await customer.save({ session });
      await session.commitTransaction();
      session.endSession();
    } else {
      await customer.save();
    }

    return { transaction, customer };
  };

  try {
    const { transaction, customer } = await executeOperations(true);
    return res.status(201).json({
      success: true,
      data: transaction,
      currentBalance: customer.balance
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {
        // ignore
      }
      session = null;
    }

    // Check if error is due to missing replica set
    const isReplicaSetError = error.message && (
      error.message.includes('replica set') || 
      error.message.includes('Transaction numbers') ||
      error.message.includes('sessions')
    );

    if (isReplicaSetError) {
      console.log('⚠️ MongoDB Standalone connection detected. Falling back to non-transactional mode...');
      global.disableMongoTransactions = true;
      
      // Retry without session
      try {
        const { transaction, customer } = await executeOperations(false);
        return res.status(201).json({
          success: true,
          data: transaction,
          currentBalance: customer.balance
        });
      } catch (retryError) {
        return next(retryError);
      }
    }

    next(error);
  }
};

// @desc    Get transaction history for a customer
// @route   GET /api/transactions/:customerId
// @access  Private
export const getTransactionsByCustomer = async (req, res, next) => {
  try {
    // Ensure customer belongs to this shop
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      shopId: req.user.shopId
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found or access denied', 404));
    }

    // Fetch transactions sorted by date descending and createdAt descending
    const transactions = await Transaction.find({
      customerId: req.params.customerId,
      shopId: req.user.shopId
    })
    .populate('performedBy', 'name role')
    .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
      customerDetails: {
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions for a shop (with optional month/year filter)
// @route   GET /api/transactions
// @access  Private
export const getAllTransactions = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let query = { shopId: req.user.shopId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const transactions = await Transaction.find(query)
      .populate('customerId', 'name phone')
      .populate('performedBy', 'name role')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};
