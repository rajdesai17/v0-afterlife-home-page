import { STARTUPS } from "@/lib/startups"
import Conversation from "@/components/Conversation"

export default async function StartupPage({
  params,
  searchParams,
}: {
  params: Promise<{ startup: string }>
  searchParams: Promise<{ name?: string; url?: string }>
}) {
  const { startup: startupId } = await params
  const { name: queryName, url: queryUrl } = await searchParams

  const found = STARTUPS.find((s) => s.id === startupId)

  const name = found?.name ?? queryName ?? startupId
  const years = found?.years ?? ""
  const url = found?.url ?? queryUrl

  const agentId = process.env.ELEVENLABS_AGENT_ID!

  return <Conversation name={name} years={years} url={url} agentId={agentId} />
}
