const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/mailer');

const passwordResetMessage = 'If an account exists for that email, a password reset link will be sent shortly.';

const issueToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  getJwtSecret(),
  { expiresIn: '7d' }
);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone
});

exports.register = async (req, res, next) => {
  try {
    try {
      getJwtSecret();
    } catch (error) {
      return res.status(503).json({ message: error.message });
    }
    const { name, email, password, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
      typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required.' });
    }
    if (await User.exists({ email: email.toLowerCase().trim() })) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }
    const user = await User.create({ name, email, password, phone });
    return res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    try {
      getJwtSecret();
    } catch (error) {
      return res.status(503).json({ message: error.message });
    }
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Enter the email address for your account.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      try {
        await sendPasswordResetEmail(user, resetToken);
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        console.error(`Password reset email delivery failed: ${error.message}`);
      }
    }

    return res.json({ message: passwordResetMessage });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token) ||
      typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Use a valid reset link and a password with at least 8 characters.' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      return res.status(400).json({ message: 'This password reset link is invalid or has expired. Request a new link.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ message: 'Your password has been reset. Sign in with your new password.' });
  } catch (error) {
    return next(error);
  }
};

exports.me = (req, res) => res.json({ user: publicUser(req.user) });
