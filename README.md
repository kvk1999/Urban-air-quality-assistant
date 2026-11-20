# AetherGuard AI: Winter Smog & Urban Air Quality Assistant

**AetherGuard AI** is a GenAI-powered platform designed to help urban families and communities navigate severe winter smog and atmospheric thermal inversion while systematically reducing their direct emissions and hazardous particulate exposure.

---

## 🌟 Key Features

1. **Diurnal Thermal Inversion & Atmospheric Modeling**
   - Incorporates winter planetary boundary layer dynamics (severe radiative cooling, stagnant surface air, ground-level particulate accumulation).
   - Identifies the critical **Solar Warming & Ventilation Window** (typically 12:30 PM – 3:00 PM) when boundary heights rise to allow safe air flushes.
   - Live simulated telemetry for global winter smog basins (Delhi NCR, Canberra, Stockholm, Beijing, Po Valley/Milan, Kathmandu, London, Los Angeles, Chicago).

2. **Personalized Low-Emission Daily Routine Engine**
   - Calibrated around household vulnerabilities: infants, toddlers, elderly seniors, and asthmatics.
   - Synchronizes heating schedules, commute departures, kitchen stove usage, and bedtime air scrubbing to minimize particulate inhalation by up to **68–85%**.

3. **High-CADR Indoor Air Quality (IAQ) Hacks**
   - **DIY Corsi-Rosenthal Box Purifiers**: Proven step-by-step guidance providing 350+ CFM Clean Air Delivery Rate (CADR) using MERV-13 filters and box fans for under $35.
   - **Stack-Effect Infiltration Sealing**: Micro-thermal window jamb gaskets and damp draft barriers to stop fine soot penetration.
   - **Electrostatic Wet-Dusting Protocol**: Eradicating particulate re-suspension risks.
   - **Phytoremediation Air-Cleaning Flora**: NASA-evaluated indoor plants (*Sansevieria*, *Areca Palm*) for nighttime VOC buffering.

4. **Transparent Sustainable Alternatives & Emissions Accounting**
   - Direct impact calculations for switching away from biomass/wood fires, solo ICE vehicles, and unventilated gas stoves.
   - Quantifies monthly **CO2 avoided (kg)**, **fuel/energy expense delta ($)**, and **particulate exposure reduction (%)**.

5. **Interactive Emissions & Exposure Simulator**
   - Real-time Chart.js interactive dashboard dynamically calculating collective personal actions and equivalent urban tree planting benefits.

6. **Community Collective Action Compact**
   - School drop-off anti-idling pledges, community low-cost laser sensor mesh networks (PurpleAir/Plantower integration models), and shared purifier banks for vulnerable neighbors.

7. **Interactive GenAI Air Copilot**
   - Conversational AI assistant providing immediate advice on mask standards (N95/FFP2 vs cloth), nursery sanctuary setup, and thermal inversion physics.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Running Locally

```bash
# 1. Clone or navigate to the project root
cd "d:/Guvi FS Programs/Urban-air-quality-assistant"

# 2. Start the application
npm start
# or: node server.js
```

Then open your browser and navigate to:
```
http://localhost:3000
```

---

## 📁 Architecture

- `server.js`: Node.js HTTP micro-service featuring the GenAI synthetic planning engine, atmospheric city databases, and conversational air copilot API.
- `public/index.html`: Responsive single-page application dashboard with modern dark atmospheric aesthetic, interactive tab panels, and visual gauges.
- `public/style.css`: Modern design system featuring glassmorphic cards, responsive CSS grid, accessibility-optimized contrast, and ambient air indicators.
- `public/app.js`: Client controller managing live Chart.js diurnal curves, personal impact simulators, dynamic API rendering, and copilot chat flows.
