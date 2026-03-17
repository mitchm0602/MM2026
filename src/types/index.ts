// src/types/index.ts

export interface Team {
  id: string;
  name: string;
  shortName: string;
  seed: number;
  region: 'East' | 'West' | 'South' | 'Midwest';
  conf: string;
  color: string;
  emoji: string;
  // Record
  record: string;
  ats: string;
  // Efficiency (KenPom-style)
  offEff: number;   // Adjusted offensive efficiency (pts per 100 poss)
  defEff: number;   // Adjusted defensive efficiency (pts allowed per 100 poss)
  tempo: number;    // Adjusted tempo (possessions per 40 min)
  sos: number;      // Strength of schedule rank
  // Scoring
  ppg: number;
  oppg: number;
  // Four Factors
  efgPct: number;   // Effective FG%
  tovPct: number;   // Turnover %
  orbPct: number;   // Offensive rebound %
  ftr: number;      // Free throw rate
  // Shooting
  threePct: number;
  ftPct: number;
  // Form
  last10: string;
  neutralRec: string;
  // Data source metadata
  dataSource?: 'kenpom' | 'espn' | 'sportradar' | 'mock';
  lastUpdated?: string;
}

export interface BettingLine {
  spread: number;
  spreadFav: string;   // team id
  ml_a: number;        // moneyline for team A (American odds)
  ml_b: number;        // moneyline for team B
  total: number;       // over/under
  source: string;      // sportsbook name
  updated: string;     // human-readable timestamp
  // Optional line movement
  openSpread?: number;
  openTotal?: number;
}

export interface MatchupAnalysis {
  tA: Team;
  tB: Team;
  lines: BettingLine;
  // Projections
  projA: number;
  projB: number;
  projMargin: number;
  projTotal: number;
  poss: number;
  marketSpread: number;
  // Edges
  spreadEdge: number;
  totalEdge: number;
  coverProb: number;
  // Output
  confidence: number;
  pickCover: string;
  ouLean: string;
  reasons: string[];
  risks: string[];
  volatility: 'HIGH' | 'MODERATE' | 'LOW';
  // Optional AI narrative
  aiNarrative?: string;
}

export interface HistoryEntry {
  id: number;
  teamA: string;
  teamB: string;
  pick: string;
  confidence: number;
  date: string;
  score?: string;
}

export interface AppSettings {
  kenpomEmail: string;
  kenpomPassword: string;
  oddsApiKey: string;
  formWeight: number;
  matchupWeight: number;
  sosWeight: number;
  recentWeight: number;
  showAINarrative: boolean;
  cacheEnabled: boolean;
  defaultBook: string;
  oddsFormat: 'american' | 'decimal' | 'fractional';
  dataMode: 'mock' | 'live';
  apiHealth: {
    kenpom: 'live' | 'demo' | 'error';
    espn: 'live' | 'demo' | 'error';
    betting: 'live' | 'demo' | 'error';
  };
}
