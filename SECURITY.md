# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

The DDS Solutions team takes the security of AI-Tadpole-OS and its template ecosystem seriously.

If you discover a security vulnerability within this repository, template packages, or connector blueprints:

1. **Do not create a public GitHub issue.**
2. Report the vulnerability privately via GitHub Security Advisories or by emailing `security@dds-solutions.dev`.
3. Include detailed steps to reproduce the issue, along with any relevant template configurations or payloads.
4. The security team will acknowledge receipt within 48 hours and provide an estimated timeline for remediation.

## Security Controls

All templates undergo automated scanning in CI:
- Deterministic contract and capability validation (`scripts/validate_template.py`)
- Python static security analysis (Bandit 1.9.4)
- Anti-malware and file signature verification (ClamAV)
- Lockfile cryptographic hash verification (`compatibility.lock.json`)
