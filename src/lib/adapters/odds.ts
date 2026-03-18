// src/lib/adapters/odds.ts
// ─────────────────────────────────────────────────────────────
//  The Odds API Adapter — fixed version
//
//  SETUP:
//  1. Sign up at https://the-odds-api.com (free: 500 req/month)
//  2. Add to Vercel env vars:
//       ODDS_API_KEY   = your key
//       ODDS_API_BOOK  = draftkings  (or fanduel, betmgm, etc.)
//       ODDS_API_SPORT = basketball_ncaab
//       DATA_MODE      = live
//
//  BUGS FIXED vs previous version:
//  - Mock key lookup now uses actual team IDs, not name slices
//  - Live team matching uses a robust fuzzy-match with known aliases
//  - spreadFav now correctly stores the team's actual ID
//  - Server-side in-memory cache added (5 min TTL) so one API call
//    serves all concurrent users instead of burning quota per user
// ─────────────────────────────────────────────────────────────

import type { BettingLine } from '@/types';
import { MOCK_BETTING_LINES, MOCK_TEAMS } from '@/lib/mock-data';

const BASE_URL = 'https://api.the-odds-api.com/v4';

// ── Raw API response types ────────────────────────────────────
interface OddsApiOutcome {
  name:   string;
  price:  number;
  point?: number;
}
interface OddsApiMarket {
  key:      string;
  outcomes: OddsApiOutcome[];
  last_update: string;
}
interface OddsApiBookmaker {
  key:      string;
  title:    string;
  last_update: string;
  markets:  OddsApiMarket[];
}
interface OddsApiGame {
  id:           string;
  sport_key:    string;
  commence_time: string;
  home_team:    string;
  away_team:    string;
  bookmakers:   OddsApiBookmaker[];
}

// ── Server-side in-memory cache (survives across requests in same serverless instance)
let _cache: { games: OddsApiGame[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Team name aliases ─────────────────────────────────────────
// The Odds API uses full school names. Our team IDs use short slugs.
// This map lets us match either direction.
const TEAM_ALIASES: Record<string, string[]> = {
  'duke':          ['Duke'],
  'arizona':       ['Arizona'],
  'michigan':      ['Michigan'],
  'florida':       ['Florida'],
  'uconn':         ['UConn', 'Connecticut'],
  'purdue':        ['Purdue'],
  'iowast':        ['Iowa State', 'Iowa St'],
  'houston':       ['Houston'],
  'michiganst':    ['Michigan State', 'Michigan St'],
  'gonzaga':       ['Gonzaga'],
  'virginia':      ['Virginia'],
  'illinois':      ['Illinois'],
  'kansas':        ['Kansas'],
  'arkansas':      ['Arkansas'],
  'alabama':       ['Alabama'],
  'nebraska':      ['Nebraska'],
  'stjohns':       ["St. John's", 'St Johns', 'Saint Johns'],
  'wisconsin':     ['Wisconsin'],
  'texastech':     ['Texas Tech'],
  'vanderbilt':    ['Vanderbilt'],
  'louisville':    ['Louisville'],
  'byu':           ['BYU', 'Brigham Young'],
  'tennessee':     ['Tennessee'],
  'northcarolina': ['North Carolina', 'UNC'],
  'ucla':          ['UCLA'],
  'miamifl':       ['Miami (FL)', 'Miami FL', 'Miami'],
  'kentucky':      ['Kentucky'],
  'saintmarys':    ["Saint Mary's", "St. Mary's"],
  'ohiostate':     ['Ohio State', 'Ohio St'],
  'villanova':     ['Villanova'],
  'georgia':       ['Georgia'],
  'clemson':       ['Clemson'],
  'tcu':           ['TCU', 'Texas Christian'],
  'utahst':        ['Utah State', 'Utah St'],
  'stlouis':       ['Saint Louis', 'St. Louis'],
  'iowa':          ['Iowa'],
  'ucf':           ['UCF', 'Central Florida'],
  'missouri':      ['Missouri'],
  'santaclara':    ['Santa Clara'],
  'texasam':       ['Texas A&M'],
  'southflorida':  ['South Florida', 'USF'],
  'texas':         ['Texas'],
  'ncstate':       ['NC State', 'N.C. State', 'North Carolina State'],
  'smu':           ['SMU', 'Southern Methodist'],
  'miamioh':       ['Miami (OH)', 'Miami OH', 'Miami (Ohio)'],
  'vcu':           ['VCU', 'Virginia Commonwealth'],
  'northerniowa':  ['Northern Iowa', 'N. Iowa'],
  'highpoint':     ['High Point'],
  'akron':         ['Akron'],
  'mcneese':       ['McNeese', 'McNeese State'],
  'calbaptist':    ['Cal Baptist', 'California Baptist'],
  'hawaii':        ['Hawaii', "Hawai'i"],
  'hofstra':       ['Hofstra'],
  'troy':          ['Troy'],
  'northdakotast': ['North Dakota State', 'NDSU'],
  'kennesawst':    ['Kennesaw State', 'Kennesaw St'],
  'wrightstate':   ['Wright State'],
  'penn':          ['Penn', 'Pennsylvania'],
  'furman':        ['Furman'],
  'queens':        ['Queens'],
  'tennesseest':   ['Tennessee State', 'Tennessee St'],
  'idaho':         ['Idaho'],
  'siena':         ['Siena'],
  'liu':           ['LIU', 'Long Island'],
  'umbc':          ['UMBC'],
  'howard':        ['Howard'],
  'prairierview':  ['Prairie View', 'Prairie View A&M'],
  'lehigh':        ['Lehigh'],
};

// Returns true if an API team name matches any alias for a given team ID
function teamMatches(apiName: string, teamId: string): boolean {
  const aliases = TEAM_ALIASES[teamId] ?? [];
  const lower   = apiName.toLowerCase();
  return aliases.some(alias => lower.includes(alias.toLowerCase()));
}

// Find a team ID from an API team name
function findTeamId(apiName: string): string | null {
  for (const [id, aliases] of Object.entries(TEAM_ALIASES)) {
    if (aliases.some(a => apiName.toLowerCase().includes(a.toLowerCase()))) {
      return id;
    }
  }
  return null;
}

// ── Fetch all NCAAB odds from the API (with caching) ─────────
export async function fetchAllOdds(): Promise<OddsApiGame[]> {
  // Return cached data if still fresh
  const now = Date.now();
  if (_cache && (now - _cache.fetchedAt) < CACHE_TTL) {
    console.log('[OddsAPI] Returning cached data');
    return _cache.games;
  }

  const apiKey = process.env.ODDS_API_KEY;
  const sport  = process.env.ODDS_API_SPORT || 'basketball_ncaab';
  const book   = process.env.ODDS_API_BOOK  || 'draftkings';

  if (!apiKey) throw new Error('ODDS_API_KEY is not set in Vercel environment variables');

  const url = new URL(`${BASE_URL}/sports/${sport}/odds`);
  url.searchParams.set('apiKey',     apiKey);
  url.searchParams.set('regions',    'us');
  url.searchParams.set('markets',    'spreads,totals,h2h');
  url.searchParams.set('oddsFormat', 'american');
  url.searchParams.set('bookmakers', book);

  console.log('[OddsAPI] Fetching fresh odds...');
  const res = await fetch(url.toString(), { cache: 'no-store' });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Odds API ${res.status}: ${body}`);
  }

  const remaining = res.headers.get('x-requests-remaining');
  const used      = res.headers.get('x-requests-used');
  console.log(`[OddsAPI] Quota — used: ${used}, remaining: ${remaining}`);

  const games: OddsApiGame[] = await res.json();

  // Store in cache
  _cache = { games, fetchedAt: Date.now() };
  console.log(`[OddsAPI] Cached ${games.length} games`);

  return games;
}

// ── Normalize one game into our BettingLine format ────────────
function normalizeGame(
  game:      OddsApiGame,
  teamAId:   string,
  teamBId:   string,
): BettingLine | null {
  const book = process.env.ODDS_API_BOOK || 'draftkings';

  const bookmaker = game.bookmakers.find(b => b.key === book)
    ?? game.bookmakers[0];
  if (!bookmaker) return null;

  const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
  const totalsMarket  = bookmaker.markets.find(m => m.key === 'totals');
  const h2hMarket     = bookmaker.markets.find(m => m.key === 'h2h');

  if (!spreadsMarket || !totalsMarket) return null;

  // Match outcomes to team A and team B using the alias table
  const spreadA = spreadsMarket.outcomes.find(o => teamMatches(o.name, teamAId));
  const spreadB = spreadsMarket.outcomes.find(o => teamMatches(o.name, teamBId));
  const mlA     = h2hMarket?.outcomes.find(o => teamMatches(o.name, teamAId));
  const mlB     = h2hMarket?.outcomes.find(o => teamMatches(o.name, teamBId));
  const over    = totalsMarket.outcomes.find(o => o.name.toLowerCase() === 'over');

  if (!spreadA?.point || !over?.point) {
    console.warn(`[OddsAPI] Could not find spread/total for ${teamAId} vs ${teamBId}`);
    return null;
  }

  // FIX: spreadFav must be the actual team ID, not the string 'teamA'
  const spreadFav = (spreadA.point ?? 0) < 0 ? teamAId : teamBId;

  return {
    spread:    Math.abs(spreadA.point),   // always store as positive; spreadFav tells us who's favored
    spreadFav,
    ml_a:      mlA?.price  ?? 0,
    ml_b:      mlB?.price  ?? 0,
    total:     over.point,
    source:    bookmaker.title,
    updated:   new Date(bookmaker.last_update).toLocaleString('en-US', {
                 month: 'numeric', day: 'numeric',
                 hour: 'numeric', minute: '2-digit',
               }),
  };
}

// ── Main export: get line for a specific matchup ──────────────
export async function getBettingLine(
  teamAId: string,
  teamBId: string,
): Promise<BettingLine | null> {

  // ── MOCK MODE ─────────────────────────────────────────────
  if (process.env.DATA_MODE !== 'live') {
    // Look up by sorted team IDs — this is what mock-data.ts keys use
    const key = [teamAId, teamBId].sort().join('-');
    const direct = MOCK_BETTING_LINES[key];
    if (direct) return direct;

    // Try flipped order in case key is reversed
    const flipped = MOCK_BETTING_LINES[[teamBId, teamAId].join('-')];
    if (flipped) return flipped;

    // Fallback: scan all keys for a match that contains either team ID
    const partial = Object.entries(MOCK_BETTING_LINES).find(([k]) =>
      k.includes(teamAId) && k.includes(teamBId)
    );
    if (partial) return partial[1];

    // Last resort: generic placeholder
    const teamA = MOCK_TEAMS.find(t => t.id === teamAId);
    const teamB = MOCK_TEAMS.find(t => t.id === teamBId);
    const seedDiff = (teamA?.seed ?? 8) - (teamB?.seed ?? 8);
    return {
      spread:    Math.abs(seedDiff) * 2.5 + 1.5,
      spreadFav: seedDiff < 0 ? teamAId : teamBId,
      ml_a:      seedDiff < 0 ? -180 : 150,
      ml_b:      seedDiff < 0 ? 150  : -180,
      total:     145.5,
      source:    'Estimated (Demo)',
      updated:   'Demo mode',
    };
  }

  // ── LIVE MODE ─────────────────────────────────────────────
  try {
    const games = await fetchAllOdds();

    // Find the game matching both teams using alias table
    const game = games.find(g =>
      (teamMatches(g.home_team, teamAId) || teamMatches(g.away_team, teamAId)) &&
      (teamMatches(g.home_team, teamBId) || teamMatches(g.away_team, teamBId))
    );

    if (!game) {
      console.warn(`[OddsAPI] No game found for teamAId=${teamAId} teamBId=${teamBId}`);
      // Fall back to mock line so UI always has something
      const key = [teamAId, teamBId].sort().join('-');
      return MOCK_BETTING_LINES[key] ?? null;
    }

    const line = normalizeGame(game, teamAId, teamBId);
    if (!line) {
      console.warn(`[OddsAPI] normalizeGame returned null for ${teamAId} vs ${teamBId}`);
      const key = [teamAId, teamBId].sort().join('-');
      return MOCK_BETTING_LINES[key] ?? null;
    }

    return line;

  } catch (err) {
    console.error('[OddsAPI] Live fetch failed:', err);
    // Graceful fallback to mock
    const key = [teamAId, teamBId].sort().join('-');
    return MOCK_BETTING_LINES[key] ?? null;
  }
}

// ── Get all available NCAAB lines ─────────────────────────────
export async function getAllBettingLines(): Promise<Map<string, BettingLine>> {
  const map = new Map<string, BettingLine>();

  if (process.env.DATA_MODE !== 'live') {
    Object.entries(MOCK_BETTING_LINES).forEach(([k, v]) => map.set(k, v));
    return map;
  }

  try {
    const games = await fetchAllOdds();
    for (const game of games) {
      const idA = findTeamId(game.home_team);
      const idB = findTeamId(game.away_team);
      if (!idA || !idB) continue;
      const line = normalizeGame(game, idA, idB);
      if (line) {
        const key = [idA, idB].sort().join('-');
        map.set(key, line);
      }
    }
  } catch (err) {
    console.error('[OddsAPI] getAllBettingLines failed:', err);
    Object.entries(MOCK_BETTING_LINES).forEach(([k, v]) => map.set(k, v));
  }

  return map;
}
