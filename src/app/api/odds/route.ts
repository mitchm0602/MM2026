// src/app/api/odds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBettingLine, fetchAllOdds } from '@/lib/adapters/odds';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // ── DEBUG MODE: visit /api/odds?debug=true to see raw API response ──
  // This tells you EXACTLY what team names the Odds API is returning
  // so you can verify the alias table is matching correctly.
  if (searchParams.get('debug') === 'true') {
    try {
      const games = await fetchAllOdds();
      return NextResponse.json({
        mode:       process.env.DATA_MODE ?? 'mock',
        gameCount:  games.length,
        // Show just team names + bookmaker keys for diagnosis
        games: games.map(g => ({
          home: g.home_team,
          away: g.away_team,
          time: g.commence_time,
          books: g.bookmakers.map(b => b.key),
          hasSpread: g.bookmakers.some(b => b.markets.some(m => m.key === 'spreads')),
          hasTotal:  g.bookmakers.some(b => b.markets.some(m => m.key === 'totals')),
        })),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ── NORMAL MODE: get line for a specific matchup ────────────
  // Accepts teamAId and teamBId (team IDs from mock-data.ts)
  // e.g. /api/odds?teamAId=duke&teamBId=siena
  const teamAId = searchParams.get('teamAId') ?? searchParams.get('teamA') ?? '';
  const teamBId = searchParams.get('teamBId') ?? searchParams.get('teamB') ?? '';

  if (!teamAId || !teamBId) {
    return NextResponse.json(
      { error: 'teamAId and teamBId are required. Add ?debug=true to see all available games.' },
      { status: 400 }
    );
  }

  try {
    const line = await getBettingLine(teamAId, teamBId);

    return NextResponse.json({
      line,
      mode:      process.env.DATA_MODE ?? 'mock',
      teamAId,
      teamBId,
      timestamp: new Date().toISOString(),
      found:     !!line,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/odds] Error:', message);
    return NextResponse.json({ error: message, line: null }, { status: 200 });
  }
}
