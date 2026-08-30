# ForgeWeaver Logo — Delivery Spec & Insertion Map

The brand mark lives in two forms: a **square logo mark** (icon) and a **wide
wordmark lockup** (mark + "ForgeWeaver" name). Deliver the master as **SVG**
(vector) — everything else derives from it.

## Recommended dimensions (deliver these)

| Asset | Format | Size |
|---|---|---|
| Master | SVG | design on a 512×512 artboard (vector, scales infinitely) |
| Favicon | SVG + PNG | 32×32 (plus 16×16 and 48×48 for legacy browsers) |
| App / PWA icon | PNG | 512×512 and 192×192 |
| UI logo mark | SVG (inline React) | square, designed at 64×64, renders 16px–512px |
| Wordmark lockup | SVG | wide viewBox (e.g. 640×160), mark + name side by side |
| Crest / detail | PNG | as supplied (crest.png works for hero/print) |

Your existing `sp-branding/` set (50/100/150/200, transparent, crest) is a
good raster base; the SVG master is the missing piece.

## Insertion points in the repo (replace these files)

1. `apps/web/public/favicon.svg` — the web app favicon.
2. `website/public/favicon.svg` — the website favicon.
3. `website/public/wordmark.svg` — the website wordmark.
4. `packages/client/ui-primitives/src/FishLogo.tsx` — the in-UI logo mark.
   Keep the component's props (`size`, `className`); replace only the inner SVG.
5. `packages/client/ui-primitives/src/BrandWordmark.tsx` — the in-UI name
   artwork. Keep `includeMark`; replace the inner SVG.
6. `packages/skill/skill-badge/assets/dsh-badge.png` — skill badge (rename to
   `fw-badge.png` and update its consumer when the asset lands).

The primitives components render inline SVG (no file import), so dropping the
ForgeWeaver path data into the JSX keeps every consumer working unchanged.
