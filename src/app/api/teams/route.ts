// src/app/api/teams/route.ts
import { NextResponse } from 'next/server';
import { MOCK_TEAMS } from '@/lib/mock-data';
import { getTeamsWithKenPom } from '@/lib/adapters/kenpom';
import { enrichTeamsWithESPN } from '@/lib/adapters/espn';

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function GET() {
  try {
    let teams = [...MOCK_TEAMS];

    // Layer 1: KenPom efficiency metrics (if live mode + credentials set)
    teams = await getTeamsWithKenPom(teams);

    // Layer 2: ESPN record / scoring stats (if enabled)
    teams = await enrichTeamsWithESPN(teams);

    return NextResponse.json({
      teams,
      mode: process.env.DATA_MODE ?? 'mock',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/teams] Error:', err);
    // Always return something — fail gracefully with mock data
    return NextResponse.json({
      teams: MOCK_TEAMS,
      mode: 'mock',
      error: 'Live data unavailable, showing mock data',
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // 200 so the UI still renders
  }
}
