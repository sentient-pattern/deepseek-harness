import { describe, expect, it } from 'vitest'
import { Context } from '@forgeweaver/cordis'
import type { Agent } from '@forgeweaver/fw-agent'
import * as AgentInvariant from '@forgeweaver/fw-agent/invariant'
import { scopeTarget } from '@forgeweaver/fw-scope'
import InvariantRegistry from '@forgeweaver/fw-invariants'

async function setup(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(AgentInvariant)
  return ctx
}

function mockAgent(id: string): Agent {
  return { id } as unknown as Agent
}

describe('agent status invariants', () => {
  it('accepts lifecycle transitions between idle and running', async () => {
    const ctx = await setup()
    const agent = mockAgent('a1')
    expect(() => {
      ctx.emit(scopeTarget(agent, agent), 'agent/status', { agent, status: 'idle' })
      ctx.emit(scopeTarget(agent, agent), 'agent/status', { agent, status: 'running' })
      ctx.emit(scopeTarget(agent, agent), 'agent/status', { agent, status: 'idle' })
    }).not.toThrow()
  })

  it('rejects a no-op transition', async () => {
    const ctx = await setup()
    const agent = mockAgent('a3')
    ctx.emit(scopeTarget(agent, agent), 'agent/status', { agent, status: 'running' })
    expect(() => { ctx.emit(scopeTarget(agent, agent), 'agent/status', { agent, status: 'running' }) })
      .toThrow(/no-op transition/)
  })

  it('tracks agents independently', async () => {
    const ctx = await setup()
    const a = mockAgent('a5')
    const b = mockAgent('b5')
    ctx.emit(scopeTarget(a, a), 'agent/status', { agent: a, status: 'running' })
    expect(() => { ctx.emit(scopeTarget(b, b), 'agent/status', { agent: b, status: 'running' }) }).not.toThrow()
  })
})
