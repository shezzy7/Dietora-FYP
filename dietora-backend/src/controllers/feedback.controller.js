// src/controllers/feedback.controller.js

const Feedback = require('../models/Feedback');
const { successResponse, paginatedResponse } = require('../utils/response.utils');

/**
 * @route   POST /api/v1/feedback
 * @desc    Submit feedback
 * @access  Private
 */
const submit = async (req, res, next) => {
  try {
    const feedback = await Feedback.create({
      user: req.user._id,
      ...req.body,
    });

    return successResponse(res, feedback, 'Feedback submitted! Thank you 🙏', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/feedback/my
 * @desc    Get current user's feedback history
 * @access  Private
 */
const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id })
      .populate('mealPlan', 'title')
      .sort({ createdAt: -1 });

    return successResponse(res, feedback, 'Feedback history fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/feedback (admin)
 * @desc    Get all feedback (admin only)
 * @access  Private/Admin
 */
const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isResolved !== undefined) filter.isResolved = req.query.isResolved === 'true';

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate('user', 'name email')
        .populate('mealPlan', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter),
    ]);

    return paginatedResponse(res, feedback, total, page, limit, 'All feedback fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/feedback/:id/resolve (admin)
 * @desc    Mark feedback as resolved with admin response
 * @access  Private/Admin
 */
const resolve = async (req, res, next) => {
  try {
    const { adminResponse } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, adminResponse: adminResponse || 'Resolved by admin.' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    return successResponse(res, feedback, 'Feedback resolved');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/feedback/public
 * @desc    Get all feedback for public display (landing page)
 * @access  Public (no auth required)
 */
const getPublicReviews = async (req, res, next) => {
  try {
    const reviews = await Feedback.find({
      comment: { $exists: true, $ne: '' },
    })
      .populate('user', 'name')
      .select('rating comment category createdAt user')
      .sort({ createdAt: -1 })
      .limit(12);

    return successResponse(res, reviews, 'Public reviews fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { submit, getMyFeedback, getAll, resolve, getPublicReviews };
