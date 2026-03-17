// src/app/api/odds/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Server-side in-memory cache — survives between requests within the same
// serverless instance, giving us free 5-minute caching without Redis.
let cache: { data: OddsGame[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}
interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
  last_update: string;
}
interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}
interface OddsGame {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsBookmaker[];
}

async function fetchFromOddsAPI(): Promise<OddsGame[]> {
  const apiKey  = process.env.ODDS_API_KEY;
  const sport   = process.env.ODDS_API_SPORT  ?? 'basketball_ncaab';
  const book    = process.env.ODDS_API_BOOK   ?? 'draftkings';

  if (!apiKey) throw new Error('ODDS_API_KEY not set');

  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds`);
  url.searchParams.set('apiKey',      apiKey);
  url.searchParams.set('regions',     'us');
  url.searchParams.set('markets',     'spreads,totals,h2h');
  url.searchParams.set('oddsFormat',  'american');
  url.searchParams.set('bookmakers',  book);

  const res = await fetch(url.toString(), { cache: 'no-store' });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Odds API ${res.status}: ${body}`);
  }

  const remaining = res.headers.get('x-requests-remaining');
  const used      = res.headers.get('x-requests-used');
  console.log(`[OddsAPI] Requests used: ${used} | Remaining: ${remaining}`);

  return res.json();
}

function normalizeLine(game: OddsGame, teamAName: string, teamBName: string, bookKey: string) {
  const bookmaker = game.bookmakers.find(b => b.key === bookKey)
    ?? game.bookmakers[0];
  if (!bookmaker) return null;

  const spreads = bookmaker.markets.find(m => m.key === 'spreads');
  const totals  = bookmaker.markets.find(m => m.key === 'totals');
  const h2h     = bookmaker.markets.find(m => m.key === 'h2h');

  if (!spreads || !totals) return null;

  const matchName = (name: string, query: string) =>
    name.toLowerCase().includes(query.toLowerCase().split(' ')[0]);

  const spreadA  = spreads.outcomes.find(o => matchName(o.name, teamAName));
  const spreadB  = spreads.outcomes.find(o => matchName(o.name, teamBName));
  const mlA      = h2h?.outcomes.find(o => matchName(o.name, teamAName));
  const mlB      = h2h?.outcomes.find(o => matchName(o.name, teamBName));
  const overLine = totals.outcomes.find(o => o.name.toLowerCase() === 'over');

  if (!spreadA?.point || !overLine?.point) return null;

  const spreadFav = (spreadA.point ?? 0) < 0 ? 'teamA' : 'teamB';

  return {
    spread:     spreadA.point ?? 0,
    spreadFav,
    ml_a:       mlA?.price  ?? 0,
    ml_b:       mlB?.price  ?? 0,
    total:      overLine.point,
    source:     bookmaker.title,
    updated:    new Date(bookmaker.last_update).toLocaleString('en-US', {
                  month: 'numeric', day: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                }),
    fetchedAt:  Date.now(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const teamA   = searchParams.get('teamA')  ?? '';
  const teamB   = searchParams.get('teamB')  ?? '';
  const getAll  = searchParams.get('all')    === 'true';
  const book    = process.env.ODDS_API_BOOK  ?? 'draftkings';

  // Return cached data if fresh
  const now = Date.now();
  if (cache && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    console.log('[OddsAPI] Serving from cache');
    if (getAll) {
      return NextResponse.json({ games: cache.data, cached: true, fetchedAt: cache.fetchedAt });
    }
    const line = findLine(cache.data, teamA, teamB, book);
    return NextResponse.json({ line, cached: true, fetchedAt: cache.fetchedAt });
  }

  // DATA_MODE=mock → return null so UI falls back to MOCK_BETTING_LINES
  if (process.env.DATA_MODE !== 'live') {
    return NextResponse.json({ line: null, cached: false, mode: 'mock' });
  }

  try {
    console.log('[OddsAPI] Fetching fresh data...');
    const games = await fetchFromOddsAPI();
    cache = { data: games, fetchedAt: Date.now() };

    if (getAll) {
      return NextResponse.json({ games, cached: false, fetchedAt: cache.fetchedAt });
    }

    const line = findLine(games, teamA, teamB, book);
    return NextResponse.json({ line, cached: false, fetchedAt: cache.fetchedAt });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[OddsAPI] Error:', message);
    return NextResponse.json(
      { line: null, error: message, cached: false },
      { status: 200 } // 200 so UI doesn't crash, just shows mock data
    );
  }
}

function findLine(games: OddsGame[], teamA: string, teamB: string, book: string) {
  if (!teamA || !teamB) return null;
  const game = games.find(g =>
    (g.home_team.toLowerCase().includes(teamA.toLowerCase().split(' ')[0]) ||
     g.away_team.toLowerCase().includes(teamA.toLowerCase().split(' ')[0])) &&
    (g.home_team.toLowerCase().includes(teamB.toLowerCase().split(' ')[0]) ||
     g.away_team.toLowerCase().includes(teamB.toLowerCase().split(' ')[0]))
  );
  if (!game) return null;
  return normalizeLine(game, teamA, teamB, book);
}
