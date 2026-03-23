import { NextResponse } from "next/server"
import { buildEulogyPrompt, type Research } from "@/lib/buildEulogyPrompt"

export async function POST(req: Request) {
  try {
    const { research, name } = (await req.json()) as {
      research: Research
      name: string
    }
    console.log(`[signed-url] Request for "${name}"`)

    if (!name || !research) {
      console.log("[signed-url] Error: missing name or research")
      return NextResponse.json(
        { error: "name and research are required" },
        { status: 400 }
      )
    }

    const prompt = buildEulogyPrompt(name, research)
    console.log(`[signed-url] Built prompt (${prompt.length} chars)`)

    const agentId = process.env.ELEVENLABS_AGENT_ID
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!agentId || !apiKey) {
      console.log(`[signed-url] Error: missing credentials — agentId=${!!agentId}, apiKey=${!!apiKey}`)
      return NextResponse.json(
        { error: "ElevenLabs credentials not configured" },
        { status: 500 }
      )
    }

    console.log(`[signed-url] Fetching signed URL from ElevenLabs (agent: ${agentId})...`)
    const url = new URL(
      "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url"
    )
    url.searchParams.set("agent_id", agentId)

    const response = await fetch(url.toString(), {
      headers: { "xi-api-key": apiKey },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[signed-url] ElevenLabs error ${response.status}:`, text)
      return NextResponse.json(
        { error: "Failed to get signed URL from ElevenLabs" },
        { status: 502 }
      )
    }

    const data = await response.json()
    console.log(`[signed-url] Got signed URL (${data.signed_url?.length ?? 0} chars)`)

    return NextResponse.json({
      signedUrl: data.signed_url,
      prompt,
    })
  } catch (error) {
    console.error("Signed URL API error:", error)
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    )
  }
}
