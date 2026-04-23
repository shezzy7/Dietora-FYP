// src/controllers/chatbot.controller.js
// AI Chatbot Controller with LangGraph Integration
// Now using an Agentic workflow to intelligently select tools

const { runChatbotAgent, clearChatbotHistory } = require('../services/ai/chatbot/agent');
const UserLocation = require('../models/UserLocation');
const { successResponse } = require('../utils/response.utils');

/**
 * POST /api/v1/chatbot
 * 
 * Improved response with:
 * - LangGraph AI Orchestration
 * - Dynamic tool usage for location, profile, and meal plans
 * - ReAct pattern for deep thinking
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    // ─── Input validation ──────────────────────────────────
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Maximum 2000 characters.',
      });
    }

    // ─── Fetch Location Context ───────────────────────────
    const location = await UserLocation.findOne({ user: req.user._id }).lean().catch(() => null);

    // ─── Agentic AI Response ──────────────────────────────
    console.log(`[Chatbot] Running LangGraph agent for user: ${req.user._id}`);
    const aiResponse = await runChatbotAgent(
      req.user._id, 
      req.user.name, 
      message.trim(), 
      location
    );

    // ─── Send response ────────────────────────────────────
    return successResponse(
      res,
      {
        userMessage: message.trim(),
        reply: aiResponse.reply,
        intent: aiResponse.intent,
        stores: aiResponse.stores,
        hasStoreResults: aiResponse.hasStoreResults,
        foodSearched: aiResponse.foodSearched,
        tokensEstimate: aiResponse.tokensEstimate,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
      },
      'Response ready'
    );

  } catch (err) {
    // ─── Comprehensive error handling ──────────────────────
    console.error('[CHATBOT ERROR]', {
      userId: req.user?._id,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    });

    if (err.message?.includes('GROQ_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GROQ_API_KEY to your .env file.',
      });
    }

    if (err.status === 429 || err.message?.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'AI service is temporarily overloaded. Please try again in a moment.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Chatbot error: ' + err.message?.substring(0, 100),
    });
  }
};

/**
 * DELETE /api/v1/chatbot/history
 */
const clearChatHistory = async (req, res, next) => {
  try {
    await clearChatbotHistory(req.user._id);
    return successResponse(res, {}, 'Conversation history cleared ✓');
  } catch (err) {
    // BUG FIX: delegate to centralized error handler instead of swallowing
    next(err);
  }
};

module.exports = {
  sendMessage,
  clearChatHistory,
};
