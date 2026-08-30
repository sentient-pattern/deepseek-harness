import { describe, expect, it } from 'vitest'
import { Context } from '@forgeweaver/cordis'
import InvariantRegistry from '@forgeweaver/fw-invariants'
import * as UserIdInvariant from '@forgeweaver/fw-anonymous-user-id/invariant'

describe('invariant companion', () => {
  it('registers the package ownership with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(UserIdInvariant).await()).resolves.toBeDefined()
  })
})
