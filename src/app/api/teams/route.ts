// src/app/api/teams/route.ts
import { NextResponse } from 'next/server';
import { MOCK_TEAMS } from '@/lib/mock-data';
import { getTeamsWithKenPom } from '@/lib/adapters/kenpom';
import { enrichTeamsWithESPN } from '@/lib/adapters/espn';

export const dynamic = 'force-dynamic';  // ← the fix

export async function GET() {
  try {
    let teams = [...MOCK_TEAMS];
    teams = await getTeamsWithKenPom(teams);
    teams = await enrichTeamsWithESPN(teams);

    return NextResponse.json({
      teams,
      mode: process.env.DATA_MODE ?? 'mock',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/teams] Error:', err);
    return NextResponse.json({
      teams: MOCK_TEAMS,
      mode: 'mock',
      error: 'Live data unavailable, showing mock data',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}
