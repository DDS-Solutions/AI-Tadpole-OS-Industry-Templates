import { useId, useState } from 'react';
import { Database, Globe, Key, ShieldAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDialog, getModalMotionProps } from './useDialog';
import { DialogHeader } from './DialogHeader';
import { DialogFooter } from './DialogFooter';
import type { MCPConnector, MCPToolDescriptor } from '../../types';
import { ENGINE_PRIVATE_ENV_VARS } from '../../utils/validation';

interface McpEditorProps {
  connector: MCPConnector;
  onClose: () => void;
  onSave: (updatedConnector: MCPConnector) => void;
}

export default function McpEditor({ connector, onClose, onSave }: McpEditorProps) {
  const dialogRef = useDialog<HTMLFormElement>(onClose);
  const fieldId = useId();
  const reducedMotion = useReducedMotion();
  const [name, setName] = useState(connector.name);
  const [category, setCategory] = useState(connector.category);
  const [version, setVersion] = useState(connector.version);
  const [description, setDescription] = useState(connector.description);
  const [path, setPath] = useState(connector.path);

  const firstServerKey = Object.keys(connector.config?.mcpServers || {})[0]
    || connector.id.replace(/^mcp-/, '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
    || 'custom-server';
  const existingServer = connector.config?.mcpServers?.[firstServerKey];
  const [serverKey, setServerKey] = useState(firstServerKey);
  const [remoteUrl, setRemoteUrl] = useState(existingServer?.url || '');
  const [authHeader, setAuthHeader] = useState(existingServer?.headers?.['Authorization'] || '');
  const [secretVar, setSecretVar] = useState(
    Object.keys(connector.required_env || {})[0] || ''
  );
  const [toolName, setToolName] = useState(
    connector.tools?.[0]?.name || 'Query records'
  );
  const [toolRisk, setToolRisk] = useState<'read' | 'write' | 'execute'>(
    connector.tools?.[0]?.risk || 'read'
  );

  const cleanServerKey = serverKey.trim().toLowerCase();
  const isReservedGev = cleanServerKey === 'gev';
  const cleanSecretVar = secretVar.trim().toUpperCase();
  const isReservedSecret = ENGINE_PRIVATE_ENV_VARS.has(cleanSecretVar);
  const hasUrl = Boolean(remoteUrl.trim());
  const isUrlValid = !hasUrl || /^https?:\/\/\S+/i.test(remoteUrl.trim());

  const canSave = Boolean(
    name.trim()
    && category.trim()
    && path.trim()
    && isUrlValid
    && !isReservedGev
    && !isReservedSecret
  );

  const handleSave = () => {
    if (!canSave) return;

    let updatedConfig = connector.config;
    let updatedTools = connector.tools;
    let updatedRequiredEnv = connector.required_env;
    let updatedStatus = connector.status;

    if (hasUrl) {
      const headers: Record<string, string> = {};
      if (authHeader.trim()) {
        headers['Authorization'] = authHeader.trim();
      } else if (cleanSecretVar) {
        headers['Authorization'] = `Bearer \${${cleanSecretVar}}`;
      }

      updatedConfig = {
        mcpServers: {
          [cleanServerKey]: {
            url: remoteUrl.trim(),
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            protocol_version: '2026-07-28',
          },
        },
      };

      const toolSlug = toolName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'query';
      const declaredTool: MCPToolDescriptor = {
        id: `${cleanServerKey}:${toolSlug}`,
        name: toolName.trim() || `${name.trim()} Tool`,
        description: `Execute ${toolName.trim()} on ${name.trim()}.`,
        risk: toolRisk,
      };

      updatedTools = [declaredTool];
      if (cleanSecretVar) {
        updatedRequiredEnv = {
          [cleanSecretVar]: {
            description: `${name.trim()} API Credential`,
            placeholder: 'YOUR_API_KEY_HERE',
          },
        };
      }
      updatedStatus = 'reviewed';
    }

    onSave({
      ...connector,
      name: name.trim(),
      category: category.trim(),
      version: version.trim(),
      description: description.trim(),
      path: path.trim(),
      config: updatedConfig,
      tools: updatedTools,
      required_env: updatedRequiredEnv,
      status: updatedStatus,
    });
  };

  return (
    <motion.form
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${fieldId}-title`}
      aria-describedby={`${fieldId}-summary`}
      tabIndex={-1}
      onSubmit={event => { event.preventDefault(); handleSave(); }}
      {...getModalMotionProps(Boolean(reducedMotion))}
      className="sovereign-panel w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
      <DialogHeader
        id={`${fieldId}-title`}
        summaryId={`${fieldId}-summary`}
        title="Configure MCP Data Connector"
        summary="Name, category, and blueprint path are required."
        icon={<Database className="w-5 h-5 shrink-0 text-cyber-green" />}
        onClose={onClose}
        closeAriaLabel="Close connector editor"
        borderColor="color-mix(in srgb, var(--color-zinc-800) 40%, transparent)"
      />

      {/* Form Body */}
      <div className="min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5">

        {/* Name, Category, Version */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`${fieldId}-name`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Connector Name</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., Salesforce Sync"
              id={`${fieldId}-name`}
              data-dialog-initial-focus
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-category`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Category</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., CRM & SaaS"
              id={`${fieldId}-category`}
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-version`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Version</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., 1.0.0"
              id={`${fieldId}-version`}
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </div>
        </div>

        {/* Blueprint File/Directory Path */}
        <div>
          <label htmlFor={`${fieldId}-path`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Blueprint Path / Repository URI</label>
          <input
            type="text"
            className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
            placeholder="e.g., mcp-blueprints/salesforce-sync"
            id={`${fieldId}-path`}
            required
            value={path}
            onChange={e => setPath(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor={`${fieldId}-description`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Description / Purpose</label>
          <textarea
            className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-sans text-base sm:text-xs text-zinc-300 focus:border-cyber-green outline-none h-24 leading-relaxed resize-none"
            placeholder="Describe what data resources this MCP server exposes to the swarm..."
            id={`${fieldId}-description`}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Remote MCP Runtime Configuration (Optional for Streamable HTTP Connectors) */}
        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 space-y-4">
          <div className="flex items-center gap-2 text-cyber-green">
            <Globe className="w-4 h-4 shrink-0" />
            <h4 className="text-xs font-semibold text-zinc-200">Remote MCP Server Configuration (Optional)</h4>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Provide a remote HTTPS Streamable MCP endpoint. Tadpole-OS will prompt for missing secrets via the MCP Secrets Wizard on import.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${fieldId}-serverKey`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Server Key / ID</label>
              <input
                type="text"
                className={`focus-sovereign w-full min-w-0 bg-zinc-950 border ${isReservedGev ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-cyber-green outline-none font-mono`}
                placeholder="e.g. salesforce"
                id={`${fieldId}-serverKey`}
                value={serverKey}
                onChange={e => setServerKey(e.target.value)}
              />
              {isReservedGev && (
                <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> 'gev' is reserved for Tadpole-OS internal runtime
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${fieldId}-remoteUrl`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Remote Streamable MCP URL</label>
              <input
                type="url"
                className={`focus-sovereign w-full min-w-0 bg-zinc-950 border ${!isUrlValid ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-cyber-green outline-none font-mono`}
                placeholder="https://api.example.com/mcp"
                id={`${fieldId}-remoteUrl`}
                value={remoteUrl}
                onChange={e => setRemoteUrl(e.target.value)}
              />
              {!isUrlValid && (
                <p className="mt-1 text-[11px] text-red-400">Must begin with https:// or http://</p>
              )}
            </div>
          </div>

          {hasUrl && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-850">
              <div>
                <label htmlFor={`${fieldId}-secretVar`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                  <Key className="w-3 h-3 text-cyber-green" /> Credential Var Name
                </label>
                <input
                  type="text"
                  className={`focus-sovereign w-full min-w-0 bg-zinc-950 border ${isReservedSecret ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-cyber-green outline-none font-mono`}
                  placeholder="e.g. SALESFORCE_API_KEY"
                  id={`${fieldId}-secretVar`}
                  value={secretVar}
                  onChange={e => setSecretVar(e.target.value.toUpperCase())}
                />
                {isReservedSecret && (
                  <p className="mt-1 text-[10px] text-red-400">Cannot use reserved engine private variable</p>
                )}
              </div>

              <div>
                <label htmlFor={`${fieldId}-authHeader`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Authorization Header Value</label>
                <input
                  type="text"
                  className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-cyber-green outline-none font-mono"
                  placeholder={cleanSecretVar ? `Bearer \${${cleanSecretVar}}` : 'Bearer ${API_KEY}'}
                  id={`${fieldId}-authHeader`}
                  value={authHeader}
                  onChange={e => setAuthHeader(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-toolName`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Primary Tool Name</label>
                <input
                  type="text"
                  className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-cyber-green outline-none"
                  placeholder="e.g. Query records"
                  id={`${fieldId}-toolName`}
                  value={toolName}
                  onChange={e => setToolName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-toolRisk`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Primary Tool Risk</label>
                <select
                  className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-cyber-green outline-none cursor-pointer"
                  id={`${fieldId}-toolRisk`}
                  value={toolRisk}
                  onChange={e => setToolRisk(e.target.value as 'read' | 'write' | 'execute')}
                >
                  <option value="read">Read (Safe querying)</option>
                  <option value="write">Write (Requires oversight)</option>
                  <option value="execute">Execute (Requires oversight)</option>
                </select>
              </div>
            </div>
          )}
        </div>

      </div>

      <DialogFooter onCancel={onClose} canSave={canSave} saveLabel="Save Connector" />
    </motion.form>
  );
}
