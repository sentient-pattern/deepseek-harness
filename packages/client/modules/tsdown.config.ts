import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@forgeweaver/fw-client-modules',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
