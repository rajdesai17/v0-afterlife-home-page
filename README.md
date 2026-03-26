# AFTERLIFE

> Talk to dead startups. They built. They launched. They died. Now they talk.

A voice AI experience that brings failed startups back to life as interactive personas. Built for **#ElevenHacks 2025** using ElevenLabs Conversational AI and Firecrawl.

[Live Demo](https://afterlife.vercel.app) · [Built with v0](https://v0.app)

---

## Features

### Summon Any Startup
Enter any startup name to conjure its spirit, or browse the curated graveyard of famous failures like Quibi, Theranos, Vine, and WeWork.

### Real-Time Research
Watch as the AI researches 16-20 sources across four categories:
- **Wikipedia** — Company history and founding details
- **Launch coverage** — ProductHunt, TechCrunch, YC Demo Day
- **Obituaries** — Shutdown announcements and failure analysis  
- **Postmortems** — Founder reflections and lessons learned

Sources stream in real-time with favicons, titles, and clickable links.

### Voice Conversations
Have natural voice conversations powered by ElevenLabs. The startup speaks in first person with emotional authenticity—pride, regret, dark humor, wistfulness.

### Live Search Tool
Mid-conversation, the AI can search the web for specific quotes, tweets, or details it doesn't already know. It never says "I don't know" without searching first.

### AI-Generated Epitaph
After each conversation, receive a poetic one-line epitaph—the startup's tombstone inscription, generated uniquely for your session.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15, React, TypeScript |
| Voice AI | ElevenLabs Conversational AI |
| Web Scraping | Firecrawl (search + extract) |
| Text Generation | Vercel AI Gateway (GPT-4o-mini) |
| Styling | Tailwind CSS, shadcn/ui |
| Streaming | Server-Sent Events (SSE) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Environment Variables

Create a `.env.local` file:

```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Project Structure

```
app/
├── page.tsx              # Landing page with hero + graveyard grid
├── [startup]/page.tsx    # Dynamic startup conversation page
├── api/
│   ├── research/         # Streaming research endpoint (Firecrawl)
│   ├── signed-url/       # ElevenLabs signed URL generation
│   └── epitaph/          # AI epitaph generation
components/
├── Conversation.tsx      # Main conversation UI (research → ready → live → eulogy)
├── SiteHeader.tsx        # Header with theme toggle
└── ThemeProvider.tsx     # Light/dark mode provider
lib/
├── buildEulogyPrompt.ts  # Constructs the AI persona prompt
├── clientTools.ts        # ElevenLabs client tools (search_web)
└── startups.ts           # Curated startup data
```

---

## How It Works

1. **Research Phase** — Firecrawl searches and extracts content from 4-5 sources per category, streaming results via SSE
2. **Prompt Building** — Research is compiled into a detailed character prompt with personality traits and factual grounding
3. **Voice Session** — ElevenLabs Conversational AI creates a real-time voice session with the custom prompt
4. **Live Tools** — The agent can call `search_web` mid-conversation for additional context
5. **Epitaph** — Post-conversation, GPT-4o-mini generates a poetic tombstone inscription

---

## Credits

Built by [@rajoninternet](https://twitter.com/rajoninternet) for ElevenLabs Hackathon 2025.

Powered by:
- [ElevenLabs](https://elevenlabs.io) — Voice AI
- [Firecrawl](https://firecrawl.dev) — Web scraping
- [Vercel](https://vercel.com) — Hosting & AI Gateway
- [v0](https://v0.app) — Development

---

## License

MIT
