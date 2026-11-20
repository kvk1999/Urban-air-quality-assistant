const CITIES_DB = {
    "delhi": { name: "Delhi NCR (New Delhi, India)", region: "Indo-Gangetic Plain", baseAqi: 384, status: "Severe / Hazardous", pm25: 295.4, pm10: 420.1, temp: "13°C", wind: "3.2 km/h NW", inversionRisk: "Extreme (Strong Radiation Inversion)", advisory: "Red Alert: Inversion cap trapping particulates within 150m of ground." },
    "canberra": { name: "Canberra, Australia", region: "Molonglo & ACT Valley Basin", baseAqi: 78, status: "Moderate / Seasonal Woodsmoke Risk", pm25: 25.4, pm10: 42.1, temp: "4°C", wind: "4.5 km/h ESE", inversionRisk: "High (Valley Cold-Air Drainage & Wood Smoke Trap)", advisory: "Winter Advisory: Nocturnal temperature inversion drains cold air into Tuggeranong valley." },
    "stockholm": { name: "Stockholm, Sweden", region: "Baltic Archipelago & Lake Mälaren", baseAqi: 48, status: "Good / Low Inversion Risk", pm25: 11.2, pm10: 28.5, temp: "-3°C", wind: "11.5 km/h SW", inversionRisk: "Low (Sub-Arctic Coastal Ventilation)", advisory: "Favorable Air: Coastal winds maintain good dispersion." },
    "beijing": { name: "Beijing, China", region: "Northern China Plain", baseAqi: 158, status: "Unhealthy", pm25: 72.8, pm10: 115.4, temp: "-2°C", wind: "8.5 km/h N", inversionRisk: "Moderate", advisory: "Orange Advisory: Moderate smog corridor." },
    "london": { name: "Greater London, UK", region: "Thames Valley", baseAqi: 74, status: "Moderate", pm25: 23.2, pm10: 38.6, temp: "6°C", wind: "14.2 km/h SW", inversionRisk: "Low", advisory: "Moderate: High dampness with wood-burner smoke." },
    "losangeles": { name: "Los Angeles Basin, USA", region: "Southern California Coastal Plain", baseAqi: 92, status: "Moderate", pm25: 31.5, pm10: 52.1, temp: "17°C", wind: "5.8 km/h SW", inversionRisk: "Moderate", advisory: "Caution: Evening marine layer trapping freeway exhaust." },
    "milan": { name: "Milan & Po Valley, Italy", region: "Po Valley Basin", baseAqi: 172, status: "Unhealthy", pm25: 94.0, pm10: 135.0, temp: "4°C", wind: "2.0 km/h Calms", inversionRisk: "High", advisory: "Unhealthy: Alpine barrier blocking ventilation." },
    "kathmandu": { name: "Kathmandu Valley, Nepal", region: "Himalayan Bowl", baseAqi: 215, status: "Very Unhealthy", pm25: 165.0, pm10: 240.0, temp: "11°C", wind: "1.8 km/h Calm", inversionRisk: "Very High", advisory: "Health Alert: Valley topography creating cold-air lake." },
    "chicago": { name: "Chicago, USA", region: "Lake Michigan Basin", baseAqi: 62, status: "Moderate", pm25: 18.0, pm10: 30.5, temp: "-4°C", wind: "19.0 km/h WNW", inversionRisk: "Low", advisory: "Good to Moderate: Strong lake winds dispersing surface particles." }
};

exports.handler = async (event) => {
    const params = JSON.parse(event.body || '{}');
    const city = (params.city || 'delhi').toLowerCase();
    const cityData = CITIES_DB[city] || CITIES_DB["delhi"];

    const housingType = params.housingType || 'independent_house';
    const commuteMode = params.commuteMode || 'car_solo';
    const heatingSource = params.heatingSource || 'portable_radiant';
    const cookingType = (params.dailyHabits && params.dailyHabits[0]) || 'gas_hob';

    // Calculations
    let housingHeatLoss = housingType === 'older_apartment' ? 14.2 : housingType === 'modern_condo' ? 4.2 : 8.5;
    let commuteCO2 = commuteMode === 'car_solo' ? 8.4 : commuteMode === 'two_wheeler' ? 3.6 : 1.2;
    let heatingCO2 = heatingSource === 'wood_or_biomass' ? 14.8 : heatingSource === 'portable_radiant' ? 7.2 : 2.1;
    let cookingCO2 = cookingType === 'gas_hob' ? 2.1 : 0.7;

    const totalBaseline = (commuteCO2 + heatingCO2 + cookingCO2 + (housingHeatLoss * 0.45)).toFixed(1);

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
            cityData,
            summary: {
                location: cityData.name,
                overallStatus: cityData.status,
                currentAqi: cityData.baseAqi,
                estimatedExposureReduction: "72% PM2.5 Inhalation Cut",
                factorsBreakdown: {
                    housing: { name: housingType, dailyHeatLossKwh: housingHeatLoss, infiltrationRisk: "Calculated" },
                    commute: { name: commuteMode, dailyCO2Kg: commuteCO2, monthlyCostUsd: 120, hazard: "Exhaust inhalation" },
                    heating: { name: heatingSource, dailyCO2Kg: heatingCO2, monthlyCostUsd: 90, hazard: "Thermal draw & soot" },
                    cooking: { name: cookingType, dailyCO2Kg: cookingCO2, monthlyCostUsd: 25, hazard: "Combustion NO2" },
                    totalBaselineCO2Daily: `${totalBaseline} kg CO2e/day`,
                    totalBaselineCostMonthly: "$280/mo",
                    totalMonthlyCO2Savings: "540 kg CO2e/month",
                    totalMonthlyCostSavings: "$165/month"
                }
            },
            routinePlan: [
                { timeWindow: "06:00 AM – 09:30 AM", phase: "Morning Peak Inversion", action: "Keep Indoor Envelope Sealed; Postpone Strenuous Cardio", why: `Dawn radiation inversion holds heavy particulates near surface (${cityData.pm25} µg/m³).`, emissionCut: "Avoid engine cold idling." },
                { timeWindow: "10:00 AM – 11:30 AM", phase: "Transit Passage", action: "Switch vehicle to recirculation or equip N95 mask on metro", why: "Prevents in-cabin diesel exhaust accumulation.", emissionCut: "Public transit saves 4.5 kg CO2." },
                { timeWindow: "12:30 PM – 03:00 PM", phase: "Solar Warming Window", action: "Optimum Fresh Air Flush / Outdoor Errand Window", why: "Boundary layer expands with solar thermal lift, diluting soot.", emissionCut: "Solar thermal gain cuts heater load." },
                { timeWindow: "06:00 PM – 08:30 PM", phase: "Evening Traffic Re-Inversion", action: "Cover Cookware Pots & Run Kitchen Exhaust Hood", why: "Gas burner NO2 spikes as cold air traps ground pollution.", emissionCut: "Batch cooking cuts 25% cooking gas." },
                { timeWindow: "09:00 PM – 06:00 AM", phase: "Sleep Restoration Zone", action: "Low-Decibel Bedside HEPA Micro-Purification", why: "Keeps sleeping PM2.5 under 15 µg/m³ for lung tissue regeneration.", emissionCut: "Timer mode on heating cuts 2.4 kg CO2." }
            ],
            indoorHacks: [
                { title: "Corsi-Rosenthal Box (DIY Purifier)", cost: "$25 - $40", materials: "20-inch Box Fan + MERV-13 Filters + Duct Tape", instructions: "Tape MERV-13 filter flush to fan intake. Yields 350+ CFM CADR.", pmReduction: "Cuts indoor PM2.5 by 85–92% in 25 mins." },
                { title: "Perimeter Silicone Weatherstripping", cost: "< $12", materials: "Silicone weatherstrip tape, damp door draft snake", instructions: "Apply to window jambs and door bottoms to prevent stack-effect soot ingress.", pmReduction: "Blocks 65–75% of particulate infiltration." },
                { title: "Electrostatic Wet Dusting Protocol", cost: "$0", materials: "Microfiber cloth with dilute water", instructions: "Wipe surfaces; avoid dry sweeping which resuspends fine heavy metals.", pmReduction: "Stops 80% of secondary aerosol resuspension." },
                { title: "Bio-Phytoremediation Flora (Sansevieria)", cost: "$15", materials: "Snake Plant, Areca Palm", instructions: "Cluster in bedrooms; absorbs benzene & formaldehyde VOCs at night.", pmReduction: "Natural VOC buffer & humidity balance." }
            ],
            sustainableAlternatives: [
                { currentHabit: "Open wood/biomass fireplace", ecoAlternative: "Inverter Mini-Split Heat Pump", impactExplanation: "Stops toxic polycyclic aromatic hydrocarbons (PAH) soot from polluting home and neighborhood.", co2SavedKgMonth: 280, monthlyCostDelta: "-$45" },
                { currentHabit: "Solo ICE Car Commute", ecoAlternative: "Electric Rail / Metro Transit", impactExplanation: "Removes fossil fuel exhaust from school zones and congested arteries.", co2SavedKgMonth: 145, monthlyCostDelta: "-$110" },
                { currentHabit: "Unvented Gas Cooktop", ecoAlternative: "Magnetic Induction Cooktop", impactExplanation: "Combustion-free cooking with zero indoor nitrogen dioxide (NO2).", co2SavedKgMonth: 32, monthlyCostDelta: "-$15" }
            ],
            communityInitiatives: [
                { title: "Neighborhood Anti-Idling Compact", description: "Designated no-idling drop-off zones around schools during morning inversion.", collectiveImpact: "Cuts child-level black carbon exposure by 55%." },
                { title: "Community Sensor Mesh Network", description: "Deploy low-cost Plantower/PurpleAir sensors for hyper-local alert tracking.", collectiveImpact: "Early warning before official regional smog peaks." }
            ]
        })
    };
};