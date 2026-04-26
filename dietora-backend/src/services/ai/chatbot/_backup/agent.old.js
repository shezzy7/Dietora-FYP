// src/services/ai/chatbot/agent.js
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { ChatGroq } = require("@langchain/groq");
const { HumanMessage } = require("@langchain/core/messages");
const { MongoDBSaver } = require("@langchain/langgraph-checkpoint-mongodb");
const mongoose = require("mongoose");
const { createChatbotTools } = require("./tools");

let checkpointer = null;

// Initialize MongoDBSaver using Mongoose's native MongoClient
const getCheckpointer = () => {
  if (checkpointer) return checkpointer;

  const client = mongoose.connection.getClient();
  if (!client) {
    console.warn("[LangGraph] Mongoose client not ready, falling back to null checkpointer.");
    return null;
  }

  checkpointer = new MongoDBSaver({ client, dbName: mongoose.connection.name });
  return checkpointer;
};

const _buildSystemMessage = (userName) => {
  return `You are DIETORA AI, an expert medical nutrition assistant specialized in Pakistani cuisine.

YOUR CORE DIRECTIVE:
You are a "Medical-First" AI. Your primary goal is to help users manage their diseases (Diabetes, Hypertension, Cardiac issues, etc.) through diet.

YOUR WORKFLOW:
1. When a user asks a question, THINK step-by-step.
2. If you don't know their medical profile, use the 'fetch_user_profile' tool FIRST before giving advice.
3. If they ask about their current diet, use 'fetch_active_meal_plan'.
4. If they ask where to buy food, use 'search_local_stores'.
5. Always ground your final answer in their specific medical conditions.
6. Support English and Roman Urdu naturally.
7. Keep final answers concise, professional, and actionable.

User Name: ${userName || 'User'}
`;
};

/**
 * Executes the LangGraph Chatbot Agent
 */
const runChatbotAgent = async (userId, userName, message, locationContext) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing from .env");

  const model = new ChatGroq({
    apiKey: apiKey,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.5,
    maxTokens: 1024,
  });

  const tools = createChatbotTools(userId, locationContext);

  const saver = getCheckpointer();

  const app = createReactAgent({
    llm: model,
    tools,
    checkpointSaver: saver || undefined,
    messageModifier: _buildSystemMessage(userName)
  });

  const threadId = `chatbot_thread_${userId}`;
  const config = { configurable: { thread_id: threadId } };

  const result = await app.invoke(
    { messages: [new HumanMessage(message)] },
    config
  );

  const finalResponse = result.messages[result.messages.length - 1].content;
  const tokensEstimate = Math.ceil((message.length + finalResponse.length) / 4);

  let intent = "general";
  let foodSearched = null;
  let storesFound = null;

  for (const msg of result.messages) {
    if (msg.name === "search_local_stores") {
      intent = "location_search";
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.foodSearched) foodSearched = parsed.foodSearched;
        if (parsed.storesFound) storesFound = parsed.storesFound;
      } catch (e) { }
    } else if (msg.name === "fetch_user_profile") {
      intent = "medical_advice";
    }
  }

  return {
    reply: finalResponse,
    intent,
    stores: storesFound,
    hasStoreResults: !!(storesFound && storesFound.length > 0),
    foodSearched,
    tokensEstimate,
    model: "llama-3.3-70b-versatile (Agentic)",
  };
};

const clearChatbotHistory = async (userId) => {
  // If we are using MongoDB, we can just delete the checkpoints for this thread
  const threadId = `chatbot_thread_${userId}`;
  const db = mongoose.connection.db;
  if (db) {
    await db.collection('checkpoints').deleteMany({ thread_id: threadId });
    await db.collection('checkpoint_writes').deleteMany({ thread_id: threadId });
    await db.collection('checkpoint_blobs').deleteMany({ thread_id: threadId });
    console.log(`[LangGraph] Cleared MongoDB history for thread: ${threadId}`);
  }
};

module.exports = { runChatbotAgent, clearChatbotHistory };
