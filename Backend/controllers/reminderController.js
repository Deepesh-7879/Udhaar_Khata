import Reminder from '../models/Reminder.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { sendNotification } from '../services/twilioService.js';
import { sendEmailNotification } from '../services/emailService.js';
import { ErrorResponse } from '../middleware/error.js';

// @desc    Send a payment reminder via SMS or WhatsApp
// @route   POST /api/reminders/send
// @access  Private
export const sendReminder = async (req, res, next) => {
  const { customerId, channel } = req.body;

  try {
    // 1. Verify customer and fetch info
    const customer = await Customer.findOne({
      _id: customerId,
      shopId: req.user.shopId,
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found or access denied', 404));
    }

    if (customer.balance <= 0) {
      return next(new ErrorResponse('Customer does not have any pending balance due', 400));
    }

    // 2. Fetch Shop Details to get the shop's name
    const shopOwner = await User.findById(req.user.shopId);
    const shopName = shopOwner ? shopOwner.shopName : req.user.name;

    // 3. Dispatch reminder via service
    let dispatchResult;
    if (channel === 'email') {
      if (!customer.email) {
        return next(new ErrorResponse('Customer does not have an email address configured', 400));
      }
      dispatchResult = await sendEmailNotification({
        email: customer.email,
        name: customer.name,
        amount: customer.balance,
        shopName: shopName,
        fromEmail: shopOwner ? shopOwner.email : req.user.email,
        smtpSettings: shopOwner ? {
          host: shopOwner.smtpHost,
          port: shopOwner.smtpPort,
          user: shopOwner.smtpUser,
          pass: shopOwner.smtpPass
        } : null
      });
    } else {
      dispatchResult = await sendNotification({
        phone: customer.phone,
        name: customer.name,
        amount: customer.balance,
        channel: channel || 'whatsapp', // default to whatsapp
        shopName: shopName
      });
    }

    // 4. Log reminder details to database
    const reminderLog = await Reminder.create({
      shopId: req.user.shopId,
      customerId,
      amount: customer.balance,
      status: dispatchResult.success ? 'sent' : 'failed',
      channel: channel || 'whatsapp',
      message: dispatchResult.message,
    });

    res.status(200).json({
      success: true,
      message: `Reminder sent successfully via ${channel || 'whatsapp'}.`,
      data: reminderLog,
      simulated: dispatchResult.simulated || false
    });

  } catch (error) {
    // If Twilio crashes, log a failed attempt in the database
    try {
      await Reminder.create({
        shopId: req.user.shopId,
        customerId,
        amount: 0,
        status: 'failed',
        channel: channel || 'whatsapp',
        message: error.message || 'Notification transmission failure',
      });
    } catch (logError) {
      console.error('Failed to log reminder error in DB:', logError.message);
    }
    next(error);
  }
};

// @desc    Get reminder history for a customer
// @route   GET /api/reminders/history/:customerId
// @access  Private
export const getReminderHistory = async (req, res, next) => {
  try {
    // Ensure customer belongs to this shop
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      shopId: req.user.shopId,
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found or access denied', 404));
    }

    const reminders = await Reminder.find({
      customerId: req.params.customerId,
      shopId: req.user.shopId,
    }).sort({ sentAt: -1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
};
