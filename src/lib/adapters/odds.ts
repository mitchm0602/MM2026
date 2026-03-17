// src/lib/adapters/odds.ts
// ─────────────────────────────────────────────────────────────
//  The Odds API Adapter
//
//  HOW TO WIRE UP:
//  1. Sign up at https://the-odds-api.com (free: 500 req/month)
//  2. Set ODDS_API_KEY in .env.local
//  3. Set ODDS_API_BOOK to your preferred sportsbook (e.g. draftkings)
//  4. Set DATA_MODE=live
//
//  The Odds API returns lines from 40+ sportsbooks in one call.
//  We normalize to our BettingLine format.
//
//  API Docs: https://the-odds-api.com/liveapi/guides/v4/
// ─────────────────────────────────────────────────────────────

import type { BettingLine } from '@/types';
import { MOCK_BETTING_LINES } from '@/lib/mock-data';

const BASE_URL = 'https://api.the-odds-api.com/v4';

// ── Raw API response types ─────────────────────────────────────
interface OddsApiOutcome {
  name: string;
  price: number;   // American odds
  point?: number;  // spread or total value
}

interface OddsApiMarket {
  key: string;     // 'spreads' | 'totals' | 'h2h'
  outcomes: OddsApiOutcome[];
  last_update: string;
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

interface OddsApiGame {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

// ── Fetch all NCAAB games with odds ───────────────────────────
export async function fetchAllOdds(): Promise<OddsApiGame[]> {
  const apiKey = process.env.ODDS_API_KEY;
  const sport = process.env.ODDS_API_SPORT || 'basketball_ncaab';
  const book = process.env.ODDS_API_BOOK || 'draftkings';

  if (!apiKey) throw new Error('ODDS_API_KEY is not set in .env.local');

  const url = new URL(`${BASE_URL}/sports/${sport}/odds`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', 'spreads,totals,h2h');
  url.searchParams.set('oddsFormat', 'american');
  url.searchParams.set('bookmakers', book);

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 }, // Next.js: cache for 5 minutes
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Odds API error ${res.status}: ${body}`);
  }

  // Log remaining quota from response headers
  const remaining = res.headers.get('x-requests-remaining');
  console.log(`[OddsAPI] Requests remaining this month: ${remaining}`);

  return res.json();
}

// ── Normalize one game's odds into our BettingLine format ──────
function normalizeGame(game: OddsApiGame, teamAName: string, teamBName: string): BettingLine | null {
  const book = process.env.ODDS_API_BOOK || 'draftkings';
  const bookmaker = game.bookmakers.find(b => b.key === book)
    ?? game.bookmakers[0]; // fallback to first available

  if (!bookmaker) return null;

  const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
  const totalsMarket  = bookmaker.markets.find(m => m.key === 'totals');
  const h2hMarket     = bookmaker.markets.find(m => m.key === 'h2h');

  if (!spreadsMarket || !totalsMarket) return null;

  // Identify which outcome corresponds to team A vs team B
  const spreadA = spreadsMarket.outcomes.find(o =>
    o.name.toLowerCase().includes(teamAName.toLowerCase())
  );
  const spreadB = spreadsMarket.outcomes.find(o =>
    o.name.toLowerCase().includes(teamBName.toLowerCase())
  );
  const mlA = h2hMarket?.outcomes.find(o => o.name.toLowerCase().includes(teamAName.toLowerCase()));
  const mlB = h2hMarket?.outcomes.find(o => o.name.toLowerCase().includes(teamBName.toLowerCase()));
  const overOutcome = totalsMarket.outcomes.find(o => o.name.toLowerCase() === 'over');

  if (!spreadA?.point || !overOutcome?.point) return null;

  const spreadFav = (spreadA.point ?? 0) < 0 ? 'teamA' : 'teamB';

  return {
    spread: spreadA.point ?? 0,
    spreadFav,
    ml_a: mlA?.price ?? 0,
    ml_b: mlB?.price ?? 0,
    total: overOutcome.point,
    source: bookmaker.title,
    updated: new Date(bookmaker.last_update).toLocaleTimeString('en-US', {
      month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }),
  };
}

// ── Main export: get betting line for a specific matchup ───────
export async function getBettingLine(
  teamAName: string,
  teamBName: string
): Promise<BettingLine | null> {
  if (process.env.DATA_MODE !== 'live') {
    // Return mock line keyed by sorted team IDs
    const key = [teamAName.toLowerCase(), teamBName.toLowerCase()].sort().join('-');
    // Try to find a mock line that contains both team names
    const mockEntry = Object.entries(MOCK_BETTING_LINES).find(([k]) =>
      k.includes(teamAName.toLowerCase().slice(0, 5)) ||
      k.includes(teamBName.toLowerCase().slice(0, 5))
    );
    if (mockEntry) return mockEntry[1];

    // Generate a plausible mock line
    return {
      spread: -3.5,
      spreadFav: 'teamA',
      ml_a: -160,
      ml_b: 134,
      total: 145.5,
      source: 'Mock Data',
      updated: 'Demo mode',
    };
  }

  try {
    const games = await fetchAllOdds();

    // Find the game matching both teams
    const game = games.find(g =>
      (g.home_team.toLowerCase().includes(teamAName.toLowerCase()) ||
       g.away_team.toLowerCase().includes(teamAName.toLowerCase())) &&
      (g.home_team.toLowerCase().includes(teamBName.toLowerCase()) ||
       g.away_team.toLowerCase().includes(teamBName.toLowerCase()))
    );

    if (!game) {
      console.warn(`[OddsAPI] No game found for ${teamAName} vs ${teamBName}`);
      return null;
    }

    return normalizeGame(game, teamAName, teamBName);
  } catch (err) {
    console.error('[OddsAPI] Failed, returning null:', err);
    return null;
  }
}

// ── Get all available NCAAB lines (for Best Edges page) ────────
export async function getAllBettingLines(): Promise<Map<string, BettingLine>> {
  const map = new Map<string, BettingLine>();

  if (process.env.DATA_MODE !== 'live') {
    Object.entries(MOCK_BETTING_LINES).forEach(([k, v]) => map.set(k, v));
    return map;
  }

  try {
    const games = await fetchAllOdds();
    for (const game of games) {
      const line = normalizeGame(game, game.home_team, game.away_team);
      if (line) {
        const key = [game.home_team, game.away_team]
          .map(n => n.toLowerCase().replace(/\s+/g, '').slice(0, 8))
          .sort().join('-');
        map.set(key, line);
      }
    }
  } catch (err) {
    console.error('[OddsAPI] getAllBettingLines failed:', err);
    Object.entries(MOCK_BETTING_LINES).forEach(([k, v]) => map.set(k, v));
  }

  return map;
}
