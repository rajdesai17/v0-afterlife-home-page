"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useConversation } from "@elevenlabs/react"
import { Mic, MicOff, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { buildEulogyPrompt, type Research } from "@/lib/buildEulogyPrompt"

type ViewState = "researching" | "ready" | "live" | "eulogy"

interface ResearchItem {
  label: string
  status: "pending" | "active" | "done"
}

interface TranscriptMessage {
  role: "agent" | "user"
  message: string
  timestamp: Date
}

interface ConversationProps {
  name: string
  years: string
  url?: string
  agentId: string
}

function StatusIndicator({ status }: { status: ResearchItem["status"] }) {
  if (status === "done") {
    return (
      <span className="flex size-4 items-center justify-center text-emerald-500">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  }
  if (status === "active") {
    return (
      <span className="relative flex size-4 items-center justify-center">
        <span className="absolute size-2 animate-ping rounded-full bg-amber-500 opacity-75" />
        <span className="size-2 rounded-full bg-amber-500" />
      </span>
    )
  }
  return (
    <span className="flex size-4 items-center justify-center">
      <span className="size-2 rounded-full border border-zinc-600" />
    </span>
  )
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`
}

export default function Conversation({ name, years, url, agentId }: ConversationProps) {
  const [view, setView] = useState<ViewState>("researching")
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([
    { label: "Reading Wikipedia...", status: "pending" },
    { label: "Finding the launch moment...", status: "pending" },
    { label: "Reading the obituary...", status: "pending" },
    { label: "Finding the founder's last words...", status: "pending" },
  ])
  const [prompt, setPrompt] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [duration, setDuration] = useState<string>("0m 00s")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isStartingSession, setIsStartingSession] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const researchRef = useRef<Research | null>(null)
  const signedUrlRef = useRef<string | null>(null)
  const didStartResearch = useRef(false)
  const transcriptLengthRef = useRef(0)
  const elapsedSecondsRef = useRef(0)

  useEffect(() => {
    transcriptLengthRef.current = transcript.length
  }, [transcript.length])

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds
  }, [elapsedSeconds])

  const conversation = useConversation({
    onConnect: useCallback(({ conversationId }: { conversationId: string }) => {
      console.log(`[conv] Connected — conversationId: ${conversationId}`)
    }, []),
    onMessage: useCallback(({ message, role }: { message: string; role: "user" | "agent" }) => {
      console.log(`[conv] Message [${role}]: ${message.slice(0, 80)}${message.length > 80 ? "..." : ""}`)
      setTranscript((prev) => [
        ...prev,
        { role, message, timestamp: new Date() },
      ])
    }, []),
    onDisconnect: useCallback((details: unknown) => {
      console.log("[conv] Disconnected — details:", JSON.stringify(details, null, 2))
      if (timerRef.current) clearInterval(timerRef.current)
      setIsStartingSession(false)
      const hasNoMessages = transcriptLengthRef.current === 0
      const isImmediateDrop = elapsedSecondsRef.current === 0
      // If the socket drops before any exchange happened, keep the user in "ready"
      // so they can retry instead of jumping straight to an empty eulogy.
      setView((current) => {
        if ((current === "live" || current === "ready") && hasNoMessages && isImmediateDrop) {
          return "ready"
        }
        return "eulogy"
      })
      if (hasNoMessages && isImmediateDrop) {
        setError("Conversation ended before it could begin. Please try again.")
      }
    }, []),
    onStatusChange: useCallback(({ status }: { status: string }) => {
      console.log(`[conv] Status changed: ${status}`)
    }, []),
    onModeChange: useCallback(({ mode }: { mode: string }) => {
      console.log(`[conv] Mode changed: ${mode}`)
    }, []),
    onDebug: useCallback((debugEvent: unknown) => {
      console.log("[conv] Debug event:", debugEvent)
    }, []),
    onError: useCallback((message: unknown) => {
      const normalized =
        typeof message === "string"
          ? message
          : message instanceof Error
            ? message.message
            : "An unexpected conversation error occurred"
      console.error("[conv] Error:", message)
      setError(normalized)
    }, []),
  })

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  // Live timer
  useEffect(() => {
    if (view === "live" && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
          const m = Math.floor(next / 60)
          const s = next % 60
          setDuration(`${m}m ${s.toString().padStart(2, "0")}s`)
          return next
        })
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [view, startTime])

  // Parallel fetch: research + signed URL + mic permission (guarded against Strict Mode double-fire)
  useEffect(() => {
    if (didStartResearch.current) return
    didStartResearch.current = true

    async function doSetup() {
      setResearchItems((items) =>
        items.map((item) => ({ ...item, status: "active" as const }))
      )

      try {
        // Fire all three in parallel — signed URL doesn't depend on research
        const [researchRes, signedUrlRes] = await Promise.all([
          fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, url }),
          }),
          fetch("/api/signed-url", { method: "POST" }),
          // Pre-request mic permission so it's ready when user clicks "Start"
          navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            // Stop tracks immediately — we just needed the permission grant
            stream.getTracks().forEach((t) => t.stop())
          }).catch(() => { /* mic permission will be re-requested by ElevenLabs SDK */ }),
        ])

        if (!researchRes.ok) {
          throw new Error("Research failed")
        }
        if (!signedUrlRes.ok) {
          throw new Error("Failed to get signed URL")
        }

        const [research, { signedUrl: fetchedSignedUrl }] = await Promise.all([
          researchRes.json() as Promise<Research>,
          signedUrlRes.json() as Promise<{ signedUrl: string }>,
        ])

        researchRef.current = research
        signedUrlRef.current = fetchedSignedUrl

        setResearchItems((items) =>
          items.map((item) => ({ ...item, status: "done" as const }))
        )

        // Build prompt client-side — pure function, no server round-trip needed
        // Pass known years so we don't rely on broken regex extraction from Firecrawl
        const p = buildEulogyPrompt(name, research, years || undefined)
        setPrompt(p)
        setView("ready")
      } catch (err) {
        console.error("[client] Error:", err)
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    }

    doSetup()
  }, [name, url])

  async function startConversation() {
    if (!prompt || isStartingSession) return

    const signedUrl = signedUrlRef.current
    if (!signedUrl) {
      setError("Signed URL not ready. Please wait and retry.")
      return
    }

    try {
      setError(null)
      setIsStartingSession(true)
      // Use pre-fetched signedUrl instead of agentId — saves a round-trip at session start
      const conversationId = await conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt },
          },
        },
        clientTools: {
          search_web: async (parameters: { query: string }) => {
            try {
              const res = await fetch("/api/search-tool", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: parameters.query }),
              })
              const data = await res.json()
              return data.result || "No results found."
            } catch {
              return "Search failed. I don't have that information right now."
            }
          },
        },
      })
      console.log(`[client] Session started — id: ${conversationId}`)
      setStartTime(new Date())
      setElapsedSeconds(0)
      setDuration("0m 00s")
      setView("live")
    } catch (err) {
      console.error("[client] Failed to start session:", err)
      const message =
        err instanceof Error
          ? err.message
          : "Failed to start conversation. Check microphone permission and retry."
      setError(message)
      setView("ready")
    } finally {
      setIsStartingSession(false)
    }
  }

  async function endConversation() {
    console.log("[client] Ending session...")
    await conversation.endSession()
  }

  const lastAgentMessage = [...transcript].reverse().find((m) => m.role === "agent")
  const pullQuote = lastAgentMessage?.message ?? ""

  async function handleShare() {
    const diedYear = researchRef.current?.diedYear ?? ""
    const text = `I talked to ${name}${diedYear ? ` (${diedYear})` : ""}. They said: "${pullQuote}" — afterlife.app`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const upperName = name.toUpperCase()

  if (error && view === "researching") {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center px-4 py-16">
          <h1 className="font-serif text-5xl italic text-white">{name}</h1>
          <p className="mt-8 text-sm text-red-400">{error}</p>
          <Link
            href="/"
            className="mt-4 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Researching state */}
      {view === "researching" && (
        <div className="flex flex-col items-center px-4 py-16">
          <h1 className="font-serif text-5xl italic text-white">{name}</h1>
          <p className="mt-2 text-sm text-zinc-500">{years}</p>
          <div className="my-8 h-px w-full max-w-xs bg-[#1a1a1a]" />

          <div className="flex w-full max-w-[360px] flex-col gap-3">
            {researchItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <StatusIndicator status={item.status} />
                <span
                  className={
                    item.status === "pending"
                      ? "text-zinc-600"
                      : "text-zinc-300"
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm italic text-zinc-600">
            Gathering their history...
          </p>
        </div>
      )}

      {/* Ready state — research done, ready to talk */}
      {view === "ready" && (
        <div className="flex flex-col items-center px-4 py-16">
          <h1 className="font-serif text-5xl italic text-white">{name}</h1>
          <p className="mt-2 text-sm text-zinc-500">{years}</p>
          <div className="my-8 h-px w-full max-w-xs bg-[#1a1a1a]" />

          <div className="flex w-full max-w-[360px] flex-col gap-3">
            {researchItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <StatusIndicator status={item.status} />
                <span className="text-zinc-300">{item.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startConversation}
            disabled={isStartingSession}
            className="mt-10 bg-white text-black px-8 py-3 text-sm font-medium rounded-[2px] hover:bg-[#e5e5e5] transition-colors"
          >
            {isStartingSession ? "Starting..." : "Start conversation"}
          </button>
          {error && <p className="mt-4 text-xs text-red-400 text-center">{error}</p>}
        </div>
      )}

      {/* Live state */}
      {view === "live" && (
        <div className="flex flex-col px-4 py-8 max-w-2xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-[#222222] pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-white">{name}</span>
              <span className="text-sm text-zinc-500">
                {conversation.isSpeaking ? "Speaking now" : "Listening"}
              </span>
            </div>
            <span className="font-mono text-sm text-zinc-400">{duration}</span>
          </div>

          {/* Transcript area */}
          <div
            ref={transcriptRef}
            className="my-6 flex max-h-[400px] flex-col gap-6 overflow-y-auto"
          >
            {transcript.length === 0 && (
              <p className="text-sm italic text-zinc-600 text-center py-8">
                Waiting for {name} to speak...
              </p>
            )}
            {transcript.map((msg, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span
                  className={`text-[11px] font-medium uppercase tracking-wider ${
                    msg.role === "agent"
                      ? "text-emerald-500"
                      : "text-zinc-500"
                  }`}
                >
                  {msg.role === "agent" ? upperName : "YOU"}
                </span>
                <p
                  className={
                    msg.role === "agent" ? "text-white" : "text-zinc-400"
                  }
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>

          {/* Mic button */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <button
              type="button"
              onClick={endConversation}
              className="group relative flex size-16 items-center justify-center rounded-full border border-white/20 bg-[#0a0a0a] transition-colors hover:border-red-500/40"
            >
              {conversation.isSpeaking && (
                <span className="absolute inset-0 animate-pulse rounded-full border-2 border-emerald-500/50" />
              )}
              <Mic className="size-6 text-white" />
            </button>
            <span className="text-xs text-zinc-600">Tap to end</span>
          </div>

          {error && (
            <p className="mt-4 text-xs text-red-400 text-center">{error}</p>
          )}
        </div>
      )}

      {/* Eulogy state */}
      {view === "eulogy" && (
        <div className="flex justify-center px-4 py-16">
          <div className="w-full max-w-[400px] rounded-sm border border-[#222222] bg-[#111111] p-8">
            <p className="text-xs text-zinc-500">You talked to</p>
            <h2 className="mt-1 font-serif text-4xl italic text-white">
              {name}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{years}</p>

            {/* Pull quote */}
            {pullQuote && (
              <blockquote className="my-8 border-l-2 border-emerald-500 pl-4 italic text-white">
                &ldquo;{pullQuote}&rdquo;
              </blockquote>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: duration, label: "Duration" },
                {
                  value: String(transcript.length),
                  label: "Messages",
                },
                { value: "4", label: "Sources" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-sm bg-[#1a1a1a] px-3 py-1.5 text-xs text-zinc-400"
                >
                  <span className="text-white">{stat.value}</span> ·{" "}
                  {stat.label}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-3">
              <Link
                href="/"
                className="flex-1 rounded-sm border border-[#222222] px-4 py-2.5 text-sm text-white text-center transition-colors hover:border-zinc-600"
              >
                Talk again
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 rounded-sm bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
              >
                {copied ? "Copied!" : "Share eulogy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
