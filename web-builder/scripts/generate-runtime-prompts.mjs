import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(currentDir, '../public/ai-tadpole-catalog.json');

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

function cleanText(text) {
  return text.replace(/\*\*/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/\s+/g, ' ').trim();
}

function getDomainGuardrail(agent) {
  const dept = (agent.department || '').toLowerCase();
  const id = (agent.id || '').toLowerCase();

  if (dept.includes('customer-support') || id.includes('customer-support')) {
    return 'Work strictly within verified customer service records, SLA agreements, and refund policies. Never issue unauthorized refunds or commit to unapproved contract changes. Flag customer disputes and churn risks. Require human review before sending external communications or account updates.';
  }
  if (dept.includes('human-resources') || dept === 'hr' || id.includes('human-resources') || id.includes('talent')) {
    return 'Work strictly within verified employment policies, approved job descriptions, and equal opportunity standards. Never make binding job offers or disciplinary decisions independently. Flag candidate evaluation anomalies. Require human HR review and sign-off before candidate communications or onboarding dispatch.';
  }
  if (dept.includes('inventory') || id.includes('inventory') || id.includes('stock')) {
    return 'Work strictly within verified inventory ledgers, cycle count logs, and approved supplier reorder thresholds. Never adjust ledger balances or issue purchase orders independently. Flag stockout risks and excess holding costs. Require human inventory manager approval before reorders or count adjustments.';
  }
  if (dept.includes('warehousing') || id.includes('warehousing') || id.includes('warehouse')) {
    return 'Work strictly within verified floor plans, rack load ratings, and OSHA safety standards. Never alter bin allocations or rack load specifications without structural validation. Flag aisle congestion and clearance risks. Require human warehouse manager review before layout modifications.';
  }
  if (dept.includes('logistics') || id.includes('logistics') || id.includes('freight')) {
    return 'Work strictly within verified freight schedules, driver hours-of-service rules, and vehicle weight limits. Never dispatch unverified loads or exceed statutory driving limits. Flag weather bottlenecks and delivery delays. Require human dispatch supervisor approval before finalizing manifests.';
  }
  if (dept.includes('shipping') || dept.includes('receiving') || id.includes('dock') || id.includes('shipping')) {
    return 'Work strictly within verified purchase orders, packing slips, and carrier delivery receipts. Never sign off on damaged or short shipments without noting carrier exceptions on delivery documents. Flag vendor shipping discrepancies immediately. Require human dock lead verification before freight sign-off.';
  }
  if (dept.includes('it-support') || id.includes('helpdesk') || id.includes('workstation')) {
    return 'Work strictly within approved IT hardware standards, software inventories, and operating system policies. Never bypass endpoint security agents or install unapproved software. Flag recurring hardware failures and security alerts. Require human IT lead sign-off before workstation deployment or wipe.';
  }
  if (dept.includes('facilities') || id.includes('facility') || id.includes('maintenance')) {
    return 'Work strictly within verified building lease agreements, contractor service SLAs, and facility maintenance budgets. Never authorize unbudgeted capital repairs independently. Flag HVAC malfunctions and building safety issues. Require human facilities director approval before dispatching paid contractors.';
  }
  if (dept.includes('legal') || id.includes('legal') || id.includes('compliance') || id.includes('privacy')) {
    return 'Work strictly within verified compliance and policy records. Never offer legal or regulatory guarantees. Flag ambiguities and policy conflicts. Require human review and sign-off before any decision, external delivery, or document issuance.';
  }
  if (id.includes('medical') || id.includes('healthcare') || id.includes('clinical')) {
    return 'Work strictly within approved clinical and administrative documentation. Never diagnose, prescribe, or offer unapproved advice. Escalate health and safety concerns immediately. Require human clinical review before communication.';
  }
  if (dept.includes('finance') || id.includes('finance') || id.includes('accounting') || id.includes('invoice') || id.includes('pricing') || id.includes('tax')) {
    return 'Use only approved price books, ledgers, and rate schedules. Never commit to prices, terms, or transactions independently. Flag variances and incomplete data. Require human approval before financial commitments or issuance.';
  }
  if (dept.includes('security') || id.includes('security') || id.includes('appsec') || id.includes('secops')) {
    return 'Work strictly within approved architecture and security boundaries. Never bypass permissions or execute unverified commands. Flag vulnerabilities and policy conflicts. Require human security review before state changes.';
  }
  return 'Work strictly within approved context, domain standards, and factual records. Separate verified facts from assumptions and never invent data. Flag ambiguities and risks. Require human review and approval before final decisions or external delivery.';
}

function synthesizeRuntimePrompt(agent) {
  // If prompt is already concise (<= 800 chars) and not markdown header format
  if (agent.prompt && agent.prompt.length <= 800 && !agent.prompt.startsWith('#')) {
    return agent.prompt.trim();
  }

  const name = agent.name || 'Specialist';
  const role = agent.role || agent.vibe || 'Domain Specialist';
  const desc = agent.description ? agent.description.trim().replace(/\.$/, '') : '';
  const vibe = agent.vibe ? agent.vibe.trim().replace(/\.$/, '') : '';

  // Extract identity / intro
  let coreMission = desc || vibe || `provide domain expertise for ${agent.departmentLabel || agent.department}`;

  // Try extracting intro sentence from markdown if available
  const introMatch = agent.prompt.match(/You are \*\*.*?\*\*, (.*?)(?:\.|\n)/);
  if (introMatch && introMatch[1]) {
    const candidate = cleanText(introMatch[1]);
    if (candidate.length > 20 && candidate.length < 250) {
      coreMission = candidate;
    }
  }

  const guardrail = getDomainGuardrail(agent);
  const prefix = `You serve as the ${name} (${role}). ${coreMission.charAt(0).toUpperCase() + coreMission.slice(1)}.`;

  // Calculate available space for prefix so guardrail is never truncated
  const maxPrefixLen = 800 - guardrail.length - 2;
  let trimmedPrefix = prefix;
  if (trimmedPrefix.length > maxPrefixLen) {
    trimmedPrefix = trimmedPrefix.slice(0, maxPrefixLen - 3) + '...';
  }

  const fullPrompt = `${trimmedPrefix} ${guardrail}`.replace(/\s+/g, ' ').trim();
  return fullPrompt;
}

let updatedCount = 0;
for (const agent of catalog) {
  const runtimePrompt = synthesizeRuntimePrompt(agent);
  if (runtimePrompt.length > 800) {
    throw new Error(`Generated runtimePrompt for ${agent.id} exceeds 800 chars (${runtimePrompt.length}).`);
  }
  if (runtimePrompt.length < 50) {
    throw new Error(`Generated runtimePrompt for ${agent.id} is too short (${runtimePrompt.length}).`);
  }
  agent.runtimePrompt = runtimePrompt;
  updatedCount++;
}

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Successfully updated ${updatedCount} catalog agents with curated, non-truncated runtimePrompts.`);
