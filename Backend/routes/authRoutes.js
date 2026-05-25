import express from 'express';
import { 
  register, 
  login, 
  getProfile,
  updateProfile,
  createEmployee, 
  getEmployees 
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

// Employee management endpoints (restricted to Shop Owners)
router.route('/employees')
  .post(protect, restrictTo('owner'), createEmployee)
  .get(protect, restrictTo('owner'), getEmployees);

export default router;
