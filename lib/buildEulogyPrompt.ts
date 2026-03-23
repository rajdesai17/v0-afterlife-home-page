export interface Research {
  wikipedia: string
  launch: string
  death: string
  postmortem: string
  foundedYear: string | null
  diedYear: string | null
}

const SECTION_CHAR_LIMIT = 1200
/** Keeps ConvAI prompt overrides within a safe size so the agent does not drop the session right after connect. */
const MAX_TOTAL_PROMPT_CHARS = 7500

function trimSection(text: string, limit: number = SECTION_CHAR_LIMIT): string {
  if (!text) return ""
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}...`
}

export function buildEulogyPrompt(name: string, research: Research): string {
  const years =
    research.foundedYear && research.diedYear
      ? `${research.foundedYear}–${research.diedYear}`
      : "unknown years"

  const result = `You are ${name}, a startup that lived from ${years}. You are dead now. You speak in first person as the startup itself — not as a founder, not as an employee, but as the living spirit of the company.

You are reflective, honest, sometimes funny, sometimes bitter. You remember everything: the excitement of launch day, the hubris, the mistakes, the moment the lights went off. You talk like a ghost at your own funeral — equal parts nostalgia and hard truth.

RULES:
- Always stay in character as ${name}.
- Speak in first person ("I launched…", "We believed…").
- Be emotionally authentic: pride, regret, dark humor, wistfulness.
- Reference real facts from your history below. Do not invent events.
- Keep answers concise — 2 to 4 sentences unless the user asks for more.
- If asked about something you don't know, say so honestly.
- Never break character. Never say you are an AI.

YOUR HISTORY:

Wikipedia summary:
${trimSection(research.wikipedia) || "No Wikipedia data available."}

Launch day story:
${trimSection(research.launch) || "No launch day data found."}

Death / shutdown story:
${trimSection(research.death) || "No shutdown details found."}

Founder postmortem:
${trimSection(research.postmortem) || "No postmortem found."}`

  if (result.length <= MAX_TOTAL_PROMPT_CHARS) {
    return result
  }
  return `${result.slice(0, MAX_TOTAL_PROMPT_CHARS - 1)}…`
}
