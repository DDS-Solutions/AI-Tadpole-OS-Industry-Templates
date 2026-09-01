# Cross-Repository Audit Remediation Plan

This repository supplies the industry templates and Swarm Architect used by the
public [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS)
distribution. Private `DDS-Solutions/TadPole-OS` is the authoritative source
contract for every remediation described below.

> **Compatibility rule:** Any implementation work must start with a
> cross-repository contract audit. Do not change this registry's manifests,
> generated archives, validators, or migration scripts until the corresponding
> private Tadpole-OS loader, installer, runtime types, security gates, and tests
> have been inspected read-only. This prevents a locally reasonable change from
> breaking the consuming application.

## Source-of-truth order

When the two repositories disagree, resolve the discrepancy explicitly rather
than silently choosing one representation:

1. Private Tadpole-OS runtime loaders, installers, security gates, and tests.
2. Versioned schemas or shared fixtures accepted by both repositories.
3. `TEMPLATE_SPEC.md` and the validators in this repository.
4. Existing templates, which may represent intentional legacy compatibility or
   untracked schema drift.

Record the private Tadpole-OS commit used for every compatibility review. Use the public repository only as a downstream comparison.

## Phase 0: Establish the integration contract

Before editing production behavior:

- Locate the private Tadpole-OS code paths that download, validate, install, and boot
  templates.
- Trace the accepted shapes for `swarm.json`, agent profiles, workflow Markdown,
  `mcps.json`, and OKF/IKS knowledge assets.
- Document required fields, optional fields, defaults, path resolution rules,
  legacy aliases, and failure behavior.
- Test representative fixtures from this repository against the consumer.
- Classify each audit finding as a consumer incompatibility, a documentation
  mismatch, an intentional legacy format, or a registry-only defect.

**Gate:** Publish a compatibility matrix that links each field and file type to
the accepting private Tadpole-OS code and pins the reviewed upstream revision.

**Status (2026-08-17):** Complete for private upstream revision
`d328fcd43eca185f4672be313774b81982253973`. See
[`COMPATIBILITY_MATRIX.md`](COMPATIBILITY_MATRIX.md).

## Phase 1: Add contract characterization tests

- Add fixtures for a current native template, each supported legacy variant,
  an exported Swarm Architect archive, MCP-enabled output, and OKF-enabled
  output.
- Add importer/exporter tests that unzip generated archives and assert their
  complete contents and references.
- Add round-trip tests: import a repository template, export it, then verify that
  agents, workflows, connectors, and knowledge assets retain their meaning.
- Where practical, run the Tadpole-OS validator or installer against these
  fixtures in CI. Otherwise, maintain a versioned contract fixture shared by
  both repositories.

**Gate:** No schema or migration change proceeds without a failing contract test
that demonstrates the intended compatibility fix.

## Phase 2: Align validators and repository data

After Phase 0 determines the accepted contract:

- Validate required swarm and agent fields, types, IDs, and relative paths.
- Validate both global and agent-owned workflows, including the step syntax the
  consumer actually parses.
- Detect missing references, duplicate IDs or paths, orphan files, and drift
  between `registry.json`, `index.json`, and template directories.
- Decide whether the six legacy swarm manifests should be migrated or preserved
  as compatibility fixtures.
- Repair malformed or orphaned workflow files only after confirming how the
  consumer treats global versus agent-owned workflows.

**Gate:** Every registered template passes both repository validation and the
consumer compatibility suite, with intentional legacy exceptions documented.

## Phase 3: Repair Swarm Architect import and export

- Generate agent profiles in the exact shape consumed by private Tadpole-OS.
- Enforce consumer limits and required metadata before export.
- Preserve agent-owned and global workflow relationships during import and
  round-trip export.
- Emit executable workflow structure rather than unvalidated prose.
- Bundle MCP configuration and dependencies using the consumer's real path and
  installation rules; do not emit dangling repository-relative references.
- Put the actual OKF playbook content in generated knowledge assets and prevent
  filename collisions.
- Make the builder's company/mission template selector apply the selected roster
  and workflows.
- Cancel or identity-guard overlapping template requests so stale responses
  cannot populate a newly selected template.

**Gate:** A generated archive installs successfully into the pinned private
Tadpole-OS revision and survives the round-trip tests from Phase 1.

## Phase 4: Make migrations safe

- Replace in-place delete-and-recreate behavior with staged output.
- Add `--check` and `--dry-run` modes and require explicit confirmation for
  repository-wide writes.
- Validate staged templates before atomically replacing existing files.
- Preserve backups or provide a documented recovery path.
- Make migrations idempotent and test them against both native and supported
  legacy fixtures.

**Gate:** An interrupted or failed migration leaves the original template tree
unchanged and recoverable.

## Phase 5: Strengthen continuous integration

- Run frontend lint, tests, type checking, and production build before deploy.
- Run archive contract and round-trip tests for Swarm Architect changes.
- Run validator tests against known-invalid fixtures so validation gaps cannot
  silently regress.
- Expand security workflow path coverage to every industry, MCP blueprint,
  migration script, and generated artifact in scope.
- Pin dependency installation to the lockfile in CI.

**Gate:** Deployment and template publication require all quality and consumer
compatibility checks to pass.

## Recommended execution order

1. Phase 0: consumer contract audit.
2. Phase 1: characterization and round-trip tests.
3. Phase 2: validator and template-data alignment.
4. Phase 3: builder import/export fixes.
5. Phase 4: migration safety.
6. Phase 5: CI enforcement and rollout.

Do not reorder the validator or archive changes ahead of the contract audit:
doing so risks enforcing a format that the supporting AI-Tadpole-OS release does
not consume.

## Implementation status (2026-08-17)

- Phase 0: complete at private upstream revision
  `d328fcd43eca185f4672be313774b81982253973`.
- Phase 1: local consumer-wire, invalid-fixture, archive-content, MCP, OKF, and
  workflow round-trip characterization tests are in place.
- Phase 2: all registered agents, MCP configurations, and workflow SOPs are migrated;
  validation achieves **0 errors and 0 warnings** (all 6 legacy workflows registered into `swarm.json`).
- Phase 3: builder agent, workflow, MCP archive, OKF, capability chips, selector, and stale-request
  defects are repaired and covered by tests. Full MCP execution and
  deterministic workflow execution remain blocked by consumer install-path
  behavior documented in `COMPATIBILITY_MATRIX.md`.
- Phase 4: consumer contract migration is additive/idempotent, and the legacy
  roster replacement utility is staging-only.
- Phase 5: validation, lockfile drift verification, Python unit/smoke tests, builder lint/tests/build,
  whole-repo Bandit analysis, and broad security scanning with immutable Action commit SHAs are CI gates.

## Representative Migration Sample Audit

| Category | Representative Profile | Capabilities (`skills`) | Oversight Flag | Workflow Binding | MCP Tools |
| --- | --- | --- | --- | --- | --- |
| **Read-Only / Research** | `pharma/clinical-trials/agents/specialized-data-privacy-officer.json` | `["read_file", "grep_search"]` | `false` | `clinical_privacy_sop` | `[]` |
| **Mutating / File Ops** | `development/full-stack-sprint/agents/engineering-engineering-database-optimizer.json` | `["read_file", "write_file"]` | `true` (forced) | `db_migration_sop` | `[]` |
| **Execution / Shell** | `testing/smoke-test/agents/operator.json` | `["read_file", "write_file", "execute_shell", "shell"]` | `true` (forced) | `operator_sop` | `["smoke-connector:healthcheck"]` |
