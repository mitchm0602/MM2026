// src/lib/adapters/kenpom.ts
// ─────────────────────────────────────────────────────────────
//  KenPom Adapter
//
//  KenPom does not have a public REST API. The standard approach
//  is to authenticate with your subscriber credentials and scrape
//  the HTML table from kenpom.com/index.php.
//
//  HOW TO WIRE UP:
//  1. Set KENPOM_EMAIL and KENPOM_PASSWORD in .env.local
//  2. Set DATA_MODE=live in .env.local
//  3. The adapter logs in via POST, gets the session cookie,
//     then fetches the ratings page and parses the HTML table.
//
//  WARNING: KenPom's Terms of Service allow personal use only.
//  Do not expose raw KenPom data publicly or resell it.
// ─────────────────────────────────────────────────────────────

import type { Team } from '@/types';
import { MOCK_TEAMS } from '@/lib/mock-data';

interface KenPomRow {
  team: string;
  adjOE: number;   // Adjusted Offensive Efficiency
  adjDE: number;   // Adjusted Defensive Efficiency
  adjTempo: number;
  luck: number;
  sosAdjOE: number;
  sosAdjDE: number;
  rank: number;
}

// ── Authenticate and fetch KenPom ratings ──────────────────────
async function fetchKenPomRatings(): Promise<KenPomRow[]> {
  const email = process.env.KENPOM_EMAIL;
  const password = process.env.KENPOM_PASSWORD;

  if (!email || !password) {
    throw new Error('KENPOM_EMAIL and KENPOM_PASSWORD must be set in .env.local');
  }

  // Step 1: POST login credentials to get session cookie
  const loginRes = await fetch('https://kenpom.com/handlers/login_handler.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }),
    redirect: 'manual',
  });

  const cookies = loginRes.headers.get('set-cookie');
  if (!cookies) throw new Error('KenPom login failed — check credentials');

  // Step 2: Fetch the ratings page with session cookie
  const ratingsRes = await fetch('https://kenpom.com/index.php', {
    headers: { Cookie: cookies },
  });

  if (!ratingsRes.ok) throw new Error(`KenPom fetch failed: ${ratingsRes.status}`);

  const html = await ratingsRes.text();
  return parseKenPomHTML(html);
}

// ── Parse the KenPom HTML ratings table ────────────────────────
function parseKenPomHTML(html: string): KenPomRow[] {
  // KenPom uses a table with id="ratings-table"
  // We use regex here to avoid a DOM parser dependency on the server.
  // Each data row looks like: <td class="td-rank">1</td><td>Team Name</td>...
  const rows: KenPomRow[] = [];
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*><a[^>]*>([^<]+)<\/a>/g;

  // More complete extraction — extract all td values per row
  const tableMatch = html.match(/<table[^>]+id="ratings-table"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) return rows;

  const tableHtml = tableMatch[1];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let trMatch;

  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const tds = trMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
    if (tds.length < 10) continue;

    const getText = (td: string) => td.replace(/<[^>]+>/g, '').trim();
    const rank = parseInt(getText(tds[0]));
    const team = getText(tds[1]);
    const adjOE = parseFloat(getText(tds[4]));
    const adjDE = parseFloat(getText(tds[6]));
    const adjTempo = parseFloat(getText(tds[8]));
    const luck = parseFloat(getText(tds[10]));
    const sosAdjOE = parseFloat(getText(tds[12]));
    const sosAdjDE = parseFloat(getText(tds[14]));

    if (!isNaN(adjOE)) {
      rows.push({ rank, team, adjOE, adjDE, adjTempo, luck, sosAdjOE, sosAdjDE });
    }
  }

  return rows;
}

// ── Merge KenPom data into our team models ──────────────────────
function mergeKenPomIntoTeams(teams: Team[], kenPomRows: KenPomRow[]): Team[] {
  return teams.map(team => {
    // Fuzzy match on team name (KenPom uses different name formats)
    const row = kenPomRows.find(r =>
      r.team.toLowerCase().includes(team.shortName.toLowerCase()) ||
      team.name.toLowerCase().includes(r.team.toLowerCase())
    );

    if (!row) return team;

    return {
      ...team,
      offEff: row.adjOE,
      defEff: row.adjDE,
      tempo: row.adjTempo,
      // Derive SOS rank from row rank as a proxy
      sos: row.rank,
      dataSource: 'kenpom' as const,
      lastUpdated: new Date().toISOString(),
    };
  });
}

// ── Public export: get teams with KenPom data ──────────────────
export async function getTeamsWithKenPom(baseTeams: Team[]): Promise<Team[]> {
  if (process.env.DATA_MODE !== 'live') {
    console.log('[KenPom] DATA_MODE is not "live" — using mock data');
    return baseTeams;
  }

  try {
    console.log('[KenPom] Fetching live ratings...');
    const rows = await fetchKenPomRatings();
    const merged = mergeKenPomIntoTeams(baseTeams, rows);
    console.log(`[KenPom] Merged data for ${merged.filter(t => t.dataSource === 'kenpom').length} teams`);
    return merged;
  } catch (err) {
    console.error('[KenPom] Failed, falling back to mock data:', err);
    return baseTeams; // graceful fallback
  }
}
