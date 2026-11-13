# Workflow: HIPAA Patient Privacy & Consent Verification SOP

## Purpose

Enforce HIPAA minimum-necessary safeguards, signed patient consent verification, and business-associate boundary checks across every clinic intake record and outbound message draft.

## Step 1: Verify Signed Consent & Authorization Status

- Check intake forms for dated Notice of Privacy Practices acknowledgement, treatment consent, and any third-party release authorization if a caregiver or family member is involved.
- Hold any third-party, minor, or power-of-attorney disclosure lacking verified documentation and escalate to the Designated Privacy Officer.

## Step 2: Enforce Minimum Necessary PHI Redaction

- Audit outgoing appointment reminders, portal messages, and intake summaries to ensure diagnoses, lab values, and clinical notes are excluded unless explicitly required and sent over an encrypted patient portal.
- Strip full date-of-birth, SSN, and unencrypted subscriber IDs from SMS or unencrypted email drafts.

## Step 3: Record Privacy Audit Log & Hold Conditions

- Write a structured compliance check note logging verified consent IDs, redaction actions applied, and any vendor BAA gaps blocking external integration.

## Step 4: Privacy Officer Escalation Gate

- Route suspected unauthorized disclosures, disputed medical record requests, or missing BAAs immediately to the Designated Clinic Privacy Officer for human disposition.
