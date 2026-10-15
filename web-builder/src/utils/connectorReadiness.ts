import type { MCPConnector } from '../types';

// Metadata alone cannot provide a runnable connection. Export performs the full
// configuration, provenance, grant, and archive checks after this UI gate.
export function hasRuntimeDefinition(connector: MCPConnector): boolean {
  return Object.keys(connector.config?.mcpServers ?? {}).length > 0
    && Boolean(connector.tools?.length)
    && connector.status !== 'quarantined';
}
