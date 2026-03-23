export interface Startup {
  id: string
  name: string
  years: string
  cause: string
  accent: string
  url?: string
}

export const STARTUPS: Startup[] = [
  {
    id: "vine",
    name: "Vine",
    years: "2012 — 2017",
    cause: "Twitter pulled the plug",
    accent: "#00B488",
    url: "https://en.wikipedia.org/wiki/Vine_(service)",
  },
  {
    id: "quibi",
    name: "Quibi",
    years: "2020 — 2020",
    cause: "$1.75B in 6 months",
    accent: "#FF6B00",
    url: "https://en.wikipedia.org/wiki/Quibi",
  },
  {
    id: "google-plus",
    name: "Google+",
    years: "2011 — 2019",
    cause: "Nobody actually used it",
    accent: "#4285F4",
    url: "https://en.wikipedia.org/wiki/Google%2B",
  },
  {
    id: "clubhouse",
    name: "Clubhouse",
    years: "2020 — 2023",
    cause: "The world went back outside",
    accent: "#C8C4B4",
    url: "https://en.wikipedia.org/wiki/Clubhouse_(app)",
  },
  {
    id: "juicero",
    name: "Juicero",
    years: "2016 — 2017",
    cause: "You could just squeeze the bag",
    accent: "#FF4500",
    url: "https://en.wikipedia.org/wiki/Juicero",
  },
  {
    id: "myspace",
    name: "Myspace",
    years: "2003 — 2011",
    cause: "Facebook showed up",
    accent: "#003399",
    url: "https://en.wikipedia.org/wiki/Myspace",
  },
  {
    id: "yik-yak",
    name: "Yik Yak",
    years: "2013 — 2017",
    cause: "Died twice",
    accent: "#FF6600",
    url: "https://en.wikipedia.org/wiki/Yik_Yak",
  },
  {
    id: "path",
    name: "Path",
    years: "2010 — 2018",
    cause: "Almost worked. Almost.",
    accent: "#E8334A",
    url: "https://en.wikipedia.org/wiki/Path_(social_network)",
  },
]

export function findStartup(id: string): Startup | undefined {
  return STARTUPS.find((s) => s.id === id)
}
