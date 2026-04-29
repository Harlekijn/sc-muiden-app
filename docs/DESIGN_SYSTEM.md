# SC Muiden Design System

SC Muiden (Sportclub Muiden) is a local football club based in Muiden, North Holland, Netherlands. The design system is friendly, accessible, energetic, and grounded in local pride — serving players, parents, volunteers, and supporters across all ages.

---

## Products

| Product | Description | Path |
|---|---|---|
| Mobile App | Club app for schedules, match results, team news, registration | `ui_kits/app/` |
| Club Website | Public-facing site: schedules, news, team pages, sponsors | `ui_kits/website/` |

---

## Content & Voice

- **Language:** Dutch-first. All UI copy in Dutch. No mixed-language strings.
- **Tone:** Friendly, warm, direct, practical, inclusive. Community club — not a corporation.
- **Pronouns:** Informal `je / jij`. Never formal `u`. First person: `we`.
- **Casing:** Sentence case for body and labels. ALL CAPS only for scoreboard stats (`RUST`, `LIVE`).
- **Club name:** Always `SC Muiden` (with space).
- **Dates:** `zaterdag 26 april` (lowercase, Dutch long form).
- **Times:** 24-hour — `14:30`, never `2:30 PM`.
- **Scores:** `3 – 1` (en-dash, spaces on both sides).
- **Emoji:** Not used in UI.

**Examples:**
- ✅ `"Volgende wedstrijd: zaterdag 26 april om 14:30"`
- ✅ `"SC Muiden – FC Diemen 3 – 1"`
- ❌ `"⚽ SC Muiden wint met 3-1! 🎉"`

---

## Colors

```css
/* Brand */
--color-navy:   #011d50;   /* primary brand, nav backgrounds, headers */
--color-blue:   #046bba;   /* CTAs, links, active states, badges */
--color-yellow: #f5c518;   /* accent, score highlights, alerts */
--color-white:  #ffffff;
--color-light:  #f0f4f9;   /* page bg, subtle sections */
--color-mid:    #dde5f0;   /* dividers, borders, skeleton loaders */
--color-text:   #0d1f3c;   /* body text (navy-tinted near-black) */
--color-text-2: #5a6e8a;   /* secondary text, captions */

/* Semantic */
--color-success: #1a8c5c;  /* win, confirm */
--color-error:   #d63c3c;  /* loss, error, danger */
--color-warning: #e07b12;  /* warnings, pending */
--color-info:    #046bba;  /* same as blue */

/* Navy tints */
--color-navy-90: rgba(1, 29, 80, 0.90);
--color-navy-70: rgba(1, 29, 80, 0.70);
--color-navy-40: rgba(1, 29, 80, 0.40);
--color-navy-12: rgba(1, 29, 80, 0.12);
--color-navy-06: rgba(1, 29, 80, 0.06);
```

---

## Typography

### Fonts

```css
--font-display: 'Barlow Condensed', 'Arial Narrow', sans-serif;  /* headings, scores */
--font-body:    'Barlow', 'Arial', sans-serif;                    /* body, UI labels */
--font-mono:    'Barlow Condensed', 'Courier New', monospace;     /* live stats */
```

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
```

### Type Scale

```css
--text-xs:   11px;
--text-sm:   13px;
--text-base: 15px;
--text-md:   17px;
--text-lg:   20px;
--text-xl:   24px;
--text-2xl:  30px;
--text-3xl:  38px;
--text-4xl:  48px;
--text-5xl:  64px;
```

### Weights

```css
--fw-regular:   400;
--fw-medium:    500;
--fw-semibold:  600;
--fw-bold:      700;
--fw-extrabold: 800;
```

### Semantic Roles

| Role | Font | Size | Weight |
|---|---|---|---|
| H1 | Barlow Condensed | 48px | 800 |
| H2 | Barlow Condensed | 38px | 700 |
| H3 | Barlow Condensed | 30px | 700 |
| H4 | Barlow | 20px | 600 |
| Body | Barlow | 15px | 400 |
| Label | Barlow | 13px | 500, uppercase, 0.02em ls |
| Caption | Barlow | 11px | 400, `--color-text-2` |
| Score | Barlow Condensed | 64px | 800, tabular-nums |

CSS utility classes: `.ds-h1` `.ds-h2` `.ds-h3` `.ds-h4` `.ds-body` `.ds-label` `.ds-caption` `.ds-score`

---

## Spacing

Base unit: **4px**. All spacing is a multiple.

```css
--space-1:   4px;
--space-2:   8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

- Mobile horizontal padding: `16px`
- Desktop horizontal padding: `24px`
- App max-width: `390px`
- Website max-width: `1200px`

---

## Border Radius

```css
--radius-sm:   4px;
--radius-md:   8px;   /* buttons, inputs */
--radius-lg:  10px;   /* cards */
--radius-xl:  16px;
--radius-pill: 999px; /* tags, badges */
--radius-full: 50%;   /* avatars, team badges */
```

---

## Shadows

All shadows are navy-tinted — never pure black.

```css
--shadow-subtle:   0 1px 4px rgba(1, 29, 80, 0.08);   /* light borders, list items */
--shadow-card:     0 2px 8px rgba(1, 29, 80, 0.10);   /* default card elevation */
--shadow-elevated: 0 4px 16px rgba(1, 29, 80, 0.16);  /* hover, modals, dropdowns */
--shadow-nav:      0 2px 12px rgba(1, 29, 80, 0.18);  /* sticky nav bar */
--shadow-modal:    0 8px 32px rgba(1, 29, 80, 0.22);  /* modals */
```

---

## Cards

```css
background: #ffffff;
border-radius: 10px;
box-shadow: 0 2px 8px rgba(1, 29, 80, 0.10);

/* Hover */
box-shadow: 0 4px 16px rgba(1, 29, 80, 0.16);
transform: translateY(-2px);
```

- Subtle cards: add `border: 1px solid #dde5f0`
- Elevated cards: no border needed

---

## Backgrounds

- **White** `#ffffff` — most content areas
- **Light** `#f0f4f9` — alternating sections, sidebars
- **Navy** `#011d50` — match headers, live score cards, nav bars
- **No gradients** in UI components
- **Hero gradient** (overlay only): `linear-gradient(to top, rgba(1,29,80,0.8), transparent)`
- **No textures or patterns** in UI

---

## Transitions

```css
--transition-fast: 150ms ease-out;  /* hover states */
--transition-base: 200ms ease;      /* modals, drawers */
--transition-slow: 300ms ease;
```

---

## Interactive States

```css
/* Buttons */
hover:  filter: brightness(1.08);
active: transform: scale(0.97); filter: brightness(0.96);

/* Cards */
hover:  box-shadow: var(--shadow-elevated); transform: translateY(-2px);

/* Links */
hover:  color: #046bba; text-decoration: underline;

/* Nav items (dark bg) */
hover:  background: rgba(255, 255, 255, 0.10);
```

---

## Icons

**Lucide Icons** — outline/stroke style only. Never filled icons.

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

<i data-lucide="calendar"></i>
<script>lucide.createIcons();</script>
```

| Size | Context |
|---|---|
| 16px | Inline with text |
| 20px | Inside buttons |
| 24px | Navigation, feature icons |

| Context | Icon |
|---|---|
| Match / calendar | `calendar` |
| Live match | `activity` |
| Team | `users` |
| Player | `user` |
| Score / stats | `bar-chart-2` |
| News | `newspaper` |
| Location | `map-pin` |
| Time | `clock` |
| Settings | `settings` |
| Notification | `bell` |
| Home | `home` |
| Trophy / ranking | `trophy` |
| Contact | `mail` |

Icons match the color of adjacent text, or `--color-blue` when interactive.

---

## Z-Index Scale

```css
--z-base:    0;
--z-card:   10;
--z-sticky: 100;
--z-modal:  200;
--z-toast:  300;
```

---

## Layout & Breakpoints

- Mobile-first, two breakpoints: `480px` (wide phone), `768px` (tablet/desktop)
- App: bottom tab bar navigation
- Website: top sticky navigation
- Use `flex` / `grid` with `gap` — not inline flow — for all UI element groups

---

## CSS Variables File

All tokens are available in `colors_and_type.css`. Import at the top of any stylesheet:

```css
@import url('./colors_and_type.css');
/* or link in HTML */
<link rel="stylesheet" href="colors_and_type.css">
```

---

## Assets

| File | Description |
|---|---|
| `assets/logo.svg` | SC Muiden wordmark / crest (default) |
| `assets/logo-white.svg` | White version for dark backgrounds |

---

## Design Don'ts

- ❌ No gradients in UI components (hero overlays only)
- ❌ No textures or patterns
- ❌ No filled icons
- ❌ No emoji in UI
- ❌ No formal `u` pronoun
- ❌ No English UI strings
- ❌ No warm-filtered or black-and-white photography
- ❌ No pure-black shadows (always navy-tinted)
- ❌ No looping animations except loading spinners
