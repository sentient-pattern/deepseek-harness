import { Context } from '@forgeweaver/cordis'
import type { Agent } from '@forgeweaver/fw-agent'
import AgentLoop from '@forgeweaver/fw-agent-loop'
import { mountAgentLoopTestDependencies } from '@forgeweaver/fw-agent-loop-testkit'
import LocalFileSystem from '@forgeweaver/fw-fs-local'
import * as FsPolicy from '@forgeweaver/fw-fs-observation-policy'
import * as ToolFs from '@forgeweaver/fw-tool-fs'
import * as LlmForgeWeaver from '@forgeweaver/fw-llm-forgeweaver'

/**
 * Build the real fs-tool stack for with-key e2e tests. Agents have no session
 * cwd, so `fsCwd` is their workspace; `persona` configures the deployment prompt.
 * This helper lives outside the e2e glob so imports do not register tests.
 */
export async function fsHarness(fsCwd: string, persona = ''): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx, { systemPrompt: { persona } })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(LlmForgeWeaver)
  await ctx.plugin(LocalFileSystem, { cwd: fsCwd })
  await ctx.plugin(FsPolicy)
  await ctx.plugin(ToolFs)
  return ctx
}

export function waitForIdle(ctx: Context, agent: Agent): Promise<void> {
  return new Promise((resolve) => {
    const dispose = ctx.on('agent/status', ({ agent: subject, status }) => {
      if (subject === agent && status === 'idle') {
        dispose()
        resolve()
      }
    })
  })
}
