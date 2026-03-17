'use client';

// src/components/charts/MatchupCharts.tsx
import { useEffect, useRef } from 'react';
import type { MatchupAnalysis } from '@/types';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Radar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend
);

const TEXT  = '#8b95b0';
const GRID  = 'rgba(255,255,255,0.06)';
const BLUE  = 'rgba(79,126,255,0.75)';
const RED   = 'rgba(255,79,106,0.75)';

export default function MatchupCharts({ analysis }: { analysis: MatchupAnalysis }) {
  const { tA, tB, projA, projB, coverProb } = analysis;

  const norm = (v: number, mn: number, mx: number) => ((v - mn) / (mx - mn)) * 100;
  const probPct = Math.round(coverProb * 100);

  const normal = (x: number, mu: number, sigma: number) =>
    Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)) * 100;

  const pts = Array.from({ length: 21 }, (_, i) => i + Math.round(projA) - 10);

  return (
    <div className="charts-grid">
      {/* Efficiency Bar */}
      <div className="chart-card">
        <div className="section-title">Efficiency Comparison</div>
        <div style={{ position:'relative', height:260 }}>
          <Bar
            data={{
              labels: ['Off Eff', 'Def Eff', 'Tempo', 'FT Rate'],
              datasets: [
                { label: tA.name, data: [tA.offEff, tA.defEff, tA.tempo, tA.ftr], backgroundColor: BLUE, borderRadius: 4 },
                { label: tB.name, data: [tB.offEff, tB.defEff, tB.tempo, tB.ftr], backgroundColor: RED,  borderRadius: 4 },
              ],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: TEXT, boxWidth: 12 } } },
              scales: { x: { ticks: { color: TEXT }, grid: { color: GRID } },
                        y: { ticks: { color: TEXT }, grid: { color: GRID } } },
            }}
          />
        </div>
      </div>

      {/* Radar */}
      <div className="chart-card">
        <div className="section-title">Team Profile Radar</div>
        <div style={{ position:'relative', height:260 }}>
          <Radar
            data={{
              labels: ['Off Eff', 'Def (inv)', 'Tempo', '3PT%', 'FT%', 'ORB%'],
              datasets: [
                {
                  label: tA.name,
                  data: [norm(tA.offEff,95,125), norm(110-tA.defEff,90,115), norm(tA.tempo,60,80),
                         norm(tA.threePct,28,42), norm(tA.ftPct,65,82), norm(tA.orbPct,24,42)],
                  borderColor: '#4f7eff', backgroundColor: 'rgba(79,126,255,0.15)', pointBackgroundColor: '#4f7eff',
                },
                {
                  label: tB.name,
                  data: [norm(tB.offEff,95,125), norm(110-tB.defEff,90,115), norm(tB.tempo,60,80),
                         norm(tB.threePct,28,42), norm(tB.ftPct,65,82), norm(tB.orbPct,24,42)],
                  borderColor: '#ff4f6a', backgroundColor: 'rgba(255,79,106,0.15)', pointBackgroundColor: '#ff4f6a',
                },
              ],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: TEXT, boxWidth: 12 } } },
              scales: { r: { ticks: { color: TEXT, backdropColor: 'transparent' },
                             grid: { color: GRID }, pointLabels: { color: TEXT } } },
            }}
          />
        </div>
      </div>

      {/* Score Distribution */}
      <div className="chart-card">
        <div className="section-title">Score Distribution</div>
        <div style={{ position:'relative', height:260 }}>
          <Line
            data={{
              labels: pts,
              datasets: [
                { label: tA.name, data: pts.map(x => normal(x, projA, 7)),
                  borderColor: '#4f7eff', backgroundColor: 'rgba(79,126,255,0.1)', fill: true, tension: 0.4 },
                { label: tB.name, data: pts.map(x => normal(x, projB, 7)),
                  borderColor: '#ff4f6a', backgroundColor: 'rgba(255,79,106,0.1)', fill: true, tension: 0.4 },
              ],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: TEXT, boxWidth: 12 } } },
              scales: { x: { ticks: { color: TEXT, maxTicksLimit: 8 }, grid: { color: GRID } },
                        y: { ticks: { color: TEXT }, grid: { color: GRID } } },
            }}
          />
        </div>
      </div>

      {/* Cover Probability Donut */}
      <div className="chart-card">
        <div className="section-title">Cover Probability</div>
        <div style={{ position:'relative', height:260 }}>
          <Doughnut
            data={{
              labels: [`${tA.name} covers`, `${tB.name} covers`],
              datasets: [{
                data: [probPct, 100 - probPct],
                backgroundColor: ['rgba(79,126,255,0.85)', 'rgba(255,79,106,0.85)'],
                borderWidth: 0,
              }],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              cutout: '68%',
              plugins: { legend: { position: 'bottom', labels: { color: TEXT, boxWidth: 12, padding: 16 } } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
