'use client';
import { useEffect, useRef } from 'react';
import { AgentMessage, AgentId } from '@/types';

const AGENT_CONFIG: Record<AgentId, { label: string; color: string; icon: string }> = {
  hazard: { label: 'HAZARD', color: '#FF4444', icon: '⚠' },
  safety: { label: 'SAFETY', color: '#FF8C00', icon: '🛡' },
  shelter: { label: 'SHELTER', color: '#00D4FF', icon: '🏠' },
  nav: { label: 'NAV', color: '#00FF88', icon: '🧭' },
  prep: { label: 'PREP', color: '#B388FF', icon: '📋' },
  whatif: { label: 'WHAT-IF', color: '#FFD600', icon: '💡' },
  coord: { label: 'COORD', color: '#E8F4FD', icon: '⬡' },
};

interface Props {
  messages: AgentMessage[];
  isAnalyzing: boolean;
  activeAgent?: AgentId | null;
}

export default function AgentPanel({ messages, isAnalyzing, activeAgent }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700 flex-shrink-0">
        <span className="font-mono text-[10px] text-navy-400 tracking-widest">AGENT DISCUSSION</span>
        <div className="flex gap-2">
          {Object.entries(AGENT_CONFIG).map(([id, cfg]) => (
            <div
              key={id}
              className="agent-dot"
              style={{
                background: cfg.color,
                opacity: isAnalyzing && activeAgent === id ? 1 : 0.25,
                animationDelay: `${Object.keys(AGENT_CONFIG).indexOf(id) * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto p-4 font-mono space-y-1">
        {messages.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-navy-600 text-center">
            <div className="text-4xl mb-3 animate-flicker">⬡</div>
            <div className="text-[11px] tracking-widest">AGENTS STANDING BY</div>
            <div className="text-[10px] mt-1 text-navy-700">Submit a situation to begin</div>
          </div>
        )}

        {/* Boot lines */}
        {isAnalyzing && messages.length === 0 && (
          <div className="text-[10px] text-navy-500 tracking-widest animate-slide-in">
            — SAFEPATH AI INITIALIZING...
          </div>
        )}

        {messages.map((msg, i) => {
          const cfg = AGENT_CONFIG[msg.agent];
          if (!cfg) return null;
          return (
            <div key={i} className="flex gap-2.5 items-start animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Agent badge */}
              <div
                className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs mt-0.5"
                style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}
              >
                {cfg.icon}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <div className="text-[9px] tracking-widest mb-1 font-bold" style={{ color: cfg.color }}>
                  {cfg.label}
                </div>
                <div
                  className="text-[12px] leading-relaxed rounded-tr-md rounded-br-md rounded-bl-md px-3 py-2 text-navy-200"
                  style={{
                    background: '#0D1B2E',
                    borderLeft: `2px solid ${cfg.color}50`,
                    border: `1px solid #1A2E4A`,
                    borderLeftColor: `${cfg.color}50`,
                  }}
                >
                  {msg.message}
                </div>
                <div className="text-[9px] text-navy-600 mt-0.5">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isAnalyzing && activeAgent && AGENT_CONFIG[activeAgent] && (
          <div className="flex gap-2.5 items-start animate-slide-in">
            <div
              className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs mt-0.5"
              style={{
                background: `${AGENT_CONFIG[activeAgent].color}18`,
                border: `1px solid ${AGENT_CONFIG[activeAgent].color}40`,
              }}
            >
              {AGENT_CONFIG[activeAgent].icon}
            </div>
            <div className="flex-1">
              <div className="text-[9px] tracking-widest mb-1 font-bold" style={{ color: AGENT_CONFIG[activeAgent].color }}>
                {AGENT_CONFIG[activeAgent].label}
              </div>
              <div className="px-3 py-2 rounded-tr-md rounded-br-md rounded-bl-md bg-navy-800 border border-navy-700 text-navy-500 text-[12px] tracking-[6px]">
                ● ● ●
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
