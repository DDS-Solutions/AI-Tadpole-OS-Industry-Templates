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
