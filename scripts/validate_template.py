import os
import json
import re
import sys

def validate_all_templates():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    registry_path = os.path.join(base_dir, "registry.json")
    
    if not os.path.exists(registry_path):
        print(f"Error: registry.json not found at {registry_path}")
        return False
        
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
        
    templates = registry.get("templates", [])
    print(f"Loaded {len(templates)} templates from registry.json.\nStarting native architecture validation...\n")
    
    errors = 0
    warnings = 0
    
    allowed_agent_keys = {"id", "name", "role", "department", "description", "model_config", "skills", "workflows"}
    
    for t in templates:
        t_id = t.get("id")
        t_name = t.get("name")
        t_path = t.get("path")
        
        full_path = os.path.join(base_dir, t_path.replace("/", os.sep))
        if not os.path.exists(full_path):
            print(f"[{t_id}] ERROR: Directory does not exist: {t_path}")
            errors += 1
            continue
            
        swarm_json_path = os.path.join(full_path, "swarm.json")
        if not os.path.exists(swarm_json_path):
            print(f"[{t_id}] ERROR: swarm.json is missing in {t_path}")
            errors += 1
            continue
            
        try:
            with open(swarm_json_path, "r", encoding="utf-8") as sf:
                swarm = json.load(sf)
        except Exception as e:
            print(f"[{t_id}] ERROR: Failed to parse swarm.json: {e}")
            errors += 1
            continue
            
        # Validate roster agents
        roster = swarm.get("roster", [])
        for agent_ref in roster:
            agent_path = agent_ref.get("path")
            if not agent_path:
                print(f"[{t_id}] ERROR: Agent reference has no 'path' in swarm.json")
                errors += 1
                continue
                
            full_agent_path = os.path.join(full_path, agent_path.replace("/", os.sep))
            if not os.path.exists(full_agent_path):
                print(f"[{t_id}] ERROR: Referenced agent file does not exist: {t_path}/{agent_path}")
                errors += 1
                continue
                
            try:
                with open(full_agent_path, "r", encoding="utf-8") as af:
                    agent = json.load(af)
            except Exception as e:
                print(f"[{t_id}] ERROR: Failed to parse agent JSON {t_path}/{agent_path}: {e}")
                errors += 1
                continue
                
            agent_id = agent.get("id")
            
            # 1. Assert schema keys
            extra_keys = set(agent.keys()) - allowed_agent_keys
            if extra_keys:
                print(f"[{t_id}][Agent: {agent_id}] ERROR: Disallowed keys found in agent JSON: {extra_keys}")
                errors += 1
                
            # 2. Assert prompt length
            model_config = agent.get("model_config", {})
            system_prompt = model_config.get("system_prompt", "")
            if not system_prompt:
                print(f"[{t_id}][Agent: {agent_id}] ERROR: system_prompt is missing or empty")
                errors += 1
            elif len(system_prompt) > 800:
                print(f"[{t_id}][Agent: {agent_id}] ERROR: system_prompt length exceeds 800 characters ({len(system_prompt)} chars)")
                errors += 1
                
            # 3. Assert workflows exist and are valid
            agent_workflows = agent.get("workflows", [])
            for wf_id in agent_workflows:
                wf_file_name = f"{wf_id}.md"
                wf_file_path = os.path.join(full_path, "workflows", wf_file_name)
                
                if not os.path.exists(wf_file_path):
                    print(f"[{t_id}][Agent: {agent_id}] ERROR: Workflow file does not exist: {t_path}/workflows/{wf_file_name}")
                    errors += 1
                    continue
                    
                # Read workflow and check for valid step headers
                with open(wf_file_path, "r", encoding="utf-8") as wff:
                    wf_content = wff.read()
                    
                step_headers = re.findall(r'^##\s+(Step\s+.*)$', wf_content, flags=re.MULTILINE)
                if not step_headers:
                    print(f"[{t_id}][Agent: {agent_id}] ERROR: Workflow {wf_file_name} has no valid step headers (## Step [Name])")
                    errors += 1
                    
    print("\n" + "="*45)
    print(f"Native Spec Validation Finished: {errors} Errors, {warnings} Warnings.")
    print("="*45)
    
    return errors == 0

if __name__ == "__main__":
    success = validate_all_templates()
    if not success:
        sys.exit(1)
