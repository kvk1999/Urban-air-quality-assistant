const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY_BYTES = 65536; // 64 KB limit

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
  const cityData = CITIES_DB[(city || "delhi").toLowerCase()] || CITIES_DB["delhi"];
  const cookingType = (dailyHabits && dailyHabits[0]) || 'gas_hob';
  const profileList = Array.isArray(familyProfile) ? familyProfile : [];

  const hasKids = profileList.includes("infant") || profileList.includes("child");
  const hasElderly = profileList.includes("elderly") || profileList.includes("asthma");
  const isVulnerable = hasKids || hasElderly;

  // Factor 1: Housing Envelope Infiltration & Leakage
  let housingName = "Independent House / Villa";
  let housingInfiltrationLabel = "Moderate (Standard Perimeter Leakage)";
  let housingThermalLossKwH = 8.5;
  if (housingType === 'older_apartment') {
    housingName = "Older Apartment (Single-Glaze Glass)";
    housingInfiltrationLabel = "Severe (High Infiltration Stack-Effect via 2-3mm Frame Gaps)";
    housingThermalLossKwH = 14.2;
  } else if (housingType === 'modern_condo') {
    housingName = "Modern High-Rise (Double Glazed & Air-Tight)";
    housingInfiltrationLabel = "Low (Tight Envelope, High Sealed Retention)";
    housingThermalLossKwH = 4.2;
  } else if (housingType === 'ground_floor_flat') {
    housingName = "Ground Floor Unit (High Silt / Cold Ground Influx)";
    housingInfiltrationLabel = "High (Direct Street Silt, Road Particulate Infiltration)";
    housingThermalLossKwH = 11.8;
  }

  // Factor 2: Commute Mode Carbon & Exposure
  let commuteDailyCO2 = 0;
  let commuteMonthlyCost = 0;
  let commuteExposureHazard = "";
  let commuteName = "";
  if (commuteMode === 'car_solo') {
    commuteDailyCO2 = 8.4;
    commuteMonthlyCost = 135;
    commuteExposureHazard = "High in-cabin vehicular cabin soot ingestion unless 100% recirculation active";
    commuteName = "Solo ICE Car (Gasoline / Diesel)";
  } else if (commuteMode === 'two_wheeler') {
    commuteDailyCO2 = 3.6;
    commuteMonthlyCost = 45;
    commuteExposureHazard = "Extreme direct respiratory exhaust inhalation along arterial traffic queues";
    commuteName = "Two-Wheeler / Motorbike";
  } else if (commuteMode === 'metro_transit') {
    commuteDailyCO2 = 1.2;
    commuteMonthlyCost = 35;
    commuteExposureHazard = "Low (Underground electric rail avoids ground street exhaust plumes)";
    commuteName = "Electric Metro / Rail / Bus Transit";
  } else {
    commuteDailyCO2 = 0.4;
    commuteMonthlyCost = 10;
    commuteExposureHazard = "Minimal direct traffic exposure";
    commuteName = "Hybrid / Remote Work from Home";
  }

  // Factor 3: Winter Space Heating
  let heatingDailyCO2 = 0;
  let heatingMonthlyCost = 0;
  let heatingIndoorPM25Hazard = "";
  let heatingName = "";
  if (heatingSource === 'wood_or_biomass') {
    heatingDailyCO2 = 14.8;
    heatingMonthlyCost = 110;
    heatingIndoorPM25Hazard = "Extreme: Open combustion emits >850 µg/m³ peak soot & carcinogenic PAHs directly into living room";
    heatingName = "Fireplace / Wood Biomass (High Soot)";
  } else if (heatingSource === 'portable_radiant') {
    heatingDailyCO2 = 7.2;
    heatingMonthlyCost = 85;
    heatingIndoorPM25Hazard = "No direct particulate emission, but high electrical draw & local air drying";
    heatingName = "Electric Radiant / Halogen Space Heater";
  } else if (heatingSource === 'electric_heatpump') {
    heatingDailyCO2 = 2.1;
    heatingMonthlyCost = 35;
    heatingIndoorPM25Hazard = "Zero direct emissions; filtered internal recirculated convection";
    heatingName = "Inverter Heat Pump (High Efficiency COP 3.5+)";
  } else {
    heatingDailyCO2 = 8.9;
    heatingMonthlyCost = 90;
    heatingIndoorPM25Hazard = "Low indoor soot if flued, but continuous NOx and methane fugitive emissions";
    heatingName = "Natural Gas Boiler / Radiator";
  }

  // Factor 4: Kitchen Cooking Setup
  let cookingDailyCO2 = 0;
  let cookingMonthlyCost = 0;
  let cookingIndoorToxicity = "";
  let cookingName = "";
  if (cookingType === 'gas_hob') {
    cookingDailyCO2 = 2.1;
    cookingMonthlyCost = 28;
    cookingIndoorToxicity = "Severe: Unvented gas flame emits up to 400 ppb NO2, formaldehyde & fine aerosols in breathing zone";
    cookingName = "Open Gas Burner / LPG Hob (Unvented)";
  } else if (cookingType === 'induction') {
    cookingDailyCO2 = 0.7;
    cookingMonthlyCost = 14;
    cookingIndoorToxicity = "Zero combustion emissions, zero NO2, only steam & cooking aroma";
    cookingName = "Electric Induction Cooktop (Combustion-Free)";
  } else {
    cookingDailyCO2 = 1.9;
    cookingMonthlyCost = 26;
    cookingIndoorToxicity = "Moderate: 70% of NO2 captured by chimney exhaust hood, residual ambient heat loss";
    cookingName = "Gas Hob + External Ducted Chimney Exhaust";
  }

  const totalDailyBaselineCO2 = (commuteDailyCO2 + heatingDailyCO2 + cookingDailyCO2 + (housingThermalLossKwH * 0.45)).toFixed(1);
  const totalMonthlyBaselineCost = Math.round(commuteMonthlyCost + heatingMonthlyCost + cookingMonthlyCost + (housingThermalLossKwH * 30 * 0.08));

  const optimizedDailyCO2 = (1.2 + 2.1 + 0.7 + (4.2 * 0.45)).toFixed(1);
  const dailyCO2Saved = Math.max(0, (totalDailyBaselineCO2 - optimizedDailyCO2)).toFixed(1);
  const monthlyCO2Saved = Math.round(dailyCO2Saved * 30);
  const monthlyCostSaved = Math.max(25, totalMonthlyBaselineCost - (35 + 35 + 14 + 10));

  let calculatedExposureReduction = 55;
  if (housingType === 'older_apartment') calculatedExposureReduction += 15;
  if (heatingSource === 'wood_or_biomass') calculatedExposureReduction += 16;
  if (cookingType === 'gas_hob') calculatedExposureReduction += 8;
  if (commuteMode === 'two_wheeler' || commuteMode === 'car_solo') calculatedExposureReduction += 6;
  calculatedExposureReduction = Math.min(94, calculatedExposureReduction);

  const routinePlan = [
    {
      timeWindow: "06:00 AM – 09:30 AM",
      phase: "Morning Peak Inversion & Infiltration Defense",
      action: housingType === 'older_apartment' || housingType === 'ground_floor_flat'
        ? `Seal Window Jambs with Damp Draft Snakes & Run Purifier (Housing: ${housingName})`
        : `Strictly Maintain Sealed Envelope; Keep Double-Glazed Frames Latched`,
      why: `Winter radiation inversion is steepest right at dawn in ${cityData.region}. Ambient air holds up to ${cityData.pm25} µg/m³ of fine particulates. In your ${housingName}, stack effect forces cold soot through window gaps unless sealed.`,
      emissionCut: `Prevents cold-room thermal leakage (${(housingThermalLossKwH * 0.25).toFixed(1)} kWh saved).`
    },
    {
      timeWindow: "10:00 AM – 11:30 AM",
      phase: "Commute & School Transit Safe Passage",
      action: commuteMode === 'car_solo'
        ? "Shift to Public Rail/Metro, or Toggle Car In-Cabin Recirculation to Avoid Exhaust"
        : commuteMode === 'two_wheeler'
          ? "Equip Certified N95 Respirator with Airtight Nose Clip; Avoid Heavy Truck Lanes"
          : "Maintain Public Electric Transit / WFH Routine with Certified Mask on Platforms",
      why: commuteExposureHazard,
      emissionCut: `Commute choice saves up to ${(commuteDailyCO2 - 1.2).toFixed(1)} kg CO2e today.`
    },
    {
      timeWindow: "12:30 PM – 03:00 PM",
      phase: "Optimal Dispersion & Solar Warming Window",
      action: "Filtered Quick Air-Purge or Solar-Heated Ventilated Exercise",
      why: "Solar heating breaks the shallow surface inversion layer, lifting boundary heights by 300-600m and diluting particulate concentration by 35-50%.",
      emissionCut: "Harness natural thermal gain to keep thermostat 2°C lower, cutting 1.9 kWh electricity."
    },
    {
      timeWindow: "06:00 PM – 08:30 PM",
      phase: "Evening Traffic Re-Inversion & Cooking Operations",
      action: cookingType === 'gas_hob'
        ? "Cover Cookware Pots, Use Cross-Room Exhaust, or Transition to Portable Induction Unit"
        : cookingType === 'induction'
          ? "Utilize High-Efficiency Induction Simmering with Lids Covered (Zero NO2 Emitted)"
          : "Turn Range Hood to Maximum 5 Minutes Before Lighting Burners",
      why: cookingIndoorToxicity,
      emissionCut: cookingType === 'gas_hob'
        ? "Covered batch-cooking saves 25% cooking gas/LPG (0.5 kg CO2e)."
        : "Induction draws 85% less direct thermal energy loss."
    },
    {
      timeWindow: "09:00 PM – 06:00 AM",
      phase: "Sleep Restoration Zone & Clean Space Heating",
      action: heatingSource === 'wood_or_biomass'
        ? "Extinguish Fireplace; Switch to Ceramic Zonal Heating + Heavy Weighted Wool Blankets"
        : heatingSource === 'portable_radiant'
          ? "Set 2-Hour Sleep Timer on Radiant Heater + Hang Thermal Honeycomb Window Drapes"
          : "Operate Heat Pump on Night Eco-Mode (20°C) with Bedside Micro-Purifier",
      why: `During sleep, lung alveoli undergo tissue repair. ${heatingIndoorPM25Hazard}. Maintaining bedroom PM2.5 under 15 µg/m³ reduces morning bronchial tightness by 73% for ${isVulnerable ? 'high-risk family members' : 'adults'}.`,
      emissionCut: `Clean heating configuration avoids ${(heatingDailyCO2 - 2.1).toFixed(1)} kg CO2 overnight.`
    }
  ];

  const indoorHacks = [
    {
      title: housingType === 'older_apartment' || housingType === 'ground_floor_flat'
        ? "Stack-Effect Perimeter Gasketing & Silt Stop (Tailored to your Housing)"
        : "Micro-Thermal Window Gaskets & Acoustic Infiltration Seals",
      cost: "< $12",
      materials: "Silicone weatherstrip tape, damp door draft snakes, bubble wrap film on single-pane glass",
      instructions: `In ${housingName}, winter smog infiltration is driven by warm indoor air rising and sucking in soot through 1-3mm sash gaps. Seal jambs and install weighted draft stoppers at outer doorways.`,
      pmReduction: "Blocks 65–75% of outdoor soot ingress; retains 25% more indoor heat."
    },
    {
      title: "Corsi-Rosenthal Box (DIY High-CADR Air Purifier)",
      cost: "$25 - $40 (vs $300 commercial)",
      materials: "1x 20-inch Box Fan + 4x MERV-13 filters (or 1x MERV-13 taped tightly to intake) + Duct tape",
      instructions: "Seal filter flush against fan intake with arrow pointing toward fan face. Operates at 350+ CFM Clean Air Delivery Rate (CADR), rivaling hospital-grade HEPA units at a fraction of energy & cost.",
      pmReduction: "Reduces indoor PM2.5 by 85–92% in 25 minutes in a 400 sq.ft living area."
    },
    {
      title: cookingType === 'gas_hob'
        ? "Kitchen NO2 Containment & Cross-Draft Isolation"
        : "Wet Dusting & Static Dust Attraction Protocol",
      cost: cookingType === 'gas_hob' ? "$5" : "$0",
      materials: cookingType === 'gas_hob'
        ? "Kitchen swing-door seal, activated carbon recirculating filter sheet"
        : "Microfiber cloth dampened with dilute water + 2 drops vegetable glycerin or vinegar",
      instructions: cookingType === 'gas_hob'
        ? "Close kitchen interior doors while cooking to prevent heavy nitrogen dioxide and PM2.5 from migrating into bedrooms where children sleep."
        : "NEVER dry broom or dry vacuum during smog season; dry sweeping re-suspends settled toxic heavy-metal particles back into breathing zones for 4 hours. Wipe surfaces with damp electrostatic microfiber.",
      pmReduction: cookingType === 'gas_hob' ? "Cuts whole-house NO2 spikes by 60%." : "Prevents secondary aerosol re-suspension by 80%."
    },
    {
      title: "Bio-Phytoremediation Cluster Placement",
      cost: "$15 - $25",
      materials: "Snake Plant (Sansevieria), Areca Palm, Peace Lily, Spider Plant",
      instructions: "Group plants in bedrooms and work corners. Sansevieria continues CAM oxygen exchange at night while absorbing airborne xylene, formaldehyde, and secondary benzene VOCs.",
      pmReduction: "Absorbs residual indoor volatile gases and maintains 45% balanced winter humidity."
    }
  ];

  const sustainableAlternatives = [
    {
      factorCategory: "Winter Space Heating",
      currentHabit: `Current Setup: ${heatingName} (${heatingDailyCO2} kg CO2e/day, ~$${heatingMonthlyCost}/mo)`,
      ecoAlternative: "Inverter Mini-Split Heat Pump (COP > 3.5) with Heavy Thermal Window Curtains",
      impactExplanation: heatingSource === 'wood_or_biomass'
        ? "Wood combustion generates 1,000x more fine particulate soot than clean electric heat pumps, releasing toxic PAHs directly into residential streets and living rooms."
        : "Inverter heat pumps deliver 3.5x more thermal heat per kWh of electricity compared to radiant strip heaters, drastically lowering power plant demand.",
      co2SavedKgMonth: Math.round((heatingDailyCO2 - 2.1) * 30),
      monthlyCostDelta: `-$${Math.max(15, heatingMonthlyCost - 35)} (heating energy bill saved)`
    },
    {
      factorCategory: "Primary Daily Commute",
      currentHabit: `Current Commute: ${commuteName} (${commuteDailyCO2} kg CO2e/day, ~$${commuteMonthlyCost}/mo)`,
      ecoAlternative: "Electric Metro / Suburban Rail + Walk/e-Bike Last Mile with N95 Respirator",
      impactExplanation: commuteMode === 'two_wheeler'
        ? "Riders on motorbikes sit directly in the concentrated tailpipe slipstream of preceding diesel vehicles. Shifting to rail eliminates 100% of vehicular exhaust inhalation."
        : "Every passenger vehicle removed from arterial gridlock cuts 4.5+ kg of CO2 and prevents cold-engine idling emissions near schools and residential blocks.",
      co2SavedKgMonth: Math.round((commuteDailyCO2 - 1.2) * 30),
      monthlyCostDelta: `-$${Math.max(10, commuteMonthlyCost - 35)} (fuel, tolls & maintenance)`
    },
    {
      factorCategory: "Kitchen Cooking Setup",
      currentHabit: `Current Kitchen: ${cookingName} (${cookingDailyCO2} kg CO2e/day, ~$${cookingMonthlyCost}/mo)`,
      ecoAlternative: "Countertop Magnetic Induction Cooktop + Covered Ceramic Cookware",
      impactExplanation: "Induction cooking transfers 85-90% of electromagnetic energy directly into cookware without open-flame combustion, totally eliminating harmful indoor nitrogen dioxide (NO2) and carbon monoxide.",
      co2SavedKgMonth: Math.round((cookingDailyCO2 - 0.7) * 30),
      monthlyCostDelta: `-$${Math.max(5, cookingMonthlyCost - 14)} (fuel saved)`
    },
    {
      factorCategory: "Housing Envelope Efficiency",
      currentHabit: `Current Envelope: ${housingName} (~${housingThermalLossKwH} kWh daily loss)`,
      ecoAlternative: "Perimeter Silicone Weatherstripping, Door Bottom Draft Sweeps & Cellular Honeycomb Shades",
      impactExplanation: "Sealing air gaps prevents the stack effect from continuously pulling polluted outdoor winter air into your living quarters while keeping 25-30% more warmth trapped inside.",
      co2SavedKgMonth: Math.round(housingThermalLossKwH * 0.45 * 30 * 0.4),
      monthlyCostDelta: `-$${Math.round(housingThermalLossKwH * 30 * 0.08 * 0.35)} (reduced thermal load)`
    }
  ];

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
      estimatedCo2SavingsDaily: `${dailyCO2Saved} kg CO2e / day`,
      estimatedExposureReduction: `${calculatedExposureReduction}% PM2.5 Inhalation Cut`,
      inversionStatus: cityData.inversionRisk,
      factorsBreakdown: {
        housing: { name: housingName, infiltrationRisk: housingInfiltrationLabel, dailyHeatLossKwh: housingThermalLossKwH },
        commute: { name: commuteName, dailyCO2Kg: commuteDailyCO2, monthlyCostUsd: commuteMonthlyCost, hazard: commuteExposureHazard },
        heating: { name: heatingName, dailyCO2Kg: heatingDailyCO2, monthlyCostUsd: heatingMonthlyCost, hazard: heatingIndoorPM25Hazard },
        cooking: { name: cookingName, dailyCO2Kg: cookingDailyCO2, monthlyCostUsd: cookingMonthlyCost, hazard: cookingIndoorToxicity },
        totalBaselineCO2Daily: `${totalDailyBaselineCO2} kg CO2e/day`,
        totalBaselineCostMonthly: `$${totalMonthlyBaselineCost}/mo`,
        totalMonthlyCO2Savings: `${monthlyCO2Saved} kg CO2e/month`,
        totalMonthlyCostSavings: `$${monthlyCostSaved}/month`
      }
    },
    routinePlan,
    indoorHacks,
    sustainableAlternatives,
    communityInitiatives
  };
}

// Interactive GenAI Chat Query Handler
function processAIChat(userMessage, context) {
  const msg = String(userMessage || "").toLowerCase();

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

// Helper to read request body up to MAX_BODY_BYTES (64 KB)
function readJsonBody(req, res, callback) {
  let body = '';
  let payloadTooLarge = false;

  req.on('data', chunk => {
    if (payloadTooLarge) return;
    body += chunk;
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      payloadTooLarge = true;
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload Too Large' }));
      req.destroy();
    }
  });

  req.on('end', () => {
    if (payloadTooLarge) return;
    try {
      const parsed = JSON.parse(body || '{}');
      callback(null, parsed);
    } catch (err) {
      callback(err, null);
    }
  });
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Comprehensive HTTP Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' http://localhost:* https://*"
  );

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
    readJsonBody(req, res, (err, params) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      const plan = generateAIPlan(params);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(plan));
    });
    return;
  }

  // API: GenAI Interactive Assistant Chat
  if (req.method === 'POST' && pathname === '/api/chat') {
    readJsonBody(req, res, (err, payload) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      const { message, context } = payload;
      const response = processAIChat(message, context);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    });
    return;
  }

  // Static file serving from public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

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