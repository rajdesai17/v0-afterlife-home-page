"use client"

import Link from "next/link"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-md p-1.5 transition-colors ${
          theme === "light"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Light mode"
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-md p-1.5 transition-colors ${
          theme === "system"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="System mode"
      >
        <Monitor className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-md p-1.5 transition-colors ${
          theme === "dark"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Dark mode"
      >
        <Moon className="size-4" />
      </button>
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight text-foreground">
          AFTERLIFE
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://twitter.com/rajoninternet"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Follow on X"
          >
            <XLogo className="size-4" />
          </a>
        </div>
      </div>
    </header>
  )
}
