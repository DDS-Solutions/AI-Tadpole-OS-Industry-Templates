import type { TemplateItem } from './types';

export const INDUSTRY_MAP = [
  {
    "name": "Legal Services",
    "path": "legal",
    "keywords": [
      "law",
      "contract",
      "litigation",
      "legal"
    ]
  },
  {
    "name": "Medical Practices",
    "path": "healthcare",
    "keywords": [
      "health",
      "patient",
      "medical",
      "doctor",
      "clinic"
    ]
  },
  {
    "name": "Financial Services",
    "path": "financial-services",
    "keywords": [
      "money",
      "bank",
      "finance",
      "tax",
      "audit",
      "accounting"
    ]
  },
  {
    "name": "Digital Marketing",
    "path": "digital-marketing",
    "keywords": [
      "ads",
      "marketing",
      "social media",
      "content",
      "seo"
    ]
  },
  {
    "name": "E-commerce",
    "path": "e-commerce",
    "keywords": [
      "store",
      "shop",
      "product",
      "retail",
      "sales"
    ]
  },
  {
    "name": "Real Estate",
    "path": "real-estate",
    "keywords": [
      "house",
      "property",
      "realtor",
      "escrow",
      "mls"
    ]
  },
  {
    "name": "Manufacturing",
    "path": "manufacturing",
    "keywords": [
      "factory",
      "production",
      "inventory",
      "machine",
      "order"
    ]
  },
  {
    "name": "Software Development",
    "path": "development",
    "keywords": [
      "code",
      "software",
      "app",
      "developer",
      "api"
    ]
  },
  {
    "name": "Food & Beverage",
    "path": "food",
    "keywords": [
      "food",
      "restaurant",
      "menu",
      "kitchen",
      "recipe",
      "inventory"
    ]
  },
  {
    "name": "Chemical Sector",
    "path": "chemical",
    "keywords": [
      "chemical",
      "safety",
      "sds",
      "toxic",
      "hazardous"
    ]
  },
  {
    "name": "Transportation & Logistics",
    "path": "transportation",
    "keywords": [
      "transportation",
      "fleet",
      "delivery",
      "route",
      "truck",
      "driver"
    ]
  },
  {
    "name": "Pharmaceuticals",
    "path": "pharma",
    "keywords": [
      "pharma",
      "clinical",
      "trial",
      "adverse",
      "drug",
      "protocol"
    ]
  },
  {
    "name": "Agriculture & AgTech",
    "path": "agriculture",
    "keywords": [
      "agriculture",
      "farm",
      "soil",
      "crop",
      "irrigation",
      "weather"
    ]
  },
  {
    "name": "Governance & Compliance",
    "path": "compliance",
    "keywords": [
      "compliance",
      "audit",
      "soc2",
      "iso",
      "security",
      "regulatory"
    ]
  },
  {
    "name": "Cybersecurity",
    "path": "security",
    "keywords": [
      "security",
      "cybersecurity",
      "secops",
      "log",
      "firewall",
      "threat",
      "incident"
    ]
  },
  {
    "name": "Human Resources",
    "path": "hr",
    "keywords": [
      "hr",
      "recruiting",
      "resume",
      "onboarding",
      "candidate",
      "hiring",
      "talent"
    ]
  },
  {
    "name": "Education",
    "path": "education",
    "keywords": [
      "education",
      "curriculum",
      "lesson",
      "student",
      "grade",
      "school",
      "learn"
    ]
  },
  {
    "name": "Critical Infrastructure",
    "path": "utilities",
    "keywords": [
      "utility",
      "grid",
      "power",
      "telemetry",
      "scada",
      "substation",
      "maintenance"
    ]
  },
  {
    "name": "Media & Creative",
    "path": "creative",
    "keywords": [
      "media",
      "creative",
      "asset",
      "game",
      "dialog",
      "narrative",
      "localization"
    ]
  },
  {
    "name": "Specialized Consultancies",
    "path": "specialized-consultancies",
    "keywords": [
      "consulting",
      "advisory",
      "strategy",
      "management",
      "consultant"
    ]
  },
  {
    "name": "Logistics & Supply Chain",
    "path": "logistics-supply-chain",
    "keywords": [
      "supply chain",
      "warehouse",
      "dock",
      "freight",
      "procurement",
      "shipping"
    ]
  },
  {
    "name": "Engineering & Architecture",
    "path": "engineering-architecture",
    "keywords": [
      "engineering",
      "architecture",
      "cad",
      "structural",
      "blueprint",
      "specs"
    ]
  },
  {
    "name": "EdTech & Training",
    "path": "edtech-training",
    "keywords": [
      "edtech",
      "training",
      "e-learning",
      "course",
      "instructional",
      "pedagogy"
    ]
  },
  {
    "name": "Field Services",
    "path": "field-services",
    "keywords": [
      "field service",
      "dispatch",
      "technician",
      "hvac",
      "plumbing",
      "electrical",
      "maintenance"
    ]
  },
  {
    "name": "Wholesale & Distribution",
    "path": "wholesale-distribution",
    "keywords": [
      "wholesale",
      "distribution",
      "distributor",
      "b2b",
      "bulk",
      "merchant"
    ]
  }
];

export const REGISTRY: TemplateItem[] = [
  { id: "legal-contract-review", name: "Legal Contract Auditor", description: "AI-driven contract analysis, litigation forecasting, and automated discovery.", industry: "Legal Services", path: "legal/contract-review", tags: ["law", "contracts", "auditing"], company_size: 25 },
  { id: "healthcare-patient-intake", name: "Patient Intake Automation", description: "Process clinical data and automate patient intake workflows.", industry: "Medical Practices", path: "healthcare/patient-intake", tags: ["healthcare", "intake", "medical"], company_size: 25 },
  { id: "development-code-reviewer", name: "Sr. Architect Reviewer", description: "Automated code review and architectural auditing from a senior perspective.", industry: "Software Development", path: "development/code-reviewer", tags: ["development", "devops", "code-review"], company_size: 50 },
  { id: "bookkeeping-audit", name: "SMB Bookkeeping Swarm", description: "Automated daily reconciliation, tax optimization, and digital audit trails.", industry: "Financial Services", path: "financial-services/bookkeeping-audit", tags: ["finance", "accounting", "tax", "audit"], company_size: 50 },
  { id: "full-funnel-automation", name: "Marketing Funnel Pilot", description: "Automated content generation, ad spend optimization, and journey analytics.", industry: "Digital Marketing", path: "digital-marketing/full-funnel-automation", tags: ["marketing", "ads", "content", "automation"], company_size: 50 },
  { id: "lead-transaction-management", name: "Real Estate Closer", description: "Automated lead nurturing, MLS syndication, and escrow timeline tracking.", industry: "Real Estate", path: "real-estate/lead-transaction", tags: ["real-estate", "leads", "transactions", "automation"], company_size: 25 },
  { id: "manufacturing-job-shop-25", name: "Job Shop (25 Seats)", description: "Optimized production scheduling and material tracking for small-scale manufacturing.", industry: "Manufacturing", path: "manufacturing/job-shop-25", tags: ["manufacturing", "production", "inventory"], company_size: 25 },
  { id: "manufacturing-medium-plant-50", name: "Medium Plant (50 Seats)", description: "Predictive maintenance and supply chain orchestration for medium-sized facilities.", industry: "Manufacturing", path: "manufacturing/medium-plant-50", tags: ["manufacturing", "maintenance", "supply-chain"], company_size: 50 },
  { id: "manufacturing-smart-factory-100", name: "Smart Factory (100 Seats)", description: "Enterprise-level ERP integration and digital twin synchronization across sites.", industry: "Manufacturing", path: "manufacturing/smart-factory-100", tags: ["smart-factory", "digital-twin", "erp"], company_size: 100 },
  { id: "food-restaurant-ops", name: "Food & Beverage Operations", description: "Automate kitchen inventory, menu performance analytics, and supplier ordering workflows.", industry: "Food & Beverage", path: "food/restaurant-ops", tags: ["food", "restaurant", "inventory", "ordering"], company_size: 25 },
  { id: "chemical-process-safety", name: "Chemical Safety Auditor", description: "Automate chemical inventory, Safety Data Sheet (SDS) compliance auditing, and safety checklists.", industry: "Chemical Sector", path: "chemical/process-safety", tags: ["chemical", "safety", "compliance"], company_size: 25 },
  { id: "transportation-fleet-logistics", name: "Fleet Logistics Swarm", description: "Fleet scheduling, route optimization, maintenance tracking, and fuel efficiency analytics.", industry: "Transportation & Logistics", path: "transportation/fleet-logistics", tags: ["transportation", "fleet", "logistics"], company_size: 25 },
  { id: "pharma-clinical-trials", name: "Clinical Trial Manager", description: "Automate clinical trial protocol mapping, trial candidate documentation, and adverse event logging.", industry: "Pharmaceuticals", path: "pharma/clinical-trials", tags: ["pharma", "clinical", "compliance"], company_size: 25 },
  { id: "agriculture-precision-farming", name: "Precision Agriculture Swarm", description: "Crop yield forecasting, soil health telemetry analysis, and irrigation optimization.", industry: "Agriculture & AgTech", path: "agriculture/precision-farming", tags: ["agriculture", "farming", "analytics"], company_size: 25 },
  { id: "compliance-regulatory-audit", name: "Regulatory Compliance Swarm", description: "Continuous security posture assessment, SOC2/ISO readiness checks, and regulatory compliance mapping.", industry: "Governance & Compliance", path: "compliance/regulatory-audit", tags: ["compliance", "audit", "security"], company_size: 25 },
  { id: "security-incident-response", name: "Incident Response Swarm", description: "Designed for security log auditing, incident triage, and automated mitigation recommendation.", industry: "Cybersecurity", path: "security/incident-response", tags: ["security", "secops", "incident-response"], company_size: 25 },
  { id: "hr-recruiting-triage", name: "Recruiting Triage Swarm", description: "Designed for parsing candidate resumes, screening against role criteria, and coordinating onboarding files.", industry: "Human Resources", path: "hr/recruiting-triage", tags: ["hr", "recruiting", "onboarding"], company_size: 25 },
  { id: "education-curriculum-planner", name: "Curriculum Planner Swarm", description: "Designed for curriculum audit mapping, lesson plan alignment, and student analytics reviews.", industry: "Education", path: "education/curriculum-planner", tags: ["education", "curriculum", "analytics"], company_size: 25 },
  { id: "utilities-grid-telemetry", name: "Grid Telemetry Swarm", description: "Designed for grid status logs auditing, alarm triage, and utility crew scheduling.", industry: "Critical Infrastructure", path: "utilities/grid-telemetry", tags: ["utilities", "grid", "telemetry", "scada"], company_size: 25 },
  { id: "creative-asset-pipeline", name: "Creative Asset Pipeline Swarm", description: "Designed for creative asset verification, size budget checks, and dialog localization tracking.", industry: "Media & Creative", path: "creative/asset-pipeline", tags: ["creative", "media", "assets", "localization"], company_size: 25 },
  { id: "legal-precedent-synthesis", name: "Legal Precedent Synthesizer", description: "Knowledge Work: Automated analysis of legal precedents, case law synthesis, and document drafting.", industry: "Legal Services", path: "legal/precedent-synthesis", tags: ["law", "precedents", "synthesis", "knowledge"], company_size: 25 },
  { id: "legal-procurement-qa", name: "Legal Vendor Procurement & QA", description: "Edge Operations: Purchasing audits, contract lifecycle QA, and vendor compliance assessment.", industry: "Legal Services", path: "legal/procurement-qa", tags: ["law", "purchasing", "qa", "vendor-compliance"], company_size: 25 },
  { id: "medical-clinical-guidelines", name: "Clinical Guideline Indexer", description: "Knowledge Work: Processing medical research, clinical protocols indexing, and case summary generation.", industry: "Medical Practices", path: "healthcare/clinical-guidelines", tags: ["healthcare", "protocols", "indexing", "clinical"], company_size: 25 },
  { id: "medical-inventory-qa", name: "Medical Inventory & Procurement QA", description: "Edge Operations: Purchasing medical supplies, shipping, receiving audits, and ISO compliance sterilization QA.", industry: "Medical Practices", path: "healthcare/inventory-qa", tags: ["healthcare", "inventory", "shipping", "iso9000", "procurement"], company_size: 25 },
  { id: "financial-policy-synthesizer", name: "Tax Law & Policy Synthesizer", description: "Knowledge Work: Financial research, tax law changes synthesis, policy auditing, and regulatory reporting.", industry: "Financial Services", path: "financial-services/policy-synthesizer", tags: ["finance", "tax", "policy", "synthesis"], company_size: 25 },
  { id: "financial-vendor-reconciliation", name: "Vendor Invoice & Purchasing QA", description: "Edge Operations: Invoice processing, shipping validation, vendor ledger audits, and purchase reconciliation.", industry: "Financial Services", path: "financial-services/vendor-reconciliation", tags: ["finance", "invoices", "reconciliation", "purchasing", "audit"], company_size: 25 },
  { id: "marketing-seo-indexer", name: "SEO Content Strategy Indexer", description: "Knowledge Work: Web scraping, SEO keyword trend analysis, search intent mapping, and strategy synthesis.", industry: "Digital Marketing", path: "digital-marketing/seo-indexer", tags: ["marketing", "seo", "content-strategy", "synthesis"], company_size: 25 },
  { id: "marketing-vendor-purchasing", name: "Ad Spend & Vendor Purchasing QA", description: "Edge Operations: Media buy procurement, invoice verification, ad network compliance, and ISO quality auditing.", industry: "Digital Marketing", path: "digital-marketing/vendor-purchasing", tags: ["marketing", "adspend", "purchasing", "compliance", "vendor-qa"], company_size: 25 },
  { id: "ecommerce-market-analysis", name: "Competitor & Market Trend Analyzer", description: "Knowledge Work: E-commerce catalog scraping, competitor pricing intelligence, and trend synthesis.", industry: "E-commerce", path: "e-commerce/market-analysis", tags: ["e-commerce", "competitor-pricing", "trends", "market-analysis"], company_size: 25 },
  { id: "ecommerce-dispatch-qa", name: "Warehouse Dispatch & Shipping QA", description: "Edge Operations: Shipping dispatch, receiving validation, inventory auditing, and packaging quality control.", industry: "E-commerce", path: "e-commerce/dispatch-qa", tags: ["e-commerce", "shipping", "receiving", "inventory", "qa"], company_size: 25 },
  { id: "realestate-valuation-synthesizer", name: "Property Valuation & Appraisal Synthesizer", description: "Knowledge Work: Property data compilation, local market appraisal indexing, and trend report writing.", industry: "Real Estate", path: "real-estate/valuation-synthesizer", tags: ["real-estate", "valuation", "appraisal", "synthesis"], company_size: 25 },
  { id: "realestate-maintenance-procurement", name: "Maintenance Procurement & Contractor QA", description: "Edge Operations: Facilities purchasing, material inventory, shipping parts, and contractor SLA quality audits.", industry: "Real Estate", path: "real-estate/maintenance-procurement", tags: ["real-estate", "procurement", "inventory", "contractor-qa", "maintenance"], company_size: 25 },
  { id: "consultancy-expert-synthesizer", name: "Expert Knowledge Harvester", description: "Knowledge Work: Client interview transcription analysis, expert feedback harvesting, and methodology synthesis.", industry: "Specialized Consultancies", path: "specialized-consultancies/expert-synthesizer", tags: ["consultancy", "knowledge-management", "synthesis", "interviews"], company_size: 25 },
  { id: "consultancy-subcontractor-qa", name: "Subcontractor Procurement & QA", description: "Edge Operations: Consultant onboarding procurement, shipping materials, project timesheet QA, and ISO compliance.", industry: "Specialized Consultancies", path: "specialized-consultancies/subcontractor-qa", tags: ["consultancy", "procurement", "timesheet-qa", "iso9000"], company_size: 25 },
  { id: "logistics-route-optimization", name: "Route & Transit Strategy Analyzer", description: "Knowledge Work: Freight data analysis, carrier performance indexing, transit delay prediction, and strategic synthesis.", industry: "Logistics & Supply Chain", path: "logistics-supply-chain/route-optimization", tags: ["logistics", "route-planning", "transit-data", "synthesis"], company_size: 25 },
  { id: "logistics-dock-shipping", name: "Loading Dock Shipping & Receiving QA", description: "Edge Operations: Freight loading, receiving, container seals inspections, inventory logging, and ISO 9000 audits.", industry: "Logistics & Supply Chain", path: "logistics-supply-chain/dock-shipping", tags: ["logistics", "shipping", "receiving", "iso9000", "warehouse"], company_size: 25 },
  { id: "engineering-spec-compliance", name: "Engineering Spec & Code Compliance Auditor", description: "Knowledge Work: Reviewing structural specifications, municipal building codes indexing, and safety compliance audits.", industry: "Engineering & Architecture", path: "engineering-architecture/spec-compliance", tags: ["engineering", "compliance", "building-codes", "auditing"], company_size: 25 },
  { id: "engineering-parts-procurement", name: "CAD Material Purchasing & ISO 9000 QA", description: "Edge Operations: Raw materials purchasing, parts receiving, supplier testing certs, and metallurgical quality QA.", industry: "Engineering & Architecture", path: "engineering-architecture/parts-procurement", tags: ["engineering", "procurement", "inventory", "iso9000", "materials"], company_size: 25 },
  { id: "edtech-curriculum-synthesizer", name: "EdTech Curriculum & Course Indexer", description: "Knowledge Work: Educational standards mapping, syllabus content synthesis, and training guideline indexing.", industry: "EdTech & Training", path: "edtech-training/curriculum-synthesizer", tags: ["education", "curriculum", "syllabus", "indexing"], company_size: 25 },
  { id: "edtech-license-procurement", name: "Software License Procurement & Asset Audit", description: "Edge Operations: SaaS license purchasing, hardware cataloging, asset shipping, and software inventory audits.", industry: "EdTech & Training", path: "edtech-training/license-procurement", tags: ["education", "procurement", "inventory", "saas-licensing", "software-asset"], company_size: 25 },
  { id: "development-docs-synthesizer", name: "Tech Spec & API Documentation Indexer", description: "Knowledge Work: Parsing codebase schemas, indexing API documentation, and tech spec synthesis.", industry: "Software Development", path: "development/docs-synthesizer", tags: ["development", "api", "documentation", "synthesis"], company_size: 25 },
  { id: "development-qa-iso9000", name: "Release Quality Assurance & ISO 9000", description: "Edge Operations: Software release QA, test compliance auditing, security asset shipping, and patch management.", industry: "Software Development", path: "development/qa-iso9000", tags: ["development", "qa", "iso9000", "release-management", "security"], company_size: 25 },
  { id: "manufacturing-design-synthesizer", name: "CAD Design Specification Auditor", description: "Knowledge Work: Reviewing product designs, indexing mechanical blueprints, and material compliance audits.", industry: "Manufacturing", path: "manufacturing/design-synthesizer", tags: ["manufacturing", "cad", "specifications", "synthesis"], company_size: 25 },
  { id: "manufacturing-iso9000-qa", name: "Factory Floor ISO 9000 QA & Inventory", description: "Edge Operations: Materials receiving, shipping finished goods, parts inventory audits, and ISO 9000 quality checks.", industry: "Manufacturing", path: "manufacturing/iso9000-qa", tags: ["manufacturing", "iso9000", "qa", "inventory", "shipping"], company_size: 25 },
  { id: "food-recipe-compliance", name: "Recipe & Safety Compliance Auditor", description: "Knowledge Work: Analyzing recipe regulations, health guidelines indexing, and labeling audit reporting.", industry: "Food & Beverage", path: "food/recipe-compliance", tags: ["food", "compliance", "safety", "recipe-standards"], company_size: 25 },
  { id: "food-inventory-receiving", name: "Kitchen Inventory Receiving & Supplier QA", description: "Edge Operations: Purchasing ingredients, temperature shipping checks, receiving logs, and supplier quality audits.", industry: "Food & Beverage", path: "food/inventory-receiving", tags: ["food", "inventory", "shipping", "supplier-qa", "receiving"], company_size: 25 },
  { id: "chemical-sds-synthesizer", name: "Safety Data Sheet (SDS) Policy Indexer", description: "Knowledge Work: SDS sheet parsing, OSHA hazard mapping, and health regulations synthesis.", industry: "Chemical Sector", path: "chemical/sds-synthesizer", tags: ["chemical", "sds", "osha", "compliance", "safety"], company_size: 25 },
  { id: "chemical-hazmat-shipping", name: "Hazmat Shipping, Receiving & ISO QA", description: "Edge Operations: Hazmat container shipping, receiving checks, containment inventory, and ISO 9000 compliance audits.", industry: "Chemical Sector", path: "chemical/hazmat-shipping", tags: ["chemical", "hazmat", "shipping", "receiving", "iso9000", "inventory"], company_size: 25 },
  { id: "transportation-policy-compliance", name: "DOT Regulations Compliance Auditor", description: "Knowledge Work: Analyzing transit laws, DOT regulation changes indexing, and compliance reporting.", industry: "Transportation & Logistics", path: "transportation/policy-compliance", tags: ["transportation", "dot", "compliance", "auditing"], company_size: 25 },
  { id: "transportation-fleet-purchasing", name: "Spare Parts Inventory & Fleet Purchasing QA", description: "Edge Operations: Parts procurement, fleet shipping logs, inventory management, and maintenance QA.", industry: "Transportation & Logistics", path: "transportation/fleet-purchasing", tags: ["transportation", "procurement", "inventory", "parts", "maintenance-qa"], company_size: 25 },
  { id: "pharma-research-synthesizer", name: "Drug Discovery & FDA Guidelines Indexer", description: "Knowledge Work: Clinical study parsing, FDA protocol mapping, and compliance synthesis.", industry: "Pharmaceuticals", path: "pharma/research-synthesizer", tags: ["pharma", "fda", "clinical", "compliance", "indexing"], company_size: 25 },
  { id: "pharma-coldchain-shipping", name: "Cold-Chain Shipping Receiving & GMP QA", description: "Edge Operations: Thermally managed shipping, clinical stock receiving, and GMP quality inspections.", industry: "Pharmaceuticals", path: "pharma/coldchain-shipping", tags: ["pharma", "coldchain", "shipping", "receiving", "gmp", "qa"], company_size: 25 },
  { id: "agriculture-research-synthesizer", name: "Soil Science & Agronomy Database Indexer", description: "Knowledge Work: Soil telemetry data parsing, crop yields indexing, and agricultural research synthesis.", industry: "Agriculture & AgTech", path: "agriculture/research-synthesizer", tags: ["agriculture", "soil", "agronomy", "telemetry", "synthesis"], company_size: 25 },
  { id: "agriculture-grain-shipping", name: "Harvest Shipping & Equipment Parts Inventory", description: "Edge Operations: Bulk crop shipping logistics, receiving farming parts, and equipment maintenance QA.", industry: "Agriculture & AgTech", path: "agriculture/grain-shipping", tags: ["agriculture", "shipping", "inventory", "logistics", "maintenance-qa"], company_size: 25 },
  { id: "compliance-crosswalk-synthesizer", name: "SOC2/ISO Framework Crosswalk Synthesizer", description: "Knowledge Work: Regulatory framework mapping, control guidelines synthesis, and security standard crosswalk audits.", industry: "Governance & Compliance", path: "compliance/crosswalk-synthesizer", tags: ["compliance", "soc2", "iso27001", "crosswalk", "synthesis"], company_size: 25 },
  { id: "compliance-vendor-purchasing-qa", name: "Vendor Security Assessment & Procurement QA", description: "Edge Operations: Vendor onboarding security checks, compliance audits, and procurement security QA.", industry: "Governance & Compliance", path: "compliance/vendor-purchasing-qa", tags: ["compliance", "vendor-assessment", "procurement", "security-qa", "auditing"], company_size: 25 },
  { id: "security-threat-intelligence", name: "Threat Intel Feed Parser & Knowledge Base", description: "Knowledge Work: Scraping CVE bulletins, threat intel feed indexing, and security alert briefings synthesis.", industry: "Cybersecurity", path: "security/threat-intelligence", tags: ["security", "threat-intel", "cve", "synthesis"], company_size: 25 },
  { id: "security-hardware-inventory", name: "Security Hardware Purchasing & Asset QA", description: "Edge Operations: Network hardware procurement, firewall shipping audits, asset receiving, and hardware QA.", industry: "Cybersecurity", path: "security/hardware-inventory", tags: ["security", "hardware", "procurement", "asset-inventory", "hardware-qa"], company_size: 25 },
  { id: "hr-policy-synthesizer", name: "Employee Handbook & Compliance Indexer", description: "Knowledge Work: Parsing labor laws, employee handbook updates indexing, and compliance guidelines synthesis.", industry: "Human Resources", path: "hr/policy-synthesizer", tags: ["hr", "policy", "compliance", "employee-handbook"], company_size: 25 },
  { id: "hr-recruiter-purchasing", name: "Recruiting Tool Procurement & Contractor QA", description: "Edge Operations: Job board purchasing, external placement contractor QA, and invoice auditing.", industry: "Human Resources", path: "hr/recruiter-purchasing", tags: ["hr", "procurement", "contractor-qa", "recruiting-tools"], company_size: 25 },
  { id: "education-accreditation-synthesizer", name: "Accreditation & Curriculum Audit Synthesizer", description: "Knowledge Work: Academic standards audits, accreditation compliance indexing, and curriculum synthesis.", industry: "Education", path: "education/accreditation-synthesizer", tags: ["education", "accreditation", "curriculum", "compliance"], company_size: 25 },
  { id: "education-supplies-purchasing", name: "School Supplies Purchasing & Textbook Inventory", description: "Edge Operations: Textbook procurement, classroom supplies shipping, receiving audits, and inventory QA.", industry: "Education", path: "education/supplies-purchasing", tags: ["education", "procurement", "inventory", "textbooks", "supplies"], company_size: 25 },
  { id: "utilities-maintenance-synthesizer", name: "Grid Maintenance Manuals & SOP Indexer", description: "Knowledge Work: Processing telemetry manuals, emergency utility plans indexing, and maintenance reports synthesis.", industry: "Critical Infrastructure", path: "utilities/maintenance-synthesizer", tags: ["utilities", "grid-maintenance", "telemetry", "synthesis"], company_size: 25 },
  { id: "utilities-scada-qa", name: "SCADA Device Shipping, Receiving & Hardware QA", description: "Edge Operations: Grid sensor procurement, SCADA equipment shipping logs, receiving inspections, and hardware QA.", industry: "Critical Infrastructure", path: "utilities/scada-qa", tags: ["utilities", "scada", "shipping", "receiving", "hardware-qa", "procurement"], company_size: 25 },
  { id: "creative-script-synthesizer", name: "Script & Localization Knowledge Indexer", description: "Knowledge Work: Script parsing, dialog semantic mapping, cultural adaptation databases indexing, and localization synthesis.", industry: "Media & Creative", path: "creative/script-synthesizer", tags: ["creative", "scripts", "localization", "indexing", "synthesis"], company_size: 25 },
  { id: "creative-equipment-procurement", name: "Studio Equipment Purchasing & Asset Inventory", description: "Edge Operations: Camera/lens procurement, studio shipping logs, asset receiving, and hardware QA.", industry: "Media & Creative", path: "creative/equipment-procurement", tags: ["creative", "procurement", "inventory", "hardware-qa", "cameras"], company_size: 25 },
  { id: "field-service-operations-25", name: "Small Field Service Operations (25 Seats)", description: "Dispatch, estimate and work-order preparation, customer follow-up, and daily exception review for small appointment-based field-service teams.", industry: "Field Services", path: "field-services/operations-25", tags: ["field-service", "dispatch", "estimates", "work-orders", "customer-care", "small-business"], company_size: 25 },
  { id: "wholesale-b2b-operations-25", name: "Small Wholesale B2B Operations (25 Seats)", description: "Quote preparation, account follow-up, replenishment planning, and fulfillment exception control for small wholesalers and distributors.", industry: "Wholesale & Distribution", path: "wholesale-distribution/b2b-operations-25", tags: ["wholesale", "b2b", "sales-operations", "purchasing", "inventory", "fulfillment", "small-business"], company_size: 25 },
];

export const INDUSTRY_CODES_MAP: Record<string, { code: string; label: string }[]> = {
  "Legal Services": [
    {
      "code": "NAICS 541110",
      "label": "541110 - Offices of Lawyers"
    },
    {
      "code": "SIC 8111",
      "label": "8111 - Legal Services"
    }
  ],
  "Medical Practices": [
    {
      "code": "NAICS 621111",
      "label": "621111 - Offices of Physicians (except Mental Health)"
    },
    {
      "code": "NAICS 621112",
      "label": "621112 - Offices of Physicians, Mental Health Specialists"
    },
    {
      "code": "SIC 8011",
      "label": "8011 - Offices and Clinics of Doctors of Medicine"
    }
  ],
  "Financial Services": [
    {
      "code": "NAICS 523930",
      "label": "523930 - Investment Advice"
    },
    {
      "code": "NAICS 541211",
      "label": "541211 - Offices of Certified Public Accountants"
    },
    {
      "code": "SIC 6282",
      "label": "6282 - Investment Advice"
    },
    {
      "code": "SIC 8721",
      "label": "8721 - Accounting, Auditing, and Bookkeeping"
    }
  ],
  "Digital Marketing": [
    {
      "code": "NAICS 541810",
      "label": "541810 - Advertising Agencies"
    },
    {
      "code": "NAICS 541812",
      "label": "541812 - Digital Advertising Agencies"
    },
    {
      "code": "SIC 7311",
      "label": "7311 - Advertising Agencies"
    }
  ],
  "E-commerce": [
    {
      "code": "NAICS 454110",
      "label": "454110 - Electronic Shopping and Mail-Order Houses"
    },
    {
      "code": "SIC 5961",
      "label": "5961 - Catalog and Mail-Order Houses"
    }
  ],
  "Real Estate": [
    {
      "code": "NAICS 531210",
      "label": "531210 - Offices of Real Estate Agents and Brokers"
    },
    {
      "code": "SIC 6531",
      "label": "6531 - Real Estate Agents and Managers"
    }
  ],
  "Specialized Consultancies": [
    {
      "code": "NAICS 541611",
      "label": "541611 - Administrative & General Management Consulting"
    },
    {
      "code": "NAICS 541690",
      "label": "541690 - Other Scientific & Technical Consulting"
    },
    {
      "code": "SIC 8742",
      "label": "8742 - Management Consulting Services"
    }
  ],
  "Logistics & Supply Chain": [
    {
      "code": "NAICS 541614",
      "label": "541614 - Process, Physical Distribution, & Logistics Consulting"
    },
    {
      "code": "NAICS 488510",
      "label": "488510 - Freight Transportation Arrangement"
    },
    {
      "code": "SIC 4731",
      "label": "4731 - Arrangement of Transportation of Freight & Cargo"
    }
  ],
  "Engineering & Architecture": [
    {
      "code": "NAICS 541330",
      "label": "541330 - Engineering Services"
    },
    {
      "code": "NAICS 541310",
      "label": "541310 - Architectural Services"
    },
    {
      "code": "SIC 8711",
      "label": "8711 - Engineering Services"
    },
    {
      "code": "SIC 8712",
      "label": "8712 - Architectural Services"
    }
  ],
  "EdTech & Training": [
    {
      "code": "NAICS 611710",
      "label": "611710 - Educational Support Services"
    },
    {
      "code": "NAICS 611420",
      "label": "611420 - Computer Training"
    },
    {
      "code": "SIC 8299",
      "label": "8299 - Schools & Educational Services, NEC"
    }
  ],
  "Software Development": [
    {
      "code": "NAICS 541511",
      "label": "541511 - Custom Computer Programming Services"
    },
    {
      "code": "NAICS 513210",
      "label": "513210 - Software Publishers"
    },
    {
      "code": "SIC 7371",
      "label": "7371 - Computer Programming Services"
    },
    {
      "code": "SIC 7372",
      "label": "7372 - Prepackaged Software"
    }
  ],
  "Manufacturing": [
    {
      "code": "NAICS 339999",
      "label": "339999 - All Other Miscellaneous Manufacturing"
    },
    {
      "code": "SIC 3999",
      "label": "3999 - Manufacturing Industries, NEC"
    }
  ],
  "Food & Beverage": [
    {
      "code": "NAICS 722511",
      "label": "722511 - Full-Service Restaurants"
    },
    {
      "code": "NAICS 311999",
      "label": "311999 - All Other Miscellaneous Food Manufacturing"
    },
    {
      "code": "SIC 5812",
      "label": "5812 - Eating Places"
    },
    {
      "code": "SIC 2099",
      "label": "2099 - Food Preparations, NEC"
    }
  ],
  "Chemical Sector": [
    {
      "code": "NAICS 325998",
      "label": "325998 - All Other Miscellaneous Chemical Product Manufacturing"
    },
    {
      "code": "SIC 2899",
      "label": "2899 - Chemicals and Chemical Preparations, NEC"
    }
  ],
  "Transportation & Logistics": [
    {
      "code": "NAICS 484121",
      "label": "484121 - General Freight Trucking, Long-Distance"
    },
    {
      "code": "NAICS 488510",
      "label": "488510 - Freight Transportation Arrangement"
    },
    {
      "code": "SIC 4213",
      "label": "4213 - Trucking, Except Local"
    },
    {
      "code": "SIC 4731",
      "label": "4731 - Arrangement of Transportation of Freight & Cargo"
    }
  ],
  "Pharmaceuticals": [
    {
      "code": "NAICS 325412",
      "label": "325412 - Pharmaceutical Preparation Manufacturing"
    },
    {
      "code": "SIC 2834",
      "label": "2834 - Pharmaceutical Preparations"
    }
  ],
  "Agriculture & AgTech": [
    {
      "code": "NAICS 111998",
      "label": "111998 - All Other Miscellaneous Crop Farming"
    },
    {
      "code": "NAICS 541715",
      "label": "541715 - R&D in Physical, Engineering, & Life Sciences"
    },
    {
      "code": "SIC 0191",
      "label": "0191 - General Farms, Primarily Crop"
    }
  ],
  "Governance & Compliance": [
    {
      "code": "NAICS 541611",
      "label": "541611 - Administrative & General Management Consulting"
    },
    {
      "code": "SIC 8742",
      "label": "8742 - Management Consulting Services"
    }
  ],
  "Cybersecurity": [
    {
      "code": "NAICS 541512",
      "label": "541512 - Computer Systems Design Services"
    },
    {
      "code": "NAICS 541690",
      "label": "541690 - Other Scientific & Technical Consulting"
    },
    {
      "code": "SIC 7373",
      "label": "7373 - Computer Integrated Systems Design"
    },
    {
      "code": "SIC 7379",
      "label": "7379 - Computer Related Services, NEC"
    }
  ],
  "Human Resources": [
    {
      "code": "NAICS 561311",
      "label": "561311 - Employment Placement Agencies"
    },
    {
      "code": "NAICS 541612",
      "label": "541612 - Human Resources Consulting Services"
    },
    {
      "code": "SIC 7361",
      "label": "7361 - Employment Agencies"
    }
  ],
  "Education": [
    {
      "code": "NAICS 611710",
      "label": "611710 - Educational Support Services"
    },
    {
      "code": "NAICS 611310",
      "label": "611310 - Colleges, Universities, & Professional Schools"
    },
    {
      "code": "SIC 8299",
      "label": "8299 - Schools & Educational Services, NEC"
    }
  ],
  "Critical Infrastructure": [
    {
      "code": "NAICS 221122",
      "label": "221122 - Electric Power Distribution"
    },
    {
      "code": "SIC 4911",
      "label": "4911 - Electric Services"
    }
  ],
  "Media & Creative": [
    {
      "code": "NAICS 512110",
      "label": "512110 - Motion Picture & Video Production"
    },
    {
      "code": "NAICS 711510",
      "label": "711510 - Independent Artists, Writers, & Performers"
    },
    {
      "code": "SIC 7812",
      "label": "7812 - Motion Picture & Video Tape Production"
    }
  ],
  "Field Services": [
    {
      "code": "NAICS 561720",
      "label": "561720 - Janitorial Services"
    },
    {
      "code": "NAICS 238210",
      "label": "238210 - Electrical Contractors"
    },
    {
      "code": "SIC 7349",
      "label": "7349 - Building Cleaning & Maintenance Services"
    }
  ],
  "Wholesale & Distribution": [
    {
      "code": "NAICS 423840",
      "label": "423840 - Industrial Supplies Merchant Wholesalers"
    },
    {
      "code": "NAICS 423830",
      "label": "423830 - Industrial Machinery and Equipment"
    },
    {
      "code": "SIC 5084",
      "label": "5084 - Industrial Machinery and Equipment"
    }
  ]
};
