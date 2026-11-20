const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// City reference catalog with realistic winter atmospheric smog factors & sensor basepoints
const CITIES_DB = {
  "delhi": {
    name: "Delhi NCR (New Delhi, India)",
    region: "Indo-Gangetic Plain",
    baseAqi: 384,
    status: "Severe / Hazardous",
    pm25: 295.4,
    pm10: 420.1,
    temp: "13°C",
    humidity: "86%",
    wind: "3.2 km/h NW",
    inversionRisk: "Extreme (Strong Radiation Inversion)",
    smogSource: "Biomass / crop residue stubble burning, low wind stagnation, vehicular idling & brick kilns",
    advisory: "Red Alert: Inversion cap trapping particulates within 150m of ground. Postpone outdoor jogs until afternoon; run HEPA filtration continuous mode."
  },
  "canberra": {
    name: "Canberra, Australia",
    region: "Molonglo & ACT Valley Basin",
    baseAqi: 78,
    status: "Moderate / Seasonal Woodsmoke Risk",
    pm25: 25.4,
    pm10: 42.1,
    temp: "4°C",
    humidity: "75%",
    wind: "4.5 km/h ESE",
    inversionRisk: "High (Valley Cold-Air Drainage & Wood Smoke Trap)",
    smogSource: "Domestic wood-fire home heaters in Tuggeranong & valley pockets, nocturnal inversion pooling",
    advisory: "Winter Advisory: Nocturnal temperature inversion drains cold air into Tuggeranong valley, trapping residential woodsmoke overnight until late morning."
  },
  "stockholm": {
    name: "Stockholm, Sweden",
    region: "Baltic Archipelago & Lake Mälaren",
    baseAqi: 48,
    status: "Good / Low Inversion Risk",
    pm25: 11.2,
    pm10: 28.5,
    temp: "-3°C",
    humidity: "84%",
    wind: "11.5 km/h SW",
    inversionRisk: "Low (Sub-Arctic Coastal Ventilation)",
    smogSource: "Studded tire road dust abrasion (slitslitage), district biomass heating, street-canyon NO2",
    advisory: "Favorable Air: Coastal winds maintain good dispersion. Watch street canyon friction dust from winter studded tires on dry days."
  },
  "beijing": {
    name: "Beijing, China",
    region: "Northern China Plain",
    baseAqi: 158,
    status: "Unhealthy",
    pm25: 72.8,
    pm10: 115.4,
    temp: "-2°C",
    humidity: "42%",
    wind: "8.5 km/h N",
    inversionRisk: "Moderate (Cold front dispersing southern plumes)",
    smogSource: "District coal heating, heavy freight transit, regional industrial clusters",
    advisory: "Orange Advisory: Moderate smog corridor. Sensitive groups should wear N95/FFP2 masks outdoors."
  },
  "london": {
    name: "Greater London, UK",
    region: "Thames Valley",
    baseAqi: 74,
    status: "Moderate",
    pm25: 23.2,
    pm10: 38.6,
    temp: "6°C",
    humidity: "88%",
    wind: "14.2 km/h SW",
    inversionRisk: "Low (Moist Maritime Front)",
    smogSource: "Domestic wood-burning stoves, diesel vehicle nitrogen oxides (NO2)",
    advisory: "Moderate: High dampness with wood-burner smoke accumulation in residential valleys."
  },
  "losangeles": {
    name: "Los Angeles Basin, USA",
    region: "Southern California Coastal Plain",
    baseAqi: 92,
    status: "Moderate / Sensitive Risk",
    pm25: 31.5,
    pm10: 52.1,
    temp: "17°C",
    humidity: "60%",
    wind: "5.8 km/h SW",
    inversionRisk: "Moderate (Marine thermal boundary inversion)",
    smogSource: "Freeway traffic, port logistics, localized winter heating wood-smoke",
    advisory: "Caution: Evening marine layer trapping freeway exhaust in basin pockets."
  },
  "milan": {
    name: "Milan & Po Valley, Italy",
    region: "Po Valley Basin",
    baseAqi: 172,
    status: "Unhealthy",
    pm25: 94.0,
    pm10: 135.0,
    temp: "4°C",
    humidity: "90%",
    wind: "2.0 km/h Calms",
    inversionRisk: "High (Alpine Ring stagnation)",
    smogSource: "Po valley thermal trap, biomass pellet boilers, dense motorway transit",
    advisory: "Unhealthy: Alpine barrier blocking ventilation. Stagnant particulate build-up."
  },
  "kathmandu": {
    name: "Kathmandu Valley, Nepal",
    region: "Himalayan Bowl",
    baseAqi: 215,
    status: "Very Unhealthy",
    pm25: 165.0,
    pm10: 240.0,
    temp: "11°C",
    humidity: "78%",
    wind: "1.8 km/h Calm",
    inversionRisk: "Very High (Mountain valley thermal ceiling)",
    smogSource: "Valley bowl thermal trap, unpaved dust, brick kilns, older vehicles",
    advisory: "Health Alert: Valley topography creating thick cold-air lake trapping all ground emissions."
  },
  "chicago": {
    name: "Chicago, USA",
    region: "Lake Michigan Basin",
    baseAqi: 62,
    status: "Moderate",
    pm25: 18.0,
    pm10: 30.5,
    temp: "-4°C",
    humidity: "68%",
    wind: "19.0 km/h WNW",
    inversionRisk: "Low (Breezy ventilation)",
    smogSource: "Natural gas building heating, highway diesel emissions",
    advisory: "Good to Moderate: Strong lake winds dispersing surface particles."
  }
};

// Generative AI Decision Engine: Contextual Reasoning & Scenario Generation
function generateAIPlan(params) {
  const { city, familyProfile, housingType, commuteMode, heatingSource, dailyHabits } = params;
  const cityData = CITIES_DB[city.toLowerCase()] || CITIES_DB["delhi"];
  
  const hasKids = familyProfile.includes("infant") || familyProfile.includes("child");
  const hasElderly = familyProfile.includes("elderly") || familyProfile.includes("asthma");
  const isVulnerable = hasKids || hasElderly;
  
  // Calculate potential emission & exposure savings
  let baselineCO2Kg = 14.5;
  let optimizedCO2Kg = 4.2;
  let pm25ExposureReductionPct = 68;

  if (commuteMode === 'car_solo') {
    baselineCO2Kg += 8.2;
    optimizedCO2Kg += 1.8;
  } else if (commuteMode === 'ev_or_metro') {
    baselineCO2Kg += 1.2;
    optimizedCO2Kg += 0.4;
  }

  if (heatingSource === 'wood_or_biomass') {
    baselineCO2Kg += 12.0;
    optimizedCO2Kg += 2.0;
    pm25ExposureReductionPct = 84;
  } else if (heatingSource === 'electric_heatpump') {
    baselineCO2Kg += 3.0;
    optimizedCO2Kg += 1.5;
  }

  // 1. Customized Routine & Air Quality Safe Windows
  const routinePlan = [
    {
      timeWindow: "06:00 AM – 09:30 AM",
      phase: "Morning Peak Inversion & Stagnation",
      action: "Strictly Seal Indoor Envelope & Skip Outdoor Cardio",
      why: `Winter radiation inversion is steepest right at dawn in ${cityData.region}. Cold ground air holds heavy PM2.5 within breathing height. Ventilating now pulls in up to ${cityData.pm25} µg/m³ of fine particulates.`,
      emissionCut: "Avoid cold-engine car idling (prevents ~1.2 kg CO2 & toxic unburnt HC emissions)."
    },
    {
      timeWindow: "10:00 AM – 11:30 AM",
      phase: "Commute & School Transit Safe Passage",
      action: commuteMode === 'car_solo' ? "Shift to Shared EV Shuttle / Metro, or Set In-Cabin Recirculation" : "Equip N95 mask + activate public electric rail",
      why: "Inside vehicular cabins without air recirculation mode, cabin PM2.5 can reach 70% of tailpipe plumes from preceding diesel trucks.",
      emissionCut: "Trip pooling saves 4.8 kg CO2/day per family."
    },
    {
      timeWindow: "12:30 PM – 03:00 PM",
      phase: "Optimal Dispersion & Solar Warming Window",
      action: "Filtered Quick Air-Purge or Solar-Heated Ventilated Exercise",
      why: "Solar heating breaks the shallow surface inversion layer, lifting boundary heights by 300-600m and diluting particulate concentration by 35-50%.",
      emissionCut: "Harness natural thermal gain to keep thermostat 2°C lower, cutting 1.9 kWh electricity."
    },
    {
      timeWindow: "06:00 PM – 09:00 PM",
      phase: "Evening Traffic Re-inversion & Domestic Cooking",
      action: "Use Range Hood Exhaust on High + Charcoal Pre-Filter",
      why: "Stir-frying and gas burner combustion release peak indoor NO2 and ultrafine aerosols right as outdoor air re-cools and locks pollutants in.",
      emissionCut: "Cover pots and batch-cook: 25% cooking gas/LPG reduction."
    },
    {
      timeWindow: "09:30 PM – 06:00 AM",
      phase: "Sleep Restoration Zone",
      action: "Micro-Environment Bedside Air Purification (Low-Decibel)",
      why: `The human respiratory system undergoes lung tissue repair during sleep. Keeping bedroom PM2.5 under 15 µg/m³ cuts morning bronchial inflammation for ${isVulnerable ? 'high-risk family members' : 'adults'} by up to 73%.`,
      emissionCut: "Sleep timer mode on electric heaters/ACs cuts 2.4 kg CO2 overnight."
    }
  ];

  // 2. Indoor Hacks Tailored to Profile & Housing
  const indoorHacks = [
    {
      title: "Corsi-Rosenthal Box (DIY High-CADR Air Purifier)",
      cost: "$25 - $40 (vs $300 commercial)",
      materials: "1x 20-inch Box Fan + 4x MERV-13 filters (or 1x MERV-13 taped tightly to intake) + Duct tape",
      instructions: "Seal filter flush against fan intake with arrow pointing toward fan face. Operates at 350+ CFM Clean Air Delivery Rate (CADR), rivaling hospital-grade HEPA units at a fraction of energy & cost.",
      pmReduction: "Reduces indoor PM2.5 by 85–92% in 25 minutes in a 400 sq.ft living area."
    },
    {
      title: "Draft-Sealing & Micro-Thermal Window Gaskets",
      cost: "< $10",
      materials: "Silicone weatherstrip tape, damp door draft snakes, bubble wrap film on single-pane glass",
      instructions: "Winter smog infiltration occurs through 1-3mm window jamb gaps due to the chimney/stack effect. Seal perimeter cracks and apply damp towel barrier at door base.",
      pmReduction: "Blocks 65% of outdoor soot ingress; retains 22% more indoor heat."
    },
    {
      title: "Wet Dusting & Static Dust Attraction Protocol",
      cost: "$0",
      materials: "Microfiber cloth dampened with dilute water + 2 drops vegetable glycerin or vinegar",
      instructions: "NEVER dry broom or dry vacuum during smog season; dry sweeping re-suspends settled toxic heavy-metal particles back into breathing zones for 4 hours. Wipe surfaces with damp electrostatic microfiber.",
      pmReduction: "Prevents secondary aerosol re-suspension by 80%."
    },
    {
      title: "Bio-Phytoremediation Cluster Placement",
      cost: "$15 - $25",
      materials: "Snake Plant (Sansevieria), Areca Palm, Peace Lily, Spider Plant",
      instructions: "Group plants in bedrooms and work corners. Sansevieria continues CAM oxygen exchange at night while absorbing airborne xylene, formaldehyde, and secondary benzene VOCs.",
      pmReduction: "Absorbs residual indoor volatile gases and maintains 45% balanced winter humidity."
    }
  ];

  // 3. Sustainable Alternatives & Lifestyle Swaps
  const sustainableAlternatives = [
    {
      currentHabit: heatingSource === 'wood_or_biomass' ? "Burning wood/biomass logs in fireplace" : "Radiant oil/gas space heater on full overnight blast",
      ecoAlternative: "Reverse-cycle inverter mini-split heat pump or ceramic zonal heater with thermal curtains & weighted wool blankets",
      impactExplanation: "Biomass fireplaces produce 1,000x more fine soot than gas heaters and degrade indoor AQI to >500. Switching eliminates 12.4 kg CO2/night and removes cancer-linked PAHs (Polycyclic Aromatic Hydrocarbons).",
      co2SavedKgMonth: 280,
      monthlyCostDelta: "-$45 (lower fuel expenditure)"
    },
    {
      currentHabit: commuteMode === 'car_solo' ? "Solo commute in gasoline/diesel SUV with heater cranked" : "Mixed vehicle daily errand runs",
      ecoAlternative: "Metro commuter pass + micromobility e-bike/walk for last mile with certified N95 respirator",
      impactExplanation: "One bus or metro car eliminates 40 private automobiles off congested arteries, drastically reducing road-level NOx and ground-level ozone precursors.",
      co2SavedKgMonth: 145,
      monthlyCostDelta: "-$120 (fuel & parking saved)"
    },
    {
      currentHabit: "Open-flame wok cooking and gas hob without cover lids",
      ecoAlternative: "Induction countertop cooktop or electric pressure cooker (Instant Pot)",
      impactExplanation: "Induction heating is 85-90% energy efficient (vs 40% for gas burners) and produces zero nitrogen dioxide (NO2), carbon monoxide, or soot indoors.",
      co2SavedKgMonth: 32,
      monthlyCostDelta: "-$15"
    },
    {
      currentHabit: "Burning dried garden leaves, paper trash or seasonal scrap outdoors",
      ecoAlternative: "Cold compost trenching / municipal microbial vermicomposting",
      impactExplanation: "Surface trash burning generates toxic dioxins, furans, and black carbon with global warming potential 3,200x that of CO2 over a 20-year horizon.",
      co2SavedKgMonth: 95,
      monthlyCostDelta: "$0"
    }
  ];

  // 4. Community Action & Collective Inversion Defense
  const communityInitiatives = [
    {
      title: "Community Sensor Mesh & Micro-Forecast Watch",
      description: "Partner with 5 neighboring households to deploy low-cost PurpleAir / Plantower laser sensors to detect hyper-local smoke plumes and industrial idling.",
      collectiveImpact: "Enables neighborhood-wide early alerts before municipal averages reflect toxic spikes."
    },
    {
      title: "Anti-Idling School & Market Zone Pledges",
      description: "Establish designated no-idling drop-off zones around local schools and community centers where winter inversions concentrate tailpipe soot at children's respiratory height (0.8m - 1.2m).",
      collectiveImpact: "Reduces child-level benzene and black carbon concentrations by up to 55% during peak 8:00 AM drop-offs."
    },
    {
      title: "Shared High-Efficiency Thermal Blanket & Purifier Bank",
      description: "Establish a community tool-library lending portable air scrubbers, MERV filters, and thermal leak infrared cameras to low-income families in older draughty buildings.",
      collectiveImpact: "Safeguards vulnerable elders and asthmatic children who cannot afford commercial appliances."
    }
  ];

  return {
    cityData,
    summary: {
      location: cityData.name,
      overallStatus: cityData.status,
      currentAqi: cityData.baseAqi,
      familyRiskLevel: isVulnerable ? "High Priority (Children/Elderly Present)" : "Standard Urban Exposure",
      estimatedCo2SavingsDaily: `${(baselineCO2Kg - optimizedCO2Kg).toFixed(1)} kg CO2e / day`,
      estimatedExposureReduction: `${pm25ExposureReductionPct}% PM2.5 Inhalation Cut`,
      inversionStatus: cityData.inversionRisk
    },
    routinePlan,
    indoorHacks,
    sustainableAlternatives,
    communityInitiatives
  };
}

// Interactive GenAI Chat Query Handler
function processAIChat(userMessage, context) {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes("plant") || msg.includes("greenery")) {
    return {
      reply: "Plants are fantastic secondary air purifiers! For severe winter smog, NASA Clean Air studies demonstrate that **Snake Plants (Sansevieria)**, **Spider Plants**, and **Peace Lilies** excel at absorbing volatile organics (VOCs like benzene and formaldehyde). However, remember: plants cannot replace mechanical HEPA or MERV-13 filters for dense particulate PM2.5 soot. Use plants to maintain natural humidity (40-50%) and eliminate stuffy carbon dioxide build-up while keeping your physical filtration active!",
      suggestedAction: "Cluster 3-4 potted snake plants in your sleeping area for nighttime oxygen replenishment."
    };
  } else if (msg.includes("mask") || msg.includes("n95") || msg.includes("cloth")) {
    return {
      reply: "Crucial winter smog rule: **Simple surgical masks and cloth bandanas filter less than 15-20% of PM2.5 particulates**, because PM2.5 is smaller than 2.5 microns (1/30th the width of human hair). You need a well-fitted **N95, FFP2, or KF94 respirator with an airtight nose-bridge seal**. If air leaks around your nose or cheeks, filtration efficiency drops by more than 60%. Facial hair should be trimmed where the mask seal sits.",
      suggestedAction: "Perform a fit check: breathe out sharply; if air hits your eyes or leaks at your chin, re-adjust the nose-clip."
    };
  } else if (msg.includes("purifier") || msg.includes("hepa") || msg.includes("diy") || msg.includes("filter")) {
    return {
      reply: "If commercial HEPA purifiers are too expensive or sold out during smog emergencies, build a **Corsi-Rosenthal Box**! By securing one or more MERV-13 (or higher) furnace filters to a standard 20-inch box fan with duct tape, you achieve over 300 CFM CADR (Clean Air Delivery Rate) for under $35. It moves significantly more clean air than entry-level $200 purifiers while drawing only 45-60 Watts of power.",
      suggestedAction: "Run your DIY or commercial purifier continuously on low speed rather than intermittent high bursts."
    };
  } else if (msg.includes("exercise") || msg.includes("jog") || msg.includes("walk") || msg.includes("outdoor")) {
    return {
      reply: "During severe winter smog, **never jog or perform strenuous cardio in early morning or late evening**. Winter thermal inversion creates a 'ceiling' holding soot near the ground before 10 AM. During intense cardio, your minute ventilation increases 10-fold and you breathe through your mouth—bypassing your nasal filtration and depositing toxic particulate matter deep into alveolar lung sacs. Schedule any brisk walks between **12:30 PM and 3:30 PM** when solar heating lifts the inversion layer, or workout indoors with filtered air.",
      suggestedAction: "Switch to indoor yoga, resistance bands, or pilates during AQI > 150 alert days."
    };
  } else if (msg.includes("baby") || msg.includes("child") || msg.includes("pregnant") || msg.includes("kid")) {
    return {
      reply: "Infants and children are at heightened risk because: 1) Their breathing rate per kilogram of body weight is double that of adults; 2) Their lungs are actively developing; 3) Stroller height (0.5m - 0.9m) sits right in the densest zone of heavy exhaust settling. Keep nursery doors closed with a micro-HEPA purifier active, use a sealed stroller cover with active mini-purifier if emergency travel is required, and monitor for persistent dry cough or wheezing.",
      suggestedAction: "Set up a clean-air sanctuary room at home where bedroom air is kept under 25 µg/m³ PM2.5 24/7."
    };
  } else if (msg.includes("heater") || msg.includes("fireplace") || msg.includes("warm") || msg.includes("cold")) {
    return {
      reply: "Heating choices directly drive both indoor air quality and outdoor smog. Open fireplaces and wood-burning stoves emit hazardous polycyclic aromatic hydrocarbons (PAHs) and ultrafine black carbon directly into your living room. Switch to **inverter heat pumps, mica-thermic, or oil-filled electric radiators**. Pair them with heavy thermal honeycomb window drapes and draft stoppers to preserve warmth without combusting fuels.",
      suggestedAction: "Seal baseboards and hang thermal door curtains to cut heating electricity demand by 20%."
    };
  } else {
    return {
      reply: `Based on your urban profile in ${context?.cityData?.name || 'your area'}, navigating severe winter smog requires an integrated 3-pillar approach: 1) Timing your outdoor activities around the diurnal inversion curve (optimum window 12 PM - 3 PM); 2) Sealing your indoor envelope with DIY draft stoppers and high-CADR filtration; 3) Replacing localized combustion (wood stoves, idling engines) with clean electric alternatives to stop compounding the atmospheric boundary cap.`,
      suggestedAction: "Review your personalized daily routine timeline and try the interactive Carbon & PM2.5 Impact Simulator below."
    };
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Get city data list
  if (req.method === 'GET' && pathname === '/api/cities') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(CITIES_DB));
    return;
  }

  // API: Generate GenAI custom action plan
  if (req.method === 'POST' && pathname === '/api/generate-plan') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const params = JSON.parse(body || '{}');
        const plan = generateAIPlan(params);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(plan));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: GenAI Interactive Assistant Chat
  if (req.method === 'POST' && pathname === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { message, context } = JSON.parse(body || '{}');
        const response = processAIChat(message, context);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static file serving from public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Security check to avoid directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Error loading resource');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`AetherGuard Air Quality Assistant running at http://localhost:${PORT}`);
});
