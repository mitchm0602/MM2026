'use client';

// src/components/TourneyApp.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Team, BettingLine, MatchupAnalysis, HistoryEntry } from '@/types';
import { generateAnalysis } from '@/lib/model/prediction';
import { MOCK_TEAMS, MOCK_BETTING_LINES } from '@/lib/mock-data';
import MatchupCharts from '@/components/charts/MatchupCharts';

type Page = 'compare' | 'history' | 'edge' | 'settings';
type Tab  = 'stats' | 'charts' | 'ai' | 'edge';

// ─── Team Dropdown ────────────────────────────────────────────
function TeamDropdown({ which, teams, selected, other, onSelect }: {
  which: 'A' | 'B';
  teams: Team[];
  selected: Team | null;
  other: Team | null;
  onSelect: (t: Team) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const inputRef          = useRef<HTMLInputElement>(null);
  const dropRef           = useRef<HTMLDivElement>(null);

  const filtered = teams
    .filter(t => !other || t.id !== other.id)
    .filter(t =>
      query.trim() === '' ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.shortName.toLowerCase().includes(query.toLowerCase()) ||
      t.conf.toLowerCase().includes(query.toLowerCase()) ||
      String(t.seed) === query.trim()
    )
    .sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name))
    .slice(0, 20);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropRef.current  && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (selected) {
    return (
      <div className="team-preview">
        <div className="team-logo-lg" style={{ background: selected.color + '20', color: selected.color }}>
          {selected.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Seed #{selected.seed} · {selected.conf} · {selected.record}
          </div>
        </div>
        <button className="clear-btn" onClick={() => onSelect(null as unknown as Team)}>×</button>
      </div>
    );
  }

  return (
    <div className="search-wrap">
      <input
        ref={inputRef}
        className="search-input"
        placeholder="Search teams..."
        autoComplete="off"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="dropdown" ref={dropRef} style={{ maxHeight: 320 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text3)' }}>
              No teams found for &quot;{query}&quot;
            </div>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              className="dropdown-item"
              onMouseDown={e => {
                e.preventDefault();
                onSelect(t);
                setQuery('');
                setOpen(false);
              }}
            >
              <div style={{ width:28, height:28, borderRadius:6, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:13, background: t.color+'20', color: t.color }}>
                {t.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.conf}</div>
              </div>
              <span className="seed-badge">#{t.seed}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Confidence Ring ──────────────────────────────────────────
function ConfidenceRing({ value }: { value: number }) {
  const circ  = 2 * Math.PI * 28;
  const dash  = (value / 10) * circ;
  const color = value >= 7 ? '#22c97a' : value >= 5 ? '#ffb340' : '#ff4f6a';
  return (
    <div className="confidence-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r="28" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
      </svg>
      <div className="confidence-value" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────
function StatsTab({ tA, tB }: { tA: Team; tB: Team }) {
  const rows: [string, string | number, string | number, 'higher' | 'lower' | null][] = [
    ['Record',          tA.record,        tB.record,        null],
    ['ATS Record',      tA.ats,           tB.ats,           null],
    ['PPG',             tA.ppg,           tB.ppg,           'higher'],
    ['Opp PPG',         tA.oppg,          tB.oppg,          'lower'],
    ['Adj. Off Eff',    tA.offEff,        tB.offEff,        'higher'],
    ['Adj. Def Eff',    tA.defEff,        tB.defEff,        'lower'],
    ['Tempo (poss/40)', tA.tempo,         tB.tempo,         null],
    ['SOS Rank',        tA.sos,           tB.sos,           'higher'],
    ['eFG%',            tA.efgPct + '%',  tB.efgPct + '%',  'higher'],
    ['TOV%',            tA.tovPct + '%',  tB.tovPct + '%',  'lower'],
    ['ORB%',            tA.orbPct + '%',  tB.orbPct + '%',  'higher'],
    ['FT Rate',         tA.ftr,           tB.ftr,           'higher'],
    ['3PT%',            tA.threePct+'%',  tB.threePct+'%',  'higher'],
    ['FT%',             tA.ftPct + '%',   tB.ftPct + '%',   'higher'],
    ['Last 10',         tA.last10,        tB.last10,        null],
    ['Neutral Rec.',    tA.neutralRec,    tB.neutralRec,    null],
  ];

  function cls(va: string | number, vb: string | number, dir: 'higher' | 'lower' | null) {
    if (!dir) return ['edge-neutral', 'edge-neutral'];
    const na = parseFloat(String(va)), nb = parseFloat(String(vb));
    if (isNaN(na) || isNaN(nb) || na === nb) return ['edge-neutral', 'edge-neutral'];
    const aWins = dir === 'higher' ? na > nb : na < nb;
    return [aWins ? 'edge-a' : 'edge-b', aWins ? 'edge-b' : 'edge-a'];
  }

  return (
    <div className="section-card">
      <div className="section-title">Side-by-Side Comparison</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="stat-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th style={{ color: tA.color }}>{tA.name}</th>
              <th style={{ color: tB.color }}>{tB.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, va, vb, dir]) => {
              const [ca, cb] = cls(va, vb, dir);
              return (
                <tr key={label}>
                  <td>{label}</td>
                  <td className={ca}>{va}</td>
                  <td className={cb}>{vb}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AI Analysis Tab ──────────────────────────────────────────
function AITab({ a }: { a: MatchupAnalysis }) {
  const { tA, tB, projA, projB, coverProb, confidence, pickCover, ouLean,
          reasons, risks, spreadEdge, totalEdge, poss, volatility } = a;
  const probPct  = Math.round(coverProb * 100);
  const volColors = { HIGH: 'var(--red)', MODERATE: 'var(--amber)', LOW: 'var(--green)' };
  const volIcons  = { HIGH: '🔥', MODERATE: '⚖️', LOW: '🧊' };

  return (
    <div className="ai-panel">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <span className="ai-badge">AI MODEL</span>
        <span style={{ fontSize:18, fontWeight:600 }}>Betting Analysis</span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
          <ConfidenceRing value={confidence} />
          <div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>Confidence</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--green)' }}>{confidence}/10</div>
          </div>
        </div>
      </div>

      {/* Pick cards */}
      <div className="pick-cards">
        {[
          { label:'Pick to Cover', value: pickCover,  color:'var(--green)' },
          { label:'O/U Lean',      value: ouLean,     color:'var(--amber)' },
          { label:'Model Edge',    value: `${spreadEdge > 0 ? '+' : ''}${spreadEdge.toFixed(1)} pts`,
            color: Math.abs(spreadEdge) > 2 ? 'var(--green)' : 'var(--text2)' },
          { label:'Total Edge',    value: `${totalEdge > 0 ? '+' : ''}${totalEdge.toFixed(1)} pts`,
            color: Math.abs(totalEdge) > 2 ? 'var(--amber)' : 'var(--text2)' },
        ].map(({ label, value, color }) => (
          <div className="pick-card" key={label}>
            <div className="pick-card-label">{label}</div>
            <div className="pick-card-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Score prediction */}
      <div className="score-predict">
        <div style={{ textAlign:'center' }}>
          <div className="score-num" style={{ color:'var(--accent)' }}>{Math.round(projA)}</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{tA.name}</div>
        </div>
        <div style={{ fontSize:20, color:'var(--text3)' }}>—</div>
        <div style={{ textAlign:'center' }}>
          <div className="score-num" style={{ color:'var(--red)' }}>{Math.round(projB)}</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{tB.name}</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
        {[
          { label:'Proj. Total',  value: (projA + projB).toFixed(1), color:'var(--amber)' },
          { label:'Proj. Poss.',  value: poss.toFixed(0),            color:'var(--text)'  },
          { label:'Cover Prob.',  value: `${probPct}%`,              color:'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign:'center', background:'var(--bg3)', borderRadius:'var(--radius)', padding:12 }}>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{label}</div>
            <div style={{ fontSize:18, fontWeight:700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Cover probability bar */}
      <div style={{ margin:'16px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', marginBottom:6 }}>
          <span>{tA.name} {probPct}%</span>
          <span>{tB.name} {100 - probPct}%</span>
        </div>
        <div className="prob-bar">
          <div style={{ width:`${probPct}%`, background:'linear-gradient(90deg, var(--accent), var(--accent2))',
            borderRadius:'6px 0 0 6px', transition:'width 0.8s ease' }} />
          <div style={{ width:`${100-probPct}%`, background:'linear-gradient(90deg, var(--red), #ff8c7a)',
            borderRadius:'0 6px 6px 0', transition:'width 0.8s ease' }} />
        </div>
      </div>

      {/* Reasons */}
      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:10 }}>📌 Key Reasons</div>
        {reasons.map((r, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0',
            borderBottom:'1px solid var(--border)' }}>
            <span style={{ background:'var(--accent)', color:'#fff', fontSize:10, fontWeight:700,
              width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0, marginTop:1 }}>{i + 1}</span>
            <span style={{ fontSize:14, lineHeight:1.5 }}>{r}</span>
          </div>
        ))}
      </div>

      {/* Risks */}
      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:10 }}>⚠️ Risk Factors</div>
        {risks.map((r, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0',
            borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,79,106,0.15)',
              border:'1px solid var(--red)', display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, fontSize:10, color:'var(--red)', fontWeight:700 }}>!</div>
            <span style={{ fontSize:14, lineHeight:1.5 }}>{r}</span>
          </div>
        ))}
      </div>

      {/* Volatility */}
      <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg3)', borderRadius:'var(--radius)',
        borderLeft:'3px solid var(--text3)' }}>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>VOLATILITY PROFILE</div>
        <div style={{ fontSize:13, color: volColors[volatility] }}>
          {volIcons[volatility]} {volatility} VARIANCE —{' '}
          {volatility === 'HIGH'
            ? 'Both teams shoot heavy threes at high pace. Expect wide score swings.'
            : volatility === 'LOW'
            ? 'Methodical pace, low turnovers. Game likely decided by execution. Spread lean reliable.'
            : 'Balanced profile. Model confidence in moderate range. Normal betting risk.'}
        </div>
      </div>

      {/* AI narrative */}
      {a.aiNarrative && (
        <div style={{ marginTop:16, padding:'14px 16px', background:'rgba(79,126,255,0.08)',
          border:'1px solid rgba(79,126,255,0.2)', borderRadius:'var(--radius)' }}>
          <div style={{ fontSize:11, color:'var(--accent)', marginBottom:6, fontWeight:600 }}>AI NARRATIVE</div>
          <div style={{ fontSize:14, lineHeight:1.6, color:'var(--text2)' }}>{a.aiNarrative}</div>
        </div>
      )}

      <div style={{ marginTop:16, fontSize:11, color:'var(--text3)', textAlign:'center' }}>
        ⚠️ For informational purposes only. Not financial or betting advice.
      </div>
    </div>
  );
}

// ─── Edge Report Tab ──────────────────────────────────────────
function EdgeTab({ a }: { a: MatchupAnalysis }) {
  const { tA, tB, spreadEdge, totalEdge } = a;
  const edges = [
    { cat:'Offensive Efficiency',  aVal: tA.offEff.toFixed(1),   bVal: tB.offEff.toFixed(1),   edge: tA.offEff - tB.offEff,       flip: false },
    { cat:'Defensive Efficiency',  aVal: tA.defEff.toFixed(1),   bVal: tB.defEff.toFixed(1),   edge: tB.defEff - tA.defEff,       flip: true  },
    { cat:'Rebounding Edge',       aVal: tA.orbPct + '%',        bVal: tB.orbPct + '%',        edge: tA.orbPct - tB.orbPct,       flip: false },
    { cat:'Turnover Discipline',   aVal: tA.tovPct + '%',        bVal: tB.tovPct + '%',        edge: tB.tovPct - tA.tovPct,       flip: false },
    { cat:'3PT Shooting',          aVal: tA.threePct + '%',      bVal: tB.threePct + '%',      edge: tA.threePct - tB.threePct,   flip: false },
    { cat:'Free Throw %',          aVal: tA.ftPct + '%',         bVal: tB.ftPct + '%',         edge: tA.ftPct - tB.ftPct,         flip: false },
    { cat:'Strength of Schedule',  aVal: tA.sos.toFixed(1),      bVal: tB.sos.toFixed(1),      edge: tA.sos - tB.sos,             flip: false },
    { cat:'Pace Differential',     aVal: tA.tempo.toFixed(1),    bVal: tB.tempo.toFixed(1),    edge: Math.abs(tA.tempo-tB.tempo), flip: false },
  ];

  return (
    <div className="section-card">
      <div className="section-title">Matchup Edge Report</div>
      <div style={{ overflowX:'auto' }}>
        <table className="stat-table">
          <thead>
            <tr><th>Category</th><th>{tA.name}</th><th>{tB.name}</th><th>Edge</th><th>Favors</th></tr>
          </thead>
          <tbody>
            {edges.map(({ cat, aVal, bVal, edge, flip }) => {
              const eR   = Math.round(Math.abs(edge) * 10) / 10;
              const favA = flip ? edge < 0 : edge > 0;
              return (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td className={favA ? 'edge-a' : 'edge-neutral'}>{aVal}</td>
                  <td className={!favA ? 'edge-a' : 'edge-neutral'}>{bVal}</td>
                  <td><span className={`edge-badge ${eR > 3 ? 'pos' : 'neu'}`}>±{eR}</span></td>
                  <td style={{ fontSize:12, fontWeight:600, color: favA ? 'var(--green)' : 'var(--red)' }}>
                    {favA ? tA.name : tB.name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:'rgba(79,126,255,0.1)', border:'1px solid rgba(79,126,255,0.3)',
          borderRadius:'var(--radius)', padding:14 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>SPREAD MODEL EDGE</div>
          <div style={{ fontSize:22, fontWeight:700,
            color: Math.abs(spreadEdge) > 2 ? 'var(--green)' : 'var(--text2)' }}>
            {spreadEdge > 0 ? '+' : ''}{spreadEdge.toFixed(1)} pts
          </div>
          <div style={{ fontSize:12, color:'var(--text2)' }}>Model vs market spread</div>
        </div>
        <div style={{ background:'rgba(255,179,64,0.1)', border:'1px solid rgba(255,179,64,0.3)',
          borderRadius:'var(--radius)', padding:14 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>TOTAL MODEL EDGE</div>
          <div style={{ fontSize:22, fontWeight:700,
            color: Math.abs(totalEdge) > 2 ? 'var(--amber)' : 'var(--text2)' }}>
            {totalEdge > 0 ? '+' : ''}{totalEdge.toFixed(1)} pts
          </div>
          <div style={{ fontSize:12, color:'var(--text2)' }}>Model total vs O/U line</div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────
function SettingsPage() {
  const [weights, setWeights]     = useState({ form:35, matchup:30, sos:20, recent:15 });
  const [toggles, setToggles]     = useState({ narrative:true, cache:true, kenpom:true, espn:true, draftkings:true, public:false, injuries:true });
  const [oddsFormat, setOddsFormat] = useState('american');
  const [kenpomEmail, setKenpomEmail] = useState('');
  const [oddsKey, setOddsKey]     = useState('');

  return (
    <div className="settings-grid">
      <div className="setting-group">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>API Configuration</h3>
        {[
          { name:'KenPom Email',     val: kenpomEmail, setter: setKenpomEmail, placeholder:'your@email.com' },
          { name:'The Odds API Key', val: oddsKey,     setter: setOddsKey,     placeholder:'Paste API key...' },
        ].map(({ name, val, setter, placeholder }) => (
          <div className="setting-row" key={name} style={{ flexDirection:'column', alignItems:'flex-start', gap:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
              <div style={{ fontSize:14, color:'var(--text2)' }}>{name}</div>
              <span style={{ fontSize:11, color:'var(--amber)' }}><span className="status-dot warn" />demo</span>
            </div>
            <input className="api-input" placeholder={placeholder} value={val}
              onChange={e => setter(e.target.value)} style={{ width:'100%' }} />
          </div>
        ))}
        <div className="setting-row">
          <div style={{ fontSize:14, color:'var(--text2)' }}>ESPN Public API</div>
          <span style={{ fontSize:11, color:'var(--green)' }}><span className="status-dot" />active</span>
        </div>
        <div className="setting-row">
          <div style={{ fontSize:14, color:'var(--text2)' }}>Data Mode</div>
          <select style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
            borderRadius:6, padding:'6px 10px', fontFamily:'var(--font-sans)', fontSize:13 }}
            defaultValue="mock">
            <option value="mock">Mock (demo)</option>
            <option value="live">Live (real APIs)</option>
          </select>
        </div>
      </div>

      <div className="setting-group">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Model Weights</h3>
        {(Object.entries(weights) as [keyof typeof weights, number][]).map(([key, val]) => (
          <div className="setting-row" key={key}>
            <div>
              <div style={{ fontSize:14, color:'var(--text2)', textTransform:'capitalize' }}>{key} Weight</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{val}%</div>
            </div>
            <input type="range" min={5} max={60} step={5} value={val}
              style={{ width:120, accentColor:'var(--accent)' }}
              onChange={e => setWeights(w => ({ ...w, [key]: parseInt(e.target.value) }))} />
          </div>
        ))}
      </div>

      <div className="setting-group">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Display Options</h3>
        {([
          { label:'AI Narrative', sub:'Show LLM explanation',  key:'narrative' as const },
          { label:'API Cache',    sub:'Cache responses 5 min', key:'cache' as const },
        ]).map(({ label, sub, key }) => (
          <div className="setting-row" key={key}>
            <div>
              <div style={{ fontSize:14, color:'var(--text2)' }}>{label}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{sub}</div>
            </div>
            <button className={`toggle ${toggles[key] ? 'on' : ''}`}
              onClick={() => setToggles(t => ({ ...t, [key]: !t[key] }))} />
          </div>
        ))}
        <div className="setting-row">
          <div style={{ fontSize:14, color:'var(--text2)' }}>Odds Format</div>
          <select style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
            borderRadius:6, padding:'6px 10px', fontFamily:'var(--font-sans)', fontSize:13 }}
            value={oddsFormat} onChange={e => setOddsFormat(e.target.value)}>
            <option value="american">American</option>
            <option value="decimal">Decimal</option>
            <option value="fractional">Fractional</option>
          </select>
        </div>
      </div>

      <div className="setting-group">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Data Providers</h3>
        {([ ['kenpom','KenPom Metrics'], ['espn','ESPN Stats'], ['draftkings','DraftKings Odds'],
            ['public','Public Betting %'], ['injuries','Injury Reports'] ] as [keyof typeof toggles, string][])
          .map(([key, label]) => (
            <div className="setting-row" key={key}>
              <div style={{ fontSize:14, color:'var(--text2)' }}>{label}</div>
              <button className={`toggle ${toggles[key] ? 'on' : ''}`}
                onClick={() => setToggles(t => ({ ...t, [key]: !t[key] }))} />
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────
function HistoryPage({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="section-card" style={{ textAlign:'center', padding:60 }}>
        <div style={{ fontSize:48, opacity:0.3 }}>📁</div>
        <div style={{ fontSize:18, fontWeight:600, color:'var(--text2)', marginTop:12 }}>No saved picks yet</div>
        <div style={{ fontSize:14, color:'var(--text3)', marginTop:8 }}>Run an analysis to see picks appear here</div>
      </div>
    );
  }
  return (
    <div className="section-card">
      <div className="section-title">Saved Picks & History</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
        {history.map(h => (
          <div key={h.id} style={{ background:'var(--bg3)', border:'1px solid var(--border)',
            borderRadius:'var(--card-radius)', padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontWeight:600 }}>{h.teamA} vs {h.teamB}</span>
              <span style={{ background:'rgba(34,201,122,0.1)', color:'var(--green)', fontSize:12,
                fontWeight:600, padding:'4px 10px', borderRadius:20 }}>{h.pick}</span>
            </div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Conf: <strong>{h.confidence}</strong>/10</div>
            {h.score && <div style={{ fontSize:14, marginTop:6 }}>Final: {h.score}</div>}
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>{h.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Best Edges Page ──────────────────────────────────────────
function EdgePage({ teams, onLoadMatchup }: { teams: Team[]; onLoadMatchup: (a: Team, b: Team) => void }) {
  const edges = teams.slice(0, 8).map((t, i) => {
    const opp  = teams[i + 1] ?? teams[0];
    const line = MOCK_BETTING_LINES[[t.id, opp.id].sort().join('-')] ?? {
      spread: -3.5, spreadFav: t.id, ml_a: -155, ml_b: 128,
      total: 145.5, source: 'Est.', updated: 'demo',
    };
    const a = generateAnalysis(t, opp, line);
    return { tA: t, tB: opp, edge: a.spreadEdge, conf: a.confidence };
  }).sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge));

  return (
    <div className="section-card">
      <div className="section-title">Best Edges Today</div>
      <div style={{ overflowX:'auto' }}>
        <table className="stat-table">
          <thead>
            <tr><th>Matchup</th><th>Model Edge</th><th>Confidence</th><th>Lean</th><th>Action</th></tr>
          </thead>
          <tbody>
            {edges.map(({ tA, tB, edge, conf }) => (
              <tr key={tA.id + tB.id}>
                <td><strong>{tA.name}</strong> vs {tB.name}</td>
                <td>
                  <span className={`edge-badge ${Math.abs(edge) > 4 ? 'pos' : 'neu'}`}>
                    {edge > 0 ? '+' : ''}{edge.toFixed(1)}
                  </span>
                </td>
                <td style={{ color: conf >= 7 ? 'var(--green)' : 'var(--text2)' }}>{conf}/10</td>
                <td style={{ fontSize:12, fontWeight:600, color: edge > 0 ? 'var(--green)' : 'var(--red)' }}>
                  {edge > 0 ? tA.name : tB.name}
                </td>
                <td>
                  <button onClick={() => onLoadMatchup(tA, tB)}
                    style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:6,
                      padding:'6px 12px', fontSize:12, cursor:'pointer' }}>
                    Analyze →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function TourneyApp() {
  const [page,      setPage]      = useState<Page>('compare');
  const [tab,       setTab]       = useState<Tab>('ai');
  const [teams,     setTeams]     = useState<Team[]>(MOCK_TEAMS);
  const [teamA,     setTeamA]     = useState<Team | null>(null);
  const [teamB,     setTeamB]     = useState<Team | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [analysis,  setAnalysis]  = useState<MatchupAnalysis | null>(null);
  const [lineRefreshing, setLineRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh]       = useState<number | null>(null);
  const [history,   setHistory]   = useState<HistoryEntry[]>([
    { id:1, teamA:'Duke',     teamB:'UConn',    pick:'Duke -7.5',     confidence:7.8, date:'Mar 20 2026' },
    { id:2, teamA:'Michigan', teamB:'Iowa St.', pick:'Michigan -4.5', confidence:7.2, date:'Mar 20 2026' },
    { id:3, teamA:'Florida',  teamB:'Houston',  pick:'Under 140.5',   confidence:6.6, date:'Mar 20 2026' },
  ]);
  const [dataMode, setDataMode] = useState<'mock' | 'live'>('mock');

  // ── Load teams on mount — always start from MOCK_TEAMS (all 68),
  //    then upgrade to KenPom-enriched data if /api/teams returns the full field
  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => {
        if (data.teams && data.teams.length >= 60) {
          setTeams(data.teams);
          setDataMode(data.mode ?? 'mock');
        }
      })
      .catch(() => {/* silently keep MOCK_TEAMS */});
  }, []);

  // ── Fetch live line for the current matchup ───────────────────
  // Returns a BettingLine from /api/odds, or falls back to MOCK_BETTING_LINES.
  const fetchLiveLine = useCallback(async (tA: Team, tB: Team): Promise<BettingLine> => {
    try {
      const res  = await fetch(
        `/api/odds?teamAId=${encodeURIComponent(tA.id)}&teamBId=${encodeURIComponent(tB.id)}`
      );
      const data = await res.json();
      if (data.line) return data.line as BettingLine;
    } catch {
      // fall through to mock
    }
    // Fallback: mock lines keyed by alphabetically sorted ids
    const key = [tA.id, tB.id].sort().join('-');
    return MOCK_BETTING_LINES[key] ?? {
      spread: -3.5, spreadFav: tA.id, ml_a: -160, ml_b: 134,
      total: 145.5, source: 'Estimated', updated: 'Demo mode',
    };
  }, []);

  // ── Silent background line refresh every 5 minutes ───────────
  // Only runs while a matchup is being displayed. Updates the line
  // and re-runs the model silently — no spinner, no interruption.
  const refreshLine = useCallback(async () => {
    if (!teamA || !teamB || !analysis) return;
    setLineRefreshing(true);
    try {
      const freshLine = await fetchLiveLine(teamA, teamB);
      // Only update if the line actually changed
      const lineChanged =
        freshLine.spread !== analysis.lines.spread ||
        freshLine.total  !== analysis.lines.total;
      if (lineChanged) {
        const updated = generateAnalysis(teamA, teamB, freshLine);
        setAnalysis(updated);
        console.log('[Lines] Refreshed —', freshLine.source, freshLine.updated);
      }
      setLastRefresh(Date.now());
    } catch {
      // Silently fail — stale line stays displayed
    } finally {
      setLineRefreshing(false);
    }
  }, [teamA, teamB, analysis, fetchLiveLine]);

  // Set up the 5-minute refresh interval whenever a matchup is active
  useEffect(() => {
    if (!teamA || !teamB || !analysis) return;
    const interval = setInterval(refreshLine, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [teamA, teamB, analysis, refreshLine]);

  // ── Run full analysis ─────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!teamA || !teamB) return;
    setLoading(true);
    setAnalysis(null);

    try {
      // First try the server-side /api/analyze route (uses KenPom + live odds)
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ teamAId: teamA.id, teamBId: teamB.id }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        setTab('ai');
        setLastRefresh(Date.now());
        setHistory(h => [{
          id:         Date.now(),
          teamA:      teamA.name,
          teamB:      teamB.name,
          pick:       data.analysis.pickCover,
          confidence: data.analysis.confidence,
          date:       new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
        }, ...h.slice(0, 19)]);
        return;
      }
    } catch {
      // fall through to client-side fallback
    }

    // Client-side fallback: fetch line directly then run model in browser
    const line   = await fetchLiveLine(teamA, teamB);
    const result = generateAnalysis(teamA, teamB, line);
    setAnalysis(result);
    setTab('ai');
    setLastRefresh(Date.now());
    setHistory(h => [{
      id:         Date.now(),
      teamA:      teamA.name,
      teamB:      teamB.name,
      pick:       result.pickCover,
      confidence: result.confidence,
      date:       new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
    }, ...h.slice(0, 19)]);
    setLoading(false);
  }, [teamA, teamB, fetchLiveLine]);

  // Ensure loading is cleared in all paths
  useEffect(() => {
    if (analysis) setLoading(false);
  }, [analysis]);

  function loadMatchup(tA: Team, tB: Team) {
    setTeamA(tA);
    setTeamB(tB);
    setPage('compare');
    setAnalysis(null);
    setTimeout(async () => {
      setLoading(true);
      const line   = await fetchLiveLine(tA, tB);
      const result = generateAnalysis(tA, tB, line);
      setAnalysis(result);
      setTab('ai');
      setLastRefresh(Date.now());
    }, 400);
  }

  // ── Format "last refreshed" timestamp ────────────────────────
  function formatRefreshAge(ts: number | null): string {
    if (!ts) return '';
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 60)  return 'Just updated';
    if (secs < 300) return `${Math.floor(secs / 60)}m ago`;
    return 'Updating...';
  }

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 20px 60px' }}>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="logo-icon">🏀</div>
          <span>TourneyEdge <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-sans)' }}>AI</span></span>
        </div>
        <div className="nav-links">
          {([['compare','Compare'],['history','Saved Picks'],['edge','Best Edges ✨'],['settings','Settings']] as [Page,string][]).map(([p, label]) => (
            <button key={p} className={`nav-link${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{label}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {dataMode === 'mock' && (
            <span style={{ fontSize:11, background:'rgba(255,179,64,0.15)', color:'var(--amber)',
              padding:'3px 8px', borderRadius:20, border:'1px solid rgba(255,179,64,0.3)' }}>
              Demo data
            </span>
          )}
          <span style={{ fontSize:11, color:'var(--text3)' }}>Not financial advice</span>
        </div>
      </nav>

      {/* Disclaimer */}
      <div className="disclaimer">
        <strong>⚠️ Disclaimer:</strong> TourneyEdge is for informational and entertainment purposes only.
        Not financial, betting, or investment advice. All projections are statistical model estimates. Bet responsibly.
      </div>

      {/* ── COMPARE PAGE ── */}
      {page === 'compare' && (
        <>
          {/* Team Selector */}
          <div className="selector-card">
            <div className="selector-title">Select Matchup</div>
            <div className="selector-grid">
              <div className="team-selector">
                <label>Team A</label>
                <TeamDropdown which="A" teams={teams} selected={teamA} other={teamB}
                  onSelect={t => { setTeamA(t || null); setAnalysis(null); }} />
              </div>
              <button className="swap-btn" title="Swap teams"
                onClick={() => { const tmp = teamA; setTeamA(teamB); setTeamB(tmp); setAnalysis(null); }}>
                ⇄
              </button>
              <div className="team-selector">
                <label>Team B</label>
                <TeamDropdown which="B" teams={teams} selected={teamB} other={teamA}
                  onSelect={t => { setTeamB(t || null); setAnalysis(null); }} />
              </div>
            </div>
            <button className="compare-btn" disabled={!teamA || !teamB || loading} onClick={runAnalysis}>
              {loading
                ? 'Running models...'
                : teamA && teamB
                ? `Analyze ${teamA.name} vs ${teamB.name}`
                : 'Select two teams to compare'}
            </button>
          </div>

          {/* Loading spinner */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:60, gap:16 }}>
              <div className="spinner" />
              <div style={{ color:'var(--text2)', fontSize:14 }}>Fetching live lines & running models...</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !analysis && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:60, gap:12, textAlign:'center' }}>
              <div style={{ fontSize:48, opacity:0.3 }}>🏆</div>
              <div style={{ fontSize:18, fontWeight:600, color:'var(--text2)' }}>Select a Matchup</div>
              <div style={{ fontSize:14, color:'var(--text3)', maxWidth:340 }}>
                Choose two teams above to generate an AI-powered betting analysis with spread picks, totals, and predicted final score.
              </div>
            </div>
          )}

          {/* Analysis */}
          {!loading && analysis && (
            <>
              {/* Matchup header */}
              <div className="matchup-header">
                <div className="teams-display">
                  <div className="team-block left">
                    <div className="team-logo-xl" style={{ background: analysis.tA.color + '25', color: analysis.tA.color }}>{analysis.tA.emoji}</div>
                    <div className="team-name-big">{analysis.tA.name}</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>Seed #{analysis.tA.seed} · {analysis.tA.conf}</div>
                    <div style={{ fontSize:13, color:'var(--text2)' }}>{analysis.tA.record}</div>
                  </div>
                  <div className="vs-center">
                    <div style={{ fontSize:28, color:'var(--text3)', fontWeight:300 }}>vs</div>
                    <div className="spread-display">
                      <div className="spread-label">Spread</div>
                      <div className="spread-value">
                        {analysis.lines.spreadFav === analysis.tA.id
                          ? `${analysis.tA.name} ${analysis.lines.spread}`
                          : `${analysis.tB.name} ${analysis.lines.spread}`}
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{analysis.lines.source}</div>
                  </div>
                  <div className="team-block right">
                    <div className="team-logo-xl" style={{ background: analysis.tB.color + '25', color: analysis.tB.color }}>{analysis.tB.emoji}</div>
                    <div className="team-name-big">{analysis.tB.name}</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>Seed #{analysis.tB.seed} · {analysis.tB.conf}</div>
                    <div style={{ fontSize:13, color:'var(--text2)' }}>{analysis.tB.record}</div>
                  </div>
                </div>

                {/* Betting cards */}
                <div className="betting-row">
                  {[
                    { label:'Moneyline A', val: `${analysis.lines.ml_a > 0 ? '+' : ''}${analysis.lines.ml_a}` },
                    { label:'Moneyline B', val: `${analysis.lines.ml_b > 0 ? '+' : ''}${analysis.lines.ml_b}` },
                    { label:'Total (O/U)', val: String(analysis.lines.total),                       color:'var(--amber)' },
                    { label:'Proj. Total', val: (analysis.projA + analysis.projB).toFixed(1),       color:'var(--green)' },
                    { label:'Model Edge',  val: `${analysis.spreadEdge > 0 ? '+' : ''}${analysis.spreadEdge.toFixed(1)}`,
                      color: Math.abs(analysis.spreadEdge) > 2 ? 'var(--green)' : 'var(--text2)' },
                  ].map(({ label, val, color }) => (
                    <div className="bet-card" key={label}>
                      <div className="bet-label">{label}</div>
                      <div className="bet-val" style={{ color: color ?? 'var(--text)' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Source row with live refresh indicator */}
                <div className="source-row">
                  <span className="source-tag">📡 {analysis.lines.source}</span>
                  <span className="source-tag">🕐 {analysis.lines.updated}</span>
                  {lineRefreshing
                    ? <span className="source-tag" style={{ color:'var(--amber)' }}>🔄 Refreshing...</span>
                    : lastRefresh
                    ? <span className="source-tag" style={{ color:'var(--green)' }}>
                        🟢 {formatRefreshAge(lastRefresh)} · auto-refreshes every 5 min
                      </span>
                    : <span className="source-tag">🔬 Rules-based model</span>
                  }
                  {/* Manual refresh button */}
                  <button
                    onClick={refreshLine}
                    disabled={lineRefreshing}
                    style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)',
                      fontSize:11, padding:'4px 10px', borderRadius:20, cursor:'pointer',
                      opacity: lineRefreshing ? 0.5 : 1 }}>
                    ↻ Refresh line
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                {([['stats','📊 Stats'],['charts','📈 Charts'],['ai','🤖 AI Analysis'],['edge','⚡ Edge Report']] as [Tab,string][]).map(([id, label]) => (
                  <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
                ))}
              </div>

              {tab === 'stats'  && <StatsTab  tA={analysis.tA} tB={analysis.tB} />}
              {tab === 'charts' && <MatchupCharts analysis={analysis} />}
              {tab === 'ai'     && <AITab a={analysis} />}
              {tab === 'edge'   && <EdgeTab a={analysis} />}
            </>
          )}
        </>
      )}

      {page === 'history'  && <HistoryPage history={history} />}
      {page === 'edge'     && <EdgePage teams={teams} onLoadMatchup={loadMatchup} />}
      {page === 'settings' && <SettingsPage />}
    </div>
  );
}
