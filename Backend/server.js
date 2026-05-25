import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load env vars and hot reload config
dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(express.json());

// Custom NoSQL Injection Prevention Middleware (Express v5 Compatible)
const customMongoSanitize = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        customMongoSanitize(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) customMongoSanitize(req.body);
  if (req.query) customMongoSanitize(req.query);
  if (req.params) customMongoSanitize(req.params);
  next();
});

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with specific frontend domains (Vercel deployment URL)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route for API check
app.get('/', (req, res) => {
  res.send('Digital Udhaar Khata API running successfully.');
});

// Centralized error handler middleware (Must be registered after all routers)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
