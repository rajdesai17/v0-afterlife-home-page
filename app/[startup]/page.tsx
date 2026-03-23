"use client"

import { useState } from "react"
import { Mic, Check } from "lucide-react"

type ViewState = "researching" | "live" | "eulogy"

interface ResearchItem {
  label: string
  status: "pending" | "active" | "done"
}

const researchItems: ResearchItem[] = [
  { label: "Reading Wikipedia...", status: "done" },
  { label: "Finding the launch moment...", status: "done" },
  { label: "Reading the obituary...", status: "active" },
  { label: "Finding the founder's last words...", status: "pending" },
]

const transcriptMessages = [
  { speaker: "VINE", text: "I remember the day we launched. Six seconds felt like a revolution." },
  { speaker: "YOU", text: "What was the hardest part of building Vine?" },
  { speaker: "VINE", text: "Convincing people that constraints were features. Six seconds forced creativity." },
  { speaker: "YOU", text: "Do you have any regrets?" },
]

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

function ResearchingState() {
  return (
    <div className="flex flex-col items-center px-4 py-16">
      <h1 className="font-serif text-5xl italic text-white">Vine</h1>
      <p className="mt-2 text-sm text-zinc-500">2012 — 2017</p>
      <div className="my-8 h-px w-full max-w-xs bg-[#1a1a1a]" />
      
      <div className="flex w-full max-w-[360px] flex-col gap-3">
        {researchItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <StatusIndicator status={item.status} />
            <span className={item.status === "pending" ? "text-zinc-600" : "text-zinc-300"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      
      <p className="mt-8 text-sm italic text-zinc-600">Gathering 50 years of history...</p>
    </div>
  )
}

function LiveState() {
  return (
    <div className="flex flex-col px-4 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-white">Vine</span>
          <span className="text-sm text-zinc-500">Speaking now</span>
        </div>
        <span className="font-mono text-sm text-zinc-400">1:24</span>
      </div>

      {/* Transcript area */}
      <div className="my-6 flex max-h-[400px] flex-col gap-6 overflow-y-auto">
        {transcriptMessages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span
              className={`text-[11px] font-medium uppercase tracking-wider ${
                msg.speaker === "VINE" ? "text-emerald-500" : "text-zinc-500"
              }`}
            >
              {msg.speaker}
            </span>
            <p className={msg.speaker === "VINE" ? "text-white" : "text-zinc-400"}>
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          type="button"
          className="group relative flex size-16 items-center justify-center rounded-full border border-white/20 bg-[#0a0a0a] transition-colors hover:border-white/40"
        >
          <span className="absolute inset-0 animate-pulse rounded-full border-2 border-emerald-500/50 opacity-0 group-hover:opacity-100" />
          <Mic className="size-6 text-white" />
        </button>
        <span className="text-xs text-zinc-600">Tap to speak</span>
      </div>
    </div>
  )
}

function EulogyState() {
  return (
    <div className="flex justify-center px-4 py-16">
      <div className="w-full max-w-[400px] rounded-sm border border-[#222222] bg-[#111111] p-8">
        <p className="text-xs text-zinc-500">You talked to</p>
        <h2 className="mt-1 font-serif text-4xl italic text-white">Vine</h2>
        <p className="mt-1 text-sm text-zinc-500">2012 — 2017</p>

        {/* Pull quote */}
        <blockquote className="my-8 border-l-2 border-emerald-500 pl-4 italic text-white">
          "Nobody told me what was coming on that Tuesday."
        </blockquote>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "3m 24s", label: "Duration" },
            { value: "14", label: "Messages" },
            { value: "4", label: "Sources" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm bg-[#1a1a1a] px-3 py-1.5 text-xs text-zinc-400"
            >
              <span className="text-white">{stat.value}</span> · {stat.label}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-sm border border-[#222222] px-4 py-2.5 text-sm text-white transition-colors hover:border-zinc-600"
          >
            Talk again
          </button>
          <button
            type="button"
            className="flex-1 rounded-sm bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Share eulogy
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StartupPage() {
  const [view, setView] = useState<ViewState>("researching")

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Dev toggle buttons */}
      <div className="flex justify-center gap-2 border-b border-[#222222] p-4">
        {(["researching", "live", "eulogy"] as const).map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setView(state)}
            className={`rounded-sm px-3 py-1.5 text-xs capitalize transition-colors ${
              view === state
                ? "bg-white text-black"
                : "border border-[#222222] text-zinc-400 hover:text-white"
            }`}
          >
            {state}
          </button>
        ))}
      </div>

      {view === "researching" && <ResearchingState />}
      {view === "live" && <LiveState />}
      {view === "eulogy" && <EulogyState />}
    </main>
  )
}
