"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { STARTUPS } from "@/lib/startups"

function StartupCard({
  startup,
}: {
  startup: (typeof STARTUPS)[number]
}) {
  return (
    <Link
      href={`/${startup.id}`}
      className="group block bg-[#111111] border border-[#222222] transition-all duration-200 hover:border-[#444444] hover:scale-[1.02]"
    >
      <div
        className="h-1"
        style={{ backgroundColor: startup.accent }}
      />
      <div className="p-4">
        <h3 className="text-sm font-medium text-white">
          {startup.name}
        </h3>
        <p className="text-xs text-[#666666] mt-1">
          {startup.years}
        </p>
        <p className="text-[11px] text-[#444444] italic mt-2">
          {startup.cause}
        </p>
      </div>
    </Link>
  )
}

function Hero() {
  return (
    <section className="text-center py-24 md:py-32 px-4">
      <h1 className="font-serif italic text-[32px] md:text-[56px] leading-[1.1] tracking-tight">
        <span className="block text-white">They built. They launched.</span>
        <span className="block text-[#888888]">They died.</span>
      </h1>
      <p className="text-[#555555] text-base md:text-lg mt-8">
        Now they talk.
      </p>
    </section>
  )
}

function StartupGrid() {
  return (
    <section className="px-4 md:px-8 pb-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#333333] mb-6">
        Famous Failures
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STARTUPS.map((startup) => (
          <StartupCard key={startup.id} startup={startup} />
        ))}
      </div>
    </section>
  )
}

function CustomInput() {
  const router = useRouter()
  const [startupName, setStartupName] = useState("")
  const [wikiUrl, setWikiUrl] = useState("")

  function handleGo() {
    if (!startupName.trim()) return
    const slug = startupName.trim().toLowerCase().replace(/\s+/g, "-")
    const params = new URLSearchParams({ name: startupName.trim() })
    if (wikiUrl.trim()) params.set("url", wikiUrl.trim())
    router.push(`/${encodeURIComponent(slug)}?${params.toString()}`)
  }

  return (
    <section className="border-t border-[#1a1a1a] px-4 md:px-8 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Type any startup name..."
            value={startupName}
            onChange={(e) => setStartupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="flex-1 bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-white placeholder:text-[#444444] focus:outline-none focus:border-[#333333]"
          />
          <input
            type="text"
            placeholder="Or paste a Wikipedia URL (optional)"
            value={wikiUrl}
            onChange={(e) => setWikiUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="flex-1 bg-[#111111] border border-[#222222] px-4 py-3 text-sm text-white placeholder:text-[#444444] focus:outline-none focus:border-[#333333]"
          />
        </div>
        <button
          type="button"
          onClick={handleGo}
          className="mt-4 bg-white text-black px-6 py-3 text-sm font-medium rounded-[2px] hover:bg-[#e5e5e5] transition-colors"
        >
          {"Talk to them →"}
        </button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="text-center py-12 px-4">
      <p className="text-[11px] text-[#333333]">
        {"Built for #ElevenHacks 2025 · Firecrawl × ElevenLabs"}
      </p>
    </footer>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Hero />
      <StartupGrid />
      <CustomInput />
      <Footer />
    </main>
  )
}
