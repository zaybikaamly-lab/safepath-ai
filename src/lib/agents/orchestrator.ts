import Anthropic from '@anthropic-ai/sdk';
import { weatherToPromptContext } from '@/lib/api/weather';
import { getRoute } from '@/lib/api/routing';
import { getSheltersNear } from '@/lib/shelters';
import {
  WeatherData, CommunityReport, CoordinatorOutput,
  AgentMessage, AgentId, HazardOutput, SafetyOutput,
  ShelterOutput, NavOutput, PrepOutput, WhatIfOutput,
  Shelter,
} from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Helper ────────────────────────────────────────────────────────────────────

async function callAgent<T>(
  agentName: string,
  systemPrompt: string,
  userContent: string,
  onMessage: (msg: AgentMessage) => void,
): Promise<{ parsed: T; raw: string }> {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const raw = res.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: T;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`${agentName} returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  onMessage({
    agent: agentName.toLowerCase().split(' ')[0] as AgentId,
    message: (parsed as Record<string, string>).agentMessage || `${agentName} analysis complete.`,
    timestamp: Date.now(),
  });

  return { parsed, raw };
}

// ─── Agent 1: Hazard ───────────────────────────────────────────────────────────

async function runHazardAgent(
  situation: string,
  weather: WeatherData,
  reports: CommunityReport[],
  onMessage: (m: AgentMessage) => void,
): Promise<HazardOutput> {
  const reportText = reports.length
    ? reports.map(r => `- ${r.type}: ${r.description}`).join('\n')
    : 'No community reports.';

  const { parsed } = await callAgent<HazardOutput & { agentMessage: string }>(
    'Hazard Agent',
    `You are the Hazard Agent in SafePath AI. Analyze weather data and community reports to assess disaster risk.
Return ONLY valid JSON with this exact shape:
{
  "agentMessage": "1-2 sentence summary to share with team",
  "disasterType": "string",
  "severity": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
  "risks": ["string"],
  "affectedAreas": ["string"],
  "weatherSummary": "string",
  "roadRiskZones": ["string — road corridors or area types at risk"]
}`,
    `User situation: ${situation}\n\n${weatherToPromptContext(weather)}\n\nCommunity reports:\n${reportText}`,
    onMessage,
  );
  return parsed;
}

// ─── Agent 2: Safety ───────────────────────────────────────────────────────────

async function runSafetyAgent(
  situation: string,
  hazard: HazardOutput,
  onMessage: (m: AgentMessage) => void,
): Promise<SafetyOutput> {
  const { parsed } = await callAgent<SafetyOutput & { agentMessage: string }>(
    'Safety Agent',
    `You are the Safety Agent in SafePath AI. Based on hazard analysis, determine if evacuation is needed and provide safety recommendations.
Return ONLY valid JSON:
{
  "agentMessage": "1-2 sentence summary to share with team",
  "evacuate": boolean,
  "action": "STAY"|"PREPARE"|"EVACUATE",
  "recommendations": ["string"],
  "dangerousActions": ["string"],
  "timeWindow": "string — e.g. 'You have approximately 2 hours before conditions worsen'"
}`,
    `User situation: ${situation}\n\nHazard Agent output:\n${JSON.stringify(hazard, null, 2)}`,
    onMessage,
  );
  return parsed;
}

// ─── Agent 3: Shelter ──────────────────────────────────────────────────────────

async function runShelterAgent(
  safety: SafetyOutput,
  shelters: Shelter[],
  weather: WeatherData,
  onMessage: (m: AgentMessage) => void,
): Promise<ShelterOutput> {
  const shelterList = shelters.map(s =>
    `ID:${s.id} | ${s.name} | ${s.distanceKm?.toFixed(1)}km | capacity:${s.capacity} | pets:${s.petFriendly} | medical:${s.medicalSupport} | status:${s.status}`
  ).join('\n');

  const { parsed } = await callAgent<{ agentMessage: string; selectedId: string; reason: string }>(
    'Shelter Agent',
    `You are the Shelter Agent in SafePath AI. Select the best shelter given the safety assessment.
Return ONLY valid JSON:
{
  "agentMessage": "1-2 sentence summary to share with team",
  "selectedId": "shelter id string",
  "reason": "why this shelter was selected"
}`,
    `Safety assessment: evacuate=${safety.evacuate}, action=${safety.action}
Weather: ${weather.description}, wind ${weather.windSpeed}m/s

Available shelters (sorted by distance):
${shelterList}

Prefer: open shelters, medical support if vulnerable populations mentioned, pet-friendly if pets mentioned.`,
    onMessage,
  );

  const selected = shelters.find(s => s.id === parsed.selectedId) || shelters[0];
  const alternatives = shelters.filter(s => s.id !== selected?.id).slice(0, 2);

  return { selected, alternatives, reason: parsed.reason };
}

// ─── Agent 4: Navigation ───────────────────────────────────────────────────────

async function runNavAgent(
  userLoc: { lat: number; lon: number },
  shelter: ShelterOutput,
  hazard: HazardOutput,
  onMessage: (m: AgentMessage) => void,
): Promise<NavOutput> {
  // Get real OSRM route
  let routeCoords: [number, number][] = [];
  let distanceKm = 0;
  let durationMin = 0;
  let rawSteps: string[] = [];

  try {
    const route = await getRoute(
      userLoc.lat, userLoc.lon,
      shelter.selected.lat, shelter.selected.lon
    );
    routeCoords = route.coords;
    distanceKm = route.distanceKm;
    durationMin = route.durationMin;
    rawSteps = route.steps;
  } catch {
    // Fallback if OSRM unavailable
    routeCoords = [[userLoc.lat, userLoc.lon], [shelter.selected.lat, shelter.selected.lon]];
    distanceKm = 0;
    durationMin = 0;
    rawSteps = ['Proceed directly to shelter — routing service temporarily unavailable'];
  }

  const eta = durationMin > 0
    ? `~${Math.round(durationMin)} minutes (${distanceKm.toFixed(1)} km)`
    : 'ETA unavailable';

  const { parsed } = await callAgent<{ agentMessage: string; safetyNotes: string[]; avoidZones: string[] }>(
    'Navigation Agent',
    `You are the Navigation Agent in SafePath AI. You have a real road route. Add safety annotations based on hazard zones.
Return ONLY valid JSON:
{
  "agentMessage": "1-2 sentence summary to share with team",
  "safetyNotes": ["string — route-specific warnings"],
  "avoidZones": ["string — area or road type to avoid"]
}`,
    `Destination: ${shelter.selected.name}
Distance: ${distanceKm.toFixed(1)} km, ETA: ${eta}
Route steps: ${rawSteps.join(' → ')}
Hazard road risk zones: ${hazard.roadRiskZones.join(', ')}
Disaster type: ${hazard.disasterType}, severity: ${hazard.severity}`,
    onMessage,
  );

  return {
    destination: shelter.selected.name,
    destinationCoords: { lat: shelter.selected.lat, lon: shelter.selected.lon },
    routeCoords,
    steps: rawSteps,
    avoidZones: parsed.avoidZones,
    eta,
    distanceKm,
    safetyNotes: parsed.safetyNotes,
  };
}

// ─── Agent 5: Preparation ──────────────────────────────────────────────────────

async function runPrepAgent(
  situation: string,
  hazard: HazardOutput,
  safety: SafetyOutput,
  onMessage: (m: AgentMessage) => void,
): Promise<PrepOutput> {
  const { parsed } = await callAgent<PrepOutput & { agentMessage: string }>(
    'Preparation Agent',
    `You are the Preparation Agent in SafePath AI. Create a specific emergency checklist.
Return ONLY valid JSON:
{
  "agentMessage": "1-2 sentence summary to share with team",
  "checklist": [
    {
      "category": "string",
      "icon": "emoji",
      "items": [
        { "label": "string", "priority": "critical"|"important"|"optional" }
      ]
    }
  ]
}
Use categories: Immediate Actions, Pack These Items, Documents & ID, Before Leaving, At the Shelter.`,
    `Situation: ${situation}
Disaster: ${hazard.disasterType}, severity: ${hazard.severity}
Action: ${safety.action}
Recommendations: ${safety.recommendations.join('; ')}`,
    onMessage,
  );
  return { checklist: parsed.checklist };
}

// ─── Agent 6: What-If ──────────────────────────────────────────────────────────

async function runWhatIfAgent(
  situation: string,
  hazard: HazardOutput,
  safety: SafetyOutput,
  shelter: ShelterOutput,
  onMessage: (m: AgentMessage) => void,
): Promise<WhatIfOutput> {
  const { parsed } = await callAgent<WhatIfOutput & { agentMessage: string }>(
    'WhatIf Agent',
    `You are the What-If Agent in SafePath AI. Generate contingency scenarios.
Return ONLY valid JSON:
{
  "agentMessage": "1-2 sentence summary to share with team",
  "scenarios": [
    {
      "question": "What if...?",
      "answer": "string — specific actionable advice",
      "revisedAction": "STAY"|"PREPARE"|"EVACUATE"
    }
  ]
}
Generate 4 scenarios relevant to this specific disaster. Always include pets and road-blocked scenarios.`,
    `Situation: ${situation}
Disaster: ${hazard.disasterType}
Primary shelter: ${shelter.selected.name}
Alternatives: ${shelter.alternatives.map(s => s.name).join(', ')}
Action: ${safety.action}`,
    onMessage,
  );
  return { scenarios: parsed.scenarios };
}

// ─── Agent 7: Coordinator ──────────────────────────────────────────────────────

async function runCoordinatorAgent(
  situation: string,
  hazard: HazardOutput,
  safety: SafetyOutput,
  shelter: ShelterOutput,
  nav: NavOutput,
  prep: PrepOutput,
  whatIf: WhatIfOutput,
  onMessage: (m: AgentMessage) => void,
): Promise<{ riskLevel: string; summary: string }> {
  const { parsed } = await callAgent<{ agentMessage: string; riskLevel: string; summary: string }>(
    'Coordinator Agent',
    `You are the Coordinator Agent in SafePath AI. Synthesize all agent outputs into a final assessment.
Return ONLY valid JSON:
{
  "agentMessage": "2-3 sentence final coordination message",
  "riskLevel": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
  "summary": "2-3 sentence plain-language summary for the user"
}`,
    `All agent outputs:
HAZARD: ${hazard.disasterType} — ${hazard.severity}
SAFETY: ${safety.action} — ${safety.recommendations[0]}
SHELTER: ${shelter.selected.name} (${shelter.selected.distanceKm?.toFixed(1)}km)
NAV: ETA ${nav.eta}
PREP: ${prep.checklist.length} categories prepared
WHAT-IF: ${whatIf.scenarios.length} scenarios analyzed`,
    onMessage,
  );

  return { riskLevel: parsed.riskLevel, summary: parsed.summary };
}

// ─── Main Orchestrator ─────────────────────────────────────────────────────────

export async function runAgents(
  situation: string,
  weather: WeatherData,
  userLoc: { lat: number; lon: number },
  communityReports: CommunityReport[],
  onAgentMessage: (msg: AgentMessage) => void,
): Promise<CoordinatorOutput> {
  const agentLog: AgentMessage[] = [];

  const track = (msg: AgentMessage) => {
    agentLog.push(msg);
    onAgentMessage(msg);
  };

  const nearbyShelters = getSheltersNear(userLoc.lat, userLoc.lon, 100);
  if (!nearbyShelters.length) {
    // Use all shelters sorted by distance as fallback
    nearbyShelters.push(...getSheltersNear(userLoc.lat, userLoc.lon, 5000).slice(0, 3));
  }

  // Sequential agent pipeline — each feeds the next
  const hazard = await runHazardAgent(situation, weather, communityReports, track);
  const safety = await runSafetyAgent(situation, hazard, track);
  const shelter = await runShelterAgent(safety, nearbyShelters, weather, track);
  const nav = await runNavAgent(userLoc, shelter, hazard, track);
  const prep = await runPrepAgent(situation, hazard, safety, track);
  const whatIf = await runWhatIfAgent(situation, hazard, safety, shelter, track);
  const coord = await runCoordinatorAgent(situation, hazard, safety, shelter, nav, prep, whatIf, track);

  return {
    riskLevel: coord.riskLevel as CoordinatorOutput['riskLevel'],
    action: safety.action,
    summary: coord.summary,
    agentMessages: agentLog,
    hazard,
    safety,
    shelter,
    nav,
    prep,
    whatIf,
  };
}

// ─── What-If Follow-up ─────────────────────────────────────────────────────────

export async function runWhatIfQuery(
  query: string,
  context: CoordinatorOutput,
  onMessage: (msg: AgentMessage) => void,
): Promise<string> {
  onMessage({ agent: 'whatif', message: `Analyzing: "${query}"`, timestamp: Date.now() });

  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: `You are the What-If Agent in SafePath AI. Answer contingency questions with specific, actionable advice. 2-4 sentences.`,
    messages: [{
      role: 'user',
      content: `Context: ${context.summary}
Disaster: ${context.hazard.disasterType}, severity: ${context.hazard.severity}
Primary shelter: ${context.shelter.selected.name}
Alternatives: ${context.shelter.alternatives.map(s => s.name).join(', ')}

User question: ${query}`,
    }],
  });

  const answer = res.content.map(b => b.type === 'text' ? b.text : '').join('');
  onMessage({ agent: 'coord', message: `What-If resolved: ${answer.slice(0, 100)}…`, timestamp: Date.now() });
  return answer;
}
