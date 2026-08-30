import { describe, expect, it } from 'vitest'
import {
  ForgeWeaverSearchProvider,
  FORGEWEAVER_DEFAULT_API_VERSION,
  FORGEWEAVER_DEFAULT_BASE_URL,
  FORGEWEAVER_DEFAULT_MAX_TOKENS,
  FORGEWEAVER_DEFAULT_MAX_USES,
  FORGEWEAVER_DEFAULT_MODEL,
} from '@forgeweaver/fw-web-search-forgeweaver'

/** Construct the provider over a fixed options value; production passes a live thunk. */
import type { ForgeWeaverSearchProviderOptions } from '@forgeweaver/fw-web-search-forgeweaver'

const searchProvider = (options: ForgeWeaverSearchProviderOptions): ForgeWeaverSearchProvider =>
  new ForgeWeaverSearchProvider(() => options)

/**
 * Disabled real-API probe for the ForgeWeaver search provider. The live endpoint
 * can complete without structured source blocks, so this is not a reliable
 * merge signal. Its body remains because mocks cannot confirm the wire shape.
 */
const apiKey = process.env.FORGEWEAVER_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('ForgeWeaverSearchProvider real API', () => {
  it.skip('returns citeable sources for a live query via native web_search', async () => {
    const provider = searchProvider({
      apiKey: apiKey!,
      baseURL: process.env.FORGEWEAVER_SEARCH_BASE_URL ?? FORGEWEAVER_DEFAULT_BASE_URL,
      model: process.env.FORGEWEAVER_SEARCH_MODEL ?? FORGEWEAVER_DEFAULT_MODEL,
      apiVersion: FORGEWEAVER_DEFAULT_API_VERSION,
      maxTokens: FORGEWEAVER_DEFAULT_MAX_TOKENS,
      maxUses: FORGEWEAVER_DEFAULT_MAX_USES,
    })
    const result = await provider.search({ query: 'What is ForgeWeaver?', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//)
  }, 60_000)
})
