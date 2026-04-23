// src/controllers/auth.controller.js

const axios = require('axios');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const MealPlan = require('../models/MealPlan');
const GroceryList = require('../models/GroceryList');
const WeeklyProgress = require('../models/WeeklyProgress');
const Feedback = require('../models/Feedback');
const UserLocation = require('../models/UserLocation');
const { sendTokenResponse } = require('../utils/jwt.utils');

// ═══════════════════════════════════════════════════════════
//  GOOGLE OAUTH HELPER
// ═══════════════════════════════════════════════════════════

/**
 * fetchGoogleUserInfo
 * Calls Google's userinfo endpoint with the access_token obtained
 * from the browser (implicit flow). Returns verified user data.
 */
const fetchGoogleUserInfo = async (accessToken) => {
  const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 8000,
  });
  return res.data;
};

// ═══════════════════════════════════════════════════════════
//  EMAIL / PASSWORD AUTH
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.authProvider === 'google') {
        return res.status(409).json({
          success: false,
          message: 'This email is already linked to a Google account. Please sign in with Google.',
        });
      }
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'local',
      isEmailVerified: false,
    });

    sendTokenResponse(user, 201, res, 'Registration successful! Welcome to DIETORA 🥗');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.authProvider === 'google') {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please click "Continue with Google".',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google access token is required.',
      });
    }

    let googleUser;
    try {
      googleUser = await fetchGoogleUserInfo(accessToken);
    } catch (err) {
      console.error('[Google Auth] Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token. Please sign in again.',
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified,
    } = googleUser;

    if (!googleId || !email || !name) {
      return res.status(401).json({
        success: false,
        message: 'Incomplete data received from Google. Please try again.',
      });
    }

    if (!email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Your Google account email is not verified. Please verify it with Google first.',
      });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    let isNewUser = false;

    if (user) {
      const updates = { lastLogin: new Date() };

      if (!user.googleId) {
        updates.googleId = googleId;
        updates.authProvider = 'google';
        updates.isEmailVerified = true;
      }
      if (avatar && user.avatar !== avatar) {
        updates.avatar = avatar;
      }
      if (!user.isEmailVerified) {
        updates.isEmailVerified = true;
      }

      user = await User.findByIdAndUpdate(user._id, updates, {
        new: true,
        runValidators: false,
      });
    } else {
      user = await User.create({
        name:            name,
        email:           email.toLowerCase(),
        googleId:        googleId,
        avatar:          avatar || '',
        authProvider:    'google',
        isEmailVerified: true,
        role:            'user',
        isActive:        true,
        lastLogin:       new Date(),
      });
      isNewUser = true;
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    const firstName = name.split(' ')[0];
    const message = isNewUser
      ? `Welcome to DIETORA, ${firstName}! Your account has been created. 🎉`
      : `Welcome back, ${firstName}! 👋`;

    sendTokenResponse(user, 200, res, message);

  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('healthProfile');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/auth/change-password
 * @access  Private (local users only)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Google Sign-In accounts do not use a password.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  DELETE ACCOUNT
// ═══════════════════════════════════════════════════════════

/**
 * @route   DELETE /api/v1/auth/delete-account
 * @desc    Permanently delete the authenticated user and ALL their data.
 *          - Local users must supply their current password for confirmation.
 *          - Google OAuth users skip the password check (they already proved
 *            identity when they obtained the JWT).
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    // ── 1. Re-verify identity for local accounts ──────────
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.authProvider === 'local') {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your current password to confirm account deletion.',
        });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Account deletion cancelled.',
        });
      }
    }

    // ── 2. Delete all related data in parallel ────────────
    await Promise.all([
      HealthProfile.deleteMany({ user: userId }),
      MealPlan.deleteMany({ user: userId }),
      GroceryList.deleteMany({ user: userId }),
      WeeklyProgress.deleteMany({ user: userId }),
      Feedback.deleteMany({ user: userId }),
      UserLocation.deleteMany({ user: userId }),
    ]);

    // ── 3. Delete the user document itself ────────────────
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleAuth, getMe, changePassword, deleteAccount };
