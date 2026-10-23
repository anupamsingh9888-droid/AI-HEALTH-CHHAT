# Maya — Intelligent AI Health Companion Powered by Gemini

Maya is an intelligent, friendly, and personalized AI Health Companion powered by Gemini. Maya accurately understands user intent across sleep duration, sleep quality, evening routines, activity and fitness, nutrition and hydration, stress, and medical symptom education—without relying on keyword matching or generic wellness fallbacks.

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were dismissed, so the following recommended defaults have been adopted to deliver the highest quality experience:

- **Health Data Tracking & Grounding**: An interactive health metrics panel (sleep duration, sleep goal, daily steps, active minutes, hydration, exercise patterns, meals, and preferences) is directly linked to Maya's conversational context. Users can view and adjust metrics in real time or have Maya update them.
- **Audio Voice Narration**: Maya features seamless natural voice narration powered by the `gemini-3.8-flash-lite-tts` model alongside clear text responses with copy and audio controls.
- **Strict Anti-Repetition & Context Engine**: Responses are generated on-demand via the `@google/genai` TypeScript SDK using `gemini-3.8-flash`, with full user context and explicit constraints that prevent repetitive answers, generic templates ("Thank you for checking in..."), and ungrounded data claims.

---

### 1. Overview & Core Concept

- **What It Does**: Provides an empathetic, scientifically grounded health companion that answers the user's *exact* question using their real health data. Maya provides step-by-step evening wind-down routines with timings, evidence-based sleep assessments (7–9 hour benchmark), fitness assessments (150 min/week + 2 days strength targets), balanced nutrition suggestions, and cautious, non-diagnostic medical symptom guidance.
- **Target Audience / Persona**: Individuals seeking a trustworthy, conversational wellness companion that remembers their context, respects their time with direct answers, and provides practical, actionable micro-routines.
- **Key Value**: Eradicates repetitive "AI wellness template" responses by analyzing true user intent and synthesizing actionable guidance tailored to the user's logged health metrics.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Context-Aware Conversational Hub*: User asks any health question via chat or quick intent chip (e.g., "Is 6.5 hours enough sleep?", "What is a good evening wind-down routine?", "Is my activity level healthy?", "How can I improve my sleep?").
  2. *Precise Answer Presentation*: Maya directly answers the core question in conversational language, personalizes with available metrics (e.g., "Since your reported average is 6 hours 42 minutes..."), presents 2–4 clean actionable bullet points, and provides at most one relevant follow-up question.
  3. *Voice Playback & Quick Actions*: User can listen to Maya's voice playback, copy advice, explore suggested follow-ups, or click into quick action cards.
  4. *Personal Health Context Drawer & Editor*: Slide-over / sidebar panel showing active metrics (Sleep Avg: 6h 42m, Goal: 8h; Steps: 8,420; Active Min: 38 min; Hydration: 1.8L; Dietary preferences) with instant live editing so users can test how Maya's answers dynamically adapt.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm, tranquil botanical wellness theme (soft sage, warm slate `#1E293B`, crisp porcelain canvas `#F8FAFC`, calming lavender/teal accents).
  - *Color Palette & Mood (60-30-10)*:
    - 60% Dominant Canvas: Crisp neutral white / soft porcelain (`#F8FAFC`)
    - 30% Structural Surfaces: Muted card surfaces (`#FFFFFF` with subtle `border-slate-200/80` hairlines, quiet slate typography)
    - 10% Accent Budget: Deep emerald / sage teal (`#0F766E` / `#0D9488`) for active states and primary actions; soft lavender (`#8B5CF6`) for Maya's identity.
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for clean titles, `DM Sans` for body reading prose, and `tabular-nums` for all biometric numbers and timers.
  - *Anti-Slop Compliance*: No static pill enclosures; unboxed metadata separated by `·`; no pulsing status dots; no decorative left-accent bars; single-line controls; clean editorial typography.
- **Interactive Feedback & Motion**: Sub-200ms transitions, streaming/typing indicator, audio waveform pulse during voice playback, instant optimistic UI updates on metric edits.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native `@google/genai` SDK Server Integration (`gemini-3.8-flash`)**
  - *Chosen Approach*: Replace legacy deprecated `gemini-2.5-flash` HTTP fetch calls with the modern `@google/genai` TypeScript SDK using `gemini-3.8-flash` on the Express backend (`server.ts`).
  - *Why*: Delivers high-precision intent understanding, strict instruction following for the 7 answering rules, and eliminates repetitive responses.
  - *Alternatives Considered*: Client-side calls (prohibited due to API key exposure) or legacy models (`gemini-2.0-flash`, prohibited per SDK guidelines).
- **Decision 2: Comprehensive Intent-Aware Fallback Engine**
  - *Chosen Approach*: Even in local offline mode or transient API interruptions, the backend implements a deterministic, question-specific intent classifier that generates custom answers for sleep duration, routines, activity, nutrition, and symptoms matching the exact prompt guidelines, completely eliminating the banned generic fallback message.
  - *Why*: Guarantees that the user never encounters the prohibited "Thank you for checking in..." template under any circumstance.
- **Decision 3: Integrated Audio Synthesis (`gemini-3.8-flash-lite-tts`)**
  - *Chosen Approach*: Unary audio synthesis using `gemini-3.8-flash-lite-tts` with voice `Kore`, returning clean WAV audio for instant browser playback.
  - *Why*: Brings Maya to life as a natural spoken companion without needing third-party TTS libraries.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19 + Vite)                      │
│                                                                        │
│  ┌──────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Health Metrics Dock  │  │        Maya Conversation View          │  │
│  │ • Sleep: 6h 42m      │  │  • Real-time intent-targeted chat      │  │
│  │ • Steps: 8,420       │  │  • Dynamic question-specific guidance  │  │
│  │ • Active: 38 min     │  │  • Audio playback (Gemini TTS)         │  │
│  │ • Quick metric edit  │  │  • One-click contextual follow-ups     │  │
│  └──────────┬───────────┘  └───────────────────┬────────────────────┘  │
│             │                                  │                       │
└─────────────┼──────────────────────────────────┼───────────────────────┘
              │                                  │
              ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Backend (Express / Node.js)                    │
│                                                                        │
│  ┌─────────────────────────────┐    ┌───────────────────────────────┐  │
│  │ /api/chat Endpoint          │    │ /api/tts Endpoint             │  │
│  │ • Context Assembler         │    │ • gemini-3.8-flash-lite-tts   │  │
│  │ • 7 Answering Rules Prompt  │    │ • Voice: 'Kore'               │  │
│  │ • Anti-Repetition Guard     │    │ • Unary WAV Buffer response   │  │
│  └──────────────┬──────────────┘    └───────────────┬───────────────┘  │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               @google/genai TypeScript SDK                       │  │
│  │               • gemini-3.8-flash (Chat & Intent)                 │  │
│  │               • gemini-3.8-flash-lite-tts (Audio)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & Personalization State**:
  - `HealthContext`:
    - `sleep_avg_hours`: `6.7` (6h 42m)
    - `sleep_goal_hours`: `8.0`
    - `daily_steps`: `8420` (goal 10,000)
    - `active_minutes_week`: `195` (meets 150m guideline)
    - `strength_days_week`: `2`
    - `water_liters_day`: `2.1`
    - `dietary_preferences`: `Flexitarian, balanced whole foods`
    - `allergies`: `['Pollen']`
    - `current_medications`: `['Vitamin D3 1000 IU']`
  - `ChatMessage`: `id`, `role`, `content`, `suggestions`, `audio_url`, `intent_category`, `created_at`
- **Component & State Flow**:
  - `Chat.tsx`: Renders conversation history with Maya avatar, intent indicators, voice play/pause button, audio waveform indicator, and quick question chips.
  - `HealthDock.tsx` / `MetricsSidebar`: Allows inspecting and updating the exact personal health data Maya references in conversations.
  - `server.ts`: Assembles user profile + metrics + conversation history + strict system instructions into `ai.models.generateContent({ model: 'gemini-3.8-flash', ... })`.
