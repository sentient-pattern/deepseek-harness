/** Experimental-package publication and dependency constraints. */

import { describe, expect, it } from 'vitest'
import {
  checkExperimentalDependencyIsolation,
  checkExperimentalManifest,
  type WorkspaceManifest,
} from './check-workspace-constraints.ts'

const experimental: WorkspaceManifest = {
  dir: 'packages/experimental/prototype',
  manifest: { name: '@forgeweaver/fw-experimental-prototype', private: true },
}

describe('experimental workspace constraints', () => {
  it('requires the experimental package-name prefix', () => {
    expect(checkExperimentalManifest({
      ...experimental,
      manifest: { ...experimental.manifest, name: '@forgeweaver/fw-prototype' },
    })).toEqual([
      '@forgeweaver/fw-prototype: experimental package name must start with "@forgeweaver/fw-experimental-"',
    ])
  })

  it('requires private manifests without publication metadata', () => {
    expect(checkExperimentalManifest(experimental)).toEqual([])
    expect(checkExperimentalManifest({
      ...experimental,
      manifest: { ...experimental.manifest, private: false, publishConfig: { access: 'public' } },
    })).toEqual([
      '@forgeweaver/fw-experimental-prototype: experimental package must set "private": true',
      '@forgeweaver/fw-experimental-prototype: experimental package must omit publishConfig',
    ])
  })

  it.each(['dependencies', 'optionalDependencies', 'peerDependencies'] as const)(
    'rejects release %s on an experimental package',
    (section) => {
      expect(checkExperimentalDependencyIsolation([experimental, {
        dir: 'packages/core/consumer',
        manifest: {
          name: '@forgeweaver/fw-consumer',
          [section]: { '@forgeweaver/fw-experimental-prototype': 'workspace:^' },
        },
      }])).toEqual([
        `@forgeweaver/fw-consumer: ${section}.@forgeweaver/fw-experimental-prototype must not reference an experimental package`,
      ])
    },
  )

  it('allows development and experimental consumers but rejects the Python release runtime', () => {
    const manifests: WorkspaceManifest[] = [experimental, {
      dir: 'packages/core/test-only',
      manifest: {
        name: '@forgeweaver/fw-test-only',
        devDependencies: { '@forgeweaver/fw-experimental-prototype': 'workspace:^' },
      },
    }, {
      dir: 'packages/experimental/consumer',
      manifest: {
        name: '@forgeweaver/fw-experimental-consumer',
        dependencies: { '@forgeweaver/fw-experimental-prototype': 'workspace:^' },
      },
    }, {
      dir: 'python/sdk-runtime',
      manifest: {
        name: '@forgeweaver/fw-python-runtime',
        dependencies: { '@forgeweaver/fw-experimental-prototype': 'workspace:^' },
      },
    }]

    expect(checkExperimentalDependencyIsolation(manifests)).toEqual([
      '@forgeweaver/fw-python-runtime: dependencies.@forgeweaver/fw-experimental-prototype must not reference an experimental package',
    ])
  })
})
