# DIETORA Chatbot v3 — Tavily Setup Guide

## What changed

The chatbot is now a **proper agentic AI** built on:
- **Groq** (`llama-3.3-70b-versatile`) — fast LLM
- **LangGraph** — orchestrates the ReAct loop
- **Tavily** — real-time web search & URL extraction
- **Google Places** — real GPS-based store discovery
- **MongoDB** — persistent per-user conversation memory

Old files have been moved to `_backup/`:
- `src/services/ai/chatbot/_backup/agent.old.js`
- `src/services/ai/chatbot/_backup/tools.old.js`
- `src/services/_backup_chatbot.service.old.js` (the old rule-based regex chatbot)

Only the new agent is wired into the controller. The old rule-based service is no longer used anywhere.

## Tools the agent has

| # | Tool | Purpose |
|---|------|---------|
| 1 | `fetch_user_profile` | Reads user's medical conditions, BMI, budget, allergies from MongoDB |
| 2 | `fetch_active_meal_plan` | Reads the user's current 7-day plan |
| 3 | `search_local_stores` | Google Places → real nearby grocery/butcher/bakery stores |
| 4 | `search_who_health_guidance` | Tavily → WHO, CDC, NIH, Mayo, Hopkins, NHS only |
| 5 | `get_pakistani_food_price` | Tavily → Daraz, Foodpanda, Naheed, Metro, etc. |
| 6 | `tavily_general_search` | Tavily → general web (last resort) |
| 7 | `extract_url_content` | Tavily → full content of a single URL |

## Setup (3 steps)

### 1. Get the API keys you're missing

| Key | Where | Free? |
|---|---|---|
| `TAVILY_API_KEY` | https://app.tavily.com | Yes — 1000 searches/month |
| `GOOGLE_PLACES_API_KEY` | https://console.cloud.google.com → enable **Places API (New)** | $200 free credit/month |

⚠️ **You MUST also rotate your old keys** — they were exposed earlier:
- MongoDB Atlas password (Database Access → Edit user)
- Groq API key (https://console.groq.com/keys)
- Gemini API key (https://aistudio.google.com/apikey)

### 2. Install the new npm package

```bash
cd dietora-backend
npm install @langchain/tavily
```

That's the only new package. Everything else (`@langchain/groq`, `@langchain/langgraph`, etc.) is already in your `package.json`.

### 3. Update your `.env`

Add these lines:

```env
TAVILY_API_KEY=tvly-your_new_key
GROQ_MODEL=llama-3.3-70b-versatile
GOOGLE_PLACES_API_KEY=your_new_places_key
```

### 4. Restart the server

```bash
npm run dev
```

You should see no warnings on startup. The first chatbot request will lazy-init Tavily.

## Test it

```bash
# 1. Login first to get a token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'

# 2. Use the token for chatbot tests
TOKEN="paste_token_here"

# Test 1 — Personalized advice (should call fetch_user_profile)
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Mujhe diabetes hai, breakfast mein kya khaun?"}'

# Test 2 — WHO guidance (should call search_who_health_guidance)
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What does WHO recommend for daily salt intake for hypertension patients?"}'

# Test 3 — Real-time price (should call get_pakistani_food_price)
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Aaj kal basmati rice ka rate kya chal raha hai Lahore mein?"}'

# Test 4 — Local stores (should call search_local_stores; needs GPS saved)
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Where can I buy fresh chicken near me?"}'

# Test 5 — Multi-tool (should chain profile + WHO + stores)
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Based on my conditions, what should I eat for dinner and where can I buy ingredients?"}'

# Clear history
curl -X DELETE http://localhost:5000/api/v1/chatbot/history \
  -H "Authorization: Bearer $TOKEN"
```

## What the response looks like

```json
{
  "success": true,
  "data": {
    "userMessage": "...",
    "reply": "AI's natural-language answer with citations",
    "intent": "medical_advice",
    "toolsCalled": ["fetch_user_profile", "search_who_health_guidance"],
    "stores": null,
    "hasStoreResults": false,
    "foodSearched": null,
    "citedSources": [
      { "title": "Healthy diet — WHO", "url": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" }
    ],
    "tokensEstimate": 412,
    "durationMs": 2340,
    "model": "llama-3.3-70b-versatile",
    "timestamp": "2026-04-25T..."
  }
}
```

The frontend can use:
- `reply` → main chat bubble
- `citedSources` → render as numbered references below the reply
- `stores` → render as store cards if `hasStoreResults` is true
- `toolsCalled` → optional debug info / "Sources used" footer

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| "GROQ_API_KEY missing" | `.env` not loaded | Make sure `dotenv` is loaded in `server.js` before `app.js` |
| "No nearby stores" | Empty `GOOGLE_PLACES_API_KEY` or location not saved | Check `.env`; have user enable location |
| "Web search service is not configured" | Empty `TAVILY_API_KEY` | Add it to `.env` |
| Agent loops forever / `recursionLimit` error | Model isn't tool-calling reliably | Already mitigated: temperature=0.3, recursionLimit=12, retry on transient errors |
| Replies in wrong language | Model didn't pick up Roman Urdu | System prompt handles this; if persistent, increase examples in prompt |

## Frontend changes (optional but recommended)

If you want to show citations and tool usage:

```jsx
{response.citedSources?.length > 0 && (
  <div className="text-xs text-gray-500 mt-2">
    Sources:
    {response.citedSources.map((s, i) => (
      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block hover:underline">
        [{i + 1}] {s.title}
      </a>
    ))}
  </div>
)}

{response.hasStoreResults && (
  <div className="mt-3 space-y-2">
    {response.stores.map((s, i) => (
      <div key={i} className="border rounded p-2">
        <div className="font-semibold">{s.name}</div>
        <div className="text-sm">{s.address}</div>
        <div className="text-xs text-gray-500">{s.distance} • {s.status}</div>
        <a href={s.directionsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">
          Get directions →
        </a>
      </div>
    ))}
  </div>
)}
```
