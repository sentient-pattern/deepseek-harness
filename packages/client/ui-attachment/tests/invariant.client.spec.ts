import { describe, expect, it } from 'vitest'
import { Context } from '@forgeweaver/cordis'
import * as AttachmentInvariant from '@forgeweaver/fw-client-ui-attachment/invariant'
import InvariantRegistry from '@forgeweaver/fw-invariants'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(AttachmentInvariant).await()).resolves.toBeDefined()
  })
})
