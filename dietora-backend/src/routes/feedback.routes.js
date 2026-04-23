// src/routes/feedback.routes.js

const express = require('express');
const router = express.Router();
const { submit, getMyFeedback, getAll, resolve, getPublicReviews } = require('../controllers/feedback.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { feedbackSchema } = require('../validators/feedback.validator');

// @route GET /api/v1/feedback/public  (PUBLIC — no auth)
router.get('/public', getPublicReviews);

// @route POST /api/v1/feedback
router.post('/', protect, validate(feedbackSchema), submit);

// @route GET /api/v1/feedback/my
router.get('/my', protect, getMyFeedback);

// @route GET /api/v1/feedback  (admin)
router.get('/', protect, authorize('admin'), getAll);

// @route PATCH /api/v1/feedback/:id/resolve  (admin)
router.patch('/:id/resolve', protect, authorize('admin'), resolve);

module.exports = router;
