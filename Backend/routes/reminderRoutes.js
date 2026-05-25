import express from 'express';
import {
  sendReminder,
  getReminderHistory
} from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/send')
  .post(protect, sendReminder);

router.route('/history/:customerId')
  .get(protect, getReminderHistory);

export default router;
