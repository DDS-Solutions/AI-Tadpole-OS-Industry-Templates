import os
import json
import re
import shutil

def get_words(text):
    if not text: return set()
    words = re.findall(r'\w+', text.lower())
    # remove common stop words
    stop = {"and", "the", "to", "of", "for", "in", "a", "with", "is", "on"}
    return set(w for w in words if w not in stop)

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    registry_path = os.path.join(base_dir, "registry.json")
    catalog_path = os.path.join(base_dir, "web-builder", "public", "ai-tadpole-catalog.json")
    
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
        
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)
        
    templates = registry.get("templates", [])
    
    # Pre-compute words for catalog
    for agent in catalog:
        text = agent["name"] + " " + agent["description"] + " " + agent.get("departmentLabel", "")
        agent["_words"] = get_words(text)
        
    for t in templates:
        t_path = os.path.join(base_dir, t["path"].replace("/", os.sep))
        swarm_file = os.path.join(t_path, "swarm.json")
        agents_dir = os.path.join(t_path, "agents")
        
        if not os.path.exists(swarm_file):
            print(f"Skipping {t['name']}, no swarm.json found.")
            continue
            
        t_text = t["name"] + " " + t["description"] + " " + " ".join(t.get("tags", [])) + " " + t["industry"]
        t_words = get_words(t_text)
        
        # Score agents
        for agent in catalog:
            agent["_score"] = len(t_words.intersection(agent["_words"]))
            
        # Sort by score desc
        sorted_agents = sorted(catalog, key=lambda x: x["_score"], reverse=True)
        top_agents = sorted_agents[:3]
        
        # Clear existing agents
        if os.path.exists(agents_dir):
            shutil.rmtree(agents_dir)
        os.makedirs(agents_dir, exist_ok=True)
        
        new_roster = []
        for i, agent in enumerate(top_agents):
            agent_id = agent["id"]
            # Save the new Tadpole OS agent format
            new_agent = {
                "id": agent_id,
                "name": agent["name"],
                "role": agent["name"],
                "department": agent.get("departmentLabel", "Operations"),
                "description": agent["description"],
                "status": "ready",
                "tokensUsed": 0,
                "costUsd": 0.0,
                "metadata": {
                    "role": agent["name"],
                    "department": agent.get("departmentLabel", "Operations")
                },
                "skills": ["read_file"],
                "workflows": [],
                "tokenUsage": {
                    "inputTokens": 0,
                    "outputTokens": 0,
                    "totalTokens": 0
                },
                "model_config": {
                    "provider": "google",
                    "model_id": "gemini-pro-latest",
                    "system_prompt": agent["prompt"]
                },
                "model_id": "gemini-pro-latest",
                "budget_usd": 150.0,
                "budgetUsd": 150.0
            }
            
            agent_file = os.path.join(agents_dir, f"{agent_id}.json")
            with open(agent_file, "w", encoding="utf-8") as f:
                json.dump(new_agent, f, indent=2)
                
            new_roster.append({
                "id": agent_id,
                "path": f"agents/{agent_id}.json",
                "supervisor": None,
                "priority": "critical" if i == 0 else "normal"
            })
            
        # Update swarm.json
        with open(swarm_file, "r", encoding="utf-8") as f:
            swarm_data = json.load(f)
            
        swarm_data["roster"] = new_roster
        
        with open(swarm_file, "w", encoding="utf-8") as f:
            json.dump(swarm_data, f, indent=2)
            
        print(f"Upgraded template '{t['name']}' with {len(new_roster)} agents.")

if __name__ == '__main__':
    main()
