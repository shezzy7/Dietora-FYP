// src/routes/onboarding.routes.js

const express = require('express');
const router = express.Router();
const { completeOnboarding, getOnboardingStatus } = require('../controllers/onboarding.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// @route POST /api/v1/onboarding/complete
router.post('/complete', completeOnboarding);

// @route GET  /api/v1/onboarding/status
router.get('/status', getOnboardingStatus);

module.exports = router;
