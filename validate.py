import os
import json

def validate_templates():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    registry_path = os.path.join(base_dir, "registry.json")
    
    if not os.path.exists(registry_path):
        print(f"Error: registry.json not found at {registry_path}")
        return False
        
    with open(registry_path, "r") as f:
        registry = json.load(f)
        
    templates = registry.get("templates", [])
    print(f"Loaded {len(templates)} templates from registry.json.\nStarting validation...\n")
    
    errors = 0
    warnings = 0
    
    for t in templates:
        t_id = t.get("id")
        t_name = t.get("name")
        t_path = t.get("path")
        
        print(f"[{t_id}] Validating '{t_name}' at '{t_path}'...")
        
        # 1. Check path exists
        full_path = os.path.join(base_dir, t_path.replace("/", os.sep))
        if not os.path.exists(full_path):
            print(f"  -> ERROR: Directory does not exist: {t_path}")
            errors += 1
            continue
            
        # 2. Check swarm.json exists
        swarm_json_path = os.path.join(full_path, "swarm.json")
        if not os.path.exists(swarm_json_path):
            print(f"  -> ERROR: swarm.json is missing in {t_path}")
            errors += 1
            continue
            
        # 3. Read and validate swarm.json
        try:
            with open(swarm_json_path, "r") as sf:
                swarm = json.load(sf)
        except Exception as e:
            print(f"  -> ERROR: Failed to parse swarm.json in {t_path}: {e}")
            errors += 1
            continue
            
        # 4. Check mcps.json reference
        required_mcps = swarm.get("required_mcps")
        if required_mcps:
            mcps_file_path = os.path.join(full_path, required_mcps)
            if not os.path.exists(mcps_file_path):
                print(f"  -> WARNING: swarm.json references '{required_mcps}' but the file does not exist in {t_path}")
                warnings += 1
                
        # 5. Validate Roster agents
        roster = swarm.get("roster", [])
        if not roster:
            print(f"  -> WARNING: Swarm roster is empty in {t_path}")
            warnings += 1
            
        for agent_ref in roster:
            agent_path = agent_ref.get("path")
            if not agent_path:
                print(f"  -> ERROR: Agent reference has no 'path' in swarm.json of {t_path}")
                errors += 1
                continue
                
            full_agent_path = os.path.join(full_path, agent_path.replace("/", os.sep))
            if not os.path.exists(full_agent_path):
                print(f"  -> ERROR: Referenced agent file does not exist: {t_path}/{agent_path}")
                errors += 1
            else:
                # Validate agent JSON parsing
                try:
                    with open(full_agent_path, "r") as af:
                        json.load(af)
                except Exception as e:
                    print(f"  -> ERROR: Failed to parse agent JSON {t_path}/{agent_path}: {e}")
                    errors += 1
                    
        # 6. Validate Workflows
        global_workflows = swarm.get("global_workflows", [])
        for wf_path in global_workflows:
            full_wf_path = os.path.join(full_path, wf_path.replace("/", os.sep))
            if not os.path.exists(full_wf_path):
                print(f"  -> ERROR: Referenced workflow file does not exist: {t_path}/{wf_path}")
                errors += 1
                
    print("\n" + "="*40)
    print(f"Validation Finished: {errors} Errors, {warnings} Warnings.")
    print("="*40)
    
    return errors == 0

if __name__ == "__main__":
    validate_templates()
