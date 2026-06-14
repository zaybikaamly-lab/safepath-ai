'use client';
import { useState } from 'react';
import { CoordinatorOutput } from '@/types';

const QUICK_QUESTIONS = [
  'What if roads are blocked?',
  'What if I have pets?',
  'What if the shelter is full?',
  'What if I need medication?',
  'What if I have no car?',
  'What if power goes out?',
];

interface Props {
  context: CoordinatorOutput;
}

export default function WhatIfQuery({ context }: Props) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (q?: string) => {
    const question = q || query;
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setAnswer('');
    setError('');

    try {
      const res = await fetch('/api/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question, context }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] text-navy-400 tracking-widest">ASK A WHAT-IF QUESTION</div>

      {/* Quick buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => { setQuery(q); handleSubmit(q); }}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full font-mono text-[10px] transition-all"
            style={{
              background: '#0D1B2E',
              border: '1px solid #1A2E4A',
              color: '#5A7A9A',
              cursor: isLoading ? 'wait' : 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFD60050'; e.currentTarget.style.color = '#FFD600'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2E4A'; e.currentTarget.style.color = '#5A7A9A'; }}
          >💡 {q}</button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask any scenario question…"
          className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-[12px] text-navy-100 outline-none font-mono"
          onFocus={e => e.target.style.borderColor = '#FFD600'}
          onBlur={e => e.target.style.borderColor = '#1A2E4A'}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!query.trim() || isLoading}
          className="px-4 py-2 rounded-lg font-mono text-[11px] tracking-wider transition-all"
          style={{
            background: isLoading ? '#0D1B2E' : '#FFD60020',
            border: `1px solid ${isLoading ? '#1A2E4A' : '#FFD60040'}`,
            color: isLoading ? '#3A5A7A' : '#FFD600',
          }}
        >
          {isLoading ? <span className="animate-spin-slow">◌</span> : 'ASK →'}
        </button>
      </div>

      {/* Answer */}
      {answer && (
        <div className="bg-navy-800 border border-warn/20 border-l-2 border-l-warn rounded-lg px-4 py-3 text-[13px] leading-relaxed text-navy-200 animate-slide-in">
          <div className="font-mono text-[9px] text-warn tracking-widest mb-1">WHAT-IF AGENT RESPONSE</div>
          {answer}
        </div>
      )}
      {error && (
        <div className="text-[11px] text-hazard font-mono">{error}</div>
      )}
    </div>
  );
}
