// ─── Core Types ────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ActionType = 'STAY' | 'PREPARE' | 'EVACUATE';
export type ShelterStatus = 'OPEN' | 'FULL' | 'UNKNOWN';
export type AgentId = 'hazard' | 'safety' | 'shelter' | 'nav' | 'prep' | 'whatif' | 'coord';

// ─── Weather ───────────────────────────────────────────────────────────────────

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  description: string;
  icon: string;
  rainfall1h: number;
  rainfall3h: number;
  visibility: number;
  alerts: WeatherAlert[];
  coordinates: { lat: number; lon: number };
  timestamp: number;
}

export interface WeatherAlert {
  event: string;
  description: string;
  start: number;
  end: number;
  severity?: string;
}

// ─── Location ──────────────────────────────────────────────────────────────────

export interface UserLocation {
  lat: number;
  lon: number;
  city?: string;
  method: 'geolocation' | 'search';
}

export interface CommunityReport {
  id: string;
  type: 'road_blocked' | 'flooding' | 'power_outage' | 'hazard' | 'other';
  description: string;
  lat: number;
  lon: number;
  timestamp: number;
  verified: boolean;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export interface AgentMessage {
  agent: AgentId;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface HazardOutput {
  disasterType: string;
  severity: RiskLevel;
  risks: string[];
  affectedAreas: string[];
  weatherSummary: string;
  roadRiskZones: string[];
}

export interface SafetyOutput {
  evacuate: boolean;
  action: ActionType;
  recommendations: string[];
  dangerousActions: string[];
  timeWindow?: string;
}

export interface ShelterOutput {
  selected: Shelter;
  alternatives: Shelter[];
  reason: string;
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  capacity: string;
  status: ShelterStatus;
  petFriendly: boolean;
  medicalSupport: boolean;
  distanceKm?: number;
}

export interface NavOutput {
  destination: string;
  destinationCoords: { lat: number; lon: number };
  routeCoords: [number, number][];
  steps: string[];
  avoidZones: string[];
  eta: string;
  distanceKm: number;
  safetyNotes: string[];
}

export interface PrepOutput {
  checklist: ChecklistSection[];
}

export interface ChecklistSection {
  category: string;
  icon: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  label: string;
  priority: 'critical' | 'important' | 'optional';
  checked?: boolean;
}

export interface WhatIfOutput {
  scenarios: WhatIfScenario[];
}

export interface WhatIfScenario {
  question: string;
  answer: string;
  revisedAction?: ActionType;
}

export interface CoordinatorOutput {
  riskLevel: RiskLevel;
  action: ActionType;
  summary: string;
  agentMessages: AgentMessage[];
  hazard: HazardOutput;
  safety: SafetyOutput;
  shelter: ShelterOutput;
  nav: NavOutput;
  prep: PrepOutput;
  whatIf: WhatIfOutput;
}

// ─── App State ─────────────────────────────────────────────────────────────────

export interface AppState {
  phase: 'idle' | 'locating' | 'analyzing' | 'complete' | 'error';
  userLocation: UserLocation | null;
  situation: string;
  weather: WeatherData | null;
  communityReports: CommunityReport[];
  result: CoordinatorOutput | null;
  agentLog: AgentMessage[];
  error: string | null;
  whatIfQuery: string;
  checklist: ChecklistItem[];
}
