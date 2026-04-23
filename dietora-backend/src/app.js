// src/app.js
// Express application setup

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const mealPlanRoutes = require('./routes/mealPlan.routes');
const groceryRoutes = require('./routes/grocery.routes');
const budgetRoutes = require('./routes/budget.routes');
const adminRoutes = require('./routes/admin.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const locationRoutes = require('./routes/location.routes');
const weeklyProgressRoutes = require('./routes/weeklyProgress.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// ─── Security Middleware ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map((o) => o.trim()).concat(['http://localhost:4173']);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Too many requests. Please wait a moment.' },
  standardHeaders: true, legacyHeaders: false,
  skip: (req) => req.path === '/health',
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DIETORA API is running 🥗',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// ─── API Routes ───────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/profile`, profileRoutes);
app.use(`${API}/meal-plans`, mealPlanRoutes);
app.use(`${API}/grocery-list`, groceryRoutes);
app.use(`${API}/budget`, budgetRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/feedback`, feedbackRoutes);
app.use(`${API}/chatbot`, chatbotRoutes);
app.use(`${API}/location`, locationRoutes);
app.use(`${API}/progress`, weeklyProgressRoutes);
app.use(`${API}/onboarding`, onboardingRoutes);

// ─── Error Handlers ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
