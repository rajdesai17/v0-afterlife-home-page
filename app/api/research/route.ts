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

export interface SearchSource {
  url: string
  title: string
  snippet: string
  status: "searching" | "found" | "not_found"
}

export interface ResearchStep {
  type: "step"
  index: number
  label: string
  status: "searching" | "found" | "not_found"
  sources: SearchSource[]
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

      // Each step has multiple queries to search for more comprehensive results
      const steps = [
        {
          label: "Reading Wikipedia",
          queries: [
            `${name} startup site:en.wikipedia.org`,
            `${name} company history founded site:wikipedia.org`,
            `${name} tech startup wiki`,
            `${name} startup crunchbase profile`,
          ],
        },
        {
          label: "Finding the launch moment",
          queries: [
            `${name} startup ProductHunt launch`,
            `${name} TechCrunch launch announcement`,
            `${name} startup Series A funding announcement`,
            `${name} YCombinator demo day launch`,
            `${name} startup first product release`,
          ],
        },
        {
          label: "Reading the obituary",
          queries: [
            `${name} startup shutdown closed`,
            `${name} company failed obituary`,
            `${name} startup why we shut down`,
            `${name} startup discontinue cease operations`,
            `${name} startup post-mortem analysis`,
          ],
        },
        {
          label: "Finding founder's last words",
          queries: [
            `${name} founder statement why we failed`,
            `${name} CEO blog post shutdown`,
            `${name} founder lessons learned failure`,
            `${name} startup post-mortem blog`,
          ],
        },
      ]

      const results: string[] = []

      for (let i = 0; i < steps.length; i++) {
        const { label, queries } = steps[i]
        const sources: SearchSource[] = queries.map((q) => ({
          url: "",
          title: q.slice(0, 50) + (q.length > 50 ? "..." : ""),
          snippet: "",
          status: "searching" as const,
        }))

        // Send initial "searching" status with all queries
        send({
          type: "step",
          index: i,
          label,
          status: "searching",
          sources,
        })

        let combinedText = ""
        const foundSources: SearchSource[] = []

        // Search each query in the step
        for (let j = 0; j < queries.length; j++) {
          const query = queries[j]
          
          try {
            const response = await firecrawl.search(query, {
              limit: 1,
              scrapeOptions: { formats: ["markdown"] },
            })
            const items = response.web

            if (items && items.length > 0) {
              const item = items[0]
              const text = ("markdown" in item && item.markdown) || ""
              const itemUrl = ("url" in item && item.url) || ""
              const itemTitle = ("title" in item && item.title) || query
              
              combinedText += text + "\n\n"
              
              foundSources.push({
                url: itemUrl,
                title: itemTitle.slice(0, 60) + (itemTitle.length > 60 ? "..." : ""),
                snippet: text.slice(0, 80).replace(/\n/g, " ").trim() + "...",
                status: "found",
              })
            } else {
              foundSources.push({
                url: "",
                title: query.slice(0, 50) + (query.length > 50 ? "..." : ""),
                snippet: "No results found",
                status: "not_found",
              })
            }
          } catch (err) {
            console.log(`[research] [${label}] Query "${query}" failed:`, err)
            foundSources.push({
              url: "",
              title: query.slice(0, 50) + (query.length > 50 ? "..." : ""),
              snippet: "Search failed",
              status: "not_found",
            })
          }

          // Send progress update after each query
          const foundCount = foundSources.filter((s) => s.status === "found").length
          send({
            type: "step",
            index: i,
            label,
            status: foundCount > 0 ? "found" : "searching",
            sources: [
              ...foundSources,
              ...queries.slice(j + 1).map((q) => ({
                url: "",
                title: q.slice(0, 50) + (q.length > 50 ? "..." : ""),
                snippet: "",
                status: "searching" as const,
              })),
            ],
          })
        }

        results[i] = combinedText
        const finalFoundCount = foundSources.filter((s) => s.status === "found").length

        // Send final status for this step
        send({
          type: "step",
          index: i,
          label,
          status: finalFoundCount > 0 ? "found" : "not_found",
          sources: foundSources,
        })
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
