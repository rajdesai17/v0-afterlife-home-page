import { NextResponse } from "next/server"

export async function POST() {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs credentials not configured" },
        { status: 500 }
      )
    }

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

    return NextResponse.json({
      signedUrl: data.signed_url,
    })
  } catch (error) {
    console.error("Signed URL API error:", error)
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    )
  }
}
