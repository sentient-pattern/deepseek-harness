import { staticLinked } from '../tsdown.client.ts'

export default staticLinked(
  '@forgeweaver/fw-client-web',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
