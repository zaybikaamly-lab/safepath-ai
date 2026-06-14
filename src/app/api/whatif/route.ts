import { NextRequest, NextResponse } from 'next/server';
import { runWhatIfQuery } from '@/lib/agents/orchestrator';
import { AgentMessage, CoordinatorOutput } from '@/types';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json();
    if (!query || !context) {
      return NextResponse.json({ error: 'query and context required' }, { status: 400 });
    }

    const messages: AgentMessage[] = [];
    const answer = await runWhatIfQuery(query, context as CoordinatorOutput, (m) => messages.push(m));

    return NextResponse.json({ answer, messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
