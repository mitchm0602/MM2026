// src/lib/model/prediction.ts
// ─────────────────────────────────────────────────────────────
//  Prediction Engine — rules-based statistical model
//  All pure functions, fully unit-testable.
// ─────────────────────────────────────────────────────────────

import type { Team, BettingLine, MatchupAnalysis } from '@/types';

// ── Possession model ──────────────────────────────────────────
export function calcPossessions(tA: Team, tB: Team): number {
  return (tA.tempo + tB.tempo) / 2;
}

// ── Points projection ─────────────────────────────────────────
// Blend a team's adjusted offense against the opponent's adjusted defense.
// The 0.72 scalar converts per-100-possession efficiency to per-game scoring.
export function calcExpectedPts(offEff: number, defEff: number): number {
  return ((offEff + (100 - defEff)) / 2) * 0.72;
}

// ── Spread edge ───────────────────────────────────────────────
export function calcSpreadEdge(tA: Team, tB: Team): number {
  return calcExpectedPts(tA.offEff, tB.defEff) - calcExpectedPts(tB.offEff, tA.defEff);
}

// ── Cover probability (normal distribution approximation) ─────
export function calcCoverProb(projMargin: number, marketSpread: number, variance = 8): number {
  const edge = projMargin - marketSpread;
  const z = edge / variance;
  return Math.min(0.95, Math.max(0.05, 0.5 + z * 0.15));
}

// ── Confidence scoring ────────────────────────────────────────
export function calcConfidence(tA: Team, tB: Team, spreadEdge: number): number {
  let conf = 5.0;

  // Edge magnitude
  const absEdge = Math.abs(spreadEdge);
  if (absEdge > 6) conf += 1.5;
  else if (absEdge > 3) conf += 0.8;

  // 3-point variance penalty
  if (tA.threePct > 37 || tB.threePct > 37) conf -= 0.8;

  // Recent form bonus
  const parseW = (s: string) => parseInt(s.split('-')[0]);
  if (parseW(tA.last10) >= 9) conf += 0.5;
  if (parseW(tB.last10) >= 9) conf -= 0.3;

  // Rebounding edge bonus
  if (Math.abs(tA.orbPct - tB.orbPct) > 4) conf += 0.4;

  // Turnover edge bonus
  if (Math.abs(tA.tovPct - tB.tovPct) > 2) conf += 0.3;

  // SOS edge (more reliable data from harder schedules)
  if (Math.abs(tA.sos - tB.sos) > 5) conf += 0.3;

  // Clamp to [3.0, 9.8]
  return Math.round(Math.min(9.8, Math.max(3.0, conf)) * 10) / 10;
}

// ── Volatility profile ────────────────────────────────────────
export function calcVolatility(tA: Team, tB: Team): 'HIGH' | 'MODERATE' | 'LOW' {
  const avgThree = (tA.threePct + tB.threePct) / 2;
  const avgTempo = (tA.tempo + tB.tempo) / 2;
  if (avgThree > 36 && avgTempo > 71) return 'HIGH';
  if (avgTempo < 67) return 'LOW';
  return 'MODERATE';
}

// ── Reason generation ─────────────────────────────────────────
export function buildReasons(tA: Team, tB: Team, projMargin: number, spreadEdge: number): string[] {
  const reasons: string[] = [];

  if (Math.abs(tA.offEff - tB.offEff) > 8) {
    const better = tA.offEff > tB.offEff ? tA : tB;
    const worse  = tA.offEff > tB.offEff ? tB : tA;
    reasons.push(`${better.name} has a ${Math.abs(tA.offEff - tB.offEff).toFixed(1)}-pt/100 offensive efficiency advantage over ${worse.name}'s defense`);
  }

  if (Math.abs(tA.tovPct - tB.tovPct) > 2) {
    const better = tA.tovPct < tB.tovPct ? tA : tB;
    reasons.push(`${better.name} forces extra possessions via turnover rate edge (+${Math.abs(tA.tovPct - tB.tovPct).toFixed(1)}%)`);
  }

  if (Math.abs(tA.tempo - tB.tempo) > 5) {
    const faster = tA.tempo > tB.tempo ? tA : tB;
    reasons.push(`Pace mismatch of ${Math.abs(tA.tempo - tB.tempo).toFixed(1)} poss/40min favors ${faster.name}'s preferred style`);
  }

  if (Math.abs(tA.orbPct - tB.orbPct) > 4) {
    const better = tA.orbPct > tB.orbPct ? tA : tB;
    reasons.push(`${better.name} holds a +${Math.abs(tA.orbPct - tB.orbPct).toFixed(1)}% offensive rebounding edge — critical for second-chance scoring`);
  }

  if (Math.abs(tA.sos - tB.sos) > 3) {
    const harder = tA.sos > tB.sos ? tA : tB;
    reasons.push(`${harder.name}'s stronger schedule (SOS ${Math.max(tA.sos, tB.sos).toFixed(1)} vs ${Math.min(tA.sos, tB.sos).toFixed(1)}) indicates more battle-tested performance`);
  }

  if (reasons.length < 3) {
    reasons.push(
      `Model projects a ${Math.abs(projMargin).toFixed(1)}-pt margin vs the market spread — ${Math.abs(spreadEdge) > 2 ? 'a meaningful discrepancy' : 'values are close, lower confidence'}`
    );
  }

  return reasons.slice(0, 5);
}

// ── Risk generation ───────────────────────────────────────────
export function buildRisks(tA: Team, tB: Team, poss: number, spreadEdge: number): string[] {
  const risks: string[] = [];

  if (tA.threePct > 36 || tB.threePct > 36) {
    const shooter = tA.threePct > 36 ? tA : tB;
    risks.push(`${shooter.name} relies heavily on 3-point shooting (${Math.max(tA.threePct, tB.threePct).toFixed(1)}%) — high variance, games can swing 10+ points`);
  }

  if (Math.abs(tA.ftPct - tB.ftPct) < 3) {
    risks.push('Free throw rates are nearly identical — late-game FT execution will be decisive');
  }

  if (poss < 65) {
    risks.push(`Slow projected pace (${poss.toFixed(0)} poss) amplifies variance — fewer possessions mean larger per-possession swings`);
  }

  if (Math.abs(spreadEdge) < 2) {
    risks.push('Model and market are within 2 points — thin edge, increased sensitivity to lineup changes');
  }

  risks.push('Injury/lineup news not reflected in season-long metrics — verify game-day status reports before betting');

  return risks.slice(0, 4);
}

// ── Full matchup analysis ─────────────────────────────────────
export function generateAnalysis(tA: Team, tB: Team, lines: BettingLine): MatchupAnalysis {
  const poss        = calcPossessions(tA, tB);
  const projA       = calcExpectedPts(tA.offEff, tB.defEff);
  const projB       = calcExpectedPts(tB.offEff, tA.defEff);
  const projMargin  = projA - projB;
  const projTotal   = projA + projB;

  // Market spread from team A's perspective (positive = tA is underdog)
  const marketSpread = lines.spreadFav === tA.id ? lines.spread : -lines.spread;

  const spreadEdge  = projMargin - marketSpread;
  const totalEdge   = projTotal - lines.total;
  const coverProb   = calcCoverProb(projMargin, marketSpread);
  const confidence  = calcConfidence(tA, tB, spreadEdge);
  const volatility  = calcVolatility(tA, tB);

  const pickCover = projMargin > 0
    ? `${tA.name} ${marketSpread > 0 ? '+' : ''}${marketSpread}`
    : `${tB.name} ${(-marketSpread) > 0 ? '+' : ''}${(-marketSpread).toFixed(1)}`;

  const ouLean = totalEdge > 1.5
    ? `Over ${lines.total}`
    : totalEdge < -1.5
    ? `Under ${lines.total}`
    : `Too close to call (${lines.total})`;

  const reasons = buildReasons(tA, tB, projMargin, spreadEdge);
  const risks   = buildRisks(tA, tB, poss, spreadEdge);

  return {
    tA, tB, lines,
    projA, projB, projMargin, projTotal, poss, marketSpread,
    spreadEdge, totalEdge, coverProb, confidence,
    pickCover, ouLean, reasons, risks, volatility,
  };
}
