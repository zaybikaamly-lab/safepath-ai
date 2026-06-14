'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AgentPanel from '@/components/agents/AgentPanel';
import LocationInput from '@/components/ui/LocationInput';
import WeatherWidget from '@/components/ui/WeatherWidget';
import ActionPlan from '@/components/ui/ActionPlan';
import CommunityReports from '@/components/ui/CommunityReports';
import WhatIfQuery from '@/components/ui/WhatIfQuery';
import {
  AppState, UserLocation, AgentMessage, CommunityReport,
  CoordinatorOutput, WeatherData, AgentId,
} from '@/types';

// Leaflet must be dynamically imported (no SSR)
const SafeMap = dynamic(() => import('@/components/map/SafeMap'), { ssr: false });

const INITIAL_STATE: AppState = {
  phase: 'idle',
  userLocation: null,
  situation: '',
  weather: null,
  communityReports: [],
  result: null,
  agentLog: [],
  error: null,
  whatIfQuery: '',
  checklist: [],
};

const EXAMPLE_SITUATIONS = [
  'Category 3 hurricane approaching. I\'m in Miami Beach with elderly parents on the first floor.',
  'Flash flood warning just issued. I\'m near a creek in Austin, TX. First floor apartment.',
  'Wildfire 15 miles away, winds shifting toward my neighborhood in Santa Cruz.',
  'Magnitude 6.2 earthquake just hit downtown San Francisco. Building seems intact.',
];

const AGENT_ORDER: AgentId[] = ['hazard', 'safety', 'shelter', 'nav', 'prep', 'whatif', 'coord'];

export default function HomePage() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [rightTab, setRightTab] = useState<'plan' | 'whatif'>('plan');

  const updateState = useCallback((patch: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const handleLocation = useCallback((loc: UserLocation) => {
    updateState({ userLocation: loc });
  }, [updateState]);

  const handleAnalyze = async () => {
    const { userLocation, situation, communityReports } = state;
    if (!userLocation || !situation.trim()) return;

    updateState({ phase: 'analyzing', agentLog: [], result: null, error: null });

    // Simulate agent activation sequence
    let agentIdx = 0;
    const agentTimer = setInterval(() => {
      if (agentIdx < AGENT_ORDER.length) {
        setActiveAgent(AGENT_ORDER[agentIdx]);
        agentIdx++;
      } else {
        clearInterval(agentTimer);
        setActiveAgent(null);
      }
    }, 4000);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          city: userLocation.city,
          lat: userLocation.lat || undefined,
          lon: userLocation.lon || undefined,
          communityReports,
        }),
      });

      const data = await res.json();
      clearInterval(agentTimer);
      setActiveAgent(null);

      if (data.error) throw new Error(data.error);

      const result = data.result as CoordinatorOutput;
      const weather = data.weather as WeatherData;

      updateState({
        phase: 'complete',
        result,
        weather,
        agentLog: result.agentMessages,
        userLocation: {
          ...userLocation,
          lat: weather.coordinates.lat,
          lon: weather.coordinates.lon,
          city: weather.city,
        },
      });
      setRightTab('plan');
    } catch (err) {
      clearInterval(agentTimer);
      setActiveAgent(null);
      updateState({
        phase: 'error',
        error: err instanceof Error ? err.message : 'Analysis failed',
      });
    }
  };

  const addCommunityReport = useCallback((r: CommunityReport) => {
    setState(prev => ({ ...prev, communityReports: [...prev.communityReports, r] }));
  }, []);

  const { phase, userLocation, situation, weather, result, agentLog, error, communityReports } = state;
  const isAnalyzing = phase === 'analyzing';
  const isReady = !!userLocation && !!situation.trim() && !isAnalyzing;

  const shelters = result
    ? [result.shelter.selected, ...result.shelter.alternatives].filter(Boolean)
    : [];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#070E1A' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 border-b border-navy-700 flex-shrink-0"
        style={{ height: 52, background: '#070E1A' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0066CC)' }}>S</div>
          <span className="font-mono font-bold text-[15px] tracking-wide">
            SafePath<span style={{ color: '#00D4FF' }}>.AI</span>
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded border tracking-widest"
            style={{ color: '#00FF88', background: '#00FF8812', borderColor: '#00FF8830' }}>
            7 AGENTS ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          {weather && (
            <div className="font-mono text-[10px] text-navy-500">
              {weather.city} · {weather.temperature.toFixed(0)}°C · {weather.description}
            </div>
          )}
          <div className="font-mono text-[10px] text-navy-700">EMERGENCY RESPONSE SYSTEM v1.0</div>
        </div>
      </header>

      {/* ── Main 3-column layout ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Input + Agents ──────────────────────────────────────── */}
        <div className="flex flex-col border-r border-navy-700 overflow-hidden"
          style={{ width: 320, flexShrink: 0 }}>

          {/* Location + Input */}
          <div className="p-4 border-b border-navy-700 space-y-4 flex-shrink-0">
            <div>
              <div className="font-mono text-[10px] text-navy-400 tracking-widest mb-2">YOUR LOCATION</div>
              <LocationInput onLocation={handleLocation} isLoading={isAnalyzing} />
              {userLocation?.city && (
                <div className="mt-1.5 font-mono text-[10px] text-safe">
                  ✓ {userLocation.city} {userLocation.lat ? `(${userLocation.lat.toFixed(3)}, ${userLocation.lon.toFixed(3)})` : ''}
                </div>
              )}
            </div>

            <div>
              <div className="font-mono text-[10px] text-navy-400 tracking-widest mb-2">SITUATION REPORT</div>
              <textarea
                value={situation}
                onChange={e => updateState({ situation: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAnalyze(); }}
                placeholder="Describe your emergency — type, location, special circumstances (elderly, pets, medical)…"
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-[12.5px] text-navy-100 outline-none resize-none leading-relaxed"
                style={{ minHeight: 90, fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#00D4FF'}
                onBlur={e => e.target.style.borderColor = '#1A2E4A'}
              />

              {/* Examples */}
              {!situation && (
                <div className="mt-2 space-y-1">
                  {EXAMPLE_SITUATIONS.map((ex, i) => (
                    <button key={i} onClick={() => updateState({ situation: ex })}
                      className="block w-full text-left px-2.5 py-1.5 rounded text-[11px] text-navy-500 transition-all"
                      style={{ background: '#0D1B2E', border: '1px solid #1A2E4A' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C0D8F0'; e.currentTarget.style.borderColor = '#00D4FF30'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#5A7A9A'; e.currentTarget.style.borderColor = '#1A2E4A'; }}>
                      {ex}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!isReady}
                className="mt-3 w-full py-3 rounded-lg font-mono text-[11px] tracking-widest font-bold transition-all"
                style={{
                  background: isReady ? 'linear-gradient(135deg, #0066CC, #00D4FF)' : '#0D1B2E',
                  border: `1px solid ${isReady ? 'transparent' : '#1A2E4A'}`,
                  color: isReady ? '#fff' : '#3A5A7A',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                }}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin-slow">◌</span> AGENTS COORDINATING…
                  </span>
                ) : 'ANALYZE SITUATION →'}
              </button>

              {error && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-hazard/10 border border-hazard/20 font-mono text-[11px] text-hazard">
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Community reports */}
            {userLocation && (
              <CommunityReports
                onAddReport={addCommunityReport}
                reports={communityReports}
                userLat={userLocation.lat || 25.77}
                userLon={userLocation.lon || -80.19}
              />
            )}
          </div>

          {/* Agent log */}
          <div className="flex-1 overflow-hidden">
            <AgentPanel
              messages={agentLog}
              isAnalyzing={isAnalyzing}
              activeAgent={activeAgent}
            />
          </div>
        </div>

        {/* ── CENTER: Map ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Weather strip */}
          {weather && (
            <div className="absolute top-3 left-3 z-[1000] w-64">
              <WeatherWidget weather={weather} />
            </div>
          )}

          {/* Map placeholder when idle */}
          {!userLocation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-navy-700"
              style={{ background: '#0A1628' }}>
              <div className="text-5xl mb-4">🗺</div>
              <div className="font-mono text-[13px] tracking-widest">MAP READY</div>
              <div className="font-mono text-[11px] mt-2 text-navy-800">Set your location to activate</div>
            </div>
          ) : (
            <SafeMap
              userLat={userLocation.lat || 25.77}
              userLon={userLocation.lon || -80.19}
              nav={result?.nav || null}
              shelters={shelters}
              selectedShelterId={result?.shelter.selected.id}
            />
          )}
        </div>

        {/* ── RIGHT: Action plan + What-If ─────────────────────────────── */}
        <div className="flex flex-col border-l border-navy-700 overflow-hidden"
          style={{ width: 340, flexShrink: 0 }}>

          {/* Tabs */}
          <div className="flex border-b border-navy-700 flex-shrink-0">
            {(['plan', 'whatif'] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)}
                className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase transition-colors"
                style={{
                  color: rightTab === tab ? '#00D4FF' : '#3A5A7A',
                  borderBottom: rightTab === tab ? '2px solid #00D4FF' : '2px solid transparent',
                  background: 'none', border: 'none',
                  borderBottom: rightTab === tab ? '2px solid #00D4FF' : '2px solid transparent',
                }}>
                {tab === 'whatif' ? 'WHAT-IF' : 'ACTION PLAN'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'plan' ? (
              result ? (
                <ActionPlan result={result} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-navy-700">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="font-mono text-[11px] tracking-widest">NO ACTIVE PLAN</div>
                  <div className="font-mono text-[10px] mt-1 text-navy-800">
                    Analyze a situation to generate your action plan
                  </div>
                </div>
              )
            ) : (
              result ? (
                <div className="p-4 overflow-y-auto h-full">
                  <WhatIfQuery context={result} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-navy-700">
                  <div className="text-4xl mb-3">💡</div>
                  <div className="font-mono text-[11px] tracking-widest">NO CONTEXT YET</div>
                  <div className="font-mono text-[10px] mt-1 text-navy-800">
                    Analyze a situation first
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
