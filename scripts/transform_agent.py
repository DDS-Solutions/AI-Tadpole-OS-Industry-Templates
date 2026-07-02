import os
import json
import re
import shutil

def clean_markdown(text):
    if not text:
        return ""
    # Strip leading/trailing whitespaces/newlines
    return text.strip()

def get_words(text):
    if not text:
        return set()
    words = re.findall(r'\w+', text.lower())
    stop = {"and", "the", "to", "of", "for", "in", "a", "with", "is", "on"}
    return set(w for w in words if w not in stop)

def extract_section_content(sections, patterns):
    """Finds section content matching one of the header pattern strings (case insensitive)."""
    for header, content in sections.items():
        for pattern in patterns:
            if re.search(pattern, header, re.IGNORECASE):
                return header, content
    return None, None

def derive_workflow_id(agent_id):
    # Strip common department prefixes
    prefixes = ['specialized-', 'finance-finance-', 'security-security-', 'engineering-engineering-', 'finance-', 'security-', 'engineering-', 'creative-']
    wf_id = agent_id
    for p in prefixes:
        if wf_id.startswith(p):
            wf_id = wf_id[len(p):]
            break
    # Convert to snake_case
    wf_id = wf_id.replace('-', '_')
    return wf_id

def parse_markdown_sections(markdown_text):
    sections = {}
    parts = re.split(r'^##\s+(.+)$', markdown_text, flags=re.MULTILINE)
    
    # The first part is the title/intro
    title_part = parts[0].strip()
    sections['_title_'] = title_part
    
    for i in range(1, len(parts), 2):
        header = parts[i].strip()
        content = parts[i+1].strip() if i+1 < len(parts) else ""
        sections[header] = content
        
    return sections

def build_workflow_steps(workflow_content, agent_name, core_mission_content, deliverables_content):
    steps = []
    
    if workflow_content:
        # Find all subheaders inside the workflow process content (e.g. ### Step 1: ... or ### Daily Operations)
        subheaders = re.findall(r'^###\s+(.+)$', workflow_content, flags=re.MULTILINE)
        if subheaders:
            parts = re.split(r'^###\s+.+$', workflow_content, flags=re.MULTILINE)
            for idx, header in enumerate(subheaders):
                content = parts[idx+1].strip() if idx+1 < len(parts) else ""
                step_num = idx + 1
                # Check if header already starts with "Step"
                if re.match(r'^Step\s+\d+[:.]', header, re.IGNORECASE):
                    header_text = header
                elif re.match(r'^\d+[:.]', header):
                    # e.g. "1. Document Intake" -> "Step N: Document Intake"
                    cleaned = re.sub(r'^\d+[:.]\s*', '', header)
                    header_text = f"Step {step_num}: {cleaned}"
                else:
                    header_text = f"Step {step_num}: {header}"
                
                steps.append(f"## {header_text}\n\n{content}")
        else:
            # Check if there are list items
            list_items = re.findall(r'^(?:-|\*|\d+\.)\s+(.+)$', workflow_content, flags=re.MULTILINE)
            if list_items:
                for idx, item in enumerate(list_items):
                    steps.append(f"## Step {idx+1}: Task {idx+1}\n\n{item}")
            else:
                steps.append(f"## Step 1: Process Execution\n\n{workflow_content}")
                
    elif core_mission_content:
        # Fallback to Core Mission subheaders
        subheaders = re.findall(r'^###\s+(.+)$', core_mission_content, flags=re.MULTILINE)
        if subheaders:
            parts = re.split(r'^###\s+.+$', core_mission_content, flags=re.MULTILINE)
            for idx, header in enumerate(subheaders):
                content = parts[idx+1].strip() if idx+1 < len(parts) else ""
                step_num = idx + 1
                steps.append(f"## Step {step_num}: {header}\n\n{content}")
        else:
            steps.append(f"## Step 1: Core Mission Execution\n\n{core_mission_content}")
            
    elif deliverables_content:
        # Fallback to deliverables subheaders
        subheaders = re.findall(r'^###\s+(.+)$', deliverables_content, flags=re.MULTILINE)
        if subheaders:
            parts = re.split(r'^###\s+.+$', deliverables_content, flags=re.MULTILINE)
            for idx, header in enumerate(subheaders):
                content = parts[idx+1].strip() if idx+1 < len(parts) else ""
                step_num = idx + 1
                steps.append(f"## Step {step_num}: {header}\n\n{content}")
        else:
            steps.append(f"## Step 1: Deliverables Preparation\n\n{deliverables_content}")
            
    else:
        steps.append(f"## Step 1: Task Execution\n\nExecute the core responsibilities matching the {agent_name} role description.")
        
    return "\n\n".join(steps)

def discover_skills(prompt_text, existing_skills):
    skills = set(existing_skills)
    skills.add("read_file") # default always present
    
    text_lower = prompt_text.lower()
    
    # Skill patterns mapping
    patterns = {
        "grep_search": [r"\bgrep\b", r"\bripgrep\b", r"\bsearch\b"],
        "write_to_file": [r"\bwrite\b", r"\bcreate file\b", r"\bgenerate file\b", r"\bsave file\b"],
        "replace_file_content": [r"\bedit file\b", r"\breplace content\b", r"\bmodify file\b", r"\breplace_file_content\b"],
        "run_command": [r"\bcommand line\b", r"\bexecute command\b", r"\brun command\b", r"\bterminal\b", r"\bshell\b"],
        "search_web": [r"\bweb search\b", r"\bsearch the web\b", r"\bgoogle search\b", r"\bsearch_web\b", r"\bscrape\b", r"\bscraping\b"]
    }
    
    for skill, regexes in patterns.items():
        for regex in regexes:
            if re.search(regex, text_lower):
                skills.add(skill)
                break
                
    return sorted(list(skills))

def transform_agent_prompt(agent_id, agent_name, prompt_text, existing_skills):
    sections = parse_markdown_sections(prompt_text)
    
    # Extract identity section
    _, identity_content = extract_section_content(sections, [r"identity", r"memory"])
    if not identity_content:
        # Fallback to the title introduction
        identity_content = sections['_title_']
        
    # Get the first paragraph of the identity section as personality definition
    paragraphs = [p.strip() for p in identity_content.split('\n\n') if p.strip()]
    personality = ""
    for p in paragraphs:
        if not p.startswith(('-', '*', '>', '#')):
            personality = p
            break
    if not personality:
        # Fallback to the first available non-header paragraph
        for p in paragraphs:
            if not p.startswith('#'):
                personality = p
                break
                
    # Clean up formatting marks
    personality = re.sub(r'\*\*', '', personality)
    personality = re.sub(r'__', '', personality)
    
    # Build slim personality system prompt
    suffix = " Follow the associated workflow SOP precisely."
    max_len = 800 - len(suffix)
    
    if len(personality) > max_len:
        # Truncate at sentence boundary
        truncated = personality[:max_len]
        last_dot = truncated.rfind('.')
        if last_dot > 100:
            personality = truncated[:last_dot + 1]
        else:
            personality = truncated + "..."
            
    slim_system_prompt = personality.strip() + suffix
    
    # Extract other procedural sections to construct workflow
    _, core_mission = extract_section_content(sections, [r"core mission", r"mission"])
    _, critical_rules = extract_section_content(sections, [r"critical rules", r"rules"])
    _, deliverables = extract_section_content(sections, [r"deliverables", r"templates"])
    _, workflow_process = extract_section_content(sections, [r"workflow", r"process", r"step"])
    _, domain_expertise = extract_section_content(sections, [r"domain expertise", r"expertise"])
    _, communication_style = extract_section_content(sections, [r"communication style", r"style"])
    _, success_metrics = extract_section_content(sections, [r"success metrics", r"metrics"])
    _, advanced_capabilities = extract_section_content(sections, [r"advanced capabilities", r"capabilities"])
    
    # Build the steps section
    steps_content = build_workflow_steps(workflow_process, agent_name, core_mission, deliverables)
    
    # Assemble workflow Markdown SOP
    wf_id = derive_workflow_id(agent_id)
    wf_md = []
    wf_md.append(f"# Workflow: {agent_name} SOP\n")
    
    if core_mission:
        wf_md.append(f"## Core Mission\n{core_mission}\n")
    if critical_rules:
        wf_md.append(f"## Critical Rules\n{critical_rules}\n")
    if deliverables:
        wf_md.append(f"## Technical Deliverables\n{deliverables}\n")
        
    wf_md.append(steps_content + "\n")
    
    if domain_expertise:
        wf_md.append(f"## Domain Expertise\n{domain_expertise}\n")
    if communication_style:
        wf_md.append(f"## Communication Style\n{communication_style}\n")
    if success_metrics:
        wf_md.append(f"## Success Metrics\n{success_metrics}\n")
    if advanced_capabilities:
        wf_md.append(f"## Advanced Capabilities\n{advanced_capabilities}\n")
        
    workflow_markdown = "\n".join(wf_md)
    
    # Discover skills
    skills = discover_skills(prompt_text, existing_skills)
    
    return slim_system_prompt, workflow_markdown, wf_id, skills

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    registry_path = os.path.join(base_dir, "registry.json")
    index_path = os.path.join(base_dir, "index.json")
    
    if not os.path.exists(registry_path):
        print(f"Error: registry.json not found at {registry_path}")
        return
        
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
        
    templates = registry.get("templates", [])
    
    # Map to store accumulated template skills
    template_skills_map = {}
    
    for t in templates:
        t_id = t["id"]
        t_path = os.path.join(base_dir, t["path"].replace("/", os.sep))
        agents_dir = os.path.join(t_path, "agents")
        workflows_dir = os.path.join(t_path, "workflows")
        
        if not os.path.exists(agents_dir):
            print(f"Skipping template {t_id}: no agents directory.")
            continue
            
        print(f"Restructuring agents & generating workflows for template '{t['name']}'...")
        
        # Ensure workflows directory exists
        os.makedirs(workflows_dir, exist_ok=True)
        
        # Store all skills across all agents in this template
        all_template_skills = set()
        
        for file_name in os.listdir(agents_dir):
            if not file_name.endswith(".json"):
                continue
                
            agent_file = os.path.join(agents_dir, file_name)
            with open(agent_file, "r", encoding="utf-8") as f:
                agent = json.load(f)
                
            agent_id = agent.get("id")
            agent_name = agent.get("name")
            model_config = agent.get("model_config", {})
            system_prompt = model_config.get("system_prompt", "")
            
            if not system_prompt or len(system_prompt) < 100 or "Follow the associated workflow" in system_prompt:
                # Already processed or empty prompt
                print(f"  -> Skipping agent {agent_id} (already slim or no system prompt).")
                for s in agent.get("skills", []):
                    all_template_skills.add(s)
                continue
                
            print(f"  -> Processing agent: {agent_name} ({agent_id})")
            
            slim_prompt, wf_md, wf_id, skills = transform_agent_prompt(
                agent_id, agent_name, system_prompt, agent.get("skills", [])
            )
            
            # Save workflow md
            wf_file_path = os.path.join(workflows_dir, f"{wf_id}.md")
            with open(wf_file_path, "w", encoding="utf-8") as f:
                f.write(wf_md)
                
            # Update agent JSON
            updated_agent = {
                "id": agent["id"],
                "name": agent["name"],
                "role": agent.get("role", agent["name"]),
                "department": agent.get("department", "Operations"),
                "description": agent.get("description", ""),
                "model_config": {
                    "system_prompt": slim_prompt
                },
                "skills": skills,
                "workflows": [wf_id]
            }
            
            with open(agent_file, "w", encoding="utf-8") as f:
                json.dump(updated_agent, f, indent=2, ensure_ascii=False)
                
            for s in skills:
                all_template_skills.add(s)
                
        template_skills_map[t_id] = sorted(list(all_template_skills))
        
    # Phase 3: Registry Integration & Verification
    print("\nAligning index.json and registry.json required_skills...")
    
    # 1. Update registry.json
    for t in registry.get("templates", []):
        t_id = t["id"]
        if t_id in template_skills_map:
            t["required_skills"] = template_skills_map[t_id]
            
    with open(registry_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
    print("  -> Updated registry.json")
        
    # 2. Update index.json
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            index_data = json.load(f)
            
        for t in index_data:
            t_id = t.get("id")
            if t_id in template_skills_map:
                t["required_skills"] = template_skills_map[t_id]
                
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)
        print("  -> Updated index.json")
        
    print("\nTransformation complete!")

if __name__ == '__main__':
    main()
