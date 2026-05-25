import express from 'express';
import {
  addTransaction,
  getTransactionsByCustomer,
  getAllTransactions
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, addTransaction)
  .get(protect, getAllTransactions);

router.route('/:customerId')
  .get(protect, getTransactionsByCustomer);

export default router;
