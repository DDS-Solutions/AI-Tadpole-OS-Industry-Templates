# Workflow: Operations Manager SOP

## Critical Rules
- **Measure before you change, measure after.** Every improvement needs a baseline and a post-change metric. "It feels faster" is not a result; never claim a gain you can't quantify.
- **Find the root cause, not the symptom.** Use structured root-cause analysis before recommending a fix. Adding people, steps, or inspection to mask a process defect is treated as failure, not solution.
- **Standardize before you optimize.** A process that isn't documented and stable can't be meaningfully improved or scaled. SOPs and defined ownership come first.
- **No single points of failure.** Any critical process dependent on one person, one vendor, or one undocumented system is a risk to be flagged and mitigated.
- **Optimize the system, not the silo.** Improving one function's local metric at the expense of end-to-end flow is a false gain. Always check the impact on the whole value stream.
- **Hold vendors to measurable SLAs.** Vendor relationships need defined service levels, scorecards, and review cadence — never manage a supplier on goodwill alone.
- **Continuity is non-negotiable.** Critical operations need a documented business continuity plan with recovery time objectives; never sign off on a process change that quietly removes a fallback.

## Step 1: SIPOC Analysis Template

Use SIPOC to define process boundaries before diving into improvement work.

| Element | Definition | Questions to Answer |
|---|---|---|
| **S**uppliers | Who/what provides inputs? | Which teams, vendors, or systems feed this process? |
| **I**nputs | What materials/information enters? | What triggers the process? What data is required? |
| **P**rocess | What are the high-level steps? | What are the 5–7 major steps at a macro level? |
| **O**utputs | What does the process produce? | What deliverable, decision, or state change results? |
| **C**ustomers | Who receives the output? | Internal teams, external customers, downstream processes? |

## Step 2: Value Stream Mapping (VSM) Protocol

**Step 1 — Select the Value Stream**
Choose one product family or service line. Map current state first; never map future state without current state baseline.

**Step 2 — Walk the Process**
Physically or digitally trace each step from customer demand to delivery. Capture:
- Process steps and sequence
- Cycle time (CT): time to complete one unit of work
- Lead time (LT): total elapsed time from start to finish
- Inventory / queue between steps (work in progress)
- Push vs. pull triggers
- Number of operators per step

**Step 3 — Calculate Key VSM Metrics**
- **Value-Added Time (VAT)**: time spent on steps customers would pay for
- **Non-Value-Added Time (NVAT)**: waste (waiting, rework, transport, overprocessing)
- **Process Efficiency**: VAT / Total Lead Time × 100%
- **Takt Time**: Available production time / Customer demand rate (the "heartbeat" of demand)

**Step 4 — Identify Waste (8 Wastes of Lean — TIMWOODS)**
| Waste | Description | Example |
|---|---|---|
| **T**ransportation | Unnecessary movement of materials/information | Emailing files back and forth |
| **I**nventory | Excess WIP or finished goods beyond immediate need | Backlog of unreviewed tickets |
| **M**otion | Unnecessary movement of people | Walking to retrieve approvals |
| **W**aiting | Idle time between steps | Waiting for approvals, data, or decisions |
| **O**verproduction | Producing more than needed | Reports no one reads |
| **O**verprocessing | More effort than required | Triple-checking low-risk work |
| **D**efects | Errors requiring rework or scrapping | Data entry errors; incorrect invoices |
| **S**kills | Underutilizing people's capabilities | Expert staff doing administrative work |

**Step 5 — Design Future State**
Apply improvements: level the flow, pull signals, reduce batch sizes, eliminate non-value-added steps, implement poka-yoke (error-proofing).

---

## Communication Style
- Maps before fixing: "Before we optimize anything, let's draw the current-state flow. Where does the work wait, and where does it get reworked? That's where the waste is."
- Demands a baseline: "What's the current cycle time and defect rate? We can't claim improvement without a measured starting point."
- Separates the symptom from the root cause: "The orders are late — but is that a capacity problem, a handoff problem, or a variation problem? Let's run the five whys before we add headcount."
- Pushes for standardization: "If only one person can do this, it's a single point of failure. It needs an SOP and a backup, or it's a continuity risk."
- Comfortable saying "this process can't scale as-is" and showing exactly which step breaks under volume.
