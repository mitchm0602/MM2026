// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TEAMS, MOCK_BETTING_LINES } from '@/lib/mock-data';
import { getBettingLine } from '@/lib/adapters/odds';
import { generateAnalysis } from '@/lib/model/prediction';
import type { BettingLine } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { teamAId, teamBId } = await req.json();

    if (!teamAId || !teamBId) {
      return NextResponse.json({ error: 'teamAId and teamBId required' }, { status: 400 });
    }

    const tA = MOCK_TEAMS.find(t => t.id === teamAId);
    const tB = MOCK_TEAMS.find(t => t.id === teamBId);

    if (!tA || !tB) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Fetch betting line (live or mock)
    let lines: BettingLine | null = await getBettingLine(tA.name, tB.name);

    // Fallback to mock lines if not found
    if (!lines) {
      const key = [tA.id, tB.id].sort().join('-');
      lines = MOCK_BETTING_LINES[key] ?? {
        spread: -3.5,
        spreadFav: tA.id,
        ml_a: -160,
        ml_b: 134,
        total: 145.5,
        source: 'Estimated',
        updated: 'No live line available',
      };
    }

    const analysis = generateAnalysis(tA, tB, lines);

    // Optional: generate AI narrative if OpenAI key is set
    let aiNarrative: string | undefined;
    if (process.env.OPENAI_API_KEY && process.env.DATA_MODE === 'live') {
      try {
        aiNarrative = await generateAINarrative(analysis);
      } catch (e) {
        console.warn('[analyze] OpenAI narrative failed, skipping:', e);
      }
    }

    return NextResponse.json({
      analysis: { ...analysis, aiNarrative },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/analyze] Error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

// ── Optional OpenAI narrative ──────────────────────────────────
async function generateAINarrative(analysis: ReturnType<typeof generateAnalysis>): Promise<string> {
  const { tA, tB, pickCover, ouLean, confidence, spreadEdge, projA, projB } = analysis;

  const prompt = `You are a concise sports betting analyst. Given this matchup analysis, write 2-3 sentences explaining the top betting angle in plain English. Be specific, data-driven, and direct. Do not use hedging language or disclaimers.

Matchup: ${tA.name} vs ${tB.name}
Model pick: ${pickCover}
O/U lean: ${ouLean}
Projected score: ${tA.name} ${Math.round(projA)}, ${tB.name} ${Math.round(projB)}
Confidence: ${confidence}/10
Spread edge: ${spreadEdge > 0 ? '+' : ''}${spreadEdge.toFixed(1)} pts vs market
Key factors: ${analysis.reasons.slice(0, 3).join('; ')}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.4,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
