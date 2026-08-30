/** ForgeWeaver Files API identifiers. @module fw-llm-forgeweaver/file-id */

import type { Branded } from '@forgeweaver/fw-brand'

/** Opaque identifier returned by the ForgeWeaver Files API. */
export type ForgeWeaverFileId = Branded<'ForgeWeaverFileId'>

/**
 * Brand a provider-returned file identifier after wire validation.
 * @param id - non-empty Files API identifier.
 * @returns the same string with its provider identity attached at type level.
 */
export function ForgeWeaverFileId(id: string): ForgeWeaverFileId {
  return id as ForgeWeaverFileId
}

/** Non-secret digest identifying one endpoint and API-key file namespace. */
export type ForgeWeaverFileScope = Branded<'ForgeWeaverFileScope'>

/**
 * Brand a locally derived namespace digest.
 * @param scope - SHA-256 digest of endpoint and API key.
 * @returns the same string with namespace identity attached at type level.
 */
export function ForgeWeaverFileScope(scope: string): ForgeWeaverFileScope {
  return scope as ForgeWeaverFileScope
}
