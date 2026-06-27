# AutoBiz AI — AI-Powered Business Platform for Indian SMEs

A modern, professional web application prototype featuring AI-driven agents, business analytics, and a WhatsApp-inspired chat interface.

## Quick Start

```bash
cd AutoBizAI
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── App.tsx                  # Root with all routes
├── main.tsx                 # Entry point
├── index.css                # Design system (Tailwind layers, custom components)
├── types/index.ts           # TypeScript interfaces
├── services/api.ts          # API service layer (mock ↔ FastAPI toggle)
├── stores/
│   ├── agentStore.ts        # Zustand: agents & chat state
│   └── appStore.ts          # Zustand: theme, language, sidebar
├── layouts/
│   └── AppLayout.tsx        # App shell with nav (desktop sidebar + mobile bottom)
├── pages/
│   ├── Welcome.tsx          # Landing page
│   ├── onboarding/
│   │   ├── GuidedOnboarding.tsx   # 6-step form
│   │   ├── FreeTextOnboarding.tsx # Free-text description
│   │   ├── UploadOnboarding.tsx   # Document upload
│   │   ├── AnalyzingScreen.tsx    # Animated loader
│   │   └── ResultsScreen.tsx      # Results & sign-up
│   └── app/
│       ├── AgentsTab.tsx    # WhatsApp-style chat
│       ├── BusinessTab.tsx  # Analytics dashboard (Recharts)
│       ├── CommunityTab.tsx # Agent marketplace
│       └── DashboardTab.tsx # Settings & controls
public/
└── data/
    ├── agents.json              # Hired agents
    ├── chat-history.json        # Mock conversations
    ├── business-metrics.json    # Revenue, charts, recommendations
    ├── marketplace-agents.json  # Community agents
    └── onboarding-config.json   # Industries, goals, mock AI response
```

## Connecting a Real Backend

1. Open `src/services/api.ts`
2. Set `USE_MOCK = false`
3. Change `API_BASE` to your FastAPI server URL (e.g., `http://localhost:8000/api`)
4. All API functions already match the expected endpoint structure

## Tech Stack

| Layer         | Technology                              |
|---------------|----------------------------------------|
| Framework     | React 18 + TypeScript                  |
| Styling       | Tailwind CSS v3                        |
| State         | Zustand                               |
| Charts        | Recharts                               |
| Icons         | Lucide React                           |
| Routing       | React Router v6                        |
| Build         | Vite                                   |

## Routes

| Path               | Description                  |
|--------------------|------------------------------|
| `/welcome`         | Landing page                 |
| `/onboarding/guided` | 6-step guided form         |
| `/onboarding/freetext` | Free-text business input |
| `/onboarding/upload` | Document upload            |
| `/onboarding/analyzing` | Loading animation        |
| `/onboarding/results` | AI analysis results       |
| `/app/agents`      | WhatsApp-style chat          |
| `/app/business`    | Analytics dashboard          |
| `/app/community`   | Agent marketplace            |
| `/app/dashboard`   | Settings & controls          |

## Features

- 🌙 Dark/Light theme toggle
- 🌐 English/Hindi language switch
- 📱 Mobile-first responsive design
- 💬 WhatsApp-inspired chat with message bubbles
- 📊 Interactive charts (Revenue, Sales, Segments, Traffic)
- 🤖 Agent marketplace with search and filters
- ✨ Smooth animations throughout
- 🇮🇳 Built for Indian SMEs (₹ currency, local industries)

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static hosting (Vercel, Netlify, etc).
