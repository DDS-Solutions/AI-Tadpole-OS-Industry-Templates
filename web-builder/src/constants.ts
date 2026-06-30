import type { TemplateItem } from './types';

export const INDUSTRY_MAP = [
  { name: 'Legal Services', path: 'legal', keywords: ['law', 'contract', 'litigation', 'legal'] },
  { name: 'Medical Practices', path: 'healthcare', keywords: ['health', 'patient', 'medical', 'doctor', 'clinic'] },
  { name: 'Financial Services', path: 'financial-services', keywords: ['money', 'bank', 'finance', 'tax', 'audit', 'accounting'] },
  { name: 'Digital Marketing', path: 'digital-marketing', keywords: ['ads', 'marketing', 'social media', 'content', 'seo'] },
  { name: 'E-commerce', path: 'e-commerce', keywords: ['store', 'shop', 'product', 'retail', 'sales'] },
  { name: 'Real Estate', path: 'real-estate', keywords: ['house', 'property', 'realtor', 'escrow', 'mls'] },
  { name: 'Manufacturing', path: 'manufacturing', keywords: ['factory', 'production', 'inventory', 'machine', 'order'] },
  { name: 'Software Development', path: 'development', keywords: ['code', 'software', 'app', 'developer', 'api'] },
  { name: 'Food & Beverage', path: 'food', keywords: ['food', 'restaurant', 'menu', 'kitchen', 'recipe', 'inventory'] },
  { name: 'Chemical Sector', path: 'chemical', keywords: ['chemical', 'safety', 'sds', 'toxic', 'hazardous'] },
  { name: 'Transportation & Logistics', path: 'transportation', keywords: ['transportation', 'fleet', 'delivery', 'route', 'truck', 'driver'] },
  { name: 'Pharmaceuticals', path: 'pharma', keywords: ['pharma', 'clinical', 'trial', 'adverse', 'drug', 'protocol'] },
  { name: 'Agriculture & AgTech', path: 'agriculture', keywords: ['agriculture', 'farm', 'soil', 'crop', 'irrigation', 'weather'] },
  { name: 'Governance & Compliance', path: 'compliance', keywords: ['compliance', 'audit', 'soc2', 'iso', 'security', 'regulatory'] },
  { name: 'Cybersecurity', path: 'security', keywords: ['security', 'cybersecurity', 'secops', 'log', 'firewall', 'threat', 'incident'] },
  { name: 'Human Resources', path: 'hr', keywords: ['hr', 'recruiting', 'resume', 'onboarding', 'candidate', 'hiring', 'talent'] },
  { name: 'Education', path: 'education', keywords: ['education', 'curriculum', 'lesson', 'student', 'grade', 'school', 'learn'] },
  { name: 'Critical Infrastructure', path: 'utilities', keywords: ['utility', 'grid', 'power', 'telemetry', 'scada', 'substation', 'maintenance'] },
  { name: 'Media & Creative', path: 'creative', keywords: ['media', 'creative', 'asset', 'game', 'dialog', 'narrative', 'localization'] },
];

export const REGISTRY: TemplateItem[] = [
  { id: "legal-contract-review", name: "Legal Contract Auditor", description: "AI-driven contract analysis, litigation forecasting, and automated discovery.", industry: "Legal Services", path: "legal/contract-review", tags: ["law", "contracts"] },
  { id: "healthcare-patient-intake", name: "Patient Intake Automation", description: "Process clinical data and automate patient intake workflows.", industry: "Medical Practices", path: "healthcare/patient-intake", tags: ["healthcare", "intake"] },
  { id: "development-code-reviewer", name: "Sr. Architect Reviewer", description: "Automated code review and architectural auditing from a senior perspective.", industry: "Software Development", path: "development/code-reviewer", tags: ["development", "devops"] },
  { id: "bookkeeping-audit", name: "SMB Bookkeeping Swarm", description: "Automated daily reconciliation, tax optimization, and digital audit trails.", industry: "Financial Services", path: "financial-services/bookkeeping-audit", tags: ["finance", "accounting"] },
  { id: "full-funnel-automation", name: "Marketing Funnel Pilot", description: "Automated content generation, ad spend optimization, and journey analytics.", industry: "Digital Marketing", path: "digital-marketing/full-funnel-automation", tags: ["marketing", "ads"] },
  { id: "lead-transaction-management", name: "Real Estate Closer", description: "Automated lead nurturing, MLS syndication, and escrow timeline tracking.", industry: "Real Estate", path: "real-estate/lead-transaction", tags: ["real-estate", "leads"] },
  { id: "food-restaurant-ops", name: "Food & Beverage Operations", description: "Automate kitchen inventory, menu performance analytics, and supplier ordering workflows.", industry: "Food & Beverage", path: "food/restaurant-ops", tags: ["food", "restaurant", "inventory"] },
  { id: "chemical-process-safety", name: "Chemical Safety Auditor", description: "Automate chemical inventory, Safety Data Sheet (SDS) compliance auditing, and safety checklists.", industry: "Chemical Sector", path: "chemical/process-safety", tags: ["chemical", "safety", "compliance"] },
  { id: "transportation-fleet-logistics", name: "Fleet Logistics Swarm", description: "Fleet scheduling, route optimization, maintenance tracking, and fuel efficiency analytics.", industry: "Transportation & Logistics", path: "transportation/fleet-logistics", tags: ["transportation", "fleet", "logistics"] },
  { id: "pharma-clinical-trials", name: "Clinical Trial Manager", description: "Automate clinical trial protocol mapping, trial candidate documentation, and adverse event logging.", industry: "Pharmaceuticals", path: "pharma/clinical-trials", tags: ["pharma", "clinical", "compliance"] },
  { id: "agriculture-precision-farming", name: "Precision Agriculture Swarm", description: "Crop yield forecasting, soil health telemetry analysis, and irrigation optimization.", industry: "Agriculture & AgTech", path: "agriculture/precision-farming", tags: ["agriculture", "farming", "analytics"] },
  { id: "compliance-regulatory-audit", name: "Regulatory Compliance Swarm", description: "Continuous security posture assessment, SOC2/ISO readiness checks, and regulatory compliance mapping.", industry: "Governance & Compliance", path: "compliance/regulatory-audit", tags: ["compliance", "audit", "security"] },
  { id: "security-incident-response", name: "Incident Response Swarm", description: "Designed for security log auditing, incident triage, and automated mitigation recommendation.", industry: "Cybersecurity", path: "security/incident-response", tags: ["security", "secops", "incident"] },
  { id: "hr-recruiting-triage", name: "Recruiting Triage Swarm", description: "Designed for parsing candidate resumes, screening against role criteria, and coordinating onboarding files.", industry: "Human Resources", path: "hr/recruiting-triage", tags: ["hr", "recruiting", "hiring"] },
  { id: "education-curriculum-planner", name: "Curriculum Planner Swarm", description: "Designed for curriculum audit mapping, lesson plan alignment, and student analytics reviews.", industry: "Education", path: "education/curriculum-planner", tags: ["education", "curriculum", "school"] },
  { id: "utilities-grid-telemetry", name: "Grid Telemetry Swarm", description: "Designed for grid status logs auditing, alarm triage, and utility crew scheduling.", industry: "Critical Infrastructure", path: "utilities/grid-telemetry", tags: ["utilities", "grid", "telemetry"] },
  { id: "creative-asset-pipeline", name: "Creative Asset Pipeline Swarm", description: "Designed for creative asset verification, size budget checks, and dialog localization tracking.", industry: "Media & Creative", path: "creative/asset-pipeline", tags: ["creative", "media", "assets"] },
];

export const INDUSTRY_CODES_MAP: Record<string, { code: string; label: string }[]> = {
  'Legal Services': [
    { code: 'NAICS 541110', label: '541110 - Offices of Lawyers' },
    { code: 'SIC 8111', label: '8111 - Legal Services' }
  ],
  'Medical Practices': [
    { code: 'NAICS 621111', label: '621111 - Offices of Physicians (except Mental Health)' },
    { code: 'NAICS 621112', label: '621112 - Offices of Physicians, Mental Health Specialists' },
    { code: 'SIC 8011', label: '8011 - Offices and Clinics of Doctors of Medicine' }
  ],
  'Financial Services': [
    { code: 'NAICS 523930', label: '523930 - Investment Advice' },
    { code: 'NAICS 541211', label: '541211 - Offices of Certified Public Accountants' },
    { code: 'SIC 6282', label: '6282 - Investment Advice' },
    { code: 'SIC 8721', label: '8721 - Accounting, Auditing, and Bookkeeping' }
  ],
  'Digital Marketing': [
    { code: 'NAICS 541810', label: '541810 - Advertising Agencies' },
    { code: 'NAICS 541812', label: '541812 - Digital Advertising Agencies' },
    { code: 'SIC 7311', label: '7311 - Advertising Agencies' }
  ],
  'E-commerce': [
    { code: 'NAICS 454110', label: '454110 - Electronic Shopping and Mail-Order Houses' },
    { code: 'SIC 5961', label: '5961 - Catalog and Mail-Order Houses' }
  ],
  'Real Estate': [
    { code: 'NAICS 531210', label: '531210 - Offices of Real Estate Agents and Brokers' },
    { code: 'SIC 6531', label: '6531 - Real Estate Agents and Managers' }
  ],
  'Specialized Consultancies': [
    { code: 'NAICS 541611', label: '541611 - Administrative & General Management Consulting' },
    { code: 'NAICS 541690', label: '541690 - Other Scientific & Technical Consulting' },
    { code: 'SIC 8742', label: '8742 - Management Consulting Services' }
  ],
  'Logistics & Supply Chain': [
    { code: 'NAICS 541614', label: '541614 - Process, Physical Distribution, & Logistics Consulting' },
    { code: 'NAICS 488510', label: '488510 - Freight Transportation Arrangement' },
    { code: 'SIC 4731', label: '4731 - Arrangement of Transportation of Freight & Cargo' }
  ],
  'Engineering & Architecture': [
    { code: 'NAICS 541330', label: '541330 - Engineering Services' },
    { code: 'NAICS 541310', label: '541310 - Architectural Services' },
    { code: 'SIC 8711', label: '8711 - Engineering Services' },
    { code: 'SIC 8712', label: '8712 - Architectural Services' }
  ],
  'EdTech & Training': [
    { code: 'NAICS 611710', label: '611710 - Educational Support Services' },
    { code: 'NAICS 611420', label: '611420 - Computer Training' },
    { code: 'SIC 8299', label: '8299 - Schools & Educational Services, NEC' }
  ],
  'Software Development': [
    { code: 'NAICS 541511', label: '541511 - Custom Computer Programming Services' },
    { code: 'NAICS 513210', label: '513210 - Software Publishers' },
    { code: 'SIC 7371', label: '7371 - Computer Programming Services' },
    { code: 'SIC 7372', label: '7372 - Prepackaged Software' }
  ],
  'Manufacturing': [
    { code: 'NAICS 339999', label: '339999 - All Other Miscellaneous Manufacturing' },
    { code: 'SIC 3999', label: '3999 - Manufacturing Industries, NEC' }
  ],
  'Food & Beverage': [
    { code: 'NAICS 722511', label: '722511 - Full-Service Restaurants' },
    { code: 'NAICS 311999', label: '311999 - All Other Miscellaneous Food Manufacturing' },
    { code: 'SIC 5812', label: '5812 - Eating Places' },
    { code: 'SIC 2099', label: '2099 - Food Preparations, NEC' }
  ],
  'Chemical Sector': [
    { code: 'NAICS 325998', label: '325998 - All Other Miscellaneous Chemical Product Manufacturing' },
    { code: 'SIC 2899', label: '2899 - Chemicals and Chemical Preparations, NEC' }
  ],
  'Transportation & Logistics': [
    { code: 'NAICS 484121', label: '484121 - General Freight Trucking, Long-Distance' },
    { code: 'NAICS 488510', label: '488510 - Freight Transportation Arrangement' },
    { code: 'SIC 4213', label: '4213 - Trucking, Except Local' },
    { code: 'SIC 4731', label: '4731 - Arrangement of Transportation of Freight & Cargo' }
  ],
  'Pharmaceuticals': [
    { code: 'NAICS 325412', label: '325412 - Pharmaceutical Preparation Manufacturing' },
    { code: 'SIC 2834', label: '2834 - Pharmaceutical Preparations' }
  ],
  'Agriculture & AgTech': [
    { code: 'NAICS 111998', label: '111998 - All Other Miscellaneous Crop Farming' },
    { code: 'NAICS 541715', label: '541715 - R&D in Physical, Engineering, & Life Sciences' },
    { code: 'SIC 0191', label: '0191 - General Farms, Primarily Crop' }
  ],
  'Governance & Compliance': [
    { code: 'NAICS 541611', label: '541611 - Administrative & General Management Consulting' },
    { code: 'SIC 8742', label: '8742 - Management Consulting Services' }
  ],
  'Cybersecurity': [
    { code: 'NAICS 541512', label: '541512 - Computer Systems Design Services' },
    { code: 'NAICS 541690', label: '541690 - Other Scientific & Technical Consulting' },
    { code: 'SIC 7373', label: '7373 - Computer Integrated Systems Design' },
    { code: 'SIC 7379', label: '7379 - Computer Related Services, NEC' }
  ],
  'Human Resources': [
    { code: 'NAICS 561311', label: '561311 - Employment Placement Agencies' },
    { code: 'NAICS 541612', label: '541612 - Human Resources Consulting Services' },
    { code: 'SIC 7361', label: '7361 - Employment Agencies' }
  ],
  'Education': [
    { code: 'NAICS 611710', label: '611710 - Educational Support Services' },
    { code: 'NAICS 611310', label: '611310 - Colleges, Universities, & Professional Schools' },
    { code: 'SIC 8299', label: '8299 - Schools & Educational Services, NEC' }
  ],
  'Critical Infrastructure': [
    { code: 'NAICS 221122', label: '221122 - Electric Power Distribution' },
    { code: 'SIC 4911', label: '4911 - Electric Services' }
  ],
  'Media & Creative': [
    { code: 'NAICS 512110', label: '512110 - Motion Picture & Video Production' },
    { code: 'NAICS 711510', label: '711510 - Independent Artists, Writers, & Performers' },
    { code: 'SIC 7812', label: '7812 - Motion Picture & Video Tape Production' }
  ]
};
