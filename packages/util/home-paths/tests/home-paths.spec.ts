import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_FW_HOME_DISPLAY,
  FW_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultDshHome,
  fwHomeDisplay,
  fwHomePath,
  expandHomePath,
  resolveDshHome,
} from '@forgeweaver/fw-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('fw path helpers', () => {
  it('owns the shared default DSH home directory name', () => {
    expect(FW_HOME_DIR_NAME).toBe('.fw')
    expect(DEFAULT_FW_HOME_DISPLAY).toBe('~/.fw')
    expect(defaultDshHome()).toBe(join(homedir(), '.fw'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.fw')).toBe(join(homedir(), '.fw'))
    expect(expandHomePath('~\\.fw')).toBe(join(homedir(), '.fw'))
    expect(expandHomePath('/tmp/.fw')).toBe('/tmp/.fw')
    expect(expandHomePath('~other/.fw')).toBe('~other/.fw')
  })

  it('resolves explicit path before FW_HOME and the default', () => {
    const envHome = join(homedir(), 'env-fw')

    expect(resolveDshHome('/tmp/explicit-fw', { FW_HOME: '~/env-fw' })).toBe(resolve('/tmp/explicit-fw'))
    expect(resolveDshHome(undefined, { FW_HOME: '~/env-fw' })).toBe(envHome)
    expect(resolveDshHome(undefined, {})).toBe(defaultDshHome())
  })

  it('treats an empty or whitespace-only FW_HOME as unset', () => {
    expect(resolveDshHome(undefined, { FW_HOME: '' })).toBe(defaultDshHome())
    expect(resolveDshHome(undefined, { FW_HOME: '   ' })).toBe(defaultDshHome())
  })

  it('joins child segments onto the resolved FW_HOME', () => {
    vi.stubEnv('FW_HOME', '~/env-fw')
    expect(fwHomePath()).toBe(join(homedir(), 'env-fw'))
    expect(fwHomePath('storages', 'cache')).toBe(join(homedir(), 'env-fw', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(fwHomeDisplay(resolve(defaultDshHome()))).toBe('~/.fw')
    expect(fwHomeDisplay('/some/other/root')).toBe('$FW_HOME')
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fw-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
