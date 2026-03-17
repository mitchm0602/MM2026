// src/lib/adapters/espn.ts
// ─────────────────────────────────────────────────────────────
//  ESPN Adapter (Public unofficial API — no key required)
//
//  HOW TO WIRE UP:
//  1. Set USE_ESPN_PUBLIC=true in .env.local
//  2. Set DATA_MODE=live
//
//  ESPN has an undocumented but stable public API used by their
//  own web apps. It returns team stats, schedules, and standings.
//  No API key required for the public endpoints.
//
//  IMPORTANT: This is an unofficial API. ESPN could block it
//  at any time. For production, use Sportradar (see sportradar.ts).
//
//  Endpoints used:
//  - https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/{teamId}
//  - https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event={gameId}
// ─────────────────────────────────────────────────────────────

import type { Team } from '@/types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball';

// ── ESPN team ID lookup (add more as needed) ──────────────────
// Find ESPN team IDs at: https://www.espn.com/mens-college-basketball/teams
export const ESPN_TEAM_IDS: Record<string, string> = {
  duke:      '150',
  kansas:    '2305',
  gonzaga:   '2250',
  houston:   '248',
  tennessee: '2633',
  marquette: '269',
  auburn:    '2',
  iowast:    '66',
  purdue:    '2509',
  creighton: '156',
  illinois:  '356',
  baylor:    '239',
  arizona:   '12',
  uconn:     '41',
  kentucky:  '96',
  indiana:   '84',
  sandiegos: '21',
  wis:       '275',
  tcu:       '2628',
};

// ── Fetch ESPN stats for a single team ────────────────────────
export async function fetchESPNTeamStats(teamId: string): Promise<Partial<Team> | null> {
  const espnId = ESPN_TEAM_IDS[teamId];
  if (!espnId) {
    console.warn(`[ESPN] No ESPN ID for team: ${teamId}`);
    return null;
  }

  try {
    const res = await fetch(`${ESPN_BASE}/teams/${espnId}`, {
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) throw new Error(`ESPN API ${res.status}`);

    const data = await res.json();
    const team = data.team;
    const stats = team?.record?.items?.[0]?.stats ?? [];

    const getStat = (name: string): number => {
      const s = stats.find((s: { name: string; value: number }) => s.name === name);
      return s?.value ?? 0;
    };

    return {
      record: team?.record?.items?.[0]?.summary ?? '',
      ppg:    getStat('avgPoints'),
      oppg:   getStat('avgPointsAgainst'),
      dataSource: 'espn',
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[ESPN] Failed for team ${teamId}:`, err);
    return null;
  }
}

// ── Enrich a list of teams with ESPN stats ────────────────────
export async function enrichTeamsWithESPN(teams: Team[]): Promise<Team[]> {
  if (process.env.USE_ESPN_PUBLIC !== 'true' || process.env.DATA_MODE !== 'live') {
    return teams;
  }

  const enriched = await Promise.all(
    teams.map(async team => {
      const stats = await fetchESPNTeamStats(team.id);
      if (!stats) return team;
      return { ...team, ...stats };
    })
  );

  console.log(`[ESPN] Enriched ${enriched.filter(t => t.dataSource === 'espn').length} teams`);
  return enriched;
}
