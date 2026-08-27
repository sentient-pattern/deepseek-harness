# Brand configuration (config-driven rebrand)

`brand.yaml` is the **single source of truth** for the fork's identity: product
name, CLI name, package-scope targets, env-var prefix, the Consciousness
palette, gradients, text tokens, and default provider/model.

## Rebrand workflow

1. Edit `brand.yaml`.
2. Regenerate the typed constants:

   ```sh
   node scripts/generate-brand.mjs
   ```

3. Rebuild the affected consumers (`pnpm run build`).

The generator emits:

- `brand/brand.config.ts` — typed, frozen constants (`brand`, `BrandConfig`,
  default export) that code imports instead of hardcoded brand strings.
- `brand/brand.config.json` — the same values for scripts/docs.

**Never edit the generated files by hand** — edit `brand.yaml` and regenerate.

## Pointer wiring status

| Brand pointer | Location | Status |
|---|---|---|
| Identity constants | `brand/brand.config.ts` | ✅ generated from YAML |
| Theme palette | `packages/client/ui-theme/src/styles/design-platform.css` | ⏳ generate CSS from YAML |
| UI copy (product name) | `packages/client/locale` | ⏳ interpolate from config |
| CLI name/help | `apps/cli` | ⏳ read config |
| Env prefix (`DSH_*`) | launch/shell env plumbing | ⏳ Phase 2 rename, YAML-driven |
| Package scope (`@deepseek-ai`) | npm manifests | ⏳ Phase 2 rename, YAML-driven |
