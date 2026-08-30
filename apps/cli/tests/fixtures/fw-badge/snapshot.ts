import { fileURLToPath } from 'node:url'
import { Context } from '@forgeweaver/cordis'
import { agentEvents, Inbox, type Agent } from '@forgeweaver/fw-agent'
import { CallId } from '@forgeweaver/fw-llm'
import { boot, loadOverlayPatches } from '@forgeweaver/fw-app-boot'
import { SessionId } from '@forgeweaver/fw-session'
import type {} from '@forgeweaver/fw-skill'
import type {} from '@forgeweaver/fw-tools'

const overlayPath = process.argv[2]
if (overlayPath === undefined) throw new Error('fw-badge snapshot requires an overlay path')
const rootConfigPath = fileURLToPath(new URL('../../../../../packages/bundle/base/tests/fixtures/root.cordis.yml', import.meta.url))
const basePatchPath = fileURLToPath(new URL('../../../../../packages/bundle/base/cordis.patch.yml', import.meta.url))
const ctx = await boot('fw-badge-snapshot', rootConfigPath, [
  ...loadOverlayPatches('fw-badge-snapshot', basePatchPath),
  ...loadOverlayPatches('fw-badge-snapshot', overlayPath),
])

try {
  const agentId = SessionId('fw-badge-snapshot')
  const session = ctx.sessions.create(agentId, { meta: { cwd: process.cwd() } })
  const agent: Agent = {
    ctx: new Context(),
    id: agentId,
    options: {},
    session,
    inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'idle',
    send: () => {},
    followup: () => {},
    steer: () => {},
    inject: () => { throw new Error('fw-badge snapshot must receive the catalog at the step boundary') },
    cancel: () => {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  const decision = await agentEvents(ctx, agent).waterfall(
    'agent/pre-step',
    { messages: [], turn: 1, step: 1, signal: new AbortController().signal },
    () => Promise.resolve({ kind: 'enter' as const, messages: [] }),
  )
  const catalog = decision.kind === 'enter'
    ? decision.messages.find(message => message.role === 'user'
      && message.source.kind === 'skill-catalog')?.content
    : undefined
  const summary = (await ctx.skills.list()).find(skill => skill.name === 'fw-badge')
  const result = await ctx.tools.execute({
    callId: CallId('fw-badge-snapshot'),
    name: 'skill',
    arguments: { name: 'fw-badge' },
    signal: new AbortController().signal,
  })
  process.stdout.write(`${JSON.stringify({ catalog: catalog ?? null, summary: summary ?? null, result })}\n`)
} finally {
  await ctx.fiber.dispose()
}
