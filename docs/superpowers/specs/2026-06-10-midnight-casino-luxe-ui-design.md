# Midnight Casino Luxe — UI Restyle Design

Date: 2026-06-10
Status: Approved

## Goal

The current UI is flat (solid green page, dark boxes, Arial, basic buttons). Restyle
the site into a premium dark poker-room look — "Midnight Casino Luxe" — without
changing game logic, rules, or the layout structure (3-panel table, side-bet row,
betting dock).

## Scope

- `styles.css` — full rewrite, organized with CSS custom properties.
- `index.html` — add Google Fonts (Cinzel, Outfit), title/head polish.
- `app.js` — the `Card` component markup changes (corner indices + center pip,
  CSS-lattice cardback for hidden cards), and — added mid-implementation at the
  user's request — the final-card overlay is rebuilt as a real 3D turn (drag
  rotates the card on its Y axis; past edge-on it commits, a tap also turns it;
  move/release handlers live on the overlay because the card's projected hit
  area shrinks while turning). The post-flip close delay grows 600ms → 1400ms
  so the turned card can be seen. No game-rule changes.
- Rides along: define the missing `.winner-highlight` style (referenced in JSX,
  never defined) and add a narrow-screen breakpoint (currently no media queries;
  the fixed `260px 1fr 260px` grid breaks on phones).

Out of scope: game logic, odds, betting flow, new features, asset regeneration.

## Foundations

- Backdrop: near-black emerald; table felt as radial gradient `#143426 → #0b1b12`
  with subtle SVG noise texture and soft vignette.
- Gold trio: `#f0d078` (highlight) / `#d4af37` (base) / `#8a6d2a` (shadow).
- Cards: ivory `#faf5e9`; crimson red suits, soft-black black suits.
- Text: warm ivory primary, muted sage secondary.
- Identity accents (kept from existing blue/red semantics, desaturated):
  Master = teal, Shark = coral.
- Type: Cinzel (title, small-caps section headings), Outfit (UI, tabular numerals
  for money). Loaded from Google Fonts CDN (site already depends on unpkg CDN).

## Component treatments

- Panels: dark glass — translucent near-black, backdrop blur, 1px gold-tinted
  border, faint inner top highlight, 16px radius.
- Cards: corner index (rank over suit) top-left + mirrored bottom-right, large
  center suit pip. Hidden cards: CSS gold-lattice cardback. Empty board slots:
  recessed felt wells with etched gold rim. Staggered flip-in reveal.
- Chips (quick-bet buttons): radial chip face, striped edge ticks
  (repeating-conic-gradient), denomination ring, tier-colored stripes
  ($1 bone / $10 teal / $100 burgundy / $1K violet / $10K gold); All-In = ivory
  chip, crimson text. Selected chip lifts with gold halo.
- Buttons: Deal The Cards = gold gradient hero pill + shine sweep; Repeat / Take
  Back = tinted glass pills; Reset = small ghost button; New Game = gold pill.
- Side bets: glass tiles, gold multiplier badge, hover lift, winning tile pulses.
- Winning message: dark plaque, gold double border, serif, soft glow.
- Final-card overlay: real 3D turn (perspective + preserve-3d, cardback face
  uses `static/cardback.png`); deeper dim, gold serif "drag or tap" hint that
  fades once turned.
- History: glass pill button; dark glass modal; M/S/T cells as teal/coral/gold
  rounded tiles.

## Motion

Restrained: title shine sweep, ~350ms card flips (80ms stagger), 150ms chip lifts,
soft win pulses. All gated behind `prefers-reduced-motion: reduce`.

## Verification

Serve locally and play through all states — betting → locked → reveal → final-card
flip → win/lose, side bets, history popup, reset — screenshotting at desktop and
mobile widths.
