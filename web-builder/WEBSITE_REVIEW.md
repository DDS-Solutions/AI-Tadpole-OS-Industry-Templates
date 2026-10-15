# Swarm Architect website review

Reviewed and updated October 15, 2026. Scope: the React/TypeScript website in `web-builder`, its setup flows, local draft recovery, connector selection, editor dialogs, and production packaging.

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
| Approval/read-only badges used only an explicit oversight flag | Elevated or unknown permissions could receive misleading assurances | Account for native capability risk and MCP grants; show review states for unknown permissions |
| Metadata-only connectors looked ready to select | Users entered a configuration that could not be exported | Explain requirements and gate new selection in both modes; keep existing selections removable |
| Catalog filtering could retain an excluded preview | The Add action could target an unexpected specialist | Resolve selection within the filtered results |
| Catalog and dialogs were difficult to use on phones or with a keyboard | Fixed-width panes, missing dialog semantics, and escaped keyboard focus | Add a mobile list/detail layout, dialog names, Escape handling, focus containment/restoration, and scroll locking |
| Some fields lacked associated labels or dropped current model/company-size values | Reduced accessibility and misleading selections when switching modes | Associate labels, retain custom values, and align size options |

## Interface changes

- New landing composition with a clearer value statement, illustrative team topology, distinct setup choices, and a direct template-library entry.
- Refined obsidian surfaces, restrained green/cyan accents, stronger text hierarchy, readable control states, and consistent focus treatment.
- Wider desktop workspace, compact phone progress navigation, wrapping actions, and more usable editor scroll regions.
- Reduced-motion support for CSS animation, Framer Motion, and programmatic step scrolling.
- Updated search labels and page metadata; template counts remain driven by the registry rather than stale marketing copy.

## Verification

- ESLint passes.
- All 91 tests across 10 suites pass, including draft, permission, connector readiness, guided flow, validation, and archive regressions.
- TypeScript and the Vite production build pass.
- Production asset references use the configured deployment base path.
- The production preview, favicon, and all three catalogs respond with HTTP 200. Packaged data contains 73 public templates, 295 personas, and four configured connectors.
- The initial test run hit a sandbox temporary-file cache error. Re-running with a workspace-local temporary directory completed successfully.

## Remaining validation and boundaries

- Live browser visual and keyboard interaction verification remains outstanding because the Chrome connection was unavailable in this session. Check the landing screen, dialogs, and all four guided steps at phone, tablet, and desktop widths before release.
- Custom connector editing manages metadata. Runnable custom connectors still require a registry configuration, tool manifest, and package assets. The UI now explains and enforces this boundary; export performs the full package checks.
- This review did not perform a live installation into the separate Tadpole OS runtime or authenticate real external business tools.
