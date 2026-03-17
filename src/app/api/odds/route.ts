// src/app/api/odds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBettingLine } from '@/lib/adapters/odds';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const teamA = searchParams.get('teamA');
  const teamB = searchParams.get('teamB');

  if (!teamA || !teamB) {
    return NextResponse.json({ error: 'teamA and teamB query params required' }, { status: 400 });
  }

  try {
    const line = await getBettingLine(teamA, teamB);

    if (!line) {
      return NextResponse.json({
        line: null,
        message: `No betting line found for ${teamA} vs ${teamB}`,
      }, { status: 200 });
    }

    return NextResponse.json({
      line,
      mode: process.env.DATA_MODE ?? 'mock',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/odds] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch odds' }, { status: 500 });
  }
}
