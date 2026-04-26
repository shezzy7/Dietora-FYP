// src/controllers/chatbot.controller.js
// DIETORA AI Chatbot Controller — LangGraph + Groq + Tavily

const { runChatbotAgent, clearChatbotHistory } = require('../services/ai/chatbot/agent');
const UserLocation = require('../models/UserLocation');
const { successResponse } = require('../utils/response.utils');

// ─── POST /api/v1/chatbot ────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // ─── Input validation ────────────────────────────────────────────────
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

    // ─── Fetch user location context (non-blocking on failure) ───────────
    const location = await UserLocation.findOne({ user: req.user._id })
      .lean()
      .catch(() => null);

    // ─── Run agent ───────────────────────────────────────────────────────
    console.log(`[Chatbot] User=${req.user._id} | msg="${message.slice(0, 80)}..."`);

    const aiResponse = await runChatbotAgent(
      req.user._id.toString(),
      req.user.name,
      message.trim(),
      location,
    );

    // ─── Send response ───────────────────────────────────────────────────
    return successResponse(
      res,
      {
        userMessage: message.trim(),
        reply: aiResponse.reply,
        intent: aiResponse.intent,
        toolsCalled: aiResponse.toolsCalled,
        stores: aiResponse.stores,
        hasStoreResults: aiResponse.hasStoreResults,
        foodSearched: aiResponse.foodSearched,
        citedSources: aiResponse.citedSources,
        tokensEstimate: aiResponse.tokensEstimate,
        durationMs: aiResponse.durationMs,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
      },
      'Response ready',
    );
  } catch (err) {
    console.error('[Chatbot ERROR]', {
      userId: req.user?._id?.toString(),
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    });

    // ─── Map known errors to HTTP statuses ───────────────────────────────
    if (err.message?.includes('GROQ_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Add GROQ_API_KEY to your .env file.',
      });
    }

    if (err.message?.includes('TAVILY_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Web search service is not configured. Add TAVILY_API_KEY to your .env file.',
      });
    }

    if (err.status === 429 || /rate.?limit/i.test(err.message || '')) {
      return res.status(429).json({
        success: false,
        message: 'AI service is temporarily rate-limited. Please try again in a moment.',
      });
    }

    if (err.status === 401 || /unauthor/i.test(err.message || '')) {
      return res.status(503).json({
        success: false,
        message: 'AI service authentication failed. Check that your API keys are valid.',
      });
    }

    return res.status(500).json({
      success: false,
      message: `Chatbot error: ${(err.message || 'Unknown error').slice(0, 200)}`,
    });
  }
};

// ─── DELETE /api/v1/chatbot/history ──────────────────────────────────────
const clearChatHistory = async (req, res, next) => {
  try {
    await clearChatbotHistory(req.user._id.toString());
    return successResponse(res, {}, 'Conversation history cleared ✓');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendMessage,
  clearChatHistory,
};
