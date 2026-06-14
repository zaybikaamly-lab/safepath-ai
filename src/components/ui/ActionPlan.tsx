'use client';
import { useState } from 'react';
import { CoordinatorOutput } from '@/types';

const RISK_CFG = {
  LOW:      { color: '#00FF88', bg: '#00FF8812', label: 'LOW RISK' },
  MODERATE: { color: '#FFD600', bg: '#FFD60012', label: 'MODERATE' },
  HIGH:     { color: '#FF8C00', bg: '#FF8C0012', label: 'HIGH RISK' },
  CRITICAL: { color: '#FF4444', bg: '#FF444412', label: 'CRITICAL' },
};
const ACTION_CFG = {
  STAY:     { color: '#00FF88', icon: '✓', label: 'STAY IN PLACE' },
  PREPARE:  { color: '#FFD600', icon: '⚡', label: 'PREPARE TO EVACUATE' },
  EVACUATE: { color: '#FF4444', icon: '↑', label: 'EVACUATE NOW' },
};

interface Props {
  result: CoordinatorOutput;
  onCheckedChange?: (idx: string, checked: boolean) => void;
}

export default function ActionPlan({ result }: Props) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'route' | 'checklist' | 'whatif'>('plan');

  const risk = RISK_CFG[result.riskLevel] || RISK_CFG.MODERATE;
  const action = ACTION_CFG[result.action] || ACTION_CFG.PREPARE;

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Risk banner */}
      <div className="flex-shrink-0 p-3 border-b border-navy-700"
        style={{ background: risk.bg, borderLeft: `3px solid ${risk.color}` }}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] tracking-widest" style={{ color: risk.color }}>{risk.label}</span>
          <span className="font-mono text-[11px] font-bold" style={{ color: action.color }}>
            {action.icon} {action.label}
          </span>
        </div>
        <p className="text-[12px] text-navy-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-navy-700 flex-shrink-0">
        {(['plan', 'route', 'checklist', 'whatif'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 font-mono text-[9px] tracking-widest uppercase transition-colors"
            style={{
              color: activeTab === tab ? '#00D4FF' : '#3A5A7A',
              borderBottom: activeTab === tab ? '2px solid #00D4FF' : '2px solid transparent',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #00D4FF' : '2px solid transparent',
            }}>
            {tab === 'whatif' ? 'WHAT-IF' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Plan tab */}
        {activeTab === 'plan' && (
          <>
            <Section title="SAFETY RECOMMENDATIONS" color="#FF8C00">
              {result.safety.recommendations.map((r, i) => (
                <Item key={i} icon="→" text={r} />
              ))}
            </Section>
            {result.safety.timeWindow && (
              <div className="bg-navy-800 border border-warn/30 rounded-lg px-3 py-2 font-mono text-[11px] text-warn">
                ⏱ {result.safety.timeWindow}
              </div>
            )}
            <Section title="AVOID THESE ACTIONS" color="#FF4444">
              {result.safety.dangerousActions.map((d, i) => (
                <Item key={i} icon="✕" text={d} color="#FF6666" />
              ))}
            </Section>
            <Section title="SELECTED SHELTER" color="#00D4FF">
              <div className="bg-navy-800 border border-navy-700 rounded-lg p-2.5 space-y-1">
                <div className="font-semibold text-[13px]">{result.shelter.selected.name}</div>
                <div className="font-mono text-[10px] text-navy-400">{result.shelter.selected.address}</div>
                <div className="flex gap-3 font-mono text-[10px] mt-1">
                  <span className="text-safe">● OPEN</span>
                  <span className="text-navy-400">Cap: {result.shelter.selected.capacity}</span>
                  {result.shelter.selected.petFriendly && <span className="text-warn">🐾 Pets OK</span>}
                  {result.shelter.selected.medicalSupport && <span className="text-cyan-DEFAULT">🏥 Medical</span>}
                </div>
                {result.shelter.reason && (
                  <div className="text-[11px] text-navy-400 italic mt-1">{result.shelter.reason}</div>
                )}
              </div>
              {result.shelter.alternatives.length > 0 && (
                <div className="mt-2">
                  <div className="font-mono text-[9px] text-navy-500 tracking-widest mb-1">ALTERNATES</div>
                  {result.shelter.alternatives.map((s) => (
                    <div key={s.id} className="text-[11px] text-navy-400 py-0.5">
                      • {s.name} ({s.distanceKm?.toFixed(1)}km)
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {/* Route tab */}
        {activeTab === 'route' && (
          <>
            <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] text-cyan-DEFAULT tracking-widest">PRIMARY ROUTE</div>
                <div className="font-mono text-[11px] text-navy-400">{result.nav.eta}</div>
              </div>
              {result.nav.steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start text-[12px] text-navy-200">
                  <span className="font-mono text-[10px] text-navy-600 mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            {result.nav.avoidZones.length > 0 && (
              <Section title="AVOID ZONES" color="#FF4444">
                {result.nav.avoidZones.map((z, i) => <Item key={i} icon="✕" text={z} color="#FF6666" />)}
              </Section>
            )}
            {result.nav.safetyNotes.length > 0 && (
              <Section title="ROUTE SAFETY NOTES" color="#FFD600">
                {result.nav.safetyNotes.map((n, i) => <Item key={i} icon="⚠" text={n} color="#FFD600" />)}
              </Section>
            )}
          </>
        )}

        {/* Checklist tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {result.prep.checklist.map((section) => (
              <div key={section.category}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{section.icon}</span>
                  <span className="font-mono text-[10px] tracking-widest text-navy-400">{section.category.toUpperCase()}</span>
                </div>
                {section.items.map((item) => {
                  const key = `${section.category}-${item.label}`;
                  const checked = checkedItems.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCheck(key)}
                      className="flex items-center gap-3 w-full text-left py-1.5 group"
                    >
                      <div
                        className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                        style={{
                          background: checked ? '#00FF88' : 'transparent',
                          borderColor: checked ? '#00FF88' : item.priority === 'critical' ? '#FF4444' : '#3A5A7A',
                        }}
                      >
                        {checked && <span className="text-navy-950 text-[10px] font-bold">✓</span>}
                      </div>
                      <span
                        className="text-[12px] transition-all"
                        style={{
                          color: checked ? '#3A5A7A' : item.priority === 'critical' ? '#E8F4FD' : '#C0D8F0',
                          textDecoration: checked ? 'line-through' : 'none',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.priority === 'critical' && !checked && (
                        <span className="font-mono text-[8px] text-hazard ml-auto">CRITICAL</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* What-If tab */}
        {activeTab === 'whatif' && (
          <div className="space-y-2">
            {result.whatIf.scenarios.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border overflow-hidden cursor-pointer transition-all"
                style={{
                  background: '#0D1B2E',
                  borderColor: expandedScenario === i ? '#FFD60040' : '#1A2E4A',
                  borderLeft: `2px solid ${expandedScenario === i ? '#FFD600' : 'transparent'}`,
                }}
                onClick={() => setExpandedScenario(expandedScenario === i ? null : i)}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-warn">💡</span>
                    <span className="text-[13px] font-medium text-navy-100">{s.question}</span>
                  </div>
                  <span className="text-navy-500 text-[11px]">{expandedScenario === i ? '▲' : '▼'}</span>
                </div>
                {expandedScenario === i && (
                  <div className="px-3 pb-3 pt-0 text-[12px] leading-relaxed text-navy-300 border-t border-navy-700">
                    {s.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-widest mb-2" style={{ color }}>{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Item({ icon, text, color }: { icon: string; text: string; color?: string }) {
  return (
    <div className="flex gap-2 items-start text-[12px]">
      <span className="flex-shrink-0 text-[10px] mt-0.5" style={{ color: color || '#7A9AB8' }}>{icon}</span>
      <span style={{ color: color || '#C0D8F0' }}>{text}</span>
    </div>
  );
}
