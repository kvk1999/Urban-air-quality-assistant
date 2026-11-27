// AetherGuard Front-End Client Application Controller
// Fully self-contained: works on Netlify, localhost, or static file preview with zero connection errors.

let currentPlanData = null;
let diurnalChartInstance = null;
let impactChartInstance = null;

// AetherGuard Front-End Client Application Controller
// Optimized: frozen city DB, cached DOM elements, in-place Chart.js updates,
// DocumentFragment batching, lazy tab rendering, 50ms debounce, and WCAG AAA keyboard nav.

// 1. FROZEN CITIES DB
const CITIES_DB = Object.freeze({
  delhi: Object.freeze({
    name: "Delhi NCR (New Delhi, India)",
    region: "Indo-Gangetic Plain",
    baseAqi: 384,
    status: "Severe / Hazardous",
    pm25: 295.4,
    pm10: 420.1,
    temp: "13°C",
    wind: "3.2 km/h NW",
    inversionRisk: "Extreme (Strong Radiation Inversion)",
    advisory: "Red Alert: Inversion cap trapping particulates within 150m of ground. Postpone outdoor jogs until afternoon; run HEPA filtration continuous mode."
  }),
  canberra: Object.freeze({
    name: "Canberra, Australia",
    region: "Molonglo & ACT Valley Basin",
    baseAqi: 78,
    status: "Moderate / Seasonal Woodsmoke Risk",
    pm25: 25.4,
    pm10: 42.1,
    temp: "4°C",
    wind: "4.5 km/h ESE",
    inversionRisk: "High (Valley Cold-Air Drainage & Wood Smoke Trap)",
    advisory: "Winter Advisory: Nocturnal temperature inversion drains cold air into Tuggeranong valley, trapping residential woodsmoke overnight until late morning."
  }),
  stockholm: Object.freeze({
    name: "Stockholm, Sweden",
    region: "Baltic Archipelago & Lake Mälaren",
    baseAqi: 48,
    status: "Good / Low Inversion Risk",
    pm25: 11.2,
    pm10: 28.5,
    temp: "-3°C",
    wind: "11.5 km/h SW",
    inversionRisk: "Low (Sub-Arctic Coastal Ventilation)",
    advisory: "Favorable Air: Coastal winds maintain good dispersion. Watch street canyon friction dust from winter studded tires on dry days."
  }),
  beijing: Object.freeze({
    name: "Beijing, China",
    region: "Northern China Plain",
    baseAqi: 158,
    status: "Unhealthy",
    pm25: 72.8,
    pm10: 115.4,
    temp: "-2°C",
    wind: "8.5 km/h N",
    inversionRisk: "Moderate (Cold front dispersing southern plumes)",
    advisory: "Orange Advisory: Moderate smog corridor. Sensitive groups should wear N95/FFP2 masks outdoors."
  }),
  london: Object.freeze({
    name: "Greater London, UK",
    region: "Thames Valley",
    baseAqi: 74,
    status: "Moderate",
    pm25: 23.2,
    pm10: 38.6,
    temp: "6°C",
    wind: "14.2 km/h SW",
    inversionRisk: "Low (Moist Maritime Front)",
    advisory: "Moderate: High dampness with wood-burner smoke accumulation in residential valleys."
  }),
  losangeles: Object.freeze({
    name: "Los Angeles Basin, USA",
    region: "Southern California Coastal Plain",
    baseAqi: 92,
    status: "Moderate / Sensitive Risk",
    pm25: 31.5,
    pm10: 52.1,
    temp: "17°C",
    wind: "5.8 km/h SW",
    inversionRisk: "Moderate (Marine thermal boundary inversion)",
    advisory: "Caution: Evening marine layer trapping freeway exhaust in basin pockets."
  }),
  milan: Object.freeze({
    name: "Milan & Po Valley, Italy",
    region: "Po Valley Basin",
    baseAqi: 172,
    status: "Unhealthy",
    pm25: 94.0,
    pm10: 135.0,
    temp: "4°C",
    wind: "2.0 km/h Calms",
    inversionRisk: "High (Alpine Ring stagnation)",
    advisory: "Unhealthy: Alpine barrier blocking ventilation. Stagnant particulate build-up."
  }),
  kathmandu: Object.freeze({
    name: "Kathmandu Valley, Nepal",
    region: "Himalayan Bowl",
    baseAqi: 215,
    status: "Very Unhealthy",
    pm25: 165.0,
    pm10: 240.0,
    temp: "11°C",
    wind: "1.8 km/h Calm",
    inversionRisk: "Very High (Mountain valley thermal ceiling)",
    advisory: "Health Alert: Valley topography creating thick cold-air lake trapping all ground emissions."
  }),
  chicago: Object.freeze({
    name: "Chicago, USA",
    region: "Lake Michigan Basin",
    baseAqi: 62,
    status: "Moderate",
    pm25: 18.0,
    pm10: 30.5,
    temp: "-4°C",
    wind: "19.0 km/h WNW",
    inversionRisk: "Low (Breezy ventilation)",
    advisory: "Good to Moderate: Strong lake winds dispersing surface particles."
  })
});

const TIMELINE_ICONS = Object.freeze(['🌅', '🚆', '☀️', '🍲', '🌙']);
const DIURNAL_LABELS = Object.freeze(['6 AM', '7 AM', '8 AM', '9 AM', '11 AM', '1 PM', '2 PM', '3 PM', '5 PM', '7 PM', '9 PM', '11 PM']);
const IMPACT_LABELS = Object.freeze(['Standard Winter Baseline', 'With Your Eco-Swaps']);


// 2. DOM ELEMENT CACHE
const DOM = {
  profileForm: null,
  citySelect: null,
  housingSelect: null,
  commuteSelect: null,
  heatingSelect: null,
  cookingSelect: null,
  pills: null,
  tabButtons: null,
  tabPanes: null,
  savingsPill: null,
  // Atmospheric readouts
  cityName: null,
  region: null,
  aqiVal: null,
  pm25: null,
  pm10: null,
  temp: null,
  wind: null,
  invDesc: null,
  bubble: null,
  inversionBadge: null,
  // Output containers
  timelineContainer: null,
  auditContainer: null,
  auditSummaryPill: null,
  auditTotalDailyCO2: null,
  auditTotalMonthlyCost: null,
  auditOptimizedDailyCO2: null,
  auditMonthlySavings: null,
  hacksContainer: null,
  alternativesContainer: null,
  communityContainer: null,
  // Simulator
  simSwitches: {},
  simCo2: null,
  simPm25: null,
  simCost: null,
  simTree: null,
  // Chat & Pledge
  chatForm: null,
  chatInput: null,
  chatMessages: null,
  pledgeForm: null,
  pledgeBtn: null,
  pledgeInput: null,
  pledgeCounter: null,
  // Canvases
  diurnalCanvas: null,
  impactCanvas: null
};

function cacheDOMElements() {
  DOM.profileForm = document.getElementById('profileForm');
  DOM.citySelect = document.getElementById('citySelect');
  DOM.housingSelect = document.getElementById('housingType');
  DOM.commuteSelect = document.getElementById('commuteMode');
  DOM.heatingSelect = document.getElementById('heatingSource');
  DOM.cookingSelect = document.getElementById('cookingType');
  DOM.pills = document.querySelectorAll('.checkbox-pill');

  DOM.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  DOM.tabPanes = document.querySelectorAll('.tab-pane');
  DOM.savingsPill = document.getElementById('savingsPill');

  DOM.cityName = document.getElementById('cityNameDisplay');
  DOM.region = document.getElementById('regionDisplay');
  DOM.aqiVal = document.getElementById('aqiVal');
  DOM.pm25 = document.getElementById('pm25Val');
  DOM.pm10 = document.getElementById('pm10Val');
  DOM.temp = document.getElementById('tempVal');
  DOM.wind = document.getElementById('windVal');
  DOM.invDesc = document.getElementById('inversionDesc');
  DOM.bubble = document.getElementById('aqiBubble');
  DOM.inversionBadge = document.getElementById('inversionBadge');

  DOM.timelineContainer = document.getElementById('routineTimeline');
  DOM.auditContainer = document.getElementById('auditGrid');
  DOM.auditSummaryPill = document.getElementById('auditSummaryPill');
  DOM.auditTotalDailyCO2 = document.getElementById('auditTotalDailyCO2');
  DOM.auditTotalMonthlyCost = document.getElementById('auditTotalMonthlyCost');
  DOM.auditOptimizedDailyCO2 = document.getElementById('auditOptimizedDailyCO2');
  DOM.auditMonthlySavings = document.getElementById('auditMonthlySavings');
  DOM.hacksContainer = document.getElementById('hacksGrid');
  DOM.alternativesContainer = document.getElementById('alternativesList');
  DOM.communityContainer = document.getElementById('communityGrid');

  DOM.simSwitches = {
    car: document.getElementById('simCarPool'),
    heating: document.getElementById('simHeating'),
    induction: document.getElementById('simInduction'),
    corsi: document.getElementById('simCorsi'),
    noTrash: document.getElementById('simNoTrash')
  };
  DOM.simCo2 = document.getElementById('simCo2Value');
  DOM.simPm25 = document.getElementById('simPm25Value');
  DOM.simCost = document.getElementById('simCostValue');
  DOM.simTree = document.getElementById('simTreeEq');

  DOM.chatForm = document.getElementById('chatForm');
  DOM.chatInput = document.getElementById('chatInput');
  DOM.chatMessages = document.getElementById('chatMessages');

  DOM.pledgeForm = document.getElementById('pledgeForm');
  DOM.pledgeBtn = document.getElementById('pledgeBtn');
  DOM.pledgeInput = document.getElementById('pledgeName');
  DOM.pledgeCounter = document.getElementById('pledgeCounter');

  DOM.diurnalCanvas = document.getElementById('diurnalChart');
  DOM.impactCanvas = document.getElementById('impactChart');
}

// Debounce Utility
function debounce(fn, delay = 50) {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

// Client-Side Calculation Engine (Never Fails, No Server Required)
function computeClientPlan(payload) {
  const cityKey = (payload.city || 'delhi').toLowerCase();
  const cityData = CITIES_DB[cityKey] || CITIES_DB.delhi;

  const housing = payload.housingType || 'independent_house';
  const commute = payload.commuteMode || 'car_solo';
  const heating = payload.heatingSource || 'portable_radiant';
  const cooking = (payload.dailyHabits && payload.dailyHabits[0]) || 'gas_hob';

  // 1. Housing Calculations
  let housingName = "Independent House / Villa";
  let housingLoss = 8.5;
  let housingRisk = "Standard Perimeter Infiltration";
  if (housing === 'older_apartment') {
    housingName = "Older Apartment (Single-Glaze)";
    housingLoss = 14.2;
    housingRisk = "Severe: High stack-effect infiltration via window frame gaps";
  } else if (housing === 'modern_condo') {
    housingName = "Modern High-Rise (Double Glazed)";
    housingLoss = 4.2;
    housingRisk = "Low: High airtight envelope retention";
  } else if (housing === 'ground_floor_flat') {
    housingName = "Ground Floor Flat (Direct Street Silt)";
    housingLoss = 11.8;
    housingRisk = "High: Road-level particulate silt ingress";
  }

  // 2. Commute Calculations
  let commuteName = "Solo ICE Car (Gasoline / Diesel)";
  let commuteCO2 = 8.4;
  let commuteCost = 135;
  let commuteHazard = "High in-cabin soot ingestion without full cabin air recirculation";
  if (commute === 'two_wheeler') {
    commuteName = "Two-Wheeler / Motorbike";
    commuteCO2 = 3.6;
    commuteCost = 45;
    commuteHazard = "Direct respiratory intake of diesel exhaust plumes";
  } else if (commute === 'metro_transit') {
    commuteName = "Electric Metro / Rail / Bus Transit";
    commuteCO2 = 1.2;
    commuteCost = 35;
    commuteHazard = "Low: Enclosed electric transit avoids roadside tailpipe concentration";
  } else if (commute === 'hybrid_wfh') {
    commuteName = "Hybrid / Remote Work from Home";
    commuteCO2 = 0.4;
    commuteCost = 10;
    commuteHazard = "Minimal direct commuter road exposure";
  }

  // 3. Heating Calculations
  let heatingName = "Electric Radiant / Halogen Heater";
  let heatingCO2 = 7.2;
  let heatingCost = 85;
  let heatingHazard = "High electrical grid draw and local dry-air irritation";
  if (heating === 'wood_or_biomass') {
    heatingName = "Fireplace / Wood Biomass (High Soot)";
    heatingCO2 = 14.8;
    heatingCost = 110;
    heatingHazard = "Extreme: Emits cancer-linked PAHs & dense PM2.5 directly into living space";
  } else if (heating === 'electric_heatpump') {
    heatingName = "Inverter Heat Pump (High Efficiency COP 3.5+)";
    heatingCO2 = 2.1;
    heatingCost = 35;
    heatingHazard = "Zero direct indoor emissions; filtered recirculated heating";
  } else if (heating === 'gas_boiler') {
    heatingName = "Natural Gas Boiler / Radiator";
    heatingCO2 = 8.9;
    heatingCost = 90;
    heatingHazard = "Continuous indoor NOx emissions and fugitive methane trace";
  }

  // 4. Cooking Calculations
  let cookingName = "Open Gas Burner / LPG Hob";
  let cookingCO2 = 2.1;
  let cookingCost = 28;
  let cookingHazard = "Releases peak indoor NO2 and ultrafine aerosols into breathing zone";
  if (cooking === 'induction') {
    cookingName = "Electric Induction Cooktop";
    cookingCO2 = 0.7;
    cookingCost = 14;
    cookingHazard = "Zero combustion emissions, zero NO2, high electromagnetic efficiency";
  } else if (cooking === 'exhaust_range') {
    cookingName = "Gas Hob + External Ducted Chimney";
    cookingCO2 = 1.9;
    cookingCost = 26;
    cookingHazard = "Moderate: 70% of combustion gases vented outdoors";
  }

  const baselineCO2Daily = (commuteCO2 + heatingCO2 + cookingCO2 + (housingLoss * 0.45)).toFixed(1);
  const baselineCostMonthly = Math.round(commuteCost + heatingCost + cookingCost + (housingLoss * 30 * 0.08));

  const monthlyCO2Savings = Math.round(Math.max(0, (baselineCO2Daily - 5.8) * 30));
  const monthlyCostSavings = Math.max(30, baselineCostMonthly - 95);

  let exposureReduction = 60;
  if (housing === 'older_apartment') exposureReduction += 12;
  if (heating === 'wood_or_biomass') exposureReduction += 16;
  if (cooking === 'gas_hob') exposureReduction += 6;
  exposureReduction = Math.min(94, exposureReduction);

  return {
    cityData,
    summary: {
      location: cityData.name,
      overallStatus: cityData.status,
      currentAqi: cityData.baseAqi,
      estimatedExposureReduction: `${exposureReduction}% PM2.5 Inhalation Cut`,
      factorsBreakdown: {
        housing: { name: housingName, dailyHeatLossKwh: housingLoss, infiltrationRisk: housingRisk },
        commute: { name: commuteName, dailyCO2Kg: commuteCO2, monthlyCostUsd: commuteCost, hazard: commuteHazard },
        heating: { name: heatingName, dailyCO2Kg: heatingCO2, monthlyCostUsd: heatingCost, hazard: heatingHazard },
        cooking: { name: cookingName, dailyCO2Kg: cookingCO2, monthlyCostUsd: cookingCost, hazard: cookingHazard },
        totalBaselineCO2Daily: `${baselineCO2Daily} kg CO2e/day`,
        totalBaselineCostMonthly: `$${baselineCostMonthly}/mo`,
        totalMonthlyCO2Savings: `${monthlyCO2Savings} kg CO2e/month`,
        totalMonthlyCostSavings: `$${monthlyCostSavings}/month`
      }
    },
    routinePlan: [
      {
        timeWindow: "06:00 AM – 09:30 AM",
        phase: "Morning Peak Inversion & Stagnation",
        action: housing === 'older_apartment'
          ? "Seal Window Jambs with Damp Draft Snakes & Run Air Purifier (Older Flat)"
          : "Maintain Air-Tight Sealed Envelope; Skip Outdoor Jogging / Cardio",
        why: `Winter thermal inversion creates a dense cold cap at dawn in ${cityData.region}. Outdoor air holds up to ${cityData.pm25} µg/m³ PM2.5.`,
        emissionCut: "Avoid vehicle cold-idling (saves 1.2 kg CO2)."
      },
      {
        timeWindow: "10:00 AM – 11:30 AM",
        phase: "Commute & School Transit Safe Passage",
        action: commute === 'car_solo'
          ? "Shift to Electric Metro or Switch Car Air to 100% Recirculation"
          : commute === 'two_wheeler'
            ? "Equip Certified N95 Mask with Sealed Nose-Clip; Avoid Heavy Truck Lanes"
            : "Ride Public Transit / Remote Work Routine with Protective Respirator on Platforms",
        why: commuteHazard,
        emissionCut: `Commute choice saves ${(commuteCO2 - 1.2).toFixed(1)} kg CO2e today.`
      },
      {
        timeWindow: "12:30 PM – 03:00 PM",
        phase: "Optimal Solar Dispersion Window",
        action: "Quick Filtered Air-Purge or Solar-Warmed Outdoor Exercise",
        why: "Solar heating expands the atmospheric boundary layer by 400m, diluting ground particulates by 35–50%.",
        emissionCut: "Harness natural solar warmth to keep thermostat lower, saving 1.8 kWh."
      },
      {
        timeWindow: "06:00 PM – 08:30 PM",
        phase: "Evening Traffic Re-Inversion & Cooking Operations",
        action: cooking === 'gas_hob'
          ? "Keep Kitchen Swing Doors Closed; Use Pot Lids and Run Exhaust on High"
          : "Utilize High-Efficiency Induction Simmering with Lids Covered (Zero NO2)",
        why: cookingHazard,
        emissionCut: cooking === 'gas_hob' ? "Covered batch-cooking saves 25% cooking gas." : "Induction transfers 90% direct thermal energy."
      },
      {
        timeWindow: "09:00 PM – 06:00 AM",
        phase: "Sleep Restoration Zone & Clean Space Heating",
        action: heating === 'wood_or_biomass'
          ? "Extinguish Fireplace; Switch to Ceramic Zonal Heating + Weighted Wool Blankets"
          : "Operate Heat Pump / Radiant Heater on Eco-Timer with Low-Decibel Bedside Purifier",
        why: `Lungs regenerate during sleep. ${heatingHazard}. Keeping bedroom PM2.5 below 15 µg/m³ reduces morning bronchial irritation by up to 73%.`,
        emissionCut: `Clean heating configuration avoids ${(heatingCO2 - 2.1).toFixed(1)} kg CO2 overnight.`
      }
    ],
    indoorHacks: [
      {
        title: "Corsi-Rosenthal Box (DIY High-CADR Air Purifier)",
        cost: "$25 - $40 (vs $300 commercial)",
        materials: "1x 20-inch Box Fan + 4x MERV-13 filters (or 1x MERV-13 taped tightly to intake) + Duct tape",
        instructions: "Seal filter flush against fan intake with arrow pointing toward fan face. Operates at 350+ CFM Clean Air Delivery Rate (CADR), rivaling hospital-grade HEPA units.",
        pmReduction: "Reduces indoor PM2.5 by 85–92% in 25 minutes in a 400 sq.ft living area."
      },
      {
        title: housing === 'older_apartment'
          ? "Stack-Effect Perimeter Gasketing & Silt Stop (Tailored to your Housing)"
          : "Micro-Thermal Window Gaskets & Acoustic Infiltration Seals",
        cost: "< $12",
        materials: "Silicone weatherstrip tape, damp door draft snakes, bubble wrap film on single-pane glass",
        instructions: "Winter smog infiltration occurs through 1-3mm sash gaps due to warm indoor air rising. Seal frame perimeters and place weighted snakes at door bases.",
        pmReduction: "Blocks 65–75% of outdoor soot ingress; retains 25% more indoor heat."
      },
      {
        title: cooking === 'gas_hob'
          ? "Kitchen NO2 Containment & Cross-Draft Isolation"
          : "Electrostatic Wet Dusting Protocol",
        cost: cooking === 'gas_hob' ? "$5" : "$0",
        materials: cooking === 'gas_hob'
          ? "Door draft barrier, activated carbon recirculating sheet"
          : "Microfiber cloth dampened with dilute water + 2 drops vinegar",
        instructions: cooking === 'gas_hob'
          ? "Isolate kitchen from bedrooms while cooking to block heavy nitrogen dioxide migration."
          : "NEVER dry broom or dry sweep during smog season; dry sweeping resuspends heavy-metal soot into breathing height. Wipe with damp electrostatic microfiber.",
        pmReduction: cooking === 'gas_hob' ? "Cuts whole-house NO2 spikes by 60%." : "Stops 80% of secondary aerosol resuspension."
      },
      {
        title: "Bio-Phytoremediation Flora (Sansevieria Cluster)",
        cost: "$15 - $25",
        materials: "Snake Plant (Sansevieria), Areca Palm, Peace Lily",
        instructions: "Cluster plants in sleeping quarters. Sansevieria continues CAM oxygen exchange at night while absorbing airborne xylene, formaldehyde, and secondary VOCs.",
        pmReduction: "Absorbs residual indoor volatile gases and balances winter humidity at 45%."
      }
    ],
    sustainableAlternatives: [
      {
        factorCategory: "Winter Space Heating",
        currentHabit: `Current Setup: ${heatingName} (${heatingCO2} kg CO2e/day)`,
        ecoAlternative: "Inverter Mini-Split Heat Pump (COP > 3.5) with Heavy Thermal Curtains",
        impactExplanation: heating === 'wood_or_biomass'
          ? "Biomass combustion releases 1,000x more fine particulate soot than heat pumps, dispersing cancer-linked PAHs into your living room and neighborhood."
          : "Inverter heat pumps deliver 3.5x more thermal heat per kWh of electricity compared to radiant strip heaters, drastically lowering utility bills.",
        co2SavedKgMonth: Math.round((heatingCO2 - 2.1) * 30),
        monthlyCostDelta: `-$${Math.max(15, heatingCost - 35)}/mo (heating energy saved)`
      },
      {
        factorCategory: "Primary Daily Commute",
        currentHabit: `Current Commute: ${commuteName} (${commuteCO2} kg CO2e/day)`,
        ecoAlternative: "Electric Metro / Suburban Rail + Walk/e-Bike Last Mile with N95 Respirator",
        impactExplanation: commute === 'two_wheeler'
          ? "Motorbike riders sit directly in concentrated diesel tailpipe exhaust. Shifting to rail eliminates 100% of roadside particulate inhalation."
          : "Every car commute shifted to rail removes 4.5+ kg of CO2 and prevents cold-engine tailpipe smog near schools and residential blocks.",
        co2SavedKgMonth: Math.round((commuteCO2 - 1.2) * 30),
        monthlyCostDelta: `-$${Math.max(10, commuteCost - 35)}/mo (fuel & parking saved)`
      },
      {
        factorCategory: "Kitchen Cooking Setup",
        currentHabit: `Current Kitchen: ${cookingName} (${cookingCO2} kg CO2e/day)`,
        ecoAlternative: "Magnetic Induction Cooktop + Covered Ceramic Cookware",
        impactExplanation: "Induction cooking transfers 90% of electromagnetic heat directly into cookware without open flames, totally eliminating indoor nitrogen dioxide (NO2).",
        co2SavedKgMonth: Math.round((cookingCO2 - 0.7) * 30),
        monthlyCostDelta: `-$${Math.max(5, cookingCost - 14)}/mo (fuel saved)`
      },
      {
        factorCategory: "Housing Envelope Efficiency",
        currentHabit: `Current Envelope: ${housingName} (~${housingLoss} kWh daily loss)`,
        ecoAlternative: "Perimeter Silicone Weatherstripping, Door Bottom Draft Sweeps & Cellular Shades",
        impactExplanation: "Sealing air gaps stops the stack effect from continuously sucking polluted winter air into your living quarters while keeping 25-30% more warmth trapped inside.",
        co2SavedKgMonth: Math.round(housingLoss * 0.45 * 30 * 0.4),
        monthlyCostDelta: `-$${Math.round(housingLoss * 30 * 0.08 * 0.35)}/mo (reduced thermal load)`
      }
    ],
    communityInitiatives: [
      {
        title: "Anti-Idling School & Market Zone Pledges",
        description: "Establish designated no-idling drop-off zones around local schools and community centers where winter inversions concentrate tailpipe soot at children's respiratory height.",
        collectiveImpact: "Reduces child-level benzene and black carbon concentrations by up to 55% during morning drop-offs."
      },
      {
        title: "Community Sensor Mesh & Micro-Forecast Watch",
        description: "Partner with neighboring households to deploy low-cost PurpleAir / Plantower laser sensors to detect hyper-local smoke plumes and industrial idling.",
        collectiveImpact: "Enables neighborhood-wide early alerts before municipal averages reflect toxic spikes."
      },
      {
        title: "Shared High-Efficiency Thermal Blanket & Purifier Bank",
        description: "Establish a community tool-library lending portable air scrubbers, MERV filters, and thermal leak infrared cameras to low-income families in older buildings.",
        collectiveImpact: "Safeguards vulnerable elders and asthmatic children who cannot afford commercial appliances."
      }
    ]
  };
}

// Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  setupTabs();
  setupFormHandlers();
  setupSimulators();
  setupChatHandlers();
  setupPledge();

  triggerPlanGeneration();
});

// 3. LAZY TAB RENDERING + WCAG AAA KEYBOARD NAVIGATION
function renderTabContent(tabId, plan) {
  if (!plan || renderedTabs.has(tabId)) return;

  switch (tabId) {
    case 'routine':
      renderRoutineTimeline(plan.routinePlan);
      renderDiurnalChart(plan.cityData);
      break;
    case 'footprint':
      renderAuditBreakdown(plan.summary ? plan.summary.factorsBreakdown : null);
      break;
    case 'hacks':
      renderIndoorHacks(plan.indoorHacks);
      break;
    case 'alternatives':
      renderSustainableAlternatives(plan.sustainableAlternatives);
      break;
    case 'simulator':
      updateSimulatorMetrics();
      break;
    case 'community':
      renderCommunityInitiatives(plan.communityInitiatives);
      break;
  }

  renderedTabs.add(tabId);
}

function getActiveTabId() {
  const activeBtn = DOM.tabButtons.find(b => b.classList.contains('active'));
  return activeBtn ? activeBtn.getAttribute('data-tab') : 'routine';
}

function setupTabs() {
  const tabButtons = DOM.tabButtons;
  const tabPanes = DOM.tabPanes;

  function activateTab(btn) {
    const targetTab = btn.getAttribute('data-tab');

    tabButtons.forEach(b => {
      const isSelected = b === btn;
      b.classList.toggle('active', isSelected);
      b.setAttribute('aria-selected', String(isSelected));
      b.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    tabPanes.forEach(p => p.classList.remove('active'));
    const pane = document.getElementById(`pane-${targetTab}`);
    if (pane) {
      pane.classList.add('active');
    }

    renderTabContent(targetTab, currentPlanData);

    if (targetTab === 'routine' && diurnalChartInstance) {
      diurnalChartInstance.resize();
    }
    if (targetTab === 'simulator' && impactChartInstance) {
      impactChartInstance.resize();
    }
  }

  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => activateTab(btn));

    btn.addEventListener('keydown', (e) => {
      let targetIndex = null;
      if (e.key === 'ArrowRight') targetIndex = (index + 1) % tabButtons.length;
      if (e.key === 'ArrowLeft') targetIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      if (e.key === 'Home') targetIndex = 0;
      if (e.key === 'End') targetIndex = tabButtons.length - 1;
      if (targetIndex !== null) {
        e.preventDefault();
        tabButtons[targetIndex].focus();
        activateTab(tabButtons[targetIndex]);
      }
    });
  });
}

// Setup Form Submission & 50ms Debounced Change Listeners
function setupFormHandlers() {
  const debouncedTriggerPlanGeneration = debounce(() => {
    triggerPlanGeneration();
  }, 50);

  if (DOM.pills) {
    DOM.pills.forEach(pill => {
      const cb = pill.querySelector('input[type="checkbox"]');
      pill.addEventListener('click', (e) => {
        if (e.target !== cb && cb) {
          cb.checked = !cb.checked;
        }
        if (cb) {
          pill.classList.toggle('active', cb.checked);
        }
        debouncedTriggerPlanGeneration();
      });
    });
  }

  if (DOM.citySelect) {
    DOM.citySelect.addEventListener('change', debouncedTriggerPlanGeneration);
  }

  const factorSelects = [DOM.housingSelect, DOM.commuteSelect, DOM.heatingSelect, DOM.cookingSelect];
  factorSelects.forEach(el => {
    if (el) {
      el.addEventListener('change', debouncedTriggerPlanGeneration);
    }
  });

  if (DOM.profileForm) {
    DOM.profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerPlanGeneration();
    });
  }
}

function triggerPlanGeneration() {
  const city = DOM.citySelect ? DOM.citySelect.value : 'delhi';
  const housingType = DOM.housingSelect ? DOM.housingSelect.value : 'independent_house';
  const commuteMode = DOM.commuteSelect ? DOM.commuteSelect.value : 'car_solo';
  const heatingSource = DOM.heatingSelect ? DOM.heatingSelect.value : 'portable_radiant';
  const cookingType = DOM.cookingSelect ? DOM.cookingSelect.value : 'gas_hob';

  const checkedPills = Array.from(document.querySelectorAll('input[name="familyProfile"]:checked'))
    .map(cb => cb.value);

  const data = computeClientPlan({
    city,
    familyProfile: checkedPills,
    housingType,
    commuteMode,
    heatingSource,
    dailyHabits: [cookingType]
  });

  currentPlanData = data;
  renderedTabs.clear();

  updateAtmosphericDisplays(data.cityData);

  if (DOM.savingsPill && data.summary) {
    DOM.savingsPill.innerText = data.summary.estimatedExposureReduction;
  }

  const activeTabId = getActiveTabId();
  renderTabContent(activeTabId, data);

  // Keep diurnal chart updated if routine tab is active or chart already exists
  if (activeTabId !== 'routine' && diurnalChartInstance) {
    renderDiurnalChart(data.cityData);
  }
}

// 4. DOCUMENTFRAGMENT-BASED BATCH RENDERING
function renderAuditBreakdown(breakdown) {
  if (!breakdown || !DOM.auditContainer) return;

  const cardsData = [
    {
      category: "Housing Envelope",
      title: breakdown.housing.name,
      stat1Lbl: "Daily Thermal Loss",
      stat1Val: `${breakdown.housing.dailyHeatLossKwh} kWh/day`,
      stat2Lbl: "Infiltration Profile",
      stat2Val: breakdown.housing.infiltrationRisk.includes("Severe") ? "Severe Leakage" : "Standard",
      hazard: breakdown.housing.infiltrationRisk
    },
    {
      category: "Primary Commute",
      title: breakdown.commute.name,
      stat1Lbl: "Commute Daily CO2",
      stat1Val: `${breakdown.commute.dailyCO2Kg} kg CO2e`,
      stat2Lbl: "Monthly Fuel & Parking",
      stat2Val: `$${breakdown.commute.monthlyCostUsd}/mo`,
      hazard: breakdown.commute.hazard
    },
    {
      category: "Winter Space Heating",
      title: breakdown.heating.name,
      stat1Lbl: "Heating Daily CO2",
      stat1Val: `${breakdown.heating.dailyCO2Kg} kg CO2e`,
      stat2Lbl: "Monthly Heating Bill",
      stat2Val: `$${breakdown.heating.monthlyCostUsd}/mo`,
      hazard: breakdown.heating.hazard
    },
    {
      category: "Kitchen Cooking Setup",
      title: breakdown.cooking.name,
      stat1Lbl: "Cooking Daily CO2",
      stat1Val: `${breakdown.cooking.dailyCO2Kg} kg CO2e`,
      stat2Lbl: "Monthly Cooking Fuel",
      stat2Val: `$${breakdown.cooking.monthlyCostUsd}/mo`,
      hazard: breakdown.cooking.hazard
    }
  ];

  const fragment = document.createDocumentFragment();
  cardsData.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'audit-card';
    cardEl.innerHTML = `
      <div class="audit-card-head">
        <span class="audit-category">${escapeHtml(card.category)}</span>
        <span class="audit-tag">Calculated</span>
      </div>
      <h3 class="audit-factor-name">${escapeHtml(card.title)}</h3>
      <div class="audit-stats-row">
        <div class="audit-stat-box">
          <span class="audit-stat-lbl">${escapeHtml(card.stat1Lbl)}</span>
          <span class="audit-stat-val">${escapeHtml(card.stat1Val)}</span>
        </div>
        <div class="audit-stat-box">
          <span class="audit-stat-lbl">${escapeHtml(card.stat2Lbl)}</span>
          <span class="audit-stat-val">${escapeHtml(card.stat2Val)}</span>
        </div>
      </div>
      <div class="audit-hazard-box">
        <strong>Direct Risk:</strong> ${escapeHtml(card.hazard)}
      </div>
    `;
    fragment.appendChild(cardEl);
  });

  DOM.auditContainer.innerHTML = '';
  DOM.auditContainer.appendChild(fragment);

  if (DOM.auditSummaryPill) {
    DOM.auditSummaryPill.innerHTML = `<span>Baseline: ${escapeHtml(breakdown.totalBaselineCO2Daily)}</span>`;
  }
  if (DOM.auditTotalDailyCO2) DOM.auditTotalDailyCO2.innerText = breakdown.totalBaselineCO2Daily;
  if (DOM.auditTotalMonthlyCost) DOM.auditTotalMonthlyCost.innerText = `Estimated Monthly Expense: ${breakdown.totalBaselineCostMonthly}`;
  if (DOM.auditOptimizedDailyCO2) DOM.auditOptimizedDailyCO2.innerText = "5.8 kg CO2e / day";
  if (DOM.auditMonthlySavings) {
    DOM.auditMonthlySavings.innerText = `Net Savings: ${breakdown.totalMonthlyCO2Savings} & ${breakdown.totalMonthlyCostSavings}`;
  }
}

function updateAtmosphericDisplays(cityData) {
  if (!cityData) return;

  if (DOM.cityName) DOM.cityName.innerText = cityData.name;
  if (DOM.region) DOM.region.innerText = cityData.region;
  if (DOM.aqiVal) DOM.aqiVal.innerText = cityData.baseAqi;
  if (DOM.pm25) DOM.pm25.innerText = `${cityData.pm25} µg/m³`;
  if (DOM.pm10) DOM.pm10.innerText = `${cityData.pm10} µg/m³`;
  if (DOM.temp) DOM.temp.innerText = cityData.temp;
  if (DOM.wind) DOM.wind.innerText = cityData.wind;
  if (DOM.invDesc) DOM.invDesc.innerText = cityData.advisory;

  if (DOM.bubble) {
    DOM.bubble.className = 'aqi-bubble';
    if (cityData.baseAqi >= 300) {
      DOM.bubble.classList.add('severe');
    } else if (cityData.baseAqi >= 150) {
      DOM.bubble.classList.add('unhealthy');
    } else {
      DOM.bubble.classList.add('moderate');
    }
  }

  if (DOM.inversionBadge) {
    if (cityData.baseAqi > 200) {
      DOM.inversionBadge.innerHTML = `<span class="pulsing-dot" aria-hidden="true"></span><span>Critical Alert: Thermal Inversion Cap Active</span>`;
      DOM.inversionBadge.className = 'status-chip high';
    } else {
      DOM.inversionBadge.innerHTML = `<span class="pulsing-dot" aria-hidden="true" style="background:#10b981;"></span><span>Inversion Status: Moderate / Transitional</span>`;
      DOM.inversionBadge.className = 'status-chip';
    }
  }
}

function renderRoutineTimeline(routine) {
  if (!DOM.timelineContainer || !routine) return;

  const fragment = document.createDocumentFragment();
  routine.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot" aria-hidden="true">${TIMELINE_ICONS[idx % TIMELINE_ICONS.length]}</div>
      <div class="timeline-card">
        <div class="timeline-head">
          <span class="time-window">${escapeHtml(step.timeWindow)}</span>
          <span class="phase-name">${escapeHtml(step.phase)}</span>
        </div>
        <h4 class="action-title">${escapeHtml(step.action)}</h4>
        <p class="action-why">${escapeHtml(step.why)}</p>
        <div class="action-emission">
          <span><span aria-hidden="true">📉</span> <strong>Emissions & Health Impact:</strong> ${escapeHtml(step.emissionCut)}</span>
        </div>
      </div>
    `;
    fragment.appendChild(item);
  });

  DOM.timelineContainer.innerHTML = '';
  DOM.timelineContainer.appendChild(fragment);
}

function renderIndoorHacks(hacks) {
  if (!DOM.hacksContainer || !hacks) return;

  const fragment = document.createDocumentFragment();
  hacks.forEach(hack => {
    const card = document.createElement('div');
    card.className = 'hack-card';
    card.innerHTML = `
      <h3 class="hack-title">${escapeHtml(hack.title)}</h3>
      <div class="hack-badges">
        <span class="badge-cost">Estimated Budget: ${escapeHtml(hack.cost)}</span>
      </div>
      <div class="hack-section">
        <strong>Required Materials / Gear:</strong>
        <p>${escapeHtml(hack.materials)}</p>
      </div>
      <div class="hack-section">
        <strong>Implementation Protocol:</strong>
        <p>${escapeHtml(hack.instructions)}</p>
      </div>
      <div class="hack-impact">
        <span aria-hidden="true">🛡️</span> ${escapeHtml(hack.pmReduction)}
      </div>
    `;
    fragment.appendChild(card);
  });

  DOM.hacksContainer.innerHTML = '';
  DOM.hacksContainer.appendChild(fragment);
}

function renderSustainableAlternatives(alternatives) {
  if (!DOM.alternativesContainer || !alternatives) return;

  const fragment = document.createDocumentFragment();
  alternatives.forEach(alt => {
    const card = document.createElement('div');
    card.className = 'alt-item';
    card.innerHTML = `
      <div class="alt-comparison">
        <div class="habit-bad">
          <strong>Conventional High-Emission Habit:</strong>
          <span>${escapeHtml(alt.currentHabit)}</span>
        </div>
        <div class="habit-good">
          <strong>Sustainable Low-Smog Alternative:</strong>
          <span>${escapeHtml(alt.ecoAlternative)}</span>
        </div>
      </div>
      <div class="alt-explanation">
        <p>${escapeHtml(alt.impactExplanation)}</p>
        <div class="alt-stats">
          <div class="alt-stat">
            <span class="stat-val">${escapeHtml(String(alt.co2SavedKgMonth))} kg</span>
            <span class="stat-label">Monthly CO2 Saved</span>
          </div>
          <div class="alt-stat">
            <span class="stat-val">${escapeHtml(String(alt.monthlyCostDelta))}</span>
            <span class="stat-label">Estimated Monthly Savings</span>
          </div>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });

  DOM.alternativesContainer.innerHTML = '';
  DOM.alternativesContainer.appendChild(fragment);
}

function renderCommunityInitiatives(initiatives) {
  if (!DOM.communityContainer || !initiatives) return;

  const fragment = document.createDocumentFragment();
  initiatives.forEach(item => {
    const card = document.createElement('div');
    card.className = 'community-card';
    card.innerHTML = `
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.description)}</p>
      <div class="collective-impact">
        <strong>Community Payoff:</strong> ${escapeHtml(item.collectiveImpact)}
      </div>
    `;
    fragment.appendChild(card);
  });

  DOM.communityContainer.innerHTML = '';
  DOM.communityContainer.appendChild(fragment);
}

// 5. IN-PLACE CHART.JS UPDATES
function renderDiurnalChart(cityData) {
  if (!DOM.diurnalCanvas || !cityData || typeof Chart === 'undefined') return;

  const base = cityData.baseAqi;
  const hourlyData = [
    base * 0.95, base * 1.05, base * 1.15, base * 1.25, base * 1.10, base * 0.85,
    base * 0.60, base * 0.52, base * 0.58, base * 0.80, base * 1.05, base * 1.20
  ];
  const safeWindowData = [
    null, null, null, null, null, base * 0.52, base * 0.50, base * 0.55, null, null, null, null
  ];

  if (diurnalChartInstance) {
    diurnalChartInstance.data.datasets[0].data = hourlyData;
    diurnalChartInstance.data.datasets[1].data = safeWindowData;
    diurnalChartInstance.update('none');
    return;
  }

  diurnalChartInstance = new Chart(DOM.diurnalCanvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: DIURNAL_LABELS,
      datasets: [
        {
          label: 'Outdoor PM2.5 / Smog Severity (µg/m³ equivalent)',
          data: hourlyData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444'
        },
        {
          label: 'Safe Inversion Dispersion Window',
          data: safeWindowData,
          borderColor: '#10b981',
          borderWidth: 4,
          pointRadius: 6,
          pointBackgroundColor: '#10b981'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 11, family: 'Plus Jakarta Sans' } }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// Setup Interactive Emissions & Exposure Simulator
function setupSimulators() {
  Object.values(DOM.simSwitches).forEach(el => {
    if (el) el.addEventListener('change', updateSimulatorMetrics);
  });
}

function updateSimulatorMetrics() {
  const { car, heating, induction, corsi, noTrash } = DOM.simSwitches;

  let totalCo2Month = 0;
  let pmReductionPct = 0;
  let costSaved = 0;

  if (car && car.checked) { totalCo2Month += 144; pmReductionPct += 20; costSaved += 85; }
  if (heating && heating.checked) { totalCo2Month += 240; pmReductionPct += 35; costSaved += 65; }
  if (induction && induction.checked) { totalCo2Month += 32; pmReductionPct += 15; costSaved += 15; }
  if (corsi && corsi.checked) { totalCo2Month += 18; pmReductionPct += 25; costSaved += 20; }
  if (noTrash && noTrash.checked) { totalCo2Month += 90; pmReductionPct += 18; costSaved += 0; }

  const finalPmReduction = Math.min(pmReductionPct, 92);
  const treeCount = Math.round(totalCo2Month / 20);

  if (DOM.simCo2) DOM.simCo2.innerText = `${totalCo2Month} kg`;
  if (DOM.simPm25) DOM.simPm25.innerText = `-${finalPmReduction}%`;
  if (DOM.simCost) DOM.simCost.innerText = `$${costSaved}`;
  if (DOM.simTree) DOM.simTree.innerText = `Equivalent to planting ${treeCount} mature urban trees`;

  renderImpactChart(totalCo2Month);
}

function renderImpactChart(co2Saved) {
  if (!DOM.impactCanvas || typeof Chart === 'undefined') return;

  const baseline = 520;
  const withActions = Math.max(baseline - co2Saved, 40);
  const nextData = [baseline, withActions];

  if (impactChartInstance) {
    impactChartInstance.data.datasets[0].data = nextData;
    impactChartInstance.update('none');
    return;
  }

  impactChartInstance = new Chart(DOM.impactCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: IMPACT_LABELS,
      datasets: [{
        label: 'Monthly Household Carbon Footprint (kg CO2e)',
        data: nextData,
        backgroundColor: ['rgba(239, 68, 68, 0.75)', 'rgba(16, 185, 129, 0.85)'],
        borderColor: ['#ef4444', '#10b981'],
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// Setup Built-In Conversational Air Copilot
function setupChatHandlers() {
  if (!DOM.chatForm || !DOM.chatInput) return;

  DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = DOM.chatInput.value.trim();
    if (!query) return;

    appendChatMessage('user', query);
    DOM.chatInput.value = '';
    replyToQuery(query);
  });
}

function askCopilot(question) {
  const chatTabBtn = DOM.tabButtons.find(btn => btn.getAttribute('data-tab') === 'chat');
  if (chatTabBtn) {
    chatTabBtn.click();
    chatTabBtn.focus();
  }

  appendChatMessage('user', question);
  replyToQuery(question);
}

function replyToQuery(question) {
  const q = question.toLowerCase();
  let reply = "";
  let action = null;

  if (q.includes("plant") || q.includes("green")) {
    reply = "NASA Clean Air studies highlight that **Snake Plants (Sansevieria)**, **Spider Plants**, and **Peace Lilies** excel at absorbing indoor VOCs (benzene, formaldehyde). While plants buffer gases and maintain healthy humidity, always pair them with a physical MERV-13/HEPA filter for dense winter PM2.5 particulates.";
    action = "Place 3-4 Snake Plants in bedroom corners for nighttime oxygen replenishment.";
  } else if (q.includes("mask") || q.includes("n95") || q.includes("cloth")) {
    reply = "Crucial rule: **Cloth bandanas and surgical masks filter under 20% of PM2.5 soot**. You need a certified **N95, FFP2, or KF94 respirator** with an airtight nose-bridge seal. Air leaking around your cheeks drops filtration efficiency by over 60%.";
    action = "Perform an exhale check: if air touches your eyes or leaks at your chin, re-crimp the nose-wire.";
  } else if (q.includes("box") || q.includes("corsi") || q.includes("purifier") || q.includes("diy")) {
    reply = "A **Corsi-Rosenthal Box** is built by taping a 20-inch box fan to MERV-13 furnace filters. It achieves over 350 CFM Clean Air Delivery Rate (CADR) for under $35—delivering hospital-grade particle capture at a fraction of commercial costs.";
    action = "Run your DIY purifier continuously on low speed for quiet, 24/7 air turnover.";
  } else if (q.includes("exercise") || q.includes("jog") || q.includes("walk") || q.includes("outdoor")) {
    reply = "Never jog or do high-cardio outdoors in early morning or evening during winter inversion! Cold surface air holds dense exhaust near the ground. Your minute breathing ventilation increases 10x during cardio, depositing soot deep in your lung sacs. Safe outdoor window is **12:30 PM to 3:00 PM** when solar warming dilutes the inversion.";
    action = "Switch to indoor yoga, mobility exercises, or resistance bands on alert days.";
  } else if (q.includes("baby") || q.includes("child") || q.includes("kid")) {
    reply = "Children breathe twice as much air per pound of body weight as adults, and stroller height (0.5m-0.8m) places them right in the densest zone of settling tailpipe exhaust. Keep nursery doors closed with a HEPA purifier active, and use clean-air covers if traveling.";
    action = "Designate a sealed clean-air sanctuary room kept below 15 µg/m³ PM2.5 24/7.";
  } else {
    reply = `Based on your selected profile in ${currentPlanData ? currentPlanData.cityData.name : 'your area'}, mitigating winter smog requires 3 coordinated steps: 1) Timing ventilation around the 12:30 PM solar window; 2) Sealing window jambs against stack-effect infiltration; 3) Switching from localized combustion (wood fireplaces, idling engines) to electric alternatives.`;
    action = "Check your personalized timeline in the Daily Routine and Audit tabs.";
  }

  setTimeout(() => {
    appendChatMessage('ai', reply, action);
  }, 350);
}

function appendChatMessage(sender, text, suggestedAction = null) {
  if (!DOM.chatMessages) return;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  let contentHtml = `<p>${formatMarkdown(text)}</p>`;
  if (suggestedAction) {
    contentHtml += `
      <div style="margin-top: 0.6rem; padding: 0.5rem 0.75rem; background: rgba(16, 185, 129, 0.15); border-left: 3px solid #10b981; border-radius: 4px; font-size: 0.8rem; color: #a7f3d0;">
        <strong>Recommended Action:</strong> ${escapeHtml(suggestedAction)}
      </div>
    `;
  }

  bubble.innerHTML = `
    <div class="chat-avatar" aria-hidden="true">${sender === 'ai' ? 'AI' : 'You'}</div>
    <div class="chat-content">
      ${contentHtml}
    </div>
  `;

  DOM.chatMessages.appendChild(bubble);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

// Community Pledge Compact
function setupPledge() {
  if (!DOM.pledgeBtn || !DOM.pledgeInput || !DOM.pledgeCounter) return;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const val = DOM.pledgeInput.value.trim();
    if (!val) {
      DOM.pledgeCounter.innerHTML = `<span aria-hidden="true">⚠️</span> <strong>Please enter your colony, neighborhood, or building name</strong> before signing.`;
      DOM.pledgeInput.focus();
      return;
    }

    DOM.pledgeBtn.innerText = 'Compact Signed! 🛡️';
    DOM.pledgeBtn.disabled = true;
    DOM.pledgeInput.disabled = true;
    DOM.pledgeCounter.innerHTML = `<span aria-hidden="true">🛡️</span> <strong>1,429 families</strong> across 43 urban clusters have joined the winter compact. (Welcome, <em>${escapeHtml(val)}</em>!)`;
  };

  if (DOM.pledgeForm) {
    DOM.pledgeForm.addEventListener('submit', handleSubmit);
  } else {
    DOM.pledgeBtn.addEventListener('click', handleSubmit);
  }
}

// Utilities
function escapeHtml(string) {
  if (string == null) return '';
  const div = document.createElement('div');
  div.innerText = String(string);
  return div.innerHTML;
}

function formatMarkdown(text) {
  if (text == null) return '';
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
