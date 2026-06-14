# SafePath AI 🛡️

A multi-agent disaster response and evacuation assistant. Built with Next.js, Leaflet, OpenWeatherMap, and Claude (Anthropic).

## Architecture

Seven specialized AI agents collaborate in sequence:

```
User Situation + Live Weather
         ↓
   1. Hazard Agent     — Analyzes disaster severity, identifies risks
         ↓
   2. Safety Agent     — Determines evacuation necessity, safety recommendations
         ↓
   3. Shelter Agent    — Selects best nearby shelter
         ↓
   4. Navigation Agent — Generates real road route via OSRM, adds safety notes
         ↓
   5. Preparation Agent — Creates emergency checklist
         ↓
   6. What-If Agent    — Generates contingency scenarios
         ↓
   7. Coordinator      — Synthesizes all outputs into final action plan
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, TypeScript
- **Map:** Leaflet + React-Leaflet (OpenStreetMap tiles)
- **Routing:** OSRM public API (free, no key needed)
- **Weather:** OpenWeatherMap API
- **AI Agents:** Anthropic Claude (claude-sonnet)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/safepath-ai
cd safepath-ai
npm install
```

### 2. Get your API keys

**OpenWeatherMap (free):**
1. Go to https://home.openweathermap.org/users/sign_up
2. Verify email
3. Go to https://home.openweathermap.org/api_keys
4. Copy your key

**Anthropic (Claude):**
1. Go to https://console.anthropic.com/settings/keys
2. Create a new key
3. Add $5 credit at https://console.anthropic.com/settings/billing

### 3. Create environment file

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
OPENWEATHER_API_KEY=your_openweathermap_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under Settings → Environment Variables.

## Usage

1. **Set your location** — use GPS or type a city name
2. **Describe your situation** — include disaster type, any special needs (elderly, pets, medical)
3. **Watch agents collaborate** — see the Agent Discussion panel on the left
4. **Get your action plan** — risk level, shelter, route on map, checklist
5. **Ask What-If questions** — "What if roads are blocked?" etc.
6. **Submit community reports** — flag road conditions to feed into agent analysis

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts    # Main analysis endpoint
│   │   └── whatif/route.ts     # What-if follow-up endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main dashboard
├── components/
│   ├── agents/
│   │   └── AgentPanel.tsx      # Live agent discussion feed
│   ├── map/
│   │   └── SafeMap.tsx         # Leaflet map with route + shelters
│   └── ui/
│       ├── ActionPlan.tsx      # Risk banner, route, checklist, scenarios
│       ├── CommunityReports.tsx
│       ├── LocationInput.tsx   # Geolocation + city search
│       ├── WeatherWidget.tsx
│       └── WhatIfQuery.tsx     # Follow-up question interface
├── lib/
│   ├── agents/
│   │   └── orchestrator.ts     # All 7 agents + coordination logic
│   ├── api/
│   │   ├── weather.ts          # OpenWeatherMap client
│   │   └── routing.ts          # OSRM client
│   └── shelters.ts             # Shelter database + geo search
└── types/index.ts              # All TypeScript types
```

## Notes

- The app does **not** store location data persistently
- Location is only used when actively analyzing a situation
- Community reports are session-only (not stored to a database)
- For production, add a database (Supabase recommended) for persistent community reports
