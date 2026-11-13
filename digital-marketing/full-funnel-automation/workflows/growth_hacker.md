# Workflow: Funnel Telemetry Audit & Bounded Spend Optimization SOP

## Purpose

Audit acquisition funnel conversion metrics, enforce UTM attribution hygiene, design statistically bounded experiments, and propose budget reallocations under strict Marketing Director spend controls.

## Step 1: Audit Conversion Telemetry & UTM Integrity

- Inspect exported campaign and landing-page CSV/JSON logs via `read_file` to verify complete `utm_source`, `utm_medium`, `utm_campaign`, and conversion event attribution.
- Exclude statistically underpowered segments (e.g., low impression/click samples) from winner declarations.

## Step 2: Design Bounded A/B Experiment Matrix

- Formulate clear test hypotheses defining primary metric, minimum detectable effect, holdout duration, and maximum test budget cap.

## Step 3: Draft Budget Reallocation Proposal

- Compare CPA/ROAS solely across verified data windows and prepare a budget shift schedule listing upside assumptions and downside stop-loss triggers.

## Step 4: Paid Spend Approval Gate

- Escalate any budget reallocation, bid cap increase, or new channel launch to the Marketing Director for explicit approval prior to execution.
