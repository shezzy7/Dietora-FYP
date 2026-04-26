// src/services/ai/chatbot/agent.js
// DIETORA Chatbot Agent — Gemini Flash + LangGraph + Tavily
//
// Architecture:
//   User message → ReAct Agent (Google Gemini 2.0 Flash)
//                  ├── 7 tools (profile, meal plan, places, Tavily x4)
//                  ├── MongoDB checkpointer (per-user thread persistence)
//                  └── System prompt (medical-first, Roman Urdu friendly)

const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage } = require('@langchain/core/messages');
const { MongoDBSaver } = require('@langchain/langgraph-checkpoint-mongodb');
const mongoose = require('mongoose');

const { createChatbotTools } = require('./tools');

// ─── MongoDB checkpointer (lazy singleton) ────────────────────────────────
let _checkpointer = null;
const getCheckpointer = () => {
  if (_checkpointer) return _checkpointer;
  try {
    const client = mongoose.connection.getClient();
    if (!client || mongoose.connection.readyState !== 1) {
      console.warn('[ChatbotAgent] Mongoose not ready — running without persistent memory.');
      return null;
    }
    _checkpointer = new MongoDBSaver({
      client,
      dbName: mongoose.connection.name,
    });
    return _checkpointer;
  } catch (err) {
    console.warn('[ChatbotAgent] Checkpointer init failed:', err.message);
    return null;
  }
};

// ─── System prompt (medical-first, multilingual, tool-aware) ──────────────
const buildSystemMessage = (userName, hasLocation, locationCity) => {
  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return `You are DIETORA AI — a Medical-First nutrition assistant specializing in Pakistani cuisine, dietary management of diseases, and locally-sourced grocery guidance.

# CORE IDENTITY
- You help users in Pakistan manage diet for diseases like Diabetes, Hypertension, Cardiac issues, Anemia, Kidney disease, Thyroid, Constipation, and Obesity.
- You speak fluent English AND Roman Urdu. Match the user's language and tone naturally. If they mix (common in Pakistan), mix back.
- You are NOT a doctor. Always recommend professional medical consultation for diagnosis or medication changes.
- Today is ${today}.

# USER CONTEXT
- Talking to: ${userName || 'a user'}
- GPS location available: ${hasLocation ? 'YES — you can search nearby stores' : 'NO — user must enable location for store search'}
- User's current city: ${locationCity || 'Unknown — use general Pakistan if city not specified'}

# PRICE QUERY RULES — VERY IMPORTANT
When the user asks for price of any item:
1. ALWAYS call \`get_pakistani_food_price\` tool.
2. ALWAYS pass the user's current city ("${locationCity || 'Pakistan'}") as the \`city\` parameter.
3. NEVER use your training data to answer prices — prices change daily.
4. If the tool returns a price, show it clearly in PKR with the source.

# AVAILABLE TOOLS — USE THEM AGGRESSIVELY
You have 7 tools. NEVER guess answers when a tool can give you facts:

1. **fetch_user_profile** → Call FIRST whenever user asks anything about their own health, "I have", "for me", "mujhe", "main", or any personalized advice.
2. **fetch_active_meal_plan** → Call when they mention their meal plan, today's meals, or weekly diet.
3. **search_local_stores** → Call when they want to BUY something physically nearby (real GPS-based Google Places lookup).
4. **search_who_health_guidance** → Call for ANY medical/nutrition science question. ALWAYS cite the URLs you get back.
5. **get_pakistani_food_price** → Call when they ask price/rate/cost of any item. ALWAYS pass city="${locationCity || 'Pakistan'}" as parameter.
6. **tavily_general_search** → Last-resort general web search.
7. **extract_url_content** → Use to read the FULL content of a specific URL from previous search results.

# WORKFLOW RULES
1. **Personalized advice** → ALWAYS call \`fetch_user_profile\` first.
2. **Health/medical claims** → ALWAYS verify with \`search_who_health_guidance\`. Cite sources.
3. **Price questions** → ALWAYS call \`get_pakistani_food_price\` with city="${locationCity || 'Pakistan'}".
4. **"Where to buy"** → ALWAYS call \`search_local_stores\`. If location is missing, tell them to enable it.
5. **Multi-step questions** → Chain tools as needed.

# RESPONSE STYLE
- Concise, structured, actionable. Use markdown sparingly (bullet points OK, avoid heavy headings).
- For medical answers: state the recommendation, the reason, the source.
- For Pakistani food: use real local names (dal masoor, karela, saag, lassi, roti, biryani, etc.).
- Show prices in PKR with the source name (e.g., "PKR 450/kg per Daraz").
- Show stores with name, area, distance, and Google Maps link.
- Add a brief medical disclaimer for serious conditions.

# WHAT NOT TO DO
- Don't use training data prices — always call get_pakistani_food_price tool.
- Don't make up store names, addresses, or prices.
- Don't give specific medication advice (refer to doctor).
- Don't ignore the user's medical profile once you've fetched it.
- Don't break character or mention you're an "AI language model" — you are DIETORA AI.

Now help the user.`;
};

// ─── Sleep helper for retry ───────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Extract city from locationContext ───────────────────────────────────
const extractCity = (locationContext) => {
  if (!locationContext) return null;
  return (
    locationContext.resolvedCity ||
    locationContext.resolvedArea ||
    locationContext.city ||
    null
  );
};

// ─── Build the agent (created fresh per request to bind userId/location) ──
const buildAgent = (userId, userName, locationContext) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env');

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: modelName,
    temperature: 0.3,
    maxOutputTokens: 1500,
  });

  const tools = createChatbotTools(userId, locationContext);
  const checkpointer = getCheckpointer();

  const hasLocation = !!(locationContext?.locationConsent && locationContext?.currentLocation?.coordinates?.[0]);
  const locationCity = extractCity(locationContext);

  const agent = createReactAgent({
    llm: model,
    tools,
    checkpointSaver: checkpointer || undefined,
    messageModifier: buildSystemMessage(userName, hasLocation, locationCity),
  });

  return { agent, modelName };
};

// ─── Extract intent + tool-usage telemetry from agent output ──────────────
const analyzeAgentRun = (messages) => {
  const toolsCalled = [];
  let foodSearched = null;
  let storesFound = null;
  let citedSources = [];

  for (const msg of messages) {
    if (msg.name) {
      toolsCalled.push(msg.name);

      try {
        const parsed = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;

        if (msg.name === 'search_local_stores') {
          if (parsed.foodSearched) foodSearched = parsed.foodSearched;
          if (parsed.storesFound) storesFound = parsed.storesFound;
        }
        if (msg.name === 'search_who_health_guidance' || msg.name === 'tavily_general_search' || msg.name === 'get_pakistani_food_price') {
          if (Array.isArray(parsed.sources)) {
            citedSources = citedSources.concat(parsed.sources.map((s) => ({ title: s.title, url: s.url })));
          }
        }
      } catch { /* ignore parse errors */ }
    }
  }

  let intent = 'general';
  if (toolsCalled.includes('search_local_stores')) intent = 'store_search';
  else if (toolsCalled.includes('get_pakistani_food_price')) intent = 'price_query';
  else if (toolsCalled.includes('search_who_health_guidance')) intent = 'medical_advice';
  else if (toolsCalled.includes('fetch_user_profile')) intent = 'personalized_advice';
  else if (toolsCalled.includes('fetch_active_meal_plan')) intent = 'meal_plan_query';

  return { intent, toolsCalled, foodSearched, storesFound, citedSources };
};

// ─── Main entry point ─────────────────────────────────────────────────────
const runChatbotAgent = async (userId, userName, message, locationContext) => {
  const startTime = Date.now();
  const threadId = `chatbot_thread_${userId}`;
  const config = { configurable: { thread_id: threadId }, recursionLimit: 12 };

  let lastError = null;
  const maxAttempts = 2;

  // ─── DEBUG: log exactly what the agent receives ──────────────────────────
  const locationCity = extractCity(locationContext);
  console.log('\n╔═══ [CHATBOT DEBUG] Agent Input ═══════════════════════╗');
  console.log('║ User:', userName, '| ID:', userId);
  console.log('║ Message:', message);
  console.log('║ Model:', process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  console.log('║ GPS Location:', locationContext?.locationConsent
    ? `✓ Enabled | City: ${locationCity || 'not resolved'} | Coords: [${locationContext?.currentLocation?.coordinates}]`
    : '✗ Not granted');
  console.log('║ Thread ID:', threadId, '(conversation memory key)');
  console.log('║ System Prompt: contains date + userName + city + tool rules');
  console.log('║ Tools available: fetch_user_profile, fetch_active_meal_plan,');
  console.log('║               search_local_stores, search_who_health_guidance,');
  console.log('║               get_pakistani_food_price, tavily_general_search, extract_url_content');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { agent, modelName } = buildAgent(userId, userName, locationContext);
      const result = await agent.invoke(
        { messages: [new HumanMessage(message)] },
        config,
      );

      const finalMsg = result.messages[result.messages.length - 1];
      const reply = typeof finalMsg.content === 'string'
        ? finalMsg.content
        : JSON.stringify(finalMsg.content);

      const telemetry = analyzeAgentRun(result.messages);
      const tokensEstimate = Math.ceil((message.length + reply.length) / 4);
      const durationMs = Date.now() - startTime;

      // ─── DEBUG: log what tools were called and in what order ─────────────
      console.log('╔═══ [CHATBOT DEBUG] Agent Output ═══════════════════════╗');
      console.log('║ Duration:', durationMs + 'ms');
      console.log('║ Intent:', telemetry.intent);
      console.log('║ Tools called:', telemetry.toolsCalled.length
        ? telemetry.toolsCalled.map((t, i) => `${i + 1}. ${t}`).join(' → ')
        : 'NONE (model answered from its own knowledge)');
      console.log('║ City used for price:', locationCity || 'not available');
      console.log('║ Sources cited:', telemetry.citedSources.length);
      console.log('║ Reply (first 150 chars):', reply.slice(0, 150));
      console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

      console.log(`[ChatbotAgent] OK in ${durationMs}ms | intent=${telemetry.intent} | tools=[${telemetry.toolsCalled.join(',')}] | model=${modelName}`);

      return {
        reply,
        intent: telemetry.intent,
        toolsCalled: telemetry.toolsCalled,
        stores: telemetry.storesFound,
        hasStoreResults: !!(telemetry.storesFound && telemetry.storesFound.length > 0),
        foodSearched: telemetry.foodSearched,
        citedSources: telemetry.citedSources,
        tokensEstimate,
        durationMs,
        model: modelName,
      };
    } catch (err) {
      lastError = err;
      const isTransient =
        err.status === 429 ||
        err.status === 500 ||
        err.status === 502 ||
        err.status === 503 ||
        /rate.?limit|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(err.message || '');

      console.error(`[ChatbotAgent] Attempt ${attempt}/${maxAttempts} failed:`, err.message);

      if (attempt < maxAttempts && isTransient) {
        const backoffMs = 1000 * attempt;
        console.log(`[ChatbotAgent] Retrying after ${backoffMs}ms...`);
        await sleep(backoffMs);
        continue;
      }
      break;
    }
  }

  throw lastError;
};

// ─── Clear conversation history for a user ───────────────────────────────
const clearChatbotHistory = async (userId) => {
  const threadId = `chatbot_thread_${userId}`;
  const db = mongoose.connection.db;
  if (!db) {
    console.warn('[ChatbotAgent] No DB connection — skipping history clear.');
    return;
  }
  await Promise.all([
    db.collection('checkpoints').deleteMany({ thread_id: threadId }),
    db.collection('checkpoint_writes').deleteMany({ thread_id: threadId }),
    db.collection('checkpoint_blobs').deleteMany({ thread_id: threadId }),
  ]);
  console.log(`[ChatbotAgent] Cleared history for thread: ${threadId}`);
};

module.exports = { runChatbotAgent, clearChatbotHistory };
