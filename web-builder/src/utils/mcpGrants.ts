export const MCP_TOOL_DECLARATION_RE =
  /^(?:mcp__[A-Za-z0-9_.-]+__[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+)$/;

export function isValidMcpGrant(grant: string): boolean {
  return MCP_TOOL_DECLARATION_RE.test(grant.trim());
}

export function normalizeMcpGrant(grant: string): string {
  const trimmed = grant.trim();
  if (!trimmed.startsWith('mcp__')) {
    return trimmed;
  }
  const rest = trimmed.slice('mcp__'.length);
  const sepIndex = rest.indexOf('__');
  if (sepIndex <= 0 || sepIndex + 2 >= rest.length) {
    return trimmed;
  }
  return `${rest.slice(0, sepIndex)}:${rest.slice(sepIndex + 2)}`;
}

export function extractMcpServerName(grant: string): string {
  const normalized = normalizeMcpGrant(grant);
  const colonIndex = normalized.indexOf(':');
  return colonIndex >= 0 ? normalized.slice(0, colonIndex) : normalized;
}

