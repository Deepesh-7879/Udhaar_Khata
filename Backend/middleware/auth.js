import jwt from 'jsonwebtoken';

// Protect routes - requires authentication
export const protect = async (req, res, next) => {
  let token;

  // Read token from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      shopId: decoded.shopId,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Token is invalid or expired.',
    });
  }
};

// Restrict routes to specific roles (e.g. owner)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'Guest'}) is not authorized to perform this action.`,
      });
    }
    next();
  };
};
