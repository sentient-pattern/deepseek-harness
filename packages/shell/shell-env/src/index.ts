/**
 * Tool-independent shell environment plugin: owns the `ctx.shellEnv` registry of
 * trusted, per-execution `FW_*` variables consumed by the model-facing shell
 * tools (`fw-tool-bash`, `fw-tool-pwsh`). Built-in shell facts are owned by
 * the registry itself while plugins can register additional, enumerable facts
 * with effect-scoped disposal.
 *
 * @module @forgeweaver/fw-shell-env
 */

import { Service, type Context } from '@forgeweaver/cordis'
import z from '@forgeweaver/schemastery'
import { FW_ENV_PREFIX } from '@forgeweaver/fw-shell'
import type { DshEnvironment, DshEnvironmentKey } from '@forgeweaver/fw-shell'
import { FW_HOME_ENV, resolveDshHome } from '@forgeweaver/fw-home-paths'
import type { ToolExecution } from '@forgeweaver/fw-tools'
import type {} from '@forgeweaver/fw-session-persistence'

declare module '@forgeweaver/cordis' {
  interface Context {
    shellEnv: ShellEnvRegistry
  }
}

export const name = 'shell-env'
export const inject: string[] = []

/** Plugin config (all optional — the built-in facts resolve without defaults). */
export interface Config {
  /** ForgeWeaver home directory exposed as `FW_HOME`; defaults to `$FW_HOME` or `~/.fw`. */
  fwHome?: string
}

/** Runtime configuration schema for the shell-env plugin. */
export const Config: z<Config> = z.object({
  fwHome: z.string(),
})

/** Model-visible metadata for one managed `FW_*` environment variable. */
export interface BashEnvVariable {
  /** Concise description of the environment fact represented by the variable. */
  description: string
}

/**
 * A plugin contribution to the managed environment of each model shell call.
 * Declared keys make ownership conflicts detectable before the first command;
 * `resolve` computes only the values available for the current execution.
 */
export interface BashEnvContributor {
  /** Stable contributor name used in diagnostics and duplicate detection. */
  name: string
  /** Complete set of `FW_*` keys this contributor may return. */
  variables: Readonly<Record<DshEnvironmentKey, BashEnvVariable>>
  /**
   * Resolve this contributor's available values for one tool execution.
   * @param execution - the shell tool execution and its optional calling agent.
   * @returns a partial map containing only keys declared in {@link variables}.
   */
  resolve(execution: ToolExecution): Readonly<Partial<Record<DshEnvironmentKey, string>>>
}

/** An enumerable declaration returned by {@link ShellEnvRegistry.list}. */
export interface BashEnvVariableInfo extends BashEnvVariable {
  /** Contributor that owns the variable. */
  contributor: string
  /** Declared `FW_*` environment variable name. */
  key: DshEnvironmentKey
}

const FW_SHELL_KEY = `${FW_ENV_PREFIX}SHELL` as const
const FW_SESSION_ID_KEY = `${FW_ENV_PREFIX}SESSION_ID` as const
const FW_SESSION_JSONL_KEY = `${FW_ENV_PREFIX}SESSION_JSONL` as const
const RESERVED_BASH_ENV_KEYS = new Set<DshEnvironmentKey>([
  FW_HOME_ENV,
  FW_SHELL_KEY,
  FW_SESSION_ID_KEY,
])
const BASH_ENV_KEY_SUFFIX = /^[A-Z][A-Z0-9_]*$/

/**
 * Registry (`ctx.shellEnv`) for trusted, per-execution `FW_*` variables.
 * The namespace is rebuilt for every model shell call: ambient `FW_*` values
 * are discarded by the executor, then the registry's current snapshot is
 * injected. Built-in shell facts remain owned by the registry itself while
 * plugins can register additional, enumerable facts with effect-scoped
 * disposal.
 */
export class ShellEnvRegistry extends Service {
  private readonly contributors = new Map<string, BashEnvContributor>()
  private readonly keyOwners = new Map<DshEnvironmentKey, string>()
  private readonly fwHome: string

  /**
   * Create and install the `ctx.shellEnv` service.
   * @param ctx - Cordis context that owns the service and registrations.
   * @param config - home-directory configuration for the built-in variables.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'shellEnv')
    this.fwHome = resolveDshHome(config.fwHome)
  }

  /**
   * Register one environment contributor. Names and keys are unique; built-in
   * keys are reserved. Registration is disposed with the calling plugin fiber.
   * @param contributor - declared key ownership and per-execution resolver.
   * @returns the disposer that unregisters the contribution.
   */
  register(contributor: BashEnvContributor): () => void {
    const dispose = this.ctx.effect(function* (this: ShellEnvRegistry) {
      if (contributor.name.trim().length === 0) {
        throw new Error('bash env contributor name must be non-empty')
      }
      if (this.contributors.has(contributor.name)) {
        throw new Error(`bash env contributor "${contributor.name}" is already registered`)
      }

      const variables = Object.entries(contributor.variables) as [DshEnvironmentKey, BashEnvVariable][]
      for (const [key, variable] of variables) {
        if (!key.startsWith(FW_ENV_PREFIX)
          || !BASH_ENV_KEY_SUFFIX.test(key.slice(FW_ENV_PREFIX.length))) {
          throw new Error(`bash env contributor "${contributor.name}" declared invalid key "${key}"`)
        }
        if (RESERVED_BASH_ENV_KEYS.has(key)) {
          throw new Error(`bash env contributor "${contributor.name}" cannot own reserved key "${key}"`)
        }
        if (variable.description.trim().length === 0) {
          throw new Error(`bash env contributor "${contributor.name}" must describe "${key}"`)
        }
        const owner = this.keyOwners.get(key)
        if (owner !== undefined) {
          throw new Error(`bash env key "${key}" is already owned by contributor "${owner}"; contributor "${contributor.name}" cannot also own it`)
        }
      }

      this.contributors.set(contributor.name, contributor)
      for (const [key] of variables) this.keyOwners.set(key, contributor.name)
      yield () => {
        this.contributors.delete(contributor.name)
        for (const [key] of variables) this.keyOwners.delete(key)
      }
    }.bind(this), 'bashEnv.register()')
    return () => void dispose()
  }

  /**
   * Build the trusted `FW_*` snapshot for one shell tool execution.
   * @param execution - the current tool execution.
   * @returns an immutable environment overlay containing built-ins and current contributions.
   */
  collect(execution: ToolExecution): DshEnvironment {
    const values: Record<DshEnvironmentKey, string> = {
      [FW_HOME_ENV]: this.fwHome,
      [FW_SHELL_KEY]: '1',
    }
    if (execution.agent !== undefined) {
      values[FW_SESSION_ID_KEY] = execution.agent.session.header.id
    }

    for (const contributor of [...this.contributors.values()].sort((left, right) => left.name.localeCompare(right.name))) {
      const resolved = contributor.resolve(execution)
      for (const [rawKey, value] of Object.entries(resolved)) {
        const key = rawKey as DshEnvironmentKey
        if (!Object.hasOwn(contributor.variables, key)) {
          throw new Error(`bash env contributor "${contributor.name}" returned undeclared key "${key}"`)
        }
        if (typeof value !== 'string') {
          throw new Error(`bash env contributor "${contributor.name}" returned a non-string value for "${key}"`)
        }
        values[key] = value
      }
    }

    return Object.freeze(Object.fromEntries(Object.entries(values).sort(([left], [right]) => left.localeCompare(right))))
  }

  // TODO(bash-env-list-builtins): Include registry-owned built-ins before diagnostics,
  // prompt, or UI code treats list() as an exhaustive environment catalog.
  /**
   * Enumerate plugin-contributed variables without executing their resolvers.
   * @returns declarations sorted by environment variable name.
   */
  list(): BashEnvVariableInfo[] {
    return [...this.contributors.values()]
      .flatMap(contributor => Object.entries(contributor.variables).map(([key, variable]) => ({
        contributor: contributor.name,
        description: variable.description,
        key: key as DshEnvironmentKey,
      })))
      .sort((left, right) => left.key.localeCompare(right.key))
  }
}

/**
 * Load the shell-env plugin: register the `ctx.shellEnv` service and the
 * shell-agnostic persistence contributor (`FW_SESSION_JSONL`).
 * @param ctx - Cordis context that owns the service and registrations.
 * @param config - home-directory configuration for the built-in variables.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const registry = new ShellEnvRegistry(ctx, config)
  registry.register({
    name: 'session-persistence',
    variables: {
      [FW_SESSION_JSONL_KEY]: {
        description: 'Absolute target path of the current session JSONL when the active persistence backend provides one.',
      },
    },
    resolve(execution) {
      const agent = execution.agent
      if (agent === undefined) return {}
      const location = ctx.get('sessionPersistence')?.locate(agent.session.header)
      return location?.kind === 'jsonl' ? { [FW_SESSION_JSONL_KEY]: location.path } : {}
    },
  })
}
