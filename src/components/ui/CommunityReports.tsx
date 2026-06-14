'use client';
import { useState } from 'react';
import { CommunityReport } from '@/types';

interface Props {
  onAddReport: (r: CommunityReport) => void;
  reports: CommunityReport[];
  userLat: number;
  userLon: number;
}

const REPORT_TYPES = [
  { value: 'road_blocked', label: '🚧 Road blocked' },
  { value: 'flooding', label: '🌊 Flooding' },
  { value: 'power_outage', label: '⚡ Power outage' },
  { value: 'hazard', label: '⚠ Hazard' },
  { value: 'other', label: '📢 Other' },
] as const;

export default function CommunityReports({ onAddReport, reports, userLat, userLon }: Props) {
  const [type, setType] = useState<CommunityReport['type']>('road_blocked');
  const [desc, setDesc] = useState('');
  const [added, setAdded] = useState(false);

  const handleSubmit = () => {
    if (!desc.trim()) return;
    onAddReport({
      id: Math.random().toString(36).slice(2),
      type,
      description: desc.trim(),
      lat: userLat + (Math.random() - 0.5) * 0.02,
      lon: userLon + (Math.random() - 0.5) * 0.02,
      timestamp: Date.now(),
      verified: false,
    });
    setDesc('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] text-navy-400 tracking-widest">COMMUNITY REPORTS</div>
      <div className="flex gap-1 flex-wrap">
        {REPORT_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className="px-2 py-1 rounded text-[10px] font-mono transition-all"
            style={{
              background: type === t.value ? '#00D4FF20' : '#0D1B2E',
              border: `1px solid ${type === t.value ? '#00D4FF40' : '#1A2E4A'}`,
              color: type === t.value ? '#00D4FF' : '#3A5A7A',
            }}
          >{t.label}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Describe the hazard near your area…"
          className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-[12px] text-navy-100 outline-none font-mono"
          onFocus={e => e.target.style.borderColor = '#00D4FF'}
          onBlur={e => e.target.style.borderColor = '#1A2E4A'}
        />
        <button
          onClick={handleSubmit}
          disabled={!desc.trim()}
          className="px-3 py-2 rounded-lg font-mono text-[11px] transition-all"
          style={{
            background: added ? '#00FF8820' : '#0D1B2E',
            border: `1px solid ${added ? '#00FF8840' : '#1A2E4A'}`,
            color: added ? '#00FF88' : '#3A5A7A',
          }}
        >{added ? '✓' : 'ADD'}</button>
      </div>
      {reports.length > 0 && (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {reports.map(r => (
            <div key={r.id} className="text-[10px] font-mono text-navy-500 flex gap-2">
              <span className="text-warn">●</span>
              <span>{REPORT_TYPES.find(t => t.value === r.type)?.label}: {r.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
