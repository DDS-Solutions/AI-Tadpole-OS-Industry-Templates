# AI-Tadpole-OS Template Registry Design Contract

> **Core identity:** A curated registry of industry-specific AI swarms, with a browser-based Swarm Architect for creating and exporting compatible packages.
>
> **Design aesthetic:** High-density dark glass surfaces, subtle obsidian depth, cyber-telemetry accents, readable sans-serif content, monospace system metadata, and restrained motion.

---

## Scope and source of truth

This repository contains two distinct surfaces:

- Registry packages, schemas, validators, and documentation at the repository root. These are data and documentation assets, not browser UI.
- The Swarm Architect frontend in [`web-builder/`](web-builder/), a React, TypeScript, Tailwind, and Vite application.

The frontend design system lives in [`web-builder/src/index.css`](web-builder/src/index.css). Its primary composition points are [`App.tsx`](web-builder/src/App.tsx), [`components/ModeSelector.tsx`](web-builder/src/components/ModeSelector.tsx), guided steps in [`components/Guided/`](web-builder/src/components/Guided/), advanced steps in [`components/Steps/`](web-builder/src/components/Steps/), and editors in [`components/Modals/`](web-builder/src/components/Modals/).

Do not reference UI paths or primitives from the separate Tadpole OS runtime in this repository. When a reusable builder control is needed, place it under `web-builder/src/components/` and use the shared CSS tokens and utility classes below.

---

## Color palette and tokens

Keep this palette intact. The configured Tailwind tokens in `web-builder/src/index.css` are the canonical values.

| Purpose | Token | Value |
| --- | --- | --- |
| App background | `--color-zinc-950` / `--color-background` | `#040405` |
| Raised surface | `--color-zinc-900` / `--color-surface` | `#0a0a0c` |
| Surface border | `--color-zinc-800` / `--color-border` | `#1a1a20` |
| Strong surface contrast | `--color-zinc-700` | `#27272a` |
| Primary text/action | `--color-neural-pulse` | `#e4e4e7` |
| Success and primary action | `--color-cyber-green` | `#22c55e` |
| Busy or informational state | `--color-busy` | `#06b6d4` |
| Warning state | `--color-warning` | `#f59e0b` |
| Danger state | `--color-danger` | `#ef4444` |

- Never use pure black (`#000` or `#000000`). Use the tinted obsidian and zinc tokens so panels retain depth.
- Use cyber green for a single primary action or a healthy/selected state. Use cyan for activity and information, amber for warnings, and red only for destructive or blocking states.
- Status text and badges must retain readable contrast; pair tinted backgrounds with their matching bright foregrounds.

## Typography, layout, and motion

- Use `Inter` through `--font-sans` for application content, titles, labels, and controls.
- Use `JetBrains Mono` through `--font-mono` for IDs, paths, counters, capability lists, package manifests, and diagnostic copy. The `.mono-label` utility is the standard compact metadata label.
- Use `.sovereign-panel` for a top-level workspace, major section, or modal panel. Do not put visually identical panels inside each other; use dividers, spacing, and a lower-contrast inner surface instead.
- Keep icons inline with meaningful headings or actions. Do not add a decorative rounded icon tile above every heading.
- Keep transitions brief and functional. All animation and transition behavior must respect `prefers-reduced-motion`.

## Shared builder conventions

- Apply `.sovereign-panel` to primary containers and `.sovereign-transition` to selectable cards when a hover transition is appropriate.
- Apply `.focus-sovereign` to controls that need the standard visible keyboard focus treatment. Native controls must retain an equally visible focus indicator.
- Use the existing `data-tooltip` styling for supplemental, short explanations. A tooltip never replaces a visible label or an accessible name.
- Keep empty states in the current panel context with a concise explanation and a clear next action; do not introduce another nested card merely to show an empty state.

## Accessibility requirements

1. Every icon-only button must have an `aria-label` or `title`; use `aria-label` when the action needs a durable accessible name.
2. Buttons, card-like selectors, inputs, and modal actions must be keyboard reachable with a visible focus state.
3. Selected toggle controls must expose their state with the appropriate ARIA semantics, such as `aria-pressed` or `aria-checked`.
4. Do not convey status, warnings, or validation only through color; preserve a text label or icon with a meaningful accessible name.
5. Hover-only UI must remain operable with keyboard focus. Tooltips are supplemental and must also appear for focusable elements on focus.

## Validation

For frontend changes, run from `web-builder/`:

```bash
npm run lint
npm run test
npm run build
```

For registry, schema, or template-package changes, run the repository validators described in [`README.md`](README.md) and [`TEMPLATE_SPEC.md`](TEMPLATE_SPEC.md).

[//]: # (Metadata: [DESIGN])
