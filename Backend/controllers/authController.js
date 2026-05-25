import User from '../models/User.js';
import { ErrorResponse } from '../middleware/error.js';

// @desc    Register a new shopowner
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password, shopName, shopAddress, phone } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create User (role will default to 'owner')
    const user = await User.create({
      name,
      email,
      password,
      role: 'owner',
      shopName,
      shopAddress,
      phone,
    });

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (owner or employee)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Check for user (include password field which is selected out by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const userData = user.toObject();

    // If employee, dynamically attach owner details for settings screen reference
    if (user.role === 'employee' && user.shopId) {
      const owner = await User.findById(user.shopId);
      if (owner) {
        userData.ownerDetails = {
          name: owner.name,
          phone: owner.phone,
          email: owner.email,
          shopName: owner.shopName,
          shopAddress: owner.shopAddress,
          upiId: owner.upiId
        };
        // Also inherit these values onto user properties
        userData.shopName = owner.shopName;
        userData.shopAddress = owner.shopAddress;
        userData.upiId = owner.upiId;
      }
    }

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an employee account under owner's shop
// @route   POST /api/auth/employees
// @access  Private (Owner only)
export const createEmployee = async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create employee user under owner's shopId
    const employee = await User.create({
      name,
      email,
      password,
      role: 'employee',
      shopId: req.user.shopId,
      shopName: req.user.name + "'s Store", // Inherit shop details or log owner relation
      phone,
    });

    res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        shopId: employee.shopId,
        phone: employee.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employee accounts for a shop
// @route   GET /api/auth/employees
// @access  Private (Owner only)
export const getEmployees = async (req, res, next) => {
  try {
    // Find all users who are employees under this owner's shopId
    const employees = await User.find({
      shopId: req.user.shopId,
      role: 'employee'
    });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile or shop settings
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  const { name, phone, shopName, shopAddress, upiId, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    // Only owner role can edit shop parameters
    if (user.role === 'owner') {
      if (shopName) user.shopName = shopName;
      if (shopAddress !== undefined) user.shopAddress = shopAddress;
      if (upiId !== undefined) user.upiId = upiId.trim();
      if (smtpHost !== undefined) user.smtpHost = smtpHost.trim();
      if (smtpPort !== undefined) user.smtpPort = Number(smtpPort) || 587;
      if (smtpUser !== undefined) user.smtpUser = smtpUser.trim();
      if (smtpPass !== undefined) user.smtpPass = smtpPass;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
        shopName: user.shopName,
        upiId: user.upiId,
        phone: user.phone,
        shopAddress: user.shopAddress,
        smtpHost: user.smtpHost,
        smtpPort: user.smtpPort,
        smtpUser: user.smtpUser,
        smtpPass: user.smtpPass
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate JWT and send response
const sendTokenResponse = async (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  let shopName = user.shopName;
  let upiId = user.upiId;
  let shopAddress = user.shopAddress;
  let ownerDetails = null;

  if (user.role === 'employee' && user.shopId) {
    const owner = await User.findById(user.shopId);
    if (owner) {
      shopName = owner.shopName;
      upiId = owner.upiId;
      shopAddress = owner.shopAddress;
      ownerDetails = {
        name: owner.name,
        phone: owner.phone,
        email: owner.email,
        shopName: owner.shopName,
        shopAddress: owner.shopAddress,
        upiId: owner.upiId
      };
    }
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
      shopName,
      upiId,
      phone: user.phone,
      shopAddress,
      ownerDetails,
      smtpHost: user.smtpHost || '',
      smtpPort: user.smtpPort || 587,
      smtpUser: user.smtpUser || '',
      smtpPass: user.smtpPass || ''
    }
  });
};
