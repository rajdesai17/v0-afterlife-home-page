import { NextResponse } from "next/server"
import Firecrawl from "@mendable/firecrawl-js"

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
})

function truncate(text: string, maxWords: number = 100): string {
  const words = text.split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(" ") + "..."
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ result: "No search query provided." })
    }

    // limit: 1 for speed — conversational AI needs fast answers, not comprehensive results
    const response = await firecrawl.search(query, {
      limit: 1,
    })

    const items = response.web
    if (!items || items.length === 0) {
      return NextResponse.json({ result: "No results found for this search." })
    }

    const first = items[0]
    const content = ("markdown" in first && first.markdown) || ("description" in first && first.description) || ""
    const result = truncate(content)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("[search-tool] Error:", error)
    return NextResponse.json({
      result: "Search failed. I don't have that information right now.",
    })
  }
}
