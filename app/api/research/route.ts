import { NextResponse } from "next/server"
import Firecrawl from "@mendable/firecrawl-js"

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
})

function truncate(text: string, maxWords: number = 200): string {
  const words = text.split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(" ") + "..."
}

function extractYear(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern)
  return match ? match[1] : null
}

export async function POST(req: Request) {
  try {
    const { name, url } = await req.json()
    console.log(`[research] Starting research for "${name}"${url ? ` (url: ${url})` : ""}`)

    if (!name || typeof name !== "string") {
      console.log("[research] Error: name is missing or not a string")
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      )
    }

    const queries = [
      `${name} startup founded history site:en.wikipedia.org`,
      `${name} startup ProductHunt launch day excitement`,
      `${name} startup shutdown closed failed obituary`,
      `${name} founder statement blog postmortem why we failed`,
    ]
    const labels = ["wikipedia", "launch", "death", "postmortem"]

    console.log(`[research] Running ${queries.length} parallel Firecrawl searches...`)
    const results = await Promise.all(
      queries.map(async (query, i) => {
        try {
          console.log(`[research]   [${labels[i]}] Searching: "${query.slice(0, 60)}..."`)
          const response = await firecrawl.search(query, {
            limit: 2,
            scrapeOptions: { formats: ["markdown"] },
          })
          const items = response.web
          if (items && items.length > 0) {
            const text = items
              .map((r) => ("markdown" in r && r.markdown) || "")
              .join("\n\n")
            console.log(`[research]   [${labels[i]}] Got ${items.length} results (${text.length} chars)`)
            return text
          }
          console.log(`[research]   [${labels[i]}] No results`)
          return ""
        } catch (err) {
          console.log(`[research]   [${labels[i]}] Search failed:`, err)
          return ""
        }
      })
    )

    const [wikipedia, launch, death, postmortem] = results.map((r) =>
      truncate(r)
    )

    const foundedYear = extractYear(
      wikipedia,
      /(?:founded|launched|started|established|created)\s+(?:in\s+)?(\d{4})/i
    )
    const diedYear = extractYear(
      wikipedia,
      /(?:shut\s*down|closed|discontinued|ceased|ended|shut\s+down)\s+(?:in\s+)?(\d{4})/i
    )

    console.log(`[research] Done. foundedYear=${foundedYear}, diedYear=${diedYear}`)
    console.log(`[research] Result lengths — wiki:${wikipedia.length} launch:${launch.length} death:${death.length} postmortem:${postmortem.length}`)

    return NextResponse.json({
      wikipedia,
      launch,
      death,
      postmortem,
      foundedYear,
      diedYear,
    })
  } catch (error) {
    console.error("Research API error:", error)
    return NextResponse.json(
      { error: "Research failed" },
      { status: 500 }
    )
  }
}
