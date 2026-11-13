# Workflow: Industrial OT Telemetry & ERP Sync Pipeline SOP

## Purpose

Verify read-only SCADA/OPC-UA telemetry ingestion, schema compatibility, and staging ERP integration runbooks without allowing autonomous writes to shop-floor controllers.

## Step 1: Audit OT/IT Network & Read-Only Boundary

- Inspect pipeline manifests and connector configs to verify SCADA/OPC-UA endpoints operate strictly in read-only DMZ mode with zero direct write topics to PLCs.

## Step 2: Validate Schema Transform & Dead-Letter Handling

- Check telemetry field types, timestamp timezone normalization (UTC), and idempotency keys against the digital twin ingestion schema.
- Document schema drift or dropped heartbeat thresholds in a structured verification report.

## Step 3: Draft Staging Runbook & Rollback Checkpoints

- Write a deterministic deployment and rollback runbook referencing exact staging checksums and health-check probes.

## Step 4: OT Security & Controls Approval Gate

- Escalate any writable endpoint, missing TLS certificate pinning, or unverified retry storm risk to the Controls & OT Security Lead before promoting changes.
