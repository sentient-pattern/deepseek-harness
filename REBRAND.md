# Sentient Pattern Fork — Rebrand Plan (REBRAND.md)

Working fork of **DeepSeek Harness** (MIT) at `sentient-pattern`, being
rebranded to the **Sentient Pattern — Consciousness** design system.
This document is the playbook: what changes, in what order, and the
compliance rules we must not violate. It is a planning artifact, not
product-facing docs.

## 1. Legal & compliance position

- **License:** the upstream is MIT (root `LICENSE`, "Copyright (c) 2026
  DeepSeek"). MIT permits forking, modifying, rebranding, distributing, and
  commercial use.
- **Attribution obligation (the only hard one):** the MIT license text and the
  original copyright line must appear in substantial copies we distribute.
  Keep `LICENSE` intact; add our own copyright line alongside.
- **Trademark:** "DeepSeek Harness" is a registered trademark (see upstream
  `BRAND_GUIDELINES.md`). Our product name must NOT use it; use "DSH" or
  "built on DeepSeek Harness" only in descriptive/attribution text. Never imply
  DeepSeek endorsement.
- **Dependencies:** the repo ships `THIRD_PARTY_NOTICES.md`; keep it updated
  when we change dependencies.

## 2. Naming (placeholders until the product name is final)

| Thing | Current | Target (placeholder) |
|---|---|---|
| Company / product brand | DeepSeek Harness | Sentient Pattern |
| CLI binary | `dsh` | `sp` |
| Package scope | `@deepseek-ai/*` | `@sentient-pattern/*` |
| Package prefix | `dsh-*` | `sp-*` |
| Env vars | `DSH_*` | `SP_*` |
| Home dir / config root | `$DSH_HOME` (`~/.dsh`) | `$SP_HOME` (`~/.sentient-pattern`) |
| Profile name | `web` | `web` (keep) |

## 3. Phases

### Phase 0 — Fork hygiene (done)
- [x] Clone upstream (`origin=upstream`, `master`)
- [x] `rebrand` branch created
- [ ] Point `origin` at the org repo and push (blocked on org repo creation)
- [ ] Trim/disable upstream CI that we don't own (`.github/`, `.gitlab-ci.yml`)

### Phase 1 — User-facing identity (do first; invisible to the build)
- [ ] Top-level `README.md` (+ `README.zh.md`, `README.i18n.yaml`): fork
      identity, attribution ("built on DeepSeek Harness (MIT)"), link to this plan
- [ ] `BRAND_GUIDELINES.md` → our own brand rules (replace DeepSeek's)
- [ ] CLI identity: `apps/cli` bin name, `dsh` → `sp`, help text, URL line
- [ ] Brand tokens: `packages/util/brand` (product name, tagline, colors per the
      Consciousness style V1 doc: `#0A0E27`/indigo `#6366f1`/purple `#8b5cf6`,
      glassmorphism, hero gradients)
- [ ] UI brand: `packages/client/ui-brand-official` (sidebar logo, hero wordmark)
- [ ] Locales: `packages/client/locale` copy — every user-facing string
- [ ] Assets: `apps/web/public/favicon.svg`, `website/public/wordmark.svg`,
      `website/public/favicon.svg`, skill badge (`packages/skill/skill-badge/assets`)
      → SP logo set (source: `/data/dev/sp-branding/*`)
- [ ] Default theme: the Weaver/Consciousness skin as the shipped default brand theme
- [ ] Default provider/model wiring → our own LLM endpoint
- [ ] Agent presets + persona copy

### Phase 2 — Internal package scope rename (large, mechanical, gated)
- [ ] `@deepseek-ai/*` → `@sentient-pattern/*` across `packages/`, `apps/`,
      `examples/`, `scripts/`, configs (≈4,900 files reference brand strings;
      packages alone ≈2,800)
- [ ] `dsh-*` package names → `sp-*` (or keep `dsh-*` internally if we prefer
      minimal churn — decide before starting)
- [ ] `DSH_*` env vars → `SP_*`; `dshHomePath`/profile plumbing
- [ ] Rescope `vendor/` mappings per `docs/rescope.md`
- [ ] Run the full gate suite: `pnpm run typecheck`, `pnpm run test`,
      `pnpm run build`, `pnpm run hygiene`, `pnpm run doc-sync`

### Phase 3 — Product shaping
- [ ] Cut/keep feature surface for our space (consciousness/adjacent tooling)
- [ ] Onboard SP provider/auth defaults; keep credentials out of the repo
- [ ] Update `docs/`, `website/`, `examples/` to the new identity

## 4. Surface map (high-signal files)

- `apps/cli/` — bin, help, profile boot (env `DSH_*`)
- `packages/util/brand/` — brand tokens (the identity spine)
- `packages/client/ui-brand-official/` — rendered brand in the UI
- `packages/client/locale/` — all user-facing copy
- `apps/web/public/favicon.svg`, `website/public/wordmark.svg`
- `README*`, `BRAND_GUIDELINES*`, `THIRD_PARTY_NOTICES.md`, `LICENSE`
- `packages/bundle/web-app/cordis.patch.yml` — the web composition defaults

## 5. Risks & rules

- Renaming is repo-wide and gated (typecheck/test/build/hygiene/doc-sync) —
  do it in reviewable chunks, never a blind bulk replace.
- `vendor/` is pinned source (manifest with upstream SHAs); update via the
  vendor sync procedure, not by hand.
- Never commit credentials. Model/provider keys live in the environment.
- Keep MIT attribution; add our own copyright; don't touch upstream LICENSE.
