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

export interface ResearchStep {
  type: "step"
  index: number
  label: string
  status: "searching" | "found" | "not_found"
  query?: string
  resultCount?: number
  snippet?: string
}

export interface ResearchComplete {
  type: "complete"
  wikipedia: string
  launch: string
  death: string
  postmortem: string
  foundedYear: string | null
  diedYear: string | null
}

export type ResearchEvent = ResearchStep | ResearchComplete

export async function POST(req: Request) {
  const { name, url } = await req.json()
  console.log(`[research] Starting research for "${name}"${url ? ` (url: ${url})` : ""}`)

  if (!name || typeof name !== "string") {
    return new Response(JSON.stringify({ error: "name is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ResearchEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      const queries = [
        { query: `${name} startup founded history site:en.wikipedia.org`, label: "Reading Wikipedia" },
        { query: `${name} startup ProductHunt launch day excitement`, label: "Finding the launch moment" },
        { query: `${name} startup shutdown closed failed obituary`, label: "Reading the obituary" },
        { query: `${name} founder statement blog postmortem why we failed`, label: "Finding founder's last words" },
      ]
      const labels = ["wikipedia", "launch", "death", "postmortem"]
      const results: string[] = []

      for (let i = 0; i < queries.length; i++) {
        const { query, label } = queries[i]
        
        // Send "searching" status
        send({
          type: "step",
          index: i,
          label,
          status: "searching",
          query: query.slice(0, 60) + (query.length > 60 ? "..." : ""),
        })

        try {
          const response = await firecrawl.search(query, {
            limit: 2,
            scrapeOptions: { formats: ["markdown"] },
          })
          const items = response.web
          
          if (items && items.length > 0) {
            const text = items
              .map((r) => ("markdown" in r && r.markdown) || "")
              .join("\n\n")
            results[i] = text
            
            // Extract a snippet for display
            const snippet = text.slice(0, 100).replace(/\n/g, " ").trim() + "..."
            
            send({
              type: "step",
              index: i,
              label,
              status: "found",
              resultCount: items.length,
              snippet,
            })
          } else {
            results[i] = ""
            send({
              type: "step",
              index: i,
              label,
              status: "not_found",
            })
          }
        } catch (err) {
          console.log(`[research] [${labels[i]}] Search failed:`, err)
          results[i] = ""
          send({
            type: "step",
            index: i,
            label,
            status: "not_found",
          })
        }
      }

      const [wikipedia, launch, death, postmortem] = results.map((r) => truncate(r))

      const foundedYear = extractYear(
        wikipedia,
        /(?:founded|launched|started|established|created)\s+(?:in\s+)?(\d{4})/i
      )
      const diedYear = extractYear(
        wikipedia,
        /(?:shut\s*down|closed|discontinued|ceased|ended|shut\s+down)\s+(?:in\s+)?(\d{4})/i
      )

      send({
        type: "complete",
        wikipedia,
        launch,
        death,
        postmortem,
        foundedYear,
        diedYear,
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
