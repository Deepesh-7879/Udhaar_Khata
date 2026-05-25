import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { ErrorResponse } from '../middleware/error.js';

// @desc    Get all customers for the authenticated shop
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res, next) => {
  try {
    const { search, minBalance, sort } = req.query;
    
    // Base query scoped to the shop
    let query = { shopId: req.user.shopId };

    // Search filter (name or phone)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Balance filter (e.g., minimum due amount)
    if (minBalance) {
      query.balance = { $gte: parseFloat(minBalance) };
    }

    // Build query execution
    let selectQuery = Customer.find(query);

    // Sorting options (default by name, can sort by balance or last transaction)
    if (sort === 'balance_desc') {
      selectQuery = selectQuery.sort({ balance: -1 });
    } else if (sort === 'balance_asc') {
      selectQuery = selectQuery.sort({ balance: 1 });
    } else if (sort === 'updated_desc') {
      selectQuery = selectQuery.sort({ updatedAt: -1 });
    } else {
      selectQuery = selectQuery.sort({ name: 1 }); // alphabetical default
    }

    const customers = await selectQuery;

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single customer details
// @route   GET /api/customers/:id
// @access  Private
export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user.shopId, // Scope validation
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found or access denied', 404));
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res, next) => {
  const { name, phone, address, email } = req.body;

  try {
    // Check if phone already registered in this shop
    const existing = await Customer.findOne({
      shopId: req.user.shopId,
      phone: phone.trim(),
    });

    if (existing) {
      return next(new ErrorResponse('Customer with this phone number already exists in your store', 400));
    }

    const customer = await Customer.create({
      name,
      phone: phone.trim(),
      address,
      email: email ? email.trim() : undefined,
      shopId: req.user.shopId,
      balance: 0,
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
  const { name, phone, address, email } = req.body;

  try {
    let customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user.shopId,
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found or access denied', 404));
    }

    // Check if phone number is being updated, and if it conflicts with another customer
    if (phone && phone.trim() !== customer.phone) {
      const conflict = await Customer.findOne({
        shopId: req.user.shopId,
        phone: phone.trim(),
      });
      if (conflict) {
        return next(new ErrorResponse('Another customer with this phone number already exists', 400));
      }
      customer.phone = phone.trim();
    }

    if (name) customer.name = name;
    if (address !== undefined) customer.address = address;
    if (email !== undefined) customer.email = email ? email.trim() : undefined;

    await customer.save();

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a customer (Owner Only)
// @route   DELETE /api/customers/:id
// @access  Private (Owner Only)
export const deleteCustomer = async (req, res, next) => {
  try {
    // Note: restrictTo('owner') middleware will protect this endpoint as well, 
    // but we can double check here to make it extra secure
    if (req.user.role !== 'owner') {
      return next(new ErrorResponse('Employees cannot delete customers. Please ask the shop owner.', 403));
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.user.shopId,
    });

    if (!customer) {
      return next(new ErrorResponse('Customer not found or access denied', 404));
    }

    // Delete customer
    await Customer.deleteOne({ _id: customer._id });

    // Cascading delete: Remove all transactions linked to this customer
    await Transaction.deleteMany({ customerId: customer._id });

    res.status(200).json({
      success: true,
      message: 'Customer and all associated transactions successfully deleted',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
