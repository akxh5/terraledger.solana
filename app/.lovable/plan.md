

## Plan: Elevate the Rest of the Site to Match the Hero

The hero is rich and "alive" — but the sections below it, the Login page, the Dashboard, and the 404 page all feel flatter in comparison. This plan brings the same emerald glow, ambient motion, and liquid-glass polish to the rest of the app — without touching any business logic, hooks, or APIs.

### What changes (visual upgrades only)

**1. Landing sections (Problem / System / Activity / Solution / CTA)**

These currently sit on flat backgrounds with simple cards. We'll layer in subtle ambient motion so scrolling feels continuous with the hero — never competing with it.

- **Section ambient backdrop**: a new lightweight `<SectionAmbient />` component with a single drifting emerald orb + faint masked grid, anchored per section with low opacity (~10–15%). No WebGL, no canvas — pure CSS + framer-motion so it stays cheap.
- **Problem cards**: add tilted glow on hover (cursor-tracked emerald spotlight inside the card via CSS variable + `mousemove`), animated icon ring that pulses once on view.
- **System cards**: connect the 4 cards with a faint dashed line on `lg+` (decorative SVG behind the grid) to imply a flowing pipeline; cards stagger-rise on scroll.
- **Activity (Live Feed)**: add a subtle scanning gradient that sweeps top→bottom every ~6s; new tx rows get a brief emerald flash highlight on enter.
- **Solution block**: replace static gradient with a slow conic-gradient rotation behind the glass card; add a thin animated emerald border (gradient stroke moving around the card).
- **CTA section**: animated starfield-style emerald particles (small, ~30 dots, CSS keyframes only) drifting upward behind the heading; primary button gets a soft pulsing halo.

**2. Footer**

- Add a thin emerald gradient line above the border (animated shimmer, very subtle).
- Group links cleanly with hover underline grow (reuse `.story-link` pattern).
- Small social icon row (GitHub, X, Discord — lucide icons) with the same hover pill highlight as navbar.

**3. Login page**

- Replace the two static blurred orbs with a stripped-down version of the hero `NetworkBackground` (nodes + connections only, no packets, lower density ~25 nodes, fixed opacity ~40%) so the auth page feels part of the same world.
- Login card: animated emerald gradient border (same technique as Solution card), liquid-glass intensified.
- Method-select buttons: add directional arrow that slides in on hover, icon scales up 1.1.
- Form inputs: focus state gets emerald glow ring (`focus:shadow-[0_0_0_3px_hsl(160_100%_45%/0.15)]`).
- Sign In button: same hover halo as the hero CTA.

**4. Dashboard**

- **Top bar**: apply the same scrolled frosted-glass treatment as the navbar; logo gets a tiny emerald pulse dot.
- **Stat cards**: add animated count-up on mount (numbers tick from 0 → value over ~1.2s using framer-motion); sparkline mini-chart (pure SVG, 12 random points, emerald stroke) in the top-right of each card.
- **Activity table**: row hover gets emerald left-border accent that slides in; "Type" badges get a subtle pulse for new entries; add a faint zebra striping using `bg-secondary/10`.
- **Background**: add a single low-opacity drifting orb behind `<main>` to break the flatness without distracting from data.
- **Sidebar nav buttons**: active item gets the same liquid-glass pill treatment as the navbar center pill.

**5. 404 (NotFound)**

Currently a plain centered text on muted background — completely off-brand. Rebuild it:

- Same dark background + `<NetworkBackground />` (full version).
- Big italic gradient "404" using `font-serif-italic text-gradient-primary`.
- Glitch effect on the "404" (CSS `clip-path` keyframes, runs once every ~5s).
- Glass card with "Page not found" + "Return Home" button (same style as hero CTA) + a secondary "Launch Dashboard" link.
- Suggested links list ("Maybe you were looking for…") with hover pill highlight.

### Layer stack for sections (consistent with hero)

```text
┌─────────────────────────────────┐
│ Section ambient (orb + grid)    │ ← back, opacity ~12%
│ Card layer (liquid-glass)       │ ← interactive content
│ Section vignette (top + bottom) │ ← blends into next section
└─────────────────────────────────┘
```

Each section will end with a soft fade into the next so the page reads as one continuous surface, not stacked blocks.

### Performance & accessibility

- All new ambient effects respect `prefers-reduced-motion` — they collapse to static low-opacity backgrounds.
- No new heavy libraries. Reuse existing `framer-motion`, `lucide-react`, and the canvas/Three setup already in `NetworkBackground`.
- Decorative layers are `aria-hidden` and `pointer-events-none`.
- The Login `NetworkBackground` runs at reduced node count for lower GPU cost since it's a static page, not a hero.

### Strict logic preservation (per project memory)

- No changes to forms, auth flow, mode-switching state, table data, hooks, routes, or any prop/event handler.
- Only JSX wrappers, classNames, decorative siblings, and a few new presentational components are added.

### Files

**New components**
- `src/components/SectionAmbient.tsx` — reusable per-section backdrop (orb + grid).
- `src/components/AnimatedBorder.tsx` — gradient-stroke border for Solution / Login / 404 cards.
- `src/components/Sparkline.tsx` — tiny SVG chart for dashboard stat cards.
- `src/components/CountUp.tsx` — framer-motion number tween for dashboard stats.
- `src/components/AmbientParticles.tsx` — CSS-keyframe particles for the CTA section.

**Edited components/pages**
- `src/components/ProblemSection.tsx`
- `src/components/SystemSection.tsx`
- `src/components/ActivitySection.tsx`
- `src/components/SolutionSection.tsx`
- `src/components/CTASection.tsx`
- `src/components/Footer.tsx`
- `src/pages/Login.tsx` (UI only — auth state untouched)
- `src/pages/Dashboard.tsx` (UI only — table data untouched)
- `src/pages/NotFound.tsx` (full visual rebuild, route logic preserved)
- `src/index.css` — add a few keyframes (border-spin, scan-sweep, glitch, particle-float) and utility classes.

