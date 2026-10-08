const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET_CODE || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET_CODE must be set in Backend/.env');
  }
  return secret;
};

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Sign in to continue.' });
    }
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Your account could not be found.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
        ? 'Your session is invalid or expired. Please sign in again.'
        : error.message
    });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }
  return next();
};

module.exports = { protect, allowRoles, getJwtSecret };
