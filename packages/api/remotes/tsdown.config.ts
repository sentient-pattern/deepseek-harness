import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@forgeweaver/fw-api-remotes',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { hostPhase: true },
)
