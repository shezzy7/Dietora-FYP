// src/routes/weeklyProgress.routes.js

const express = require('express');
const router = express.Router();
const {
  initProgress,
  getCurrent,
  getAll,
  toggleMeal,
  submitCheckIn,
  regenerateAfterCheckIn,
} = require('../controllers/weeklyProgress.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// Initialize progress tracker for a meal plan
router.post('/init', initProgress);

// Get current (latest) progress
router.get('/current', getCurrent);

// Get all progress history
router.get('/', getAll);

// Toggle a single meal's completion
router.patch('/:progressId/day/:day/meal', toggleMeal);

// Submit end-of-week health check-in
router.post('/:progressId/checkin', submitCheckIn);

// Regenerate next week's plan after check-in
router.post('/:progressId/regenerate', regenerateAfterCheckIn);

module.exports = router;
