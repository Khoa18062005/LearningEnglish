---
name: DOL Academic Interface System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#5d3f3c'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#926f6b'
  outline-variant: '#e7bdb8'
  surface-tint: '#c00014'
  primary: '#ba0013'
  on-primary: '#ffffff'
  primary-container: '#e31e24'
  on-primary-container: '#fffafa'
  inverse-primary: '#ffb4ab'
  secondary: '#645c5d'
  on-secondary: '#ffffff'
  secondary-container: '#e8dddd'
  on-secondary-container: '#696161'
  tertiary: '#1b4dd7'
  on-tertiary: '#ffffff'
  tertiary-container: '#3f68f1'
  on-tertiary-container: '#fdfaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000d'
  secondary-fixed: '#ebe0e0'
  secondary-fixed-dim: '#cfc4c4'
  on-secondary-fixed: '#201a1b'
  on-secondary-fixed-variant: '#4c4545'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b7c4ff'
  on-tertiary-fixed: '#001551'
  on-tertiary-fixed-variant: '#0039b5'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
  crimson-primary: '#E31E24'
  crimson-dark: '#B91C1C'
  surface-crimson-subtle: '#FEF2F2'
  surface-crimson-soft: '#FEE2E2'
  border-crimson-tint: '#FECACA'
  canvas-slate: '#F8FAFC'
  card-white: '#FFFFFF'
  slate-line: '#E2E8F0'
  text-high-contrast: '#0F172A'
  text-body: '#1E293B'
  text-muted: '#64748B'
  text-disabled: '#94A3B8'
  pos-noun-text: '#1D4ED8'
  pos-noun-bg: '#DBEAFE'
  pos-verb-text: '#B91C1C'
  pos-verb-bg: '#FEE2E2'
  pos-adj-text: '#15803D'
  pos-adj-bg: '#DCFCE7'
  pos-adv-text: '#6D28D9'
  pos-adv-bg: '#EDE9FE'
  collocation-indigo: '#4338CA'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md-semibold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-uppercase:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-performance educational environment built for cognitive clarity, precision, and dense pedagogical utility. It serves advanced language learners, academic educators, and curriculum researchers navigating structural linguistic taxonomies. 

The aesthetic is Modern EdTech: authoritative, crisp, and systematically organized. It balances the urgency and focus of deep learning with the calm, inviting neutrality of high-clarity workspaces. Every surface, border, and typographical choice serves rapid scanning, immediate comprehension, and error-free knowledge retrieval. 

Visual decoration is minimized in favor of semantic classification. Rather than using arbitrary decorative flourishes, visual accents are rigorously tied to functional roles—such as parts of speech, structural word hierarchies, and primary operational triggers.

## Colors

The palette employs a high-contrast crimson engine anchored by precise slate neutrals and specialized semantic classification tones.

### Crimson Primary System
The core brand driver `#E31E24` represents decisive action, progress, and navigational focus. It is strictly reserved for primary operational targets (buttons, primary links, key save triggers) and persistent selection indicators (tabs, focus halos, selection ticks). 

Secondary crimson layers (`#FEF2F2` and `#FEE2E2`) provide soft contrast for related context badges, active list item fills, and subtle focus row highlights. This prevents the intensity of the pure red from inducing cognitive fatigue during prolonged study sessions.

### Semantic Grammar Framework
To support linguistic parsing without visual confusion, Parts of Speech (POS) adopt standard dual-tone pairs pairing a saturated, high-contrast foreground glyph with an accessible, low-saturation pastel surface:
- **Noun (n):** `#1D4ED8` on `#DBEAFE`
- **Verb (v):** `#B91C1C` on `#FEE2E2`
- **Adjective (adj):** `#15803D` on `#DCFCE7`
- **Adverb (adv):** `#6D28D9` on `#EDE9FE`
- **Collocations:** Highlighted using `#4338CA` to distinguish idiomatic partnerships from structural grammar definitions.

### Structural Neutrals
Application backgrounds utilize an ultra-clean foundation: `#F8FAFC` for macro application canvases and pure `#FFFFFF` for primary cards, sidebars, and analytical data cells. Structural dividers rely on `#E2E8F0`, offering structural separation without harsh framing. Body text scales from deep charcoal `#0F172A` down to muted metadata `#64748B`.

## Typography

The typographic strategy pairs `Plus Jakarta Sans` for display and section headers with `Inter` for operational text, tables, and granular linguistic data.

`Plus Jakarta Sans` delivers approachable geometric rhythm with distinct contemporary character, lending an authoritative yet modern academic voice to structural view headers and modal titles.

`Inter` handles high-density data presentation. Its neutral, engineered proportions ensure maximum legibility when rendering complex linguistic patterns, phonetic symbols, italicized sentence examples, and multi-layered vocabulary trees.

### Usage Standards
- **Headlines & Modal Headers:** Set in `Plus Jakarta Sans`, bold (700) or semibold (600), with negative tracking (`-0.01em` to `-0.02em`) to maintain tightness at larger scales.
- **Data Table Cells & Vocabulary Headings:** Vocabulary words are anchored using `body-lg` at semibold/bold weight (`#0F172A`). Translated meanings leverage `body-md-semibold` for immediate dual-language identification.
- **Example Sentences & Usage Notes:** Rendered in `body-sm` italic with neutral muted tones (`#64748B`), visually separated from structural rule definitions.
- **Metadata Badges:** POS markers and grammatical counters (`[C]`, `[U]`) utilize `label-md` and `caption` respectively, prioritizing compactness and quick identification.

## Layout & Spacing

The spatial engine operates on a rigid 4px base increment (`0.25rem`), providing rhythm across high-density tables and expansive learning dashboards.

### Grid & Canvas Structure
- **Application Shell:** Features a fixed `260px` primary navigation sidebar coupled with a fluid, adaptive workspace canvas constrained to a maximum content width of `1600px`.
- **Modal Dialogues:** Modals for multi-step vocabulary authoring and entry operations use a structured wide footprint (`1000px`) to comfortably accommodate multi-column relational matrices without horizontal scroll triggers.
- **Grid Layout:** 12-column responsive fluid grid on desktop viewports (`≥ 1024px`) with `1.25rem` gutters and `2rem` outer page margins. For viewports under `768px`, the grid collapses to single-column stacking with `0.75rem` gutters and `1rem` margins.

### Vertical Rhythm
Component hierarchy enforces consistent spacing tiers:
- `space-xs` (4px): Micro gaps between multi-tag wraps and badge clusters.
- `space-sm` (8px): Form input inner paddings, list-item interspacing, and button icon gaps.
- `space-md` (16px): Structural cell padding, internal card margins, and input stacked groupings.
- `space-lg` (24px): Card container padding, modal header separation, and section divider clearances.
- `space-xl` (32px): Primary section stack rhythm on administrative dashboard overviews.

## Elevation & Depth

Elevation follows a layered surface methodology that prioritizes border definition over heavy drop shadows. Depth serves to separate analytical content tiers rather than create dramatic three-dimensional realism.

### Surface Tiers
- **Tier 0 (Canvas):** The underlying foundation rendered in Light Slate (`#F8FAFC`).
- **Tier 1 (Cards & Workspaces):** Primary work units (data tables, vocabulary lists, learning cards) constructed in pure white (`#FFFFFF`) with a 1px border (`#E2E8F0`). Flat elevation by default; elevated to `0 1px 3px 0 rgba(15, 23, 42, 0.05)` on hover.
- **Tier 2 (Sticky Headers & Dropdowns):** Table headers, floating action bars, and autocomplete flyouts. Elevated via `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)` coupled with a persistent bottom or perimeter border (`#E2E8F0`).
- **Tier 3 (Modals & Overlays):** Large complex entry drawers and dialog overlays elevated with `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` over a semi-opaque backdrop (`rgba(15, 23, 42, 0.4)`).

### Interactive Rows & Tonal Elevation
Data table records convey depth during user review via soft color tinting instead of drop shadows: hovering over a vocabulary block triggers an instantaneous background shift to `rgba(254, 242, 242, 0.4)` (tinted crimson neutral), preserving crisp baseline alignment across complex column grids.

## Shapes

The system implements a defined hierarchy for corner radiuses, reflecting Level 2 (Rounded) styling with specialized exceptions for badges and structural cards.

- **Base Radius (8px / `0.5rem`):** Standard for interactive inputs, standard buttons, dropdown menus, context popovers, and table action buttons.
- **Large Radius (12px / `1rem`):** Reserved for cards, modal dialog wrappers, content panels, and root table containers (`rounded-xl` mapping).
- **Sub-Component Radius (6px / `0.375rem`):** Tailored for compact form badges, countability indicators, and small segmented toggle buttons.
- **Full Pill Radius (9999px):** Applied to Part of Speech badges (`(n)`, `(v)`, `(adj)`), lexical tag items, and category filters, separating discrete data tokens from rectangular form inputs and structural surfaces.

## Components

### Buttons
- **Primary:** Filled `#E31E24` with pure white text. Hover transitions to `#D92D20`. Border-radius 8px, font-weight 600. Active click triggers slight inset state.
- **Secondary / Subtle:** `#FEF2F2` background with `#E31E24` text and an optional `#FECACA` border. Hover triggers `#FEE2E2`.
- **Outline / Ghost:** Transparent background, `#E2E8F0` border, `#1E293B` text. Hover shifts to `#F8FAFC`.
- **Inline Row Add Action:** 1px dashed `#E31E24` or `#CBD5E1` border, rounded 8px, soft padded cell utility trigger (`+ Thêm Nghĩa / Cụm Từ`).

### Badges & Category Chips
- **Part of Speech (POS) Chips:** Pill-shaped (`rounded-full`), `px-2.5 py-0.5`. Monospace or semibold weight label. Text-to-background color pairing mapped strictly to grammatical roles (Noun: `#1D4ED8` on `#DBEAFE`; Verb: `#B91C1C` on `#FEE2E2`).
- **Category Tags:** Pill-shaped, `px-2 py-0.5`, font-size 11px. `#FEF2F2` fill, 1px `#FECACA` border, `#E31E24` text. Includes an optional dismiss cross icon.

### Form Inputs & Selectors
- **Text Inputs & Search:** `#FFFFFF` background, 1px `#CBD5E1` border, 8px radius. Height 40px (compact 34px for table inline editors). Active focus state applies a crisp `#E31E24` border with a 3px diffused outer halo (`rgba(227, 30, 36, 0.15)`).
- **Checkboxes & Radios:** 18px dimensions, 4px roundedness for checkboxes, circular for radios. Inactive state features `#CBD5E1` border; checked state transitions immediately to `#E31E24` with clean white glyphs.

### Relational Vocabulary Tables
- **Header:** Background `#DC2626` with pure white text, uppercase 11px semibold, vertical divider `#EF4444`.
- **Body Cells:** Crisp `#FFFFFF` surfaces with `#E2E8F0` borders. 
- **Row-Spanning Visual Continuity:** Parent vocabulary words span across nested grammar senses and examples cleanly without duplicated divider lines. Left border accents (4px solid `#E31E24`) visually bind active compound structures.
- **Row Hover:** Smooth transition to `rgba(254, 242, 242, 0.4)`.

### Cards & Drawers
- Container card elements use 12px rounded corners, solid `#FFFFFF` backgrounds, and a continuous 1px `#E2E8F0` border. Headers within cards feature clear bottom dividers (`#E2E8F0`) with 16px internal padding.