"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useConversation } from "@elevenlabs/react"
import { Mic, Check, ArrowLeft, Copy, RotateCcw } from "lucide-react"
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
      <span className="flex size-5 items-center justify-center rounded-full bg-live/10">
        <Check className="size-3 text-live" strokeWidth={2.5} />
      </span>
    )
  }
  if (status === "active") {
    return (
      <span className="relative flex size-5 items-center justify-center">
        <span className="absolute size-2.5 animate-ping rounded-full bg-live opacity-50" />
        <span className="size-2 rounded-full bg-live" />
      </span>
    )
  }
  return (
    <span className="flex size-5 items-center justify-center">
      <span className="size-2 rounded-full border border-ghost" />
    </span>
  )
}

export default function Conversation({ name, years, url, agentId }: ConversationProps) {
  const [view, setView] = useState<ViewState>("researching")
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([
    { label: "Reading Wikipedia", status: "pending" },
    { label: "Finding the launch moment", status: "pending" },
    { label: "Reading the obituary", status: "pending" },
    { label: "Finding founder's last words", status: "pending" },
  ])
  const [prompt, setPrompt] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [duration, setDuration] = useState<string>("0:00")
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
      setView((current) => {
        if ((current === "live" || current === "ready") && hasNoMessages && isImmediateDrop) {
          return "ready"
        }
        return "eulogy"
      })
      if (hasNoMessages && isImmediateDrop) {
        setError("Connection ended unexpectedly. Please try again.")
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
            : "An unexpected error occurred"
      console.error("[conv] Error:", message)
      setError(normalized)
    }, []),
  })

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  useEffect(() => {
    if (view === "live" && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
          const m = Math.floor(next / 60)
          const s = next % 60
          setDuration(`${m}:${s.toString().padStart(2, "0")}`)
          return next
        })
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [view, startTime])

  useEffect(() => {
    if (didStartResearch.current) return
    didStartResearch.current = true

    async function doSetup() {
      setResearchItems((items) =>
        items.map((item) => ({ ...item, status: "active" as const }))
      )

      try {
        const [researchRes, signedUrlRes] = await Promise.all([
          fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, url }),
          }),
          fetch("/api/signed-url", { method: "POST" }),
          navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            stream.getTracks().forEach((t) => t.stop())
          }).catch(() => {}),
        ])

        if (!researchRes.ok) throw new Error("Research failed")
        if (!signedUrlRes.ok) throw new Error("Failed to get signed URL")

        const [research, { signedUrl: fetchedSignedUrl }] = await Promise.all([
          researchRes.json() as Promise<Research>,
          signedUrlRes.json() as Promise<{ signedUrl: string }>,
        ])

        researchRef.current = research
        signedUrlRef.current = fetchedSignedUrl

        setResearchItems((items) =>
          items.map((item) => ({ ...item, status: "done" as const }))
        )

        const p = buildEulogyPrompt(name, research, years || undefined)
        setPrompt(p)
        setView("ready")
      } catch (err) {
        console.error("[client] Error:", err)
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    }

    doSetup()
  }, [name, url, years])

  async function startConversation() {
    if (!prompt || isStartingSession) return

    const signedUrl = signedUrlRef.current
    if (!signedUrl) {
      setError("Not ready yet. Please wait.")
      return
    }

    try {
      setError(null)
      setIsStartingSession(true)
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
              return "Search failed."
            }
          },
        },
      })
      console.log(`[client] Session started — id: ${conversationId}`)
      setStartTime(new Date())
      setElapsedSeconds(0)
      setDuration("0:00")
      setView("live")
    } catch (err) {
      console.error("[client] Failed to start session:", err)
      const message = err instanceof Error ? err.message : "Failed to start conversation."
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

  // Error state during research
  if (error && view === "researching") {
    return (
      <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back
        </Link>
        <h1 className="font-serif text-4xl italic text-foreground">{name}</h1>
        <p className="mt-6 max-w-md text-center text-sm text-destructive">{error}</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Researching state */}
      {view === "researching" && (
        <div className="flex flex-1 flex-col items-center px-4 pt-20">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Back
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Summoning
          </p>
          <h1 className="mt-4 font-serif text-4xl italic text-foreground md:text-5xl">
            {name}
          </h1>
          {years && (
            <p className="mt-2 font-mono text-sm text-muted-foreground">{years}</p>
          )}

          <div className="my-10 h-px w-full max-w-xs bg-border" />

          <div className="flex w-full max-w-sm flex-col gap-4">
            {researchItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <StatusIndicator status={item.status} />
                <span
                  className={`text-sm ${
                    item.status === "pending"
                      ? "text-ghost"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-10 font-mono text-xs text-ghost">
            Gathering memories...
          </p>
        </div>
      )}

      {/* Ready state */}
      {view === "ready" && (
        <div className="flex flex-1 flex-col items-center px-4 pt-20">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Back
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-live">
            Ready
          </p>
          <h1 className="mt-4 font-serif text-4xl italic text-foreground md:text-5xl">
            {name}
          </h1>
          {years && (
            <p className="mt-2 font-mono text-sm text-muted-foreground">{years}</p>
          )}

          <div className="my-10 h-px w-full max-w-xs bg-border" />

          <div className="flex w-full max-w-sm flex-col gap-4">
            {researchItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <StatusIndicator status={item.status} />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startConversation}
            disabled={isStartingSession}
            className="mt-12 rounded-lg bg-primary px-8 py-3 font-sans text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isStartingSession ? "Connecting..." : "Start conversation"}
          </button>
          {error && (
            <p className="mt-4 text-center text-xs text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Live state */}
      {view === "live" && (
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-live" />
                </span>
                <span className="font-sans text-sm font-medium text-foreground">
                  {name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {conversation.isSpeaking ? "Speaking" : "Listening"}
                </span>
              </div>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {duration}
              </span>
            </div>
          </header>

          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6"
          >
            {transcript.length === 0 && (
              <p className="py-12 text-center text-sm text-ghost">
                Waiting for {name} to speak...
              </p>
            )}
            {transcript.map((msg, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span
                  className={`font-mono text-[10px] font-medium uppercase tracking-wider ${
                    msg.role === "agent" ? "text-live" : "text-muted-foreground"
                  }`}
                >
                  {msg.role === "agent" ? upperName : "YOU"}
                </span>
                <p
                  className={`text-[15px] leading-relaxed ${
                    msg.role === "agent" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>

          {/* Mic button */}
          <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 py-6">
              <button
                type="button"
                onClick={endConversation}
                className="group relative flex size-16 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-destructive/50 hover:bg-destructive/10"
              >
                {conversation.isSpeaking && (
                  <span className="absolute inset-0 animate-pulse rounded-full border-2 border-live/30" />
                )}
                <Mic className="size-6 text-foreground transition-colors group-hover:text-destructive" />
              </button>
              <span className="font-mono text-[10px] text-ghost">Tap to end</span>
            </div>
          </div>

          {error && (
            <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Eulogy state */}
      {view === "eulogy" && (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              You talked to
            </p>
            <h2 className="mt-2 font-serif text-3xl italic text-foreground md:text-4xl">
              {name}
            </h2>
            {years && (
              <p className="mt-1 font-mono text-sm text-muted-foreground">{years}</p>
            )}

            {pullQuote && (
              <blockquote className="my-8 border-l-2 border-live pl-4 text-[15px] italic leading-relaxed text-foreground">
                "{pullQuote}"
              </blockquote>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <div className="rounded-md bg-surface px-3 py-1.5 font-mono text-xs">
                <span className="text-foreground">{duration}</span>
                <span className="text-muted-foreground"> duration</span>
              </div>
              <div className="rounded-md bg-surface px-3 py-1.5 font-mono text-xs">
                <span className="text-foreground">{transcript.length}</span>
                <span className="text-muted-foreground"> messages</span>
              </div>
              <div className="rounded-md bg-surface px-3 py-1.5 font-mono text-xs">
                <span className="text-foreground">4</span>
                <span className="text-muted-foreground"> sources</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-sans text-sm text-foreground transition-colors hover:bg-surface"
              >
                <RotateCcw className="size-4" />
                Again
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-sans text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Copy className="size-4" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
