# Swarm Architect website review

Reviewed and updated November 13, 2026. Scope: the React/TypeScript website in `web-builder`, its setup flows, local draft recovery, connector selection, editor dialogs, production packaging, and live Chrome verification across desktop (`1440x900`), tablet (`768x1024`), and phone (`390x844`) viewports.

## Resolved findings

| Finding | Impact | Resolution |
| --- | --- | --- |
| Guided continuation regenerated an existing team and its playbooks | Lost custom settings when returning to the business brief | Continue preserves the current blueprint; explicit regeneration confirms replacement |
| Custom connector metadata disappeared after refresh | Restored drafts referred to missing definitions | Persist a metadata whitelist and merge it with current registry runtime definitions; exclude runtime configuration and credentials |
| Corrupt draft arrays passed recovery checks | Malformed saved data could crash subsequent rendering or validation | Validate array elements and saved dates while retaining older valid drafts |
| Save controls reported success when storage failed | Users could believe an unsaved blueprint was safe | Return and display the actual save result |
| Catalog failures were logged without useful recovery | Empty recommendations and missing connections appeared to be valid states | Show load errors, provide retry, and gate recommendations while unavailable |
| Advanced template load failures were invisible | An old roster could appear to belong to a newly selected preset | Display loading/failure feedback and a retry action; reset cancels pending template requests |
| Returning from the library or another mode reset guided navigation | Users repeatedly returned to the first step | Keep guided progress in the shared application state and restore it when returning |
| Approval/read-only badges used only an explicit oversight flag | Elevated or unknown permissions could receive misleading assurances | Account for native capability risk, normalized `mcp__server__tool` grants, and review states for unknown permissions |
| Metadata-only connectors looked ready to select | Users entered a configuration that could not be exported | Explain requirements and gate new selection in both modes; keep existing selections removable |
| Catalog filtering could retain an excluded preview | The Add action could target an unexpected specialist | Resolve selection within the filtered results |
| Catalog and dialogs were difficult to use on phones or with a keyboard | Fixed-width panes, missing dialog semantics, and escaped keyboard focus | Add a mobile list/detail layout, dialog names, Escape handling, focus containment/restoration, and scroll locking |
| Some fields lacked associated labels or dropped current model/company-size values | Reduced accessibility and misleading selections when switching modes | Associate labels, retain custom values, and align size options |
| OKF `knowledge.json` export used string `tags` and supervisor cycle / malformed `mcpTools` gaps | Exported archives could fail `knowledge-v1.json`, `agent-v1.json`, or `validate_template.py` gates | Export `tags` as `string[]`, avoid `priority: 'critical'` cycle traps, emit `flat_peer_swarm: true` for multi-root swarms, reject bare `mcpTools`, validate remote `serverKey` (`gev`/`__`/empty) & clear stale auth headers, and separate `workflows/` vs `knowledge/` counts in Phase 5 manifest |
| Modal positioning trap under `.workspace-shell.animate-fadeIn` | `.animate-fadeIn` (`both` fill mode) created a containing block for `position: fixed` descendants, clipping `AgentEditor`, `McpEditor`, and `CatalogDrawer` on scrolled/short viewports | Set `.animate-fadeIn` to `backwards` (`to { transform: none }`) in `index.css` and render `CatalogDrawer`, `AgentEditor`, and `McpEditor` via `createPortal(..., document.body)` in `App.tsx` |
| Catalog non-hex color blocked `AgentEditor` saving | Named catalog colors like `"blue"` failed the 6-digit hex check and disabled `Save Configuration` | Added `normalizeAgentColor()` in `catalogHelpers.ts` (mapping all 18 named catalog colors + 3-digit hex) and wired into `AgentEditor.tsx` |
| Mobile (`390x844`) layout, overflow, tooltip overlap & small touch targets | Step 4 truncated long specialist names to `"L..."`; Phase 2 card action buttons were `26x26px` and hover-hidden; Phase 5 metric cards, `p-12`, and `Restart Configuration` tooltip caused horizontal overflow (`395px > 390px`) and heading tooltip overlap | Stacked Step 4 specialist rows on narrow screens (`Step4_GuidedReview.tsx`), enlarged Phase 2 card buttons to `44x44px` and always visible (`Step2_Roster.tsx`), switched Phase 5 cards to `grid-cols-1 sm:grid-cols-3`, removed heading tooltip, and added `.tooltip-top-end` on `Restart Configuration` (`Step5_Forge.tsx` / `index.css`) |
| Unlabeled Phase 3 inputs, `0`-template count flash, and pluralization nits | Phase 3 workflow inputs lacked explicit `<label for>` / `id` associations; cold load briefly showed `"Explore 0 industry templates"`; single counts rendered `1 Tools`, `1 agents`, `1 workflows`, `1 files`, `1 playbooks` | Added explicit `id`, `name`, `htmlFor`, and `sr-only` labels in `Step3_Playbooks.tsx`, added template count fallback (`81`) in `App.tsx`, and fixed singular/plural copy across `Step4_GuidedReview.tsx` and `Step5_Forge.tsx` |

## Interface changes

- New landing composition with a clearer value statement, illustrative team topology, distinct setup choices, and a direct template-library entry.
- Refined obsidian surfaces, restrained green/cyan accents, stronger text hierarchy, readable control states, and consistent focus treatment.
- Wider desktop workspace, compact phone progress navigation, viewport-centered portaled dialogs, `44x44px` mobile card action targets, and more usable editor scroll regions.
- Reduced-motion support for CSS animation, Framer Motion, and programmatic step scrolling.
- Eliminated Vite `[INEFFECTIVE_DYNAMIC_IMPORT]` warning via static `catalogHelpers` imports.

## Verification

- TypeScript (`tsc -b`), ESLint (`eslint .`), and the Vite production build pass with zero warnings.
- All `120` tests across `15` Vitest suites pass, including draft, catalog color normalization, permission (`server:tool` & `mcp__server__tool`), connector readiness, guided flow, manifest, validation, and archive regression suites.
- Python CI & security suite passes cleanly (`validate_template.py`, `run_template_evals.py --check`, `codegen_contract.py --check`, `verify_compatibility_lock.py`, `compile_prompt_fragments.py --check`, `migrate_consumer_contract.py --check`, `generate_llms_docs.py --check`, `unittest`, and Bandit).
- Live Chrome review & post-fix re-verification completed at `http://localhost:4173/AI-Tadpole-OS-Industry-Templates/` across `1440x900`, `768x1024`, and `390x844`:
  - Cold reload renders `Explore 81 industry templates` immediately without flashing `0`.
  - Portaled `AgentEditor`, `McpEditor`, and `CatalogDrawer` fit completely inside desktop (`1440x900`) and phone (`390x844`) viewports and dismiss cleanly with `Escape`; catalog color `"blue"` normalizes to `#3B82F6` with `Save Configuration` enabled.
  - Phone (`390x844`) Guided Step 4 renders `1 Tool` and full `Legal Compliance Checker` text without truncation or overflow (`390 <= 390`).
  - Phone (`390x844`) Advanced Phase 2 (`44x44px` visible buttons), Phase 3 (`13/13` explicitly labeled form controls), and Phase 5 (`1 agent` / `1 workflow` / `1 file`, stacked cards, `scrollWidth === 390` at rest, focused, and hovered) all pass with zero console errors, zero uncaught exceptions, and HTTP `200`/`304` on all app assets.

## Remaining boundary

- **External runtime & upstream template probing**: This review did not perform a live installation into the separate `AI-Tadpole-OS` (`v1.1.464`) runtime or authenticate real external business tools. In addition, loading an upstream template without a remote `knowledge.json` (e.g., `legal/contract-review`) emits a non-fatal browser network `404` when probing `raw.githubusercontent.com` for optional `knowledge.json`.
