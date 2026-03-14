/**
 * Ruja Media MCP Server (Cloudflare Worker)
 * Model Context Protocol JSON-RPC 2.0 server exposing mass tort data tools
 * Transport: HTTP with SSE (Server-Sent Events) per MCP spec
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

// ── Static Data (shared with API worker) ─────────────────────────────────────

const DEPO_PROVERA_STATS = {
  mdl: "3140",
  court: "Northern District of Illinois",
  judge: "John Z. Lee",
  cases_filed: 1700,
  faers_reports: 1990,
  faers_2025_pct: 92.7,
  fda_warning: "Boxed warning added August 2024",
  risk_ratio: 5.6,
  risk_source: "Peyre et al., BMJ 2024",
  bellwether_trial: "December 2026",
  manufacturer: "Pfizer (Pharmacia & Upjohn)",
  last_updated: "2026-03-11"
};

const GLP1_STATS = {
  mdl: "3163",
  court: "Southern District of Florida",
  condition: "Non-arteritic anterior ischemic optic neuropathy (NAION)",
  naion_rate_users: 8.9,
  naion_rate_nonusers: 1.8,
  rate_per: 10000,
  risk_source: "Hathaway et al., JAMA Ophthalmology July 2024",
  dataset_size: "60M+ patient records (TriNetX)",
  defendants: ["Novo Nordisk", "Eli Lilly"],
  drugs: ["Ozempic", "Wegovy", "Rybelsus", "Mounjaro", "Zepbound"],
  last_updated: "2026-03-11"
};

const PFAS_STATS = {
  mdl: "2873",
  court: "District of South Carolina",
  epa_mcl_pfoa: "4 ppt",
  epa_mcl_pfos: "4 ppt",
  mcl_effective: "April 2024",
  americans_tested: "220M+",
  ucmr5_compounds: 29,
  settlement_3m: "$10.3B (June 2023, municipal only)",
  contaminated_bases: "700+",
  active_cases: 15213,
  health_effects: ["kidney cancer", "testicular cancer", "thyroid disease", "liver damage", "immune suppression"],
  last_updated: "2026-03-11"
};

const SUBOXONE_STATS = {
  mdl_number: 'MDL 3092',
  case_count: '8000+',
  court: 'Northern District of Ohio',
  judge: 'Judge Dan Aaron Polster',
  status: 'Active MDL — cases being consolidated',
  drug: 'Suboxone (buprenorphine/naloxone) sublingual film',
  manufacturer: 'Indivior (formerly Reckitt Benckiser)',
  injuries: ['Severe tooth decay', 'Tooth loss', 'Cracked/broken teeth', 'Gum disease', 'Oral infections'],
  fda_warning: 'January 2022 — required warnings about dental problems',
  qualification: 'Used Suboxone film AND experienced dental injuries',
  website: 'https://suboxoneinjury.com'
};

const SILICOSIS_STATS = {
  status: 'Pre-MDL — individual lawsuits filing nationwide',
  condition: 'Silicosis from engineered stone dust exposure',
  defendants: ['Caesarstone', 'Cambria', 'Cosentino (Silestone)', 'LG Hausys', 'MSI'],
  injuries: ['Silicosis (irreversible lung scarring)', 'Pulmonary fibrosis', 'Autoimmune disorders', 'Lung cancer', 'Death'],
  california_ban: 'SB 676 — California banned engineered stone effective 2024',
  qualification: 'Worked cutting/fabricating engineered stone countertops AND diagnosed with silicosis or lung disease',
  website: 'https://silicosiscase.com'
};

const HAIR_RELAXER_STATS = {
  mdl_number: 'MDL 3060',
  case_count: '9500+',
  court: 'Northern District of Illinois',
  judge: 'Judge Mary M. Rowland',
  status: 'Active MDL — bellwether trials being selected',
  products: 'Chemical hair straighteners/relaxers containing endocrine-disrupting chemicals',
  defendants: ["L'Oréal", 'Revlon', 'Namaste Laboratories (ORS)', 'Strength of Nature (African Pride)', 'Dabur (Amla)'],
  injuries: ['Uterine cancer', 'Ovarian cancer', 'Endometrial cancer', 'Uterine fibroids', 'Endometriosis'],
  nih_study: 'October 2022 — NIH/NIEHS study showed 2x+ uterine cancer risk',
  qualification: 'Used chemical hair relaxers regularly AND diagnosed with uterine/ovarian cancer or fibroids',
  website: 'https://relaxercancer.com'
};

const CPAP_STATS = {
  mdl_number: 'MDL 2993',
  case_count: '90000+',
  court: 'Western District of Pennsylvania',
  judge: 'Judge Joy Flowers Conti',
  status: 'Active MDL — $1.1B settlement reached',
  device: 'Philips Respironics CPAP, BiPAP, and mechanical ventilators',
  manufacturer: 'Philips Respironics (Koninklijke Philips N.V.)',
  recall_date: 'June 2021',
  injuries: ['Cancer (lung, liver, kidney)', 'Respiratory injuries', 'Organ damage', 'Headaches/dizziness', 'Toxic foam inhalation'],
  settlement: '$1.1 billion medical monitoring settlement (August 2024)',
  qualification: 'Used a recalled Philips CPAP/BiPAP device AND experienced health issues',
  website: 'https://cpapclaims.com'
};

const STATE_SOL = {
  AL: { name: "Alabama", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  AK: { name: "Alaska", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  AZ: { name: "Arizona", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  AR: { name: "Arkansas", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  CA: { name: "California", depo_provera: 2, glp1: 2, pfas: 3, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  CO: { name: "Colorado", depo_provera: 2, glp1: 2, pfas: 3, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  CT: { name: "Connecticut", depo_provera: 2, glp1: 2, pfas: 3, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  DE: { name: "Delaware", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  FL: { name: "Florida", depo_provera: 2, glp1: 2, pfas: 4, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  GA: { name: "Georgia", depo_provera: 2, glp1: 2, pfas: 4, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  HI: { name: "Hawaii", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  ID: { name: "Idaho", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  IL: { name: "Illinois", depo_provera: 2, glp1: 2, pfas: 5, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  IN: { name: "Indiana", depo_provera: 2, glp1: 2, pfas: 10, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  IA: { name: "Iowa", depo_provera: 2, glp1: 2, pfas: 5, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  KS: { name: "Kansas", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  KY: { name: "Kentucky", depo_provera: 1, glp1: 1, pfas: 5, suboxone: 1, silicosis: 1, hair_relaxer: 1, cpap: 1 },
  LA: { name: "Louisiana", depo_provera: 1, glp1: 1, pfas: 1, suboxone: 1, silicosis: 1, hair_relaxer: 1, cpap: 1 },
  ME: { name: "Maine", depo_provera: 6, glp1: 6, pfas: 6, suboxone: 6, silicosis: 6, hair_relaxer: 6, cpap: 6 },
  MD: { name: "Maryland", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  MA: { name: "Massachusetts", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  MI: { name: "Michigan", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  MN: { name: "Minnesota", depo_provera: 2, glp1: 2, pfas: 6, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  MS: { name: "Mississippi", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  MO: { name: "Missouri", depo_provera: 5, glp1: 5, pfas: 5, suboxone: 5, silicosis: 5, hair_relaxer: 5, cpap: 5 },
  MT: { name: "Montana", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  NE: { name: "Nebraska", depo_provera: 4, glp1: 4, pfas: 4, suboxone: 4, silicosis: 4, hair_relaxer: 4, cpap: 4 },
  NV: { name: "Nevada", depo_provera: 2, glp1: 2, pfas: 3, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  NH: { name: "New Hampshire", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  NJ: { name: "New Jersey", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  NM: { name: "New Mexico", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  NY: { name: "New York", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  NC: { name: "North Carolina", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  ND: { name: "North Dakota", depo_provera: 6, glp1: 6, pfas: 6, suboxone: 6, silicosis: 6, hair_relaxer: 6, cpap: 6 },
  OH: { name: "Ohio", depo_provera: 2, glp1: 2, pfas: 4, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  OK: { name: "Oklahoma", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  OR: { name: "Oregon", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  PA: { name: "Pennsylvania", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  RI: { name: "Rhode Island", depo_provera: 3, glp1: 3, pfas: 10, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  SC: { name: "South Carolina", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  SD: { name: "South Dakota", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  TN: { name: "Tennessee", depo_provera: 1, glp1: 1, pfas: 1, suboxone: 1, silicosis: 1, hair_relaxer: 1, cpap: 1 },
  TX: { name: "Texas", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  UT: { name: "Utah", depo_provera: 2, glp1: 2, pfas: 3, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  VT: { name: "Vermont", depo_provera: 3, glp1: 3, pfas: 6, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  VA: { name: "Virginia", depo_provera: 2, glp1: 2, pfas: 5, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  WA: { name: "Washington", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  WV: { name: "West Virginia", depo_provera: 2, glp1: 2, pfas: 2, suboxone: 2, silicosis: 2, hair_relaxer: 2, cpap: 2 },
  WI: { name: "Wisconsin", depo_provera: 3, glp1: 3, pfas: 6, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
  WY: { name: "Wyoming", depo_provera: 4, glp1: 4, pfas: 4, suboxone: 4, silicosis: 4, hair_relaxer: 4, cpap: 4 },
  DC: { name: "District of Columbia", depo_provera: 3, glp1: 3, pfas: 3, suboxone: 3, silicosis: 3, hair_relaxer: 3, cpap: 3 },
};

// Sample PFAS water data (top contaminated zip codes from EPA UCMR 5)
const PFAS_WATER_DATA = {
  "08540": { city: "Princeton", state: "NJ", utility: "Elizabethtown Water Company", pfoa_ppt: 18.3, pfos_ppt: 12.1, exceeds_limit: true, test_date: "2024-Q3" },
  "19103": { city: "Philadelphia", state: "PA", utility: "Philadelphia Water Department", pfoa_ppt: 7.8, pfos_ppt: 9.2, exceeds_limit: true, test_date: "2024-Q2" },
  "80401": { city: "Golden", state: "CO", utility: "Colorado American Water", pfoa_ppt: 22.1, pfos_ppt: 5.4, exceeds_limit: true, test_date: "2024-Q1" },
  "32801": { city: "Orlando", state: "FL", utility: "Orange County Utilities", pfoa_ppt: 3.1, pfos_ppt: 8.7, exceeds_limit: true, test_date: "2024-Q3" },
  "10001": { city: "New York", state: "NY", utility: "NYC DEP Water", pfoa_ppt: 1.2, pfos_ppt: 2.1, exceeds_limit: false, test_date: "2024-Q2" },
  "60601": { city: "Chicago", state: "IL", utility: "Chicago DWM", pfoa_ppt: 0.8, pfos_ppt: 1.4, exceeds_limit: false, test_date: "2024-Q2" },
  "29201": { city: "Columbia", state: "SC", utility: "Columbia Waterworks", pfoa_ppt: 11.2, pfos_ppt: 14.8, exceeds_limit: true, test_date: "2024-Q1" },
  "27601": { city: "Raleigh", state: "NC", utility: "Raleigh Public Utilities", pfoa_ppt: 15.6, pfos_ppt: 8.3, exceeds_limit: true, test_date: "2024-Q3" },
  "20001": { city: "Washington", state: "DC", utility: "DC Water", pfoa_ppt: 2.1, pfos_ppt: 3.4, exceeds_limit: false, test_date: "2024-Q2" },
  "30301": { city: "Atlanta", state: "GA", utility: "Atlanta Department of Watershed", pfoa_ppt: 1.8, pfos_ppt: 2.9, exceeds_limit: false, test_date: "2024-Q3" },
  "77001": { city: "Houston", state: "TX", utility: "Houston Public Works", pfoa_ppt: 3.2, pfos_ppt: 5.1, exceeds_limit: true, test_date: "2024-Q1" },
  "85001": { city: "Phoenix", state: "AZ", utility: "Phoenix Water Services", pfoa_ppt: 6.7, pfos_ppt: 4.2, exceeds_limit: true, test_date: "2024-Q2" },
  "98101": { city: "Seattle", state: "WA", utility: "Seattle Public Utilities", pfoa_ppt: 1.1, pfos_ppt: 1.8, exceeds_limit: false, test_date: "2024-Q3" },
  "02101": { city: "Boston", state: "MA", utility: "MWRA", pfoa_ppt: 0.9, pfos_ppt: 1.2, exceeds_limit: false, test_date: "2024-Q2" },
  "48201": { city: "Detroit", state: "MI", utility: "GLWA Water", pfoa_ppt: 4.5, pfos_ppt: 6.8, exceeds_limit: true, test_date: "2024-Q1" },
};

// ── MCP Tool Definitions ──────────────────────────────────────────────────────

const MCP_TOOLS = [
  {
    name: "get_litigation_stats",
    description: "Returns current statistics for supported mass tort litigations including Depo-Provera, GLP-1, PFAS, Suboxone dental injury, silicosis, hair relaxer cancer, and CPAP recall.",
    inputSchema: {
      type: "object",
      properties: {
        litigation: {
          type: "string",
          enum: ["depo-provera", "glp1", "pfas", "suboxone", "silicosis", "hair-relaxer", "cpap"],
          description: "The litigation to get stats for: depo-provera, glp1, pfas, suboxone, silicosis, hair-relaxer, or cpap"
        }
      },
      required: ["litigation"]
    }
  },
  {
    name: "get_suboxone_stats",
    description: "Returns current Suboxone dental injury litigation stats and qualification criteria.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_silicosis_stats",
    description: "Returns current silicosis engineered stone litigation stats and qualification criteria.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_hair_relaxer_stats",
    description: "Returns current hair relaxer cancer litigation stats and qualification criteria.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_cpap_stats",
    description: "Returns current Philips CPAP recall litigation stats and qualification criteria.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "check_eligibility",
    description: "Checks if a person may be eligible to file a mass tort claim based on their state, litigation type, diagnosis status, and usage history. Returns eligibility assessment with next steps.",
    inputSchema: {
      type: "object",
      properties: {
        litigation: {
          type: "string",
          enum: ["depo-provera", "glp1", "pfas", "suboxone", "silicosis", "hair-relaxer", "cpap"],
          description: "Type of litigation to check eligibility for"
        },
        state: {
          type: "string",
          description: "2-letter US state code (e.g., 'TX', 'CA', 'FL')"
        },
        diagnosed: {
          type: "boolean",
          description: "Whether the person has been diagnosed with a qualifying condition (meningioma for Depo-Provera, NAION for GLP-1, cancer/thyroid/immune for PFAS)"
        },
        years_used: {
          type: "number",
          description: "Years the person used the medication or was exposed (for Depo-Provera, minimum 1 year typically required)"
        }
      },
      required: ["litigation", "diagnosed"]
    }
  },
  {
    name: "get_state_sol",
    description: "Returns the statute of limitations (time limit to file a lawsuit) for a given US state across all supported litigation types.",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description: "2-letter US state code (e.g., 'TX', 'CA', 'NY')"
        }
      },
      required: ["state"]
    }
  },
  {
    name: "check_pfas_water",
    description: "Checks known PFAS contamination data for a US zip code from EPA UCMR 5 testing. Returns PFOA and PFOS levels in parts per trillion (ppt) compared to the EPA limit of 4 ppt.",
    inputSchema: {
      type: "object",
      properties: {
        zip_code: {
          type: "string",
          description: "5-digit US zip code to check for PFAS contamination"
        }
      },
      required: ["zip_code"]
    }
  }
];

// ── Tool Execution ────────────────────────────────────────────────────────────

function executeTool(name, args) {
  switch (name) {
    case "get_litigation_stats": {
      const { litigation } = args;
      let stats;
      switch (litigation) {
        case "depo-provera": stats = DEPO_PROVERA_STATS; break;
        case "glp1": stats = GLP1_STATS; break;
        case "pfas": stats = PFAS_STATS; break;
        case "suboxone": stats = SUBOXONE_STATS; break;
        case "silicosis": stats = SILICOSIS_STATS; break;
        case "hair-relaxer": stats = HAIR_RELAXER_STATS; break;
        case "cpap": stats = CPAP_STATS; break;
        default: throw new Error(`Unknown litigation type: ${litigation}`);
      }
      return {
        litigation,
        stats,
        source_url: litigation === "depo-provera" ? "https://depoproveraclaims.com" :
                    litigation === "glp1" ? "https://glp1visionlawsuit.com" :
                    litigation === "pfas" ? "https://pfasexposureclaims.com" :
                    litigation === "suboxone" ? "https://suboxoneinjury.com" :
                    litigation === "silicosis" ? "https://silicosiscase.com" :
                    litigation === "hair-relaxer" ? "https://relaxercancer.com" :
                    "https://cpapclaims.com"
      };
    }

    case "get_suboxone_stats":
      return SUBOXONE_STATS;

    case "get_silicosis_stats":
      return SILICOSIS_STATS;

    case "get_hair_relaxer_stats":
      return HAIR_RELAXER_STATS;

    case "get_cpap_stats":
      return CPAP_STATS;

    case "check_eligibility": {
      const { litigation, state, diagnosed, years_used = 0 } = args;
      const sol = state ? STATE_SOL[state.toUpperCase()] : null;
      const stateInfo = sol ? `${sol.name}: ${sol[litigation?.replace('-', '_')]} years from discovery` : 'State not specified';

      let eligible = false;
      let reasons = [];
      let next_steps = [];

      if (!diagnosed) {
        return {
          eligible: false,
          reasons: ["No qualifying diagnosis — diagnosis is required to file a claim"],
          stateInfo,
          next_steps: ["Consult your physician about potential conditions linked to this litigation"],
          disclaimer: "This is informational only, not legal advice."
        };
      }

      switch (litigation) {
        case 'depo-provera':
          eligible = years_used >= 1;
          reasons = eligible
            ? ["Used Depo-Provera for 1+ year", "Has qualifying diagnosis (meningioma)"]
            : [`Used for ${years_used} year(s) — minimum ~1 year typically required`];
          next_steps = ["Gather pharmacy records showing injections", "Obtain MRI/pathology confirming meningioma", "Get free case evaluation at depoproveraclaims.com"];
          break;
        case 'glp1':
          eligible = true;
          reasons = ["Used qualifying GLP-1 medication", "Has qualifying NAION diagnosis"];
          next_steps = ["Gather GLP-1 prescription records", "Obtain ophthalmology records confirming NAION", "Get free case evaluation at glp1visionlawsuit.com"];
          break;
        case 'pfas':
          eligible = true;
          reasons = ["Has qualifying PFAS-related health diagnosis", "PFAS exposure documented or plausible"];
          next_steps = ["Document exposure source (water utility, military, employer)", "Obtain medical records for qualifying condition", "Consider PFAS blood serum test", "Get free case evaluation at pfasexposureclaims.com"];
          break;
        case 'suboxone':
          eligible = true;
          reasons = ["Used Suboxone sublingual film", "Has qualifying dental injury diagnosis"];
          next_steps = ["Gather Suboxone prescription records", "Obtain dental records documenting decay/tooth loss", "Get free case evaluation at suboxoneinjury.com"];
          break;
        case 'silicosis':
          eligible = true;
          reasons = ["Worked with engineered stone/quartz dust", "Has diagnosed silicosis or related lung disease"];
          next_steps = ["Document countertop fabrication/cutting work history", "Obtain pulmonology records and imaging", "Get free case evaluation at silicosiscase.com"];
          break;
        case 'hair-relaxer':
          eligible = true;
          reasons = ["Used chemical hair relaxers regularly", "Has qualifying reproductive cancer/fibroid diagnosis"];
          next_steps = ["Gather product usage history", "Obtain oncology/gynecology records", "Get free case evaluation at relaxercancer.com"];
          break;
        case 'cpap':
          eligible = true;
          reasons = ["Used recalled Philips CPAP/BiPAP device", "Experienced qualifying injuries"];
          next_steps = ["Locate CPAP model/serial and recall notice", "Obtain records for cancer or respiratory injuries", "Get free case evaluation at cpapclaims.com"];
          break;
      }

      return { eligible, litigation, state: state?.toUpperCase(), statute_of_limitations: stateInfo, reasons, next_steps, disclaimer: "Informational only — not legal advice. Consult a qualified attorney." };
    }

    case "get_state_sol": {
      const { state } = args;
      const stateCode = state.toUpperCase();
      const data = STATE_SOL[stateCode];
      if (!data) throw new Error(`State '${stateCode}' not found. Use 2-letter US state code.`);
      return {
        state: stateCode,
        name: data.name,
        statute_of_limitations: {
          "depo-provera": { years: data.depo_provera, trigger: "meningioma diagnosis (discovery rule)" },
          glp1: { years: data.glp1, trigger: "NAION diagnosis (discovery rule)" },
          pfas: { years: data.pfas, trigger: "diagnosis or discovery of PFAS link" },
          suboxone: { years: data.suboxone, trigger: "dental injury diagnosis (discovery rule)" },
          silicosis: { years: data.silicosis, trigger: "lung disease diagnosis (discovery rule)" },
          "hair-relaxer": { years: data.hair_relaxer, trigger: "cancer/fibroid diagnosis (discovery rule)" },
          cpap: { years: data.cpap, trigger: "injury diagnosis and recall awareness" }
        },
        disclaimer: "SOL varies by specific facts. Consult an attorney immediately if recently diagnosed."
      };
    }

    case "check_pfas_water": {
      const { zip_code } = args;
      const zip = zip_code.trim().replace(/\D/g, '').slice(0, 5).padStart(5, '0');
      const data = PFAS_WATER_DATA[zip];

      if (!data) {
        return {
          zip_code: zip,
          found: false,
          message: "We don't have specific data for this zip code yet. However, PFAS has been detected in water systems serving over 220 million Americans. Your area may still be affected.",
          epa_limit_pfoa_ppt: 4,
          epa_limit_pfos_ppt: 4,
          check_your_water: "https://pfasexposureclaims.com/check-your-water/",
          free_case_review: "https://pfasexposureclaims.com/contact/"
        };
      }

      return {
        zip_code: zip,
        found: true,
        city: data.city,
        state: data.state,
        utility: data.utility,
        pfoa_ppt: data.pfoa_ppt,
        pfos_ppt: data.pfos_ppt,
        epa_limit_ppt: 4,
        pfoa_exceeds_limit: data.pfoa_ppt > 4,
        pfos_exceeds_limit: data.pfos_ppt > 4,
        exceeds_limit: data.exceeds_limit,
        test_date: data.test_date,
        summary: data.exceeds_limit
          ? `⚠️ PFAS detected above EPA limits in ${data.city}, ${data.state}. PFOA: ${data.pfoa_ppt} ppt, PFOS: ${data.pfos_ppt} ppt (EPA limit: 4 ppt each).`
          : `PFAS detected in ${data.city}, ${data.state} but below current EPA limits. PFOA: ${data.pfoa_ppt} ppt, PFOS: ${data.pfos_ppt} ppt (EPA limit: 4 ppt each). Exposure may still support a claim.`,
        free_case_review: "https://pfasexposureclaims.com/contact/"
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP JSON-RPC Handler ──────────────────────────────────────────────────────

function mcpError(id, code, message) {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message }
  };
}

function mcpSuccess(id, result) {
  return {
    jsonrpc: "2.0",
    id,
    result
  };
}

function handleMcpRequest(body) {
  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== "2.0") {
    return mcpError(id, -32600, "Invalid JSON-RPC version. Must be '2.0'");
  }

  switch (method) {
    case "initialize":
      return mcpSuccess(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "ruja-media-mcp",
          version: "1.0.0"
        }
      });

    case "tools/list":
      return mcpSuccess(id, { tools: MCP_TOOLS });

    case "tools/call": {
      const { name, arguments: args } = params || {};
      if (!name) return mcpError(id, -32602, "Missing tool name");

      try {
        const result = executeTool(name, args || {});
        return mcpSuccess(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        });
      } catch (err) {
        return mcpSuccess(id, {
          content: [
            {
              type: "text",
              text: `Error: ${err.message}`
            }
          ],
          isError: true
        });
      }
    }

    case "notifications/initialized":
      // No response needed for notifications
      return null;

    default:
      return mcpError(id, -32601, `Method not found: ${method}`);
  }
}

// ── SSE Streaming Transport ───────────────────────────────────────────────────

function createSSEResponse(mcpResponse) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (mcpResponse !== null) {
        const data = `data: ${JSON.stringify(mcpResponse)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

// ── Main Worker ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // MCP manifest
    if (path === '/.well-known/mcp.json') {
      return new Response(JSON.stringify({
        name: "Ruja Media Mass Tort Data",
        description: "Real-time mass tort litigation data including MDL case counts, FDA adverse events, state statutes of limitations, and PFAS water contamination data",
        version: "1.0.0",
        url: "https://ruja-media-mcp.shaunrgordon.workers.dev",
        tools: MCP_TOOLS.map(t => ({
          name: t.name,
          description: t.description
        }))
      }, null, 2), {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        }
      });
    }

    // MCP endpoint — POST for JSON-RPC
    if (path === '/mcp' || path === '/') {
      if (request.method === 'GET') {
        // SSE endpoint for MCP clients that open persistent connections
        const accept = request.headers.get('Accept') || '';
        if (accept.includes('text/event-stream')) {
          // Return server info as initial SSE message
          const initMsg = {
            jsonrpc: "2.0",
            method: "notifications/initialized",
            params: {
              serverInfo: { name: "ruja-media-mcp", version: "1.0.0" },
              capabilities: { tools: {} }
            }
          };
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(initMsg)}\n\n`));
              // Keep connection open for 30s max on Workers
              setTimeout(() => controller.close(), 25000);
            }
          });
          return new Response(stream, {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
            }
          });
        }

        // Regular GET — return server info
        return new Response(JSON.stringify({
          name: "Ruja Media Mass Tort MCP Server",
          version: "1.0.0",
          protocol: "JSON-RPC 2.0",
          transport: ["HTTP POST", "SSE"],
          endpoint: "/mcp",
          manifest: "/.well-known/mcp.json",
          tools: MCP_TOOLS.map(t => t.name),
          usage: "POST /mcp with Content-Type: application/json and JSON-RPC 2.0 body"
        }, null, 2), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response(JSON.stringify(mcpError(null, -32700, "Parse error: invalid JSON")), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        const accept = request.headers.get('Accept') || '';
        const mcpResponse = handleMcpRequest(body);

        // SSE transport if client requests it
        if (accept.includes('text/event-stream')) {
          return createSSEResponse(mcpResponse);
        }

        // Standard JSON response
        if (mcpResponse === null) {
          return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        return new Response(JSON.stringify(mcpResponse, null, 2), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ status: "ok", server: "ruja-media-mcp", version: "1.0.0" }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Not found", hint: "MCP endpoint is at /mcp" }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
};
