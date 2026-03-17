// src/lib/model/prediction.ts
// ─────────────────────────────────────────────────────────────
//  Prediction Engine — rules-based statistical model
//  All pure functions, fully unit-testable.
//
//  Phase 4 upgrade adds:
//  - buildSpreadAnalysis: deep ATS breakdown with line movement,
//    ATS record, seed history, and matchup-specific angles
//  - buildTotalsAnalysis: deep O/U breakdown with pace interaction,
//    defensive quality, 3PT variance, FT volume, and TOV impact
//  - calcOverProb: over probability using logistic approximation
//  - calcPaceAdjustedTotal: possession-weighted total projection
//  - calcSeedEdge: historical seed performance adjustment
// ─────────────────────────────────────────────────────────────

import type { Team, BettingLine, MatchupAnalysis } from '@/types';

// ── Possession model ──────────────────────────────────────────
export function calcPossessions(tA: Team, tB: Team): number {
  return (tA.tempo + tB.tempo) / 2;
}

// ── Points projection ─────────────────────────────────────────
// Blend adjusted offense vs opponent adjusted defense.
// 0.72 scalar converts per-100-poss efficiency to per-game scoring.
export function calcExpectedPts(offEff: number, defEff: number): number {
  return ((offEff + (100 - defEff)) / 2) * 0.72;
}

// ── Pace-adjusted total projection ───────────────────────────
// Scales scoring up/down based on projected possessions vs 69-poss baseline.
export function calcPaceAdjustedTotal(tA: Team, tB: Team): number {
  const basePoss   = 69;
  const projPoss   = calcPossessions(tA, tB);
  const rawA       = calcExpectedPts(tA.offEff, tB.defEff);
  const rawB       = calcExpectedPts(tB.offEff, tA.defEff);
  const paceScalar = projPoss / basePoss;
  return (rawA + rawB) * paceScalar;
}

// ── Spread edge ───────────────────────────────────────────────
export function calcSpreadEdge(tA: Team, tB: Team): number {
  return calcExpectedPts(tA.offEff, tB.defEff) - calcExpectedPts(tB.offEff, tA.defEff);
}

// ── Cover probability ─────────────────────────────────────────
// Logistic approximation of normal CDF. Variance = 10 pts (typical NCAA tournament).
export function calcCoverProb(projMargin: number, marketSpread: number, variance = 10): number {
  const edge = projMargin - marketSpread;
  const z    = edge / variance;
  const prob = 1 / (1 + Math.exp(-1.7 * z));
  return Math.min(0.95, Math.max(0.05, prob));
}

// ── Over probability ──────────────────────────────────────────
export function calcOverProb(projTotal: number, marketTotal: number, variance = 12): number {
  const edge = projTotal - marketTotal;
  const z    = edge / variance;
  const prob = 1 / (1 + Math.exp(-1.7 * z));
  return Math.min(0.95, Math.max(0.05, prob));
}

// ── Seed-based historical adjustment ─────────────────────────
// Better seeds cover more in tournament — ~0.3 pts per seed advantage.
export function calcSeedEdge(tA: Team, tB: Team): number {
  const seedDiff = tB.seed - tA.seed;
  return seedDiff * 0.3;
}

// ── ATS record parser ─────────────────────────────────────────
function parseAts(ats: string): { wins: number; losses: number; pct: number } {
  const parts  = ats.split('-').map(Number);
  const wins   = parts[0] ?? 0;
  const losses = parts[1] ?? 0;
  const total  = wins + losses;
  return { wins, losses, pct: total > 0 ? wins / total : 0.5 };
}

// ── Last 10 wins parser ───────────────────────────────────────
function parseLast10Wins(last10: string): number {
  return parseInt(last10.split('-')[0]) ?? 5;
}

// ── Confidence scoring ────────────────────────────────────────
export function calcConfidence(tA: Team, tB: Team, spreadEdge: number): number {
  let conf = 5.0;

  // Edge magnitude
  const absEdge = Math.abs(spreadEdge);
  if (absEdge > 8)      conf += 2.0;
  else if (absEdge > 6) conf += 1.5;
  else if (absEdge > 4) conf += 1.0;
  else if (absEdge > 2) conf += 0.5;

  // 3-point reliance penalty
  const avgThree = (tA.threePct + tB.threePct) / 2;
  if (avgThree > 38)      conf -= 1.2;
  else if (avgThree > 36) conf -= 0.8;

  // Recent form
  const winsA = parseLast10Wins(tA.last10);
  const winsB = parseLast10Wins(tB.last10);
  if (winsA >= 9) conf += 0.6;
  if (winsB >= 9) conf -= 0.4;
  if (winsA <= 4) conf -= 0.5;
  if (winsB <= 4) conf += 0.3;

  // ATS consistency
  const atsA = parseAts(tA.ats);
  const atsB = parseAts(tB.ats);
  if (atsA.pct > 0.58) conf += 0.5;
  if (atsB.pct > 0.58) conf -= 0.3;

  // Rebounding edge
  const orbDiff = Math.abs(tA.orbPct - tB.orbPct);
  if (orbDiff > 6)      conf += 0.6;
  else if (orbDiff > 4) conf += 0.4;

  // Turnover edge
  const tovDiff = Math.abs(tA.tovPct - tB.tovPct);
  if (tovDiff > 3)      conf += 0.5;
  else if (tovDiff > 2) conf += 0.3;

  // SOS gap
  if (Math.abs(tA.sos - tB.sos) > 8) conf += 0.4;

  // Efficiency gap
  const offMatchupEdge = Math.abs((tA.offEff - tB.defEff) - (tB.offEff - tA.defEff));
  if (offMatchupEdge > 15) conf += 0.5;

  // Seed gap (blowout potential)
  const seedDiff = Math.abs(tA.seed - tB.seed);
  if (seedDiff >= 8)      conf += 0.4;
  else if (seedDiff >= 5) conf += 0.2;

  // Pace mismatch penalty
  if (Math.abs(tA.tempo - tB.tempo) > 8) conf -= 0.3;

  return Math.round(Math.min(9.8, Math.max(3.0, conf)) * 10) / 10;
}

// ── Volatility profile ────────────────────────────────────────
export function calcVolatility(tA: Team, tB: Team): 'HIGH' | 'MODERATE' | 'LOW' {
  const avgThree = (tA.threePct + tB.threePct) / 2;
  const avgTempo = (tA.tempo + tB.tempo) / 2;
  const avgTov   = (tA.tovPct + tB.tovPct) / 2;
  const paceDiff = Math.abs(tA.tempo - tB.tempo);

  let score = 0;
  if (avgThree > 37)  score += 2;
  else if (avgThree > 35) score += 1;
  if (avgTempo > 72)  score += 1;
  if (avgTov > 16)    score += 1;
  if (paceDiff > 6)   score += 1;
  if (avgTempo < 66)  score -= 2;
  if (avgTov < 14)    score -= 1;

  if (score >= 3)  return 'HIGH';
  if (score <= -1) return 'LOW';
  return 'MODERATE';
}

// ── Deep Spread Analysis ──────────────────────────────────────
export function buildSpreadAnalysis(
  tA: Team,
  tB: Team,
  projMargin: number,
  marketSpread: number,
  lines: BettingLine
): string[] {
  const points: string[]  = [];
  const spreadEdge        = projMargin - marketSpread;
  const favTeam           = projMargin > 0 ? tA : tB;
  const dogTeam           = projMargin > 0 ? tB : tA;

  // Core efficiency matchup
  const offVsDef_A = tA.offEff - tB.defEff;
  const offVsDef_B = tB.offEff - tA.defEff;
  if (Math.abs(offVsDef_A - offVsDef_B) > 8) {
    points.push(
      `${favTeam.name}'s offense (${favTeam.offEff.toFixed(1)} AdjOE) faces a defense allowing ` +
      `${dogTeam.defEff.toFixed(1)} pts/100 — a raw matchup edge of +${Math.abs(offVsDef_A - offVsDef_B).toFixed(1)} pts/100 possessions`
    );
  }

  // ATS record lean
  const atsA = parseAts(tA.ats);
  const atsB = parseAts(tB.ats);
  if (atsA.pct > 0.56) {
    points.push(
      `${tA.name} is covering at a ${(atsA.pct * 100).toFixed(0)}% clip this season (${tA.ats} ATS) — ` +
      `market has consistently undervalued them`
    );
  } else if (atsB.pct > 0.56) {
    points.push(
      `${tB.name} covers at a ${(atsB.pct * 100).toFixed(0)}% rate (${tB.ats} ATS) — ` +
      `fading them against the spread has been costly this year`
    );
  }

  // Line movement
  if (lines.openSpread !== undefined && Math.abs(lines.spread - lines.openSpread) >= 1.5) {
    const moved  = Math.abs(lines.spread - lines.openSpread).toFixed(1);
    const dir    = lines.spread < lines.openSpread ? 'shortened' : 'lengthened';
    const mover  = lines.spreadFav === tA.id ? tA.name : tB.name;
    points.push(
      `Line has ${dir} ${moved} pts since open — sharp money has moved toward ${mover}, ` +
      `suggesting professional bettors agree with the favorite`
    );
  } else if (lines.openSpread !== undefined) {
    points.push(
      `Spread has been stable (opened ${lines.openSpread > 0 ? '+' : ''}${lines.openSpread}, ` +
      `now ${lines.spread > 0 ? '+' : ''}${lines.spread}) — no significant sharp action detected`
    );
  }

  // Turnover edge
  const tovDiff = tA.tovPct - tB.tovPct;
  if (Math.abs(tovDiff) > 2.5) {
    const better = tovDiff < 0 ? tA : tB;
    const worse  = tovDiff < 0 ? tB : tA;
    points.push(
      `${better.name} turns it over on ${Math.min(tA.tovPct, tB.tovPct).toFixed(1)}% of possessions vs ` +
      `${worse.name}'s ${Math.max(tA.tovPct, tB.tovPct).toFixed(1)}% — that ${Math.abs(tovDiff).toFixed(1)}% gap ` +
      `translates to ~${(Math.abs(tovDiff) * 0.8).toFixed(1)} extra scoring chances per game`
    );
  }

  // Rebounding battle
  const orbDiff = tA.orbPct - tB.orbPct;
  if (Math.abs(orbDiff) > 4) {
    const better = orbDiff > 0 ? tA : tB;
    points.push(
      `${better.name} dominates the offensive glass (+${Math.abs(orbDiff).toFixed(1)}% ORB rate) — ` +
      `second-chance points are a consistent source of cover probability`
    );
  }

  // Seed history
  const seedDiff = Math.abs(tA.seed - tB.seed);
  if (seedDiff >= 5) {
    const betterSeed = tA.seed < tB.seed ? tA : tB;
    points.push(
      `${seedDiff}-seed gap — historically ${betterSeed.name} as the #${betterSeed.seed} seed covers at ` +
      `roughly ${seedDiff >= 8 ? '62' : '57'}% against this seed differential in tournament play`
    );
  }

  // Model vs market verdict
  if (Math.abs(spreadEdge) > 3) {
    points.push(
      `Model projects a ${Math.abs(projMargin).toFixed(1)}-pt margin vs the market spread of ` +
      `${marketSpread > 0 ? '+' : ''}${marketSpread} — a ${Math.abs(spreadEdge).toFixed(1)}-pt edge ` +
      `in favor of ${favTeam.name} covering`
    );
  } else {
    points.push(
      `Model projects a ${Math.abs(projMargin).toFixed(1)}-pt margin, within ${Math.abs(spreadEdge).toFixed(1)} pt ` +
      `of the market spread — market is fairly priced; tread carefully`
    );
  }

  return points.slice(0, 6);
}

// ── Deep Totals Analysis ──────────────────────────────────────
export function buildTotalsAnalysis(
  tA: Team,
  tB: Team,
  projTotal: number,
  lines: BettingLine
): string[] {
  const points: string[] = [];
  const totalEdge        = projTotal - lines.total;
  const projPoss         = calcPossessions(tA, tB);
  const projA            = calcExpectedPts(tA.offEff, tB.defEff);
  const projB            = calcExpectedPts(tB.offEff, tA.defEff);

  // 1. Pace interaction
  const paceLabel  = projPoss > 72 ? 'above-average' : projPoss < 67 ? 'below-average' : 'average';
  const paceImpact = projPoss > 72
    ? `adding ~${((projPoss - 69) * 1.8).toFixed(1)} pts vs a neutral-pace game`
    : projPoss < 67
    ? `suppressing ~${((69 - projPoss) * 1.8).toFixed(1)} pts vs a neutral-pace game`
    : 'neutral effect on total scoring';
  points.push(
    `Projected ${projPoss.toFixed(0)} possessions/game — ${paceLabel} pace ` +
    `(${tA.name}: ${tA.tempo.toFixed(1)}, ${tB.name}: ${tB.tempo.toFixed(1)} poss/40min), ${paceImpact}`
  );

  // 2. Scoring breakdown
  points.push(
    `Scoring model: ${tA.name} projects ${projA.toFixed(1)} pts, ${tB.name} projects ${projB.toFixed(1)} pts ` +
    `→ combined ${projTotal.toFixed(1)} vs O/U of ${lines.total} ` +
    `(${totalEdge > 0 ? '+' : ''}${totalEdge.toFixed(1)} pt ${totalEdge > 0 ? 'over' : 'under'} lean)`
  );

  // 3. Defensive quality
  const avgDefEff = (tA.defEff + tB.defEff) / 2;
  if (avgDefEff < 93) {
    points.push(
      `Elite defensive matchup — both teams rank in the top tier nationally ` +
      `(avg AdjDE: ${avgDefEff.toFixed(1)}). Expect below-average scoring; lean under`
    );
  } else if (avgDefEff > 99) {
    points.push(
      `Neither team fields an elite defense (avg AdjDE: ${avgDefEff.toFixed(1)}) — ` +
      `scoring environment is favorable; lean over`
    );
  } else {
    points.push(
      `Average defensive quality on both sides (avg AdjDE: ${avgDefEff.toFixed(1)}) — ` +
      `defense is not a decisive over/under factor in this matchup`
    );
  }

  // 4. 3-point variance
  const avgThree = (tA.threePct + tB.threePct) / 2;
  const threeNote = avgThree > 37
    ? `both shoot heavy 3s (avg ${avgThree.toFixed(1)}%) — a cold night can suppress total by 8-12 pts; a hot one inflates similarly`
    : avgThree < 33
    ? `neither team is arc-dependent (avg ${avgThree.toFixed(1)}%) — scoring comes from interior and FTs, reducing variance`
    : `moderate 3PT reliance (avg ${avgThree.toFixed(1)}%) — typical variance profile`;
  points.push(`3PT profile: ${threeNote}`);

  // 5. Free throw volume
  const avgFtr = (tA.ftr + tB.ftr) / 2;
  if (avgFtr > 42) {
    points.push(
      `High combined free throw rate (avg ${avgFtr.toFixed(1)} FTr) — foul-heavy games add ` +
      `4-7 pts of clock-stopping scoring that markets sometimes undercount; slight over lean`
    );
  } else if (avgFtr < 35) {
    points.push(
      `Low free throw rate (avg ${avgFtr.toFixed(1)} FTr) — limited trips to the line reduces ` +
      `automatic scoring; slight under lean`
    );
  }

  // 6. Turnover-driven suppression
  const avgTov = (tA.tovPct + tB.tovPct) / 2;
  if (avgTov > 16.5) {
    points.push(
      `High combined turnover rate (avg ${avgTov.toFixed(1)}%) — wasted possessions reduce total ` +
      `scoring by an estimated ${((avgTov - 14) * 0.6).toFixed(1)} pts; under lean`
    );
  } else if (avgTov < 13.5) {
    points.push(
      `Low combined turnover rate (avg ${avgTov.toFixed(1)}%) — clean possessions mean more ` +
      `scoring opportunities per game; slight over lean`
    );
  }

  // 7. Line movement
  if (lines.openTotal !== undefined && Math.abs(lines.total - lines.openTotal) >= 2) {
    const moved = Math.abs(lines.total - lines.openTotal).toFixed(1);
    const dir   = lines.total > lines.openTotal ? 'risen' : 'dropped';
    const fade  = lines.total > lines.openTotal ? 'under' : 'over';
    points.push(
      `Total has ${dir} ${moved} pts since open (${lines.openTotal} → ${lines.total}) — ` +
      `public money driving movement; consider fading to the ${fade}`
    );
  } else if (lines.openTotal !== undefined) {
    points.push(
      `Total stable since open (${lines.openTotal} → ${lines.total}) — ` +
      `no sharp movement; model projection is the primary signal`
    );
  }

  // 8. Final verdict
  if (Math.abs(totalEdge) > 4) {
    const side = totalEdge > 0 ? 'OVER' : 'UNDER';
    points.push(
      `Strong model edge: ${Math.abs(totalEdge).toFixed(1)} pts ${totalEdge > 0 ? 'above' : 'below'} the line — ` +
      `model strongly favors the ${side} ${lines.total}`
    );
  } else if (Math.abs(totalEdge) > 2) {
    const side = totalEdge > 0 ? 'over' : 'under';
    points.push(
      `Moderate ${Math.abs(totalEdge).toFixed(1)}-pt edge — lean toward the ${side} ${lines.total}, ` +
      `but not a high-conviction play`
    );
  } else {
    points.push(
      `Model within ${Math.abs(totalEdge).toFixed(1)} pts of the line — no strong lean. ` +
      `Monitor for late line movement before committing`
    );
  }

  return points.slice(0, 7);
}

// ── Short reasons (main AI panel) ────────────────────────────
export function buildReasons(tA: Team, tB: Team, projMargin: number, spreadEdge: number): string[] {
  const reasons: string[] = [];
  const favTeam           = projMargin > 0 ? tA : tB;
  const dogTeam           = projMargin > 0 ? tB : tA;

  const effEdge = Math.abs((tA.offEff - tB.defEff) - (tB.offEff - tA.defEff));
  if (effEdge > 8) {
    reasons.push(
      `${favTeam.name} has a ${effEdge.toFixed(1)}-pt/100 raw efficiency edge — ` +
      `their offense vs ${dogTeam.name}'s defense is a significant mismatch`
    );
  }

  if (Math.abs(tA.tovPct - tB.tovPct) > 2) {
    const better = tA.tovPct < tB.tovPct ? tA : tB;
    reasons.push(
      `${better.name} forces extra possessions via turnover discipline ` +
      `(+${Math.abs(tA.tovPct - tB.tovPct).toFixed(1)}% TOV rate edge)`
    );
  }

  if (Math.abs(tA.tempo - tB.tempo) > 5) {
    const faster = tA.tempo > tB.tempo ? tA : tB;
    reasons.push(
      `Pace mismatch of ${Math.abs(tA.tempo - tB.tempo).toFixed(1)} poss/40min — ` +
      `${faster.name}'s up-tempo style should dictate flow`
    );
  }

  if (Math.abs(tA.orbPct - tB.orbPct) > 4) {
    const better = tA.orbPct > tB.orbPct ? tA : tB;
    reasons.push(
      `${better.name} holds a +${Math.abs(tA.orbPct - tB.orbPct).toFixed(1)}% ORB edge — ` +
      `second-chance points are a repeatable advantage`
    );
  }

  if (Math.abs(tA.sos - tB.sos) > 4) {
    const harder = tA.sos < tB.sos ? tA : tB;
    reasons.push(
      `${harder.name}'s tougher schedule (SOS ${Math.min(tA.sos, tB.sos).toFixed(1)} vs ` +
      `${Math.max(tA.sos, tB.sos).toFixed(1)}) suggests more battle-tested performance`
    );
  }

  if (reasons.length < 3) {
    reasons.push(
      `Model projects a ${Math.abs(projMargin).toFixed(1)}-pt margin — ` +
      `${Math.abs(spreadEdge) > 2
        ? `a ${Math.abs(spreadEdge).toFixed(1)}-pt market discrepancy`
        : 'closely aligned with market spread'}`
    );
  }

  return reasons.slice(0, 5);
}

// ── Risk generation ───────────────────────────────────────────
export function buildRisks(tA: Team, tB: Team, poss: number, spreadEdge: number): string[] {
  const risks: string[] = [];

  const maxThree = Math.max(tA.threePct, tB.threePct);
  if (maxThree > 37) {
    const shooter = tA.threePct > tB.threePct ? tA : tB;
    risks.push(
      `${shooter.name} shoots ${maxThree.toFixed(1)}% from three on high volume — ` +
      `a hot or cold night can swing the final margin 10+ pts`
    );
  }

  if (Math.abs(tA.tempo - tB.tempo) > 7) {
    const faster = tA.tempo > tB.tempo ? tA : tB;
    const slower = tA.tempo > tB.tempo ? tB : tA;
    risks.push(
      `${faster.name} plays at ${faster.tempo.toFixed(1)} poss/40 vs ${slower.name}'s ${slower.tempo.toFixed(1)} — ` +
      `whoever controls pace will have a significant advantage not fully priced in`
    );
  }

  if (Math.abs(spreadEdge) < 2) {
    risks.push(
      `Model and market agree within ${Math.abs(spreadEdge).toFixed(1)} pts — ` +
      `thin edge is highly sensitive to last-minute lineup or injury news`
    );
  }

  if (poss < 65) {
    risks.push(
      `Slow projected pace (${poss.toFixed(0)} poss) — each possession carries more weight, ` +
      `amplifying outcome variance`
    );
  }

  if (Math.abs(tA.ftPct - tB.ftPct) < 3 && Math.abs(tA.ftr - tB.ftr) < 4) {
    risks.push(
      `Nearly identical free throw profiles — late-game FT shooting will be the tiebreaker, ` +
      `introducing high coin-flip variance`
    );
  }

  const underdog = tA.seed > tB.seed ? tA : tB;
  if (underdog.sos > 20 && Math.abs(tA.seed - tB.seed) >= 4) {
    risks.push(
      `${underdog.name} comes from a weaker schedule (SOS rank ${underdog.sos.toFixed(0)}) — ` +
      `tournament environment is a significant step up in competition`
    );
  }

  risks.push(
    `Injury and lineup changes are not reflected in season-long metrics — ` +
    `always verify game-day status reports before placing bets`
  );

  return risks.slice(0, 4);
}

// ── Full matchup analysis ─────────────────────────────────────
export function generateAnalysis(tA: Team, tB: Team, lines: BettingLine): MatchupAnalysis {
  const poss           = calcPossessions(tA, tB);
  const projA          = calcExpectedPts(tA.offEff, tB.defEff);
  const projB          = calcExpectedPts(tB.offEff, tA.defEff);
  const projTotal      = calcPaceAdjustedTotal(tA, tB);
  const seedEdge       = calcSeedEdge(tA, tB);

  // marketSpread from Team A's perspective: negative = tA favored
  const marketSpread   = lines.spreadFav === tA.id ? lines.spread : -lines.spread;

  // Apply seed adjustment to margin
  const rawMargin      = projA - projB;
  const adjustedMargin = rawMargin + seedEdge;

  const spreadEdge     = adjustedMargin - marketSpread;
  const totalEdge      = projTotal - lines.total;
  const coverProb      = calcCoverProb(adjustedMargin, marketSpread);
  const overProb       = calcOverProb(projTotal, lines.total);
  const confidence     = calcConfidence(tA, tB, spreadEdge);
  const volatility     = calcVolatility(tA, tB);

  const pickCover = adjustedMargin > 0
    ? `${tA.name} ${marketSpread > 0 ? '+' : ''}${marketSpread}`
    : `${tB.name} ${Math.abs(marketSpread) > 0 ? '+' : ''}${Math.abs(marketSpread).toFixed(1)}`;

  const overPct = Math.round(overProb * 100);
  const ouLean  = totalEdge > 2.5
    ? `Over ${lines.total} (${overPct}% probability)`
    : totalEdge < -2.5
    ? `Under ${lines.total} (${100 - overPct}% probability)`
    : `Too close to call — ${lines.total} (model within 2.5 pts)`;

  const reasons       = buildReasons(tA, tB, adjustedMargin, spreadEdge);
  const risks         = buildRisks(tA, tB, poss, spreadEdge);
  const spreadReasons = buildSpreadAnalysis(tA, tB, adjustedMargin, marketSpread, lines);
  const totalsReasons = buildTotalsAnalysis(tA, tB, projTotal, lines);

  return {
    tA, tB, lines,
    projA, projB,
    projMargin: adjustedMargin,
    projTotal,
    poss,
    marketSpread,
    spreadEdge,
    totalEdge,
    coverProb,
    overProb,
    confidence,
    pickCover,
    ouLean,
    reasons,
    risks,
    spreadReasons,
    totalsReasons,
    volatility,
  };
}
