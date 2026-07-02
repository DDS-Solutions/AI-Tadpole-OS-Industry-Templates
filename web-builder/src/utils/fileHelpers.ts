import JSZip from 'jszip';
import type { Agent, WorkflowItem, MCPConnector } from '../types';

export const exportSwarmZip = async (
  companyInfo: { name: string; mission: string; size: string; industry: string },
  agents: Agent[],
  workflows: WorkflowItem[],
  selectedConnectors: string[],
  mcpCatalog: MCPConnector[]
) => {
  const zip = new JSZip();
  
  // Group workflows into standard workflows vs knowledge playbooks
  const standardWorkflows = workflows.filter(w => !w.isOkfPlaybook);
  const okfPlaybooks = workflows.filter(w => w.isOkfPlaybook);

  // swarm.json
  const required_mcps = selectedConnectors.map(id => {
    const c = mcpCatalog.find(mc => mc.id === id);
    return c ? `${c.path}/mcps.json` : '';
  }).filter(Boolean);

  const swarmJson: any = {
    $schema: "https://tadpoleos.dev/schemas/swarm-v1.json",
    name: `${companyInfo.name} Swarm`,
    version: "1.0.0",
    description: companyInfo.mission,
    industry: companyInfo.industry.toLowerCase(),
    company_size: parseInt(companyInfo.size),
    roster: agents.map(a => ({
      id: a.id,
      path: `agents/${a.id}.json`,
      role: a.role
    })),
    global_workflows: standardWorkflows.map(w => `workflows/${w.id}.md`)
  };

  if (required_mcps.length > 0) {
    swarmJson.required_mcps = required_mcps;
  }
  
  zip.file("swarm.json", JSON.stringify(swarmJson, null, 2));
  
  // agents/*.json
  const agentsFolder = zip.folder("agents");
  agents.forEach(agent => {
    agentsFolder?.file(`${agent.id}.json`, JSON.stringify({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      system_prompt: agent.prompt
    }, null, 2));
  });
  
  // workflows/*.md
  if (standardWorkflows.length > 0) {
    const workflowsFolder = zip.folder("workflows");
    standardWorkflows.forEach(workflow => {
      workflowsFolder?.file(`${workflow.id}.md`, `# Workflow: ${workflow.name}\n\n${workflow.description}`);
    });
  }

  // Ingest knowledge playbooks if any are defined
  if (okfPlaybooks.length > 0) {
    // Create knowledge.json
    const knowledgeJson = okfPlaybooks.map(w => ({
      title: w.name,
      description: w.description.slice(0, 200), // excerpt for desc
      topic: w.topic || companyInfo.industry.toLowerCase() || 'general',
      concept_type: w.conceptType || 'playbook',
      resource_uri: w.resourceUri || undefined,
      tags: w.tags || companyInfo.industry.toLowerCase() || 'general',
      text: w.description
    }));
    zip.file("knowledge.json", JSON.stringify(knowledgeJson, null, 2));

    // Create knowledge/*.md with YAML frontmatter
    const knowledgeFolder = zip.folder("knowledge");
    okfPlaybooks.forEach(w => {
      const cleanName = w.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const frontmatter = [
        "---",
        `title: "${w.name.replace(/"/g, '\\"')}"`,
        w.resourceUri ? `url: "${w.resourceUri}"` : null,
        w.tags ? `tags: "${w.tags.replace(/"/g, '\\"')}"` : null,
        `description: "${w.description.slice(0, 150).replace(/\n/g, ' ').replace(/"/g, '\\"')}"`,
        "---",
        "",
        `# ${w.name}`,
        "",
        `/workflows/${w.id}.md`
      ].filter(Boolean).join("\n");
      knowledgeFolder?.file(`${cleanName}.md`, frontmatter);
    });
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  const url = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${companyInfo.name.toLowerCase().replace(/\s+/g, '-')}-swarm.zip`;
  link.click();
};

export const fetchSwarmDetailsFromRepo = async (
  templatePath: string
): Promise<{ roster: Agent[]; workflows: WorkflowItem[] }> => {
  const rawBase = `https://raw.githubusercontent.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates/main/${templatePath}`;
  const response = await fetch(`${rawBase}/swarm.json`);
  if (!response.ok) throw new Error("Failed to fetch swarm.json");
  const swarmData = await response.json();

  // Fetch agents details from swarmData.roster
  const roster = await Promise.all(
    (swarmData.roster || []).map(async (agentRef: { id: string; path: string; role: string }) => {
      try {
        const agentRes = await fetch(`${rawBase}/${agentRef.path}`);
        if (agentRes.ok) {
          const agentDetails = await agentRes.json();
          return {
            id: agentRef.id,
            name: agentDetails.name || agentRef.id,
            role: agentDetails.role || agentRef.role || '',
            model: agentDetails.model_id || agentDetails.model || agentDetails.model_config?.model_id || 'gemini-pro-latest',
            prompt: agentDetails.system_prompt || agentDetails.model_config?.system_prompt || '',
            description: agentDetails.description || '',
            emoji: agentDetails.emoji || '🤖',
            color: agentDetails.color || '#3B82F6',
            vibe: agentDetails.vibe || ''
          };
        }
      } catch (e) {
        console.error("Error loading agent details", e);
      }
      return {
        id: agentRef.id,
        name: agentRef.id,
        role: agentRef.role || '',
        model: 'gemini-pro-latest',
        prompt: '',
        description: '',
        emoji: '🤖',
        color: '#3B82F6',
        vibe: ''
      };
    })
  );

  // Fetch workflows details from swarmData.global_workflows
  const workflows = await Promise.all(
    (swarmData.global_workflows || []).map(async (workflowPath: string) => {
      try {
        const workflowRes = await fetch(`${rawBase}/${workflowPath}`);
        if (workflowRes.ok) {
          const mdContent = await workflowRes.text();
          const nameMatch = mdContent.match(/^#\s*Workflow:\s*(.*)$/m) || mdContent.match(/^#\s*(.*)$/m);
          const name = nameMatch ? nameMatch[1].trim() : workflowPath.split('/').pop()?.replace('.md', '') || 'Workflow';
          const description = mdContent.replace(/^#.*$/m, '').trim();
          return {
            id: crypto.randomUUID(),
            name,
            description,
            isOkfPlaybook: false
          };
        }
      } catch (e) {
        console.error("Error loading workflow details", e);
      }
      return {
        id: crypto.randomUUID(),
        name: workflowPath.split('/').pop()?.replace('.md', '') || 'Workflow',
        description: '',
        isOkfPlaybook: false
      };
    })
  );

  return { roster, workflows };
};
