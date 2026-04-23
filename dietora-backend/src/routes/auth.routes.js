// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const {
  register, login, googleAuth, getMe, changePassword, deleteAccount,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// ─── Public ───────────────────────────────────────────────
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', googleAuth);

// ─── Private ──────────────────────────────────────────────
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
