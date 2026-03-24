"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { STARTUPS } from "@/lib/startups"

function StartupCard({ startup }: { startup: (typeof STARTUPS)[number] }) {
  return (
    <Link
      href={`/${startup.id}`}
      className="group relative block overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-muted-foreground/30 hover:bg-surface-hover"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-sans text-sm font-medium text-foreground">
              {startup.name}
            </h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {startup.years}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-ghost opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {startup.cause}
        </p>
      </div>
    </Link>
  )
}

function SummonSection() {
  const router = useRouter()
  const [startupName, setStartupName] = useState("")
  const [wikiUrl, setWikiUrl] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  function handleGo() {
    if (!startupName.trim()) return
    const slug = startupName.trim().toLowerCase().replace(/\s+/g, "-")
    const params = new URLSearchParams({ name: startupName.trim() })
    if (wikiUrl.trim()) params.set("url", wikiUrl.trim())
    router.push(`/${encodeURIComponent(slug)}?${params.toString()}`)
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4">
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Type any startup name..."
            value={startupName}
            onChange={(e) => setStartupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="h-14 w-full rounded-lg border border-border bg-card px-4 pr-28 font-sans text-base text-foreground placeholder:text-muted-foreground focus:border-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-muted-foreground/20 transition-all"
          />
          <button
            type="button"
            onClick={handleGo}
            disabled={!startupName.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-5 py-2 font-sans text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Summon
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={`size-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
          Have a Wikipedia URL?
        </button>

        {showAdvanced && (
          <input
            type="text"
            placeholder="Paste Wikipedia URL (optional)"
            value={wikiUrl}
            onChange={(e) => setWikiUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="h-12 w-full rounded-lg border border-border bg-card px-4 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-muted-foreground/20 transition-all"
          />
        )}
      </div>
    </section>
  )
}

function Hero() {
  return (
    <section className="flex flex-col items-center px-4 pt-20 pb-12 md:pt-32 md:pb-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        Talk to dead startups
      </p>
      <h1 className="mt-6 text-center font-serif text-[2.5rem] leading-[1.1] tracking-tight md:text-[4rem]">
        <span className="block text-foreground italic">They built. They launched.</span>
        <span className="block text-muted-foreground italic">They died.</span>
      </h1>
      <p className="mt-6 max-w-md text-center text-base text-muted-foreground leading-relaxed">
        Summon the spirit of any failed startup and hear their story in their own voice.
      </p>
    </section>
  )
}

function GraveyardGrid() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20">
      <div className="mb-8 flex items-center gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          The Graveyard
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STARTUPS.map((startup) => (
          <StartupCard key={startup.id} startup={startup} />
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <p className="font-mono text-[11px] text-muted-foreground">
          Built for #ElevenHacks 2025
        </p>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-muted-foreground">
            Firecrawl
          </span>
          <span className="text-ghost">×</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            ElevenLabs
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Hero />
      <SummonSection />
      <GraveyardGrid />
      <div className="flex-1" />
      <Footer />
    </main>
  )
}
