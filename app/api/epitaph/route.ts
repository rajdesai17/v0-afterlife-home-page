import { NextResponse } from "next/server"
import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"

export async function POST(req: Request) {
  try {
    const { name, years, context } = await req.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const prompt = `You are ${name}, a startup that lived from ${years || "unknown years"}. You are dead now.

Write a single short epitaph (1 sentence, max 15 words) as if it's YOUR tombstone inscription. Speak in first person as the startup itself.

Be poetic, bittersweet, and memorable. Reference what made you special or how you died.

${context ? `Context about ${name}: ${context}` : ""}

Reply with ONLY the epitaph text, no quotes, no attribution.`

    const { text } = await generateText({
      model: gateway("openai/gpt-4o-mini"),
      prompt,
      maxTokens: 50,
    })

    const epitaph = text.trim().replace(/^["']|["']$/g, "")

    return NextResponse.json({ epitaph })
  } catch (error) {
    console.error("Epitaph API error:", error)
    return NextResponse.json(
      { error: "Failed to generate epitaph" },
      { status: 500 }
    )
  }
}
