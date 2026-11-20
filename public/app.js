// AetherGuard Front-End Client Application Controller

let currentPlanData = null;
let diurnalChartInstance = null;
let impactChartInstance = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupFormHandlers();
  setupSimulators();
  setupChatHandlers();
  setupPledge();

  // Load initial synthetic plan for Delhi
  triggerPlanGeneration();
});

// Setup Navigation Tabs
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(`pane-${targetTab}`);
      if (pane) {
        pane.classList.add('active');
      }

      // Re-render chart on tab display to fix sizing
      if (targetTab === 'routine' && diurnalChartInstance) {
        diurnalChartInstance.resize();
      }
      if (targetTab === 'simulator' && impactChartInstance) {
        impactChartInstance.resize();
      }
    });
  });
}

// Setup Form Submission & Dynamic Updates
function setupFormHandlers() {
  const form = document.getElementById('profileForm');
  const citySelect = document.getElementById('citySelect');

  // Checkbox pill toggle visual states
  const pills = document.querySelectorAll('.checkbox-pill');
  pills.forEach(pill => {
    const cb = pill.querySelector('input[type="checkbox"]');
    pill.addEventListener('click', (e) => {
      if (e.target !== cb) {
        cb.checked = !cb.checked;
      }
      pill.classList.toggle('active', cb.checked);
    });
  });

  citySelect.addEventListener('change', () => {
    triggerPlanGeneration();
  });

  // Auto-calculate immediately whenever any of the 4 key factors are changed
  const factorSelects = ['housingType', 'commuteMode', 'heatingSource', 'cookingType'];
  factorSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        triggerPlanGeneration();
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerPlanGeneration();
  });
}

// Fetch Plan from GenAI Engine API
async function triggerPlanGeneration() {
  const generateBtn = document.getElementById('generateBtn');
  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML = `<span>Synthesizing Atmospheric Data...</span>`;
  generateBtn.disabled = true;

  const city = document.getElementById('citySelect').value;
  const housingType = document.getElementById('housingType').value;
  const commuteMode = document.getElementById('commuteMode').value;
  const heatingSource = document.getElementById('heatingSource').value;
  const cookingType = document.getElementById('cookingType').value;

  const checkedPills = Array.from(document.querySelectorAll('input[name="familyProfile"]:checked'))
    .map(cb => cb.value);

  const payload = {
    city,
    familyProfile: checkedPills,
    housingType,
    commuteMode,
    heatingSource,
    dailyHabits: [cookingType]
  };

  try {
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('API server error');
    const data = await res.json();
    currentPlanData = data;

    updateAtmosphericDisplays(data.cityData);
    renderRoutineTimeline(data.routinePlan);
    renderAuditBreakdown(data.summary.factorsBreakdown);
    renderIndoorHacks(data.indoorHacks);
    renderSustainableAlternatives(data.sustainableAlternatives);
    renderCommunityInitiatives(data.communityInitiatives);
    renderDiurnalChart(data.cityData);
    updateSimulatorMetrics();

    document.getElementById('savingsPill').innerText = data.summary.estimatedExposureReduction;

  } catch (err) {
    console.error('Error fetching plan:', err);
  } finally {
    generateBtn.innerHTML = originalText;
    generateBtn.disabled = false;
  }
}

// Update Left-Hand Weather & AQI Readouts
function updateAtmosphericDisplays(cityData) {
  document.getElementById('cityNameDisplay').innerText = cityData.name;
  document.getElementById('regionDisplay').innerText = cityData.region;
  document.getElementById('aqiVal').innerText = cityData.baseAqi;
  document.getElementById('pm25Val').innerText = `${cityData.pm25} µg/m³`;
  document.getElementById('pm10Val').innerText = `${cityData.pm10} µg/m³`;
  document.getElementById('tempVal').innerText = cityData.temp;
  document.getElementById('windVal').innerText = cityData.wind;
  document.getElementById('inversionDesc').innerText = cityData.advisory;

  // AQI color bubbles
  const bubble = document.getElementById('aqiBubble');
  bubble.className = 'aqi-bubble';
  if (cityData.baseAqi >= 300) {
    bubble.classList.add('severe');
  } else if (cityData.baseAqi >= 150) {
    bubble.classList.add('unhealthy');
  } else {
    bubble.classList.add('moderate');
  }

  // Inversion header badge
  const inversionBadge = document.getElementById('inversionBadge');
  if (cityData.baseAqi > 200) {
    inversionBadge.innerHTML = `<span class="pulsing-dot"></span><span>Critical Alert: Thermal Inversion Cap Active</span>`;
    inversionBadge.className = 'status-chip high';
  } else {
    inversionBadge.innerHTML = `<span class="pulsing-dot" style="background:#10b981;"></span><span>Inversion Status: Moderate / Transitional</span>`;
    inversionBadge.className = 'status-chip';
  }
}

// Render 4-Factor Carbon, Thermal & Exposure Audit Breakdown
function renderAuditBreakdown(breakdown) {
  if (!breakdown) return;

  const container = document.getElementById('auditGrid');
  if (!container) return;
  container.innerHTML = '';

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
    container.appendChild(cardEl);
  });

  // Update summary pill & balance box
  const auditSummaryPill = document.getElementById('auditSummaryPill');
  if (auditSummaryPill) {
    auditSummaryPill.innerHTML = `<span>Baseline: ${breakdown.totalBaselineCO2Daily}</span>`;
  }
  document.getElementById('auditTotalDailyCO2').innerText = breakdown.totalBaselineCO2Daily;
  document.getElementById('auditTotalMonthlyCost').innerText = `Estimated Monthly Expense: ${breakdown.totalBaselineCostMonthly}`;
  document.getElementById('auditOptimizedDailyCO2').innerText = "5.8 kg CO2e / day";
  document.getElementById('auditMonthlySavings').innerText = `Net Savings: ${breakdown.totalMonthlyCO2Savings} & ${breakdown.totalMonthlyCostSavings}`;
}

// Render Timeline of Low-Emission Daily Routines
function renderRoutineTimeline(routine) {
  const container = document.getElementById('routineTimeline');
  container.innerHTML = '';

  const icons = ['🌅', '🚆', '☀️', '🍲', '🌙'];

  routine.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot">${icons[idx % icons.length]}</div>
      <div class="timeline-card">
        <div class="timeline-head">
          <span class="time-window">${escapeHtml(step.timeWindow)}</span>
          <span class="phase-name">${escapeHtml(step.phase)}</span>
        </div>
        <h4 class="action-title">${escapeHtml(step.action)}</h4>
        <p class="action-why">${escapeHtml(step.why)}</p>
        <div class="action-emission">
          <span>📉 <strong>Emissions & Health Impact:</strong> ${escapeHtml(step.emissionCut)}</span>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

// Render Indoor Hacks Grid
function renderIndoorHacks(hacks) {
  const grid = document.getElementById('hacksGrid');
  grid.innerHTML = '';

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
        🛡️ ${escapeHtml(hack.pmReduction)}
      </div>
    `;
    grid.appendChild(card);
  });
}

// Render Sustainable Alternatives List
function renderSustainableAlternatives(alternatives) {
  const list = document.getElementById('alternativesList');
  list.innerHTML = '';

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
    list.appendChild(card);
  });
}

// Render Community Collective Action Hub
function renderCommunityInitiatives(initiatives) {
  const grid = document.getElementById('communityGrid');
  grid.innerHTML = '';

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
    grid.appendChild(card);
  });
}

// Render Diurnal Chart (Particulate Curve vs Sunlight & Inversion Break)
function renderDiurnalChart(cityData) {
  const ctx = document.getElementById('diurnalChart').getContext('2d');
  const base = cityData.baseAqi;

  // Diurnal curve values based on atmospheric inversion physics
  // High at 6-8 AM, dips at 1-3 PM, peaks again 8-10 PM
  const hourlyData = [
    base * 0.95, base * 1.05, base * 1.15, base * 1.25, base * 1.10, base * 0.85, 
    base * 0.60, base * 0.52, base * 0.58, base * 0.80, base * 1.05, base * 1.20
  ];

  if (diurnalChartInstance) {
    diurnalChartInstance.destroy();
  }

  diurnalChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['6 AM', '7 AM', '8 AM', '9 AM', '11 AM', '1 PM', '2 PM', '3 PM', '5 PM', '7 PM', '9 PM', '11 PM'],
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
          data: [null, null, null, null, null, base * 0.52, base * 0.50, base * 0.55, null, null, null, null],
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
  const switches = ['simCarPool', 'simHeating', 'simInduction', 'simCorsi', 'simNoTrash'];
  switches.forEach(id => {
    document.getElementById(id).addEventListener('change', updateSimulatorMetrics);
  });
}

function updateSimulatorMetrics() {
  const car = document.getElementById('simCarPool').checked;
  const heating = document.getElementById('simHeating').checked;
  const induction = document.getElementById('simInduction').checked;
  const corsi = document.getElementById('simCorsi').checked;
  const noTrash = document.getElementById('simNoTrash').checked;

  let totalCo2Month = 0;
  let pmReductionPct = 0;
  let costSaved = 0;

  if (car) { totalCo2Month += 144; pmReductionPct += 20; costSaved += 85; }
  if (heating) { totalCo2Month += 240; pmReductionPct += 35; costSaved += 65; }
  if (induction) { totalCo2Month += 32; pmReductionPct += 15; costSaved += 15; }
  if (corsi) { totalCo2Month += 18; pmReductionPct += 25; costSaved += 20; }
  if (noTrash) { totalCo2Month += 90; pmReductionPct += 18; costSaved += 0; }

  // Clamp reduction percentage at 92%
  const finalPmReduction = Math.min(pmReductionPct, 92);
  const treeCount = Math.round(totalCo2Month / 20);

  document.getElementById('simCo2Value').innerText = `${totalCo2Month} kg`;
  document.getElementById('simPm25Value').innerText = `-${finalPmReduction}%`;
  document.getElementById('simCostValue').innerText = `$${costSaved}`;
  document.getElementById('simTreeEq').innerText = `Equivalent to planting ${treeCount} mature urban trees`;

  renderImpactChart(totalCo2Month);
}

function renderImpactChart(co2Saved) {
  const ctx = document.getElementById('impactChart').getContext('2d');
  const baseline = 520;
  const withActions = Math.max(baseline - co2Saved, 40);

  if (impactChartInstance) {
    impactChartInstance.destroy();
  }

  impactChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Standard Winter Baseline', 'With Your Eco-Swaps'],
      datasets: [{
        label: 'Monthly Household Carbon Footprint (kg CO2e)',
        data: [baseline, withActions],
        backgroundColor: ['rgba(239, 68, 68, 0.75)', 'rgba(16, 185, 129, 0.85)'],
        borderColor: ['#ef4444', '#10b981'],
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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

// Setup Interactive GenAI Chat
function setupChatHandlers() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    appendChatMessage('user', query);
    input.value = '';

    await fetchAIChatReply(query);
  });
}

function askCopilot(question) {
  // Switch to chat tab
  const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
  if (chatTabBtn) chatTabBtn.click();

  appendChatMessage('user', question);
  fetchAIChatReply(question);
}

async function fetchAIChatReply(question) {
  const messagesContainer = document.getElementById('chatMessages');

  // Loading bubble
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble ai';
  loadingBubble.id = 'loadingBubble';
  loadingBubble.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-content">
      <em>Synthesizing atmospheric advisory...</em>
    </div>
  `;
  messagesContainer.appendChild(loadingBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        context: currentPlanData
      })
    });

    const data = await res.json();
    loadingBubble.remove();

    appendChatMessage('ai', data.reply, data.suggestedAction);

  } catch (err) {
    loadingBubble.remove();
    appendChatMessage('ai', "I'm temporarily having trouble connecting to the atmospheric model. Please check that the server is online!");
  }
}

function appendChatMessage(sender, text, suggestedAction = null) {
  const container = document.getElementById('chatMessages');
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
    <div class="chat-avatar">${sender === 'ai' ? 'AI' : 'You'}</div>
    <div class="chat-content">
      ${contentHtml}
    </div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// Community Pledge Compact
function setupPledge() {
  const btn = document.getElementById('pledgeBtn');
  const input = document.getElementById('pledgeName');
  const counter = document.getElementById('pledgeCounter');

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) {
      alert('Please enter your colony, neighborhood, or building name!');
      return;
    }

    btn.innerText = 'Compact Signed! 🛡️';
    btn.disabled = true;
    input.disabled = true;
    counter.innerHTML = `🛡️ <strong>1,429 families</strong> across 43 urban clusters have joined the winter compact. (Welcome, <em>${escapeHtml(val)}</em>!)`;
  });
}

// Utilities
function escapeHtml(string) {
  const div = document.createElement('div');
  div.innerText = string;
  return div.innerHTML;
}

function formatMarkdown(text) {
  // Simple bold markdown conversion
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
