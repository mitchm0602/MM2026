'use client';

// src/components/TourneyApp.tsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
function SettingsPage({ dataMode, setDataMode }: {
  dataMode: 'mock' | 'live';
  setDataMode: (m: 'mock' | 'live') => void;
}) {
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
          <div>
            <div style={{ fontSize:14, color:'var(--text2)' }}>Data Mode</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
              {dataMode === 'live'
                ? 'Fetching live lines from The Odds API'
                : 'Using verified mock lines — set DATA_MODE=live in Vercel to enable'}
            </div>
          </div>
          <select
            style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
              borderRadius:6, padding:'6px 10px', fontFamily:'var(--font-sans)', fontSize:13 }}
            value={dataMode}
            onChange={e => {
              const val = e.target.value as 'mock' | 'live';
              setDataMode(val);
              try { localStorage.setItem('tourney_data_mode', val); } catch {}
            }}>
            <option value="mock">Mock (demo)</option>
            <option value="live">Live (real APIs)</option>
          </select>
        </div>
        {dataMode === 'live' && (
          <div style={{ marginTop:8, padding:'10px 12px', background:'rgba(34,201,122,0.08)',
            border:'1px solid rgba(34,201,122,0.25)', borderRadius:'var(--radius)', fontSize:12,
            color:'var(--green)' }}>
            🟢 Live mode active — lines refresh every 5 min from DraftKings.
            Make sure <strong>ODDS_API_KEY</strong> and <strong>DATA_MODE=live</strong> are set in Vercel.
          </div>
        )}
        {dataMode === 'mock' && (
          <div style={{ marginTop:8, padding:'10px 12px', background:'rgba(255,179,64,0.08)',
            border:'1px solid rgba(255,179,64,0.25)', borderRadius:'var(--radius)', fontSize:12,
            color:'var(--amber)' }}>
            ⚠️ Mock mode — showing verified lines from March 17, 2026.
            Switch to Live to get real-time spreads and totals.
          </div>
        )}
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

// ─── Tournament Board Page ────────────────────────────────────
// Explicit row type so TypeScript can resolve spreadEdge etc.
// Sharp money signal for a single market (spread or total)
interface SharpSignal {
  moved:       boolean;    // did the line move at all?
  magnitude:   number;     // how many points did it move?
  direction:   'toward' | 'against' | 'none'; // vs the model's pick
  confirmedBy: 'spread' | 'total' | 'both' | 'none'; // which markets confirm
  label:       string;     // human-readable description
  emoji:       string;     // visual indicator
}

interface BoardRow {
  date:         string;
  region:       string;
  tA:           Team;
  tB:           Team;
  line:         BettingLine;
  favTeam:      Team;
  dogTeam:      Team;
  spreadEdge:   number;
  totalEdge:    number;
  confidence:   number;
  pickCover:    string;
  ouLean:       string;
  projA:        number;
  projB:        number;
  projTotal:    number;
  volatility:   'HIGH' | 'MODERATE' | 'LOW';
  sharpSignal:  SharpSignal;  // sharp money tracker
}
// All 32 first-round matchups (+ likely round-2 projections for 3/22)
// sorted by model edge, total edge, or confidence.

type SortKey = 'spreadEdge' | 'totalEdge' | 'confidence' | 'sharpScore';

// ── Sharp money signal calculator ─────────────────────────────
// Reads openSpread/openTotal vs current spread/total to determine
// whether professional money has moved the line toward or away from
// the model's pick. Returns a structured signal with label + emoji.
function calcSharpSignal(line: BettingLine, spreadEdge: number, totalEdge: number): SharpSignal {
  const spreadMoved = line.openSpread !== undefined
    ? Math.abs(line.spread - line.openSpread)
    : 0;
  const totalMoved  = line.openTotal !== undefined
    ? Math.abs(line.total - line.openTotal)
    : 0;

  const SPREAD_THRESHOLD = 1.0;  // >= 1 pt spread move = meaningful
  const TOTAL_THRESHOLD  = 1.5;  // >= 1.5 pts total move = meaningful

  const spreadSharp = spreadMoved >= SPREAD_THRESHOLD;
  const totalSharp  = totalMoved  >= TOTAL_THRESHOLD;

  if (!spreadSharp && !totalSharp) {
    return {
      moved: false, magnitude: 0, direction: 'none',
      confirmedBy: 'none',
      label: 'No movement — market stable',
      emoji: '⚪',
    };
  }

  // Spread direction: did the line move toward or away from model pick?
  // Model likes tA to cover when spreadEdge > 0 (projMargin > marketSpread)
  // If spread shortened (fav became cheaper) and model likes fav → against model
  // If spread lengthened (fav got more expensive) and model likes fav → confirms model
  let spreadDir: 'toward' | 'against' | 'none' = 'none';
  if (spreadSharp && line.openSpread !== undefined) {
    const spreadGotBigger = line.spread > line.openSpread; // favorite got more expensive
    // spreadEdge > 0 means model likes the favorite to cover
    spreadDir = (spreadGotBigger && spreadEdge > 0) || (!spreadGotBigger && spreadEdge < 0)
      ? 'toward'
      : 'against';
  }

  // Total direction: did the total move toward or away from model lean?
  // totalEdge > 0 = model likes the over
  // If total went up and model likes over → confirms model
  // If total went down and model likes under → confirms model
  let totalDir: 'toward' | 'against' | 'none' = 'none';
  if (totalSharp && line.openTotal !== undefined) {
    const totalWentUp = line.total > line.openTotal;
    totalDir = (totalWentUp && totalEdge > 0) || (!totalWentUp && totalEdge < 0)
      ? 'toward'
      : 'against';
  }

  // Combine signals
  const bothMoved = spreadSharp && totalSharp;
  const bothConfirm = spreadDir === 'toward' && totalDir === 'toward';
  const eitherConfirm = spreadDir === 'toward' || totalDir === 'toward';
  const eitherAgainst = spreadDir === 'against' || totalDir === 'against';

  const confirmedBy: SharpSignal['confirmedBy'] =
    bothMoved && bothConfirm ? 'both'
    : spreadSharp && spreadDir === 'toward' ? 'spread'
    : totalSharp  && totalDir  === 'toward' ? 'total'
    : 'none';

  const direction: SharpSignal['direction'] =
    bothConfirm           ? 'toward'
    : eitherConfirm && !eitherAgainst ? 'toward'
    : eitherAgainst && !eitherConfirm ? 'against'
    : 'against'; // mixed signals default to caution

  const magnitude = Math.max(spreadMoved, totalMoved);

  // Build human label
  const parts: string[] = [];
  if (spreadSharp && line.openSpread !== undefined) {
    const dir   = line.spread > line.openSpread ? '↑' : '↓';
    const delta = Math.abs(line.spread - line.openSpread).toFixed(1);
    parts.push(`Spread ${dir}${delta} (${line.openSpread}→${line.spread})`);
  }
  if (totalSharp && line.openTotal !== undefined) {
    const dir   = line.total > line.openTotal ? '↑' : '↓';
    const delta = Math.abs(line.total - line.openTotal).toFixed(1);
    parts.push(`Total ${dir}${delta} (${line.openTotal}→${line.total})`);
  }

  const emoji =
    direction === 'toward' && magnitude >= 2 ? '🔵' // strong sharp confirmation
    : direction === 'toward'                  ? '🟢' // mild sharp confirmation
    : direction === 'against' && magnitude >= 2? '🔴' // sharp money against model
    : '🟡'; // mixed/uncertain

  return {
    moved: true,
    magnitude,
    direction,
    confirmedBy,
    label: parts.join(' · '),
    emoji,
  };
}
type DateFilter = 'all' | '3/19' | '3/20' | '3/21' | '3/22';

// Every scheduled matchup March 19-22 with the correct mock-data line key
const TOURNAMENT_SCHEDULE: {
  date: string; region: string; tAId: string; tBId: string;
}[] = [
  // ── March 19 ──────────────────────────────────────────────
  { date:'3/19', region:'East',    tAId:'duke',         tBId:'siena'         },
  { date:'3/19', region:'East',    tAId:'furman',       tBId:'uconn'         },
  { date:'3/19', region:'East',    tAId:'louisville',   tBId:'southflorida'  },
  { date:'3/19', region:'East',    tAId:'ohiostate',    tBId:'tcu'           },
  { date:'3/19', region:'West',    tAId:'arizona',      tBId:'liu'           },
  { date:'3/19', region:'West',    tAId:'miamifl',      tBId:'missouri'      },
  { date:'3/19', region:'West',    tAId:'utahst',       tBId:'villanova'     },
  // ── March 20 ──────────────────────────────────────────────
  { date:'3/20', region:'East',    tAId:'michiganst',   tBId:'northdakotast' },
  { date:'3/20', region:'East',    tAId:'calbaptist',   tBId:'kansas'        },
  { date:'3/20', region:'East',    tAId:'northerniowa', tBId:'stjohns'       },
  { date:'3/20', region:'East',    tAId:'ucf',          tBId:'ucla'          },
  { date:'3/20', region:'West',    tAId:'purdue',       tBId:'queens'        },
  { date:'3/20', region:'West',    tAId:'gonzaga',      tBId:'kennesawst'    },
  { date:'3/20', region:'West',    tAId:'highpoint',    tBId:'wisconsin'     },
  { date:'3/20', region:'West',    tAId:'arkansas',     tBId:'hawaii'        },
  { date:'3/20', region:'South',   tAId:'florida',      tBId:'prairierview'  },
  { date:'3/20', region:'South',   tAId:'houston',      tBId:'idaho'         },
  { date:'3/20', region:'South',   tAId:'nebraska',     tBId:'troy'          },
  { date:'3/20', region:'South',   tAId:'northcarolina',tBId:'vcu'           },
  { date:'3/20', region:'Midwest', tAId:'michigan',     tBId:'umbc'          },
  { date:'3/20', region:'Midwest', tAId:'iowast',       tBId:'tennesseest'   },
  { date:'3/20', region:'Midwest', tAId:'texastech',    tBId:'akron'         },
  { date:'3/20', region:'Midwest', tAId:'georgia',      tBId:'stlouis'       },
  // ── March 21 ──────────────────────────────────────────────
  { date:'3/21', region:'South',   tAId:'illinois',     tBId:'penn'          },
  { date:'3/21', region:'South',   tAId:'mcneese',      tBId:'vanderbilt'    },
  { date:'3/21', region:'South',   tAId:'saintmarys',   tBId:'texasam'       },
  { date:'3/21', region:'South',   tAId:'clemson',      tBId:'iowa'          },
  { date:'3/21', region:'Midwest', tAId:'virginia',     tBId:'wrightstate'   },
  { date:'3/21', region:'Midwest', tAId:'alabama',      tBId:'hofstra'       },
  { date:'3/21', region:'Midwest', tAId:'kentucky',     tBId:'santaclara'    },
  { date:'3/21', region:'Midwest', tAId:'tennessee',    tBId:'smu'           },
  // ── March 22 (Round of 32 — projected top matchups) ───────
  { date:'3/22', region:'East',    tAId:'duke',         tBId:'uconn'         },
  { date:'3/22', region:'West',    tAId:'arizona',      tBId:'purdue'        },
  { date:'3/22', region:'Midwest', tAId:'michigan',     tBId:'iowast'        },
  { date:'3/22', region:'South',   tAId:'florida',      tBId:'houston'       },
];

function TourneyBoard({ teams, onLoadMatchup }: {
  teams: Team[];
  onLoadMatchup: (a: Team, b: Team) => void;
}) {
  const [sortKey,    setSortKey]    = useState<SortKey>('spreadEdge');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [showOnlyEdge,  setShowOnlyEdge]  = useState(false);
  const [showOnlySharp, setShowOnlySharp] = useState(false);

  // Build a lookup map from team ID → Team object
  const teamMap = useMemo(() => {
    const m: Record<string, Team> = {};
    teams.forEach(t => { m[t.id] = t; });
    return m;
  }, [teams]);

  // Run the model on every scheduled matchup
  const rows = useMemo((): BoardRow[] => {
    const result: BoardRow[] = [];
    for (const s of TOURNAMENT_SCHEDULE) {
      if (dateFilter !== 'all' && s.date !== dateFilter) continue;
      if (regionFilter !== 'all' && s.region !== regionFilter) continue;

      const tA = teamMap[s.tAId];
      const tB = teamMap[s.tBId];
      if (!tA || !tB) continue;

      const key  = [s.tAId, s.tBId].sort().join('-');
      const line: BettingLine = MOCK_BETTING_LINES[key] ?? {
        spread:    Math.abs(tA.seed - tB.seed) * 2.5 + 1.5,
        spreadFav: tA.seed < tB.seed ? tA.id : tB.id,
        ml_a: -150, ml_b: 125,
        total: 145.5,
        source: 'Est.', updated: 'Est.',
      };

      const analysis = generateAnalysis(tA, tB, line);
      const sharpSignal = calcSharpSignal(line, analysis.spreadEdge, analysis.totalEdge);
      result.push({
        date:        s.date,
        region:      s.region,
        tA, tB, line,
        favTeam:     line.spreadFav === tA.id ? tA : tB,
        dogTeam:     line.spreadFav === tA.id ? tB : tA,
        spreadEdge:  analysis.spreadEdge,
        totalEdge:   analysis.totalEdge,
        confidence:  analysis.confidence,
        pickCover:   analysis.pickCover,
        ouLean:      analysis.ouLean,
        projA:       analysis.projA,
        projB:       analysis.projB,
        projTotal:   analysis.projTotal,
        volatility:  analysis.volatility,
        sharpSignal,
      });
    }
    return result;
  }, [teamMap, dateFilter, regionFilter]);

  // Sort
  // Sharp score: combines magnitude, confirmation, and model edge
  const sharpScore = (r: BoardRow): number => {
    if (!r.sharpSignal.moved) return 0;
    const base      = r.sharpSignal.magnitude * 10;
    const confirm   = r.sharpSignal.direction === 'toward'  ?  1.5 : 0.3;
    const bothBonus = r.sharpSignal.confirmedBy === 'both'  ? 1.4  : 1.0;
    const edgeBonus = (Math.abs(r.spreadEdge) + Math.abs(r.totalEdge)) * 0.5;
    return base * confirm * bothBonus + edgeBonus;
  };

  const sorted = useMemo((): BoardRow[] => {
    const filtered: BoardRow[] = showOnlyEdge
      ? rows.filter(r => Math.abs(r.spreadEdge) > 3 || Math.abs(r.totalEdge) > 3)
      : showOnlySharp
      ? rows.filter(r => r.sharpSignal.moved)
      : rows;

    return [...filtered].sort((a: BoardRow, b: BoardRow) => {
      if (sortKey === 'confidence') return b.confidence - a.confidence;
      if (sortKey === 'spreadEdge') return Math.abs(b.spreadEdge) - Math.abs(a.spreadEdge);
      if (sortKey === 'totalEdge')  return Math.abs(b.totalEdge)  - Math.abs(a.totalEdge);
      // sharpScore: confirmed moves first, then by magnitude
      return sharpScore(b) - sharpScore(a);
    });
  }, [rows, sortKey, showOnlyEdge, showOnlySharp]);

  const dates   = ['all', '3/19', '3/20', '3/21', '3/22'];
  const regions = ['all', 'East', 'West', 'Midwest', 'South'];

  const edgeColor = (v: number, threshold = 3) =>
    Math.abs(v) >= threshold * 2 ? (v > 0 ? 'var(--green)' : 'var(--red)')
    : Math.abs(v) >= threshold   ? (v > 0 ? '#6ee09a'       : '#ff8888')
    : 'var(--text3)';

  const confColor = (c: number) =>
    c >= 7.5 ? 'var(--green)' : c >= 6 ? 'var(--amber)' : 'var(--red)';

  const confLabel = (c: number) =>
    c >= 7.5 ? 'HIGH' : c >= 6 ? 'MED' : 'LOW';

  const volIcon = { HIGH: '🔥', MODERATE: '⚖️', LOW: '🧊' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>
          🏆 Tournament Board
        </div>
        <div style={{ fontSize:13, color:'var(--text3)' }}>
          Every first-round matchup ranked by model edge — find the best bets across all four days
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:20, alignItems:'center' }}>

        {/* Sort */}
        <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:8, padding:4 }}>
          {([
            ['spreadEdge', '📊 Spread Edge'],
            ['totalEdge',  '🎯 Total Edge'],
            ['confidence', '💪 Confidence'],
            ['sharpScore', '🔵 Sharp Money'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSortKey(key)}
              style={{ fontSize:12, padding:'6px 12px', borderRadius:6, border:'none', cursor:'pointer',
                background: sortKey === key ? 'var(--accent)' : 'transparent',
                color: sortKey === key ? '#fff' : 'var(--text2)',
                fontWeight: sortKey === key ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:8, padding:4 }}>
          {dates.map(d => (
            <button key={d} onClick={() => setDateFilter(d as DateFilter)}
              style={{ fontSize:12, padding:'6px 10px', borderRadius:6, border:'none', cursor:'pointer',
                background: dateFilter === d ? 'var(--accent2)' : 'transparent',
                color: dateFilter === d ? '#fff' : 'var(--text2)',
                fontWeight: dateFilter === d ? 600 : 400 }}>
              {d === 'all' ? 'All Days' : d}
            </button>
          ))}
        </div>

        {/* Region filter */}
        <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:8, padding:4 }}>
          {regions.map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              style={{ fontSize:11, padding:'6px 10px', borderRadius:6, border:'none', cursor:'pointer',
                background: regionFilter === r ? 'var(--amber)' : 'transparent',
                color: regionFilter === r ? '#000' : 'var(--text2)',
                fontWeight: regionFilter === r ? 600 : 400 }}>
              {r === 'all' ? 'All Regions' : r}
            </button>
          ))}
        </div>

        {/* Edge-only toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text2)', cursor:'pointer' }}>
          <button className={`toggle ${showOnlyEdge ? 'on' : ''}`}
            onClick={() => setShowOnlyEdge(v => !v)} />
          Best edges only (&gt;3 pts)
        </label>

        {/* Sharp-only toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text2)', cursor:'pointer' }}>
          <button className={`toggle ${showOnlySharp ? 'on' : ''}`}
            onClick={() => setShowOnlySharp(v => !v)} />
          Sharp action only
        </label>

        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>
          {sorted.length} matchup{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary bar — top picks at a glance */}
      {sorted.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
          gap:10, marginBottom:20 }}>
          {[
            {
              label: '🔥 Best Spread Bet',
              value: (() => {
                const top = [...sorted].sort((a,b) => Math.abs(b.spreadEdge) - Math.abs(a.spreadEdge))[0];
                return top ? `${top.pickCover} (${top.spreadEdge > 0 ? '+' : ''}${top.spreadEdge.toFixed(1)})` : '—';
              })(),
              color: 'var(--green)',
            },
            {
              label: '🎯 Best Total Bet',
              value: (() => {
                const top = [...sorted].sort((a,b) => Math.abs(b.totalEdge) - Math.abs(a.totalEdge))[0];
                return top ? top.ouLean.split(' (')[0] : '—';
              })(),
              color: 'var(--amber)',
            },
            {
              label: '💪 Highest Confidence',
              value: (() => {
                const top = [...sorted].sort((a,b) => b.confidence - a.confidence)[0];
                return top ? `${top.tA.name} vs ${top.tB.name} (${top.confidence})` : '—';
              })(),
              color: 'var(--accent)',
            },
            {
              label: '🔵 Sharp + Model Agree',
              value: (() => {
                const top = [...sorted]
                  .filter(r => r.sharpSignal.direction === 'toward' && r.sharpSignal.moved)
                  .sort((a,b) => sharpScore(b) - sharpScore(a))[0];
                return top ? `${top.pickCover} (${top.sharpSignal.emoji} ${top.sharpSignal.confirmedBy})` : 'No confirmed moves yet';
              })(),
              color: '#4fa3e0',
            },
            {
              label: '⚠️ Sharp vs Model',
              value: (() => {
                const top = [...sorted]
                  .filter(r => r.sharpSignal.direction === 'against' && r.sharpSignal.moved)
                  .sort((a,b) => b.sharpSignal.magnitude - a.sharpSignal.magnitude)[0];
                return top ? `${top.tA.name} vs ${top.tB.name} (${top.sharpSignal.label.split('·')[0].trim()})` : 'No conflicts';
              })(),
              color: 'var(--red)',
            },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:'var(--bg3)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:600, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main table */}
      <div style={{ overflowX:'auto' }}>
        <table className="stat-table" style={{ minWidth:900 }}>
          <thead>
            <tr>
              <th style={{ width:40 }}>#</th>
              <th>Date</th>
              <th>Matchup</th>
              <th>Proj. Score</th>
              <th>Spread</th>
              <th style={{ cursor:'pointer' }} onClick={() => setSortKey('spreadEdge')}>
                Spread Edge {sortKey === 'spreadEdge' ? '↓' : ''}
              </th>
              <th style={{ cursor:'pointer', minWidth:140 }} onClick={() => setSortKey('sharpScore')}>
                Sharp Signal {sortKey === 'sharpScore' ? '↓' : ''}
              </th>
              <th>Pick to Cover</th>
              <th style={{ cursor:'pointer' }} onClick={() => setSortKey('totalEdge')}>
                O/U Edge {sortKey === 'totalEdge' ? '↓' : ''}
              </th>
              <th>O/U Lean</th>
              <th style={{ cursor:'pointer' }} onClick={() => setSortKey('confidence')}>
                Conf. {sortKey === 'confidence' ? '↓' : ''}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const spreadAbs  = Math.abs(r.spreadEdge);
              const totalAbs   = Math.abs(r.totalEdge);
              const isTopSpread = i === 0 && sortKey === 'spreadEdge';
              const isTopTotal  = i === 0 && sortKey === 'totalEdge';

              return (
                <tr key={r.tA.id + r.tB.id}
                  style={{ background: i === 0 && sortKey !== 'confidence'
                    ? 'rgba(79,126,255,0.06)' : undefined }}>

                  {/* Rank */}
                  <td style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>
                    {i + 1}
                  </td>

                  {/* Date + Region */}
                  <td>
                    <div style={{ fontSize:13, fontWeight:600 }}>{r.date}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>{r.region}</div>
                  </td>

                  {/* Matchup */}
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:16 }}>{r.tA.emoji}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>
                          <span style={{ color: r.tA.color }}>{r.tA.name}</span>
                          <span style={{ color:'var(--text3)', fontWeight:400, margin:'0 4px' }}>vs</span>
                          <span style={{ color: r.tB.color }}>{r.tB.name}</span>
                        </div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>
                          #{r.tA.seed} vs #{r.tB.seed} · {volIcon[r.volatility]}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Projected score */}
                  <td>
                    <div style={{ fontSize:13, fontWeight:700, letterSpacing:0.5 }}>
                      {Math.round(r.projA)}–{Math.round(r.projB)}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>
                      proj total {r.projTotal.toFixed(0)}
                    </div>
                  </td>

                  {/* Market spread */}
                  <td>
                    <div style={{ fontSize:13, fontWeight:600 }}>
                      {r.favTeam.name} -{r.line.spread.toFixed(1)}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>{r.line.source}</div>
                  </td>

                  {/* Spread edge */}
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:16, fontWeight:800,
                        color: edgeColor(r.spreadEdge) }}>
                        {r.spreadEdge > 0 ? '+' : ''}{r.spreadEdge.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                      {spreadAbs >= 6 ? 'Strong edge' : spreadAbs >= 3 ? 'Moderate edge' : 'Thin edge'}
                    </div>
                  </td>

                  {/* Sharp Money Signal — the new column */}
                  <td>
                    {!r.sharpSignal.moved ? (
                      <div style={{ fontSize:11, color:'var(--text3)' }}>
                        ⚪ No move
                      </div>
                    ) : (
                      <div>
                        {/* Main signal line */}
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:15 }}>{r.sharpSignal.emoji}</span>
                          <span style={{ fontSize:11, fontWeight:700,
                            color: r.sharpSignal.direction === 'toward'
                              ? (r.sharpSignal.confirmedBy === 'both' ? '#4fa3e0' : 'var(--green)')
                              : 'var(--red)' }}>
                            {r.sharpSignal.direction === 'toward'
                              ? r.sharpSignal.confirmedBy === 'both' ? 'SHARP CONFIRMED' : 'SHARP WITH MODEL'
                              : 'SHARP AGAINST'}
                          </span>
                        </div>
                        {/* Line movement detail */}
                        <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>
                          {r.sharpSignal.label.split(' · ').map((part, i) => (
                            <div key={i}>{part}</div>
                          ))}
                        </div>
                        {/* Confirmation badge */}
                        {r.sharpSignal.confirmedBy === 'both' && (
                          <span style={{ fontSize:9, background:'rgba(79,163,224,0.2)',
                            color:'#4fa3e0', padding:'1px 5px', borderRadius:8,
                            fontWeight:700, marginTop:3, display:'inline-block' }}>
                            SPREAD + TOTAL CONFIRM
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Pick to cover */}
                  <td>
                    <span style={{ fontSize:12, fontWeight:700,
                      color: r.spreadEdge > 0 ? 'var(--green)' : 'var(--red)' }}>
                      {r.pickCover}
                    </span>
                  </td>

                  {/* Total edge */}
                  <td>
                    <span style={{ fontSize:16, fontWeight:800,
                      color: edgeColor(r.totalEdge) }}>
                      {r.totalEdge > 0 ? '+' : ''}{r.totalEdge.toFixed(1)}
                    </span>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                      mkt {r.line.total}
                    </div>
                  </td>

                  {/* O/U lean */}
                  <td>
                    <span style={{ fontSize:12, fontWeight:600,
                      color: r.totalEdge > 2 ? 'var(--amber)' : r.totalEdge < -2 ? 'var(--accent)' : 'var(--text3)' }}>
                      {r.ouLean.split(' (')[0]}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:16, fontWeight:800, color: confColor(r.confidence) }}>
                        {r.confidence}
                      </span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px',
                        borderRadius:10, background: r.confidence >= 7.5
                          ? 'rgba(34,201,122,0.15)' : r.confidence >= 6
                          ? 'rgba(255,179,64,0.15)' : 'rgba(255,79,106,0.1)',
                        color: confColor(r.confidence) }}>
                        {confLabel(r.confidence)}
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td>
                    <button
                      onClick={() => onLoadMatchup(r.tA, r.tB)}
                      style={{ background:'var(--accent)', color:'#fff', border:'none',
                        borderRadius:6, padding:'6px 12px', fontSize:11, cursor:'pointer',
                        fontWeight:600, whiteSpace:'nowrap' }}>
                      Deep Dive →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>
          No matchups found for the selected filters.
        </div>
      )}

      <div style={{ marginTop:16, fontSize:11, color:'var(--text3)', textAlign:'center' }}>
        ⚠️ For informational purposes only. Not financial or betting advice.
        Model edges are statistical estimates — always verify live lines before placing bets.
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

  // ── Restore persisted dataMode from localStorage ────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tourney_data_mode') as 'mock' | 'live' | null;
      if (saved === 'live' || saved === 'mock') setDataMode(saved);
    } catch {}
  }, []);

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
          {([['compare','Compare'],['history','Saved Picks'],['edge','Board 🏆'],['settings','Settings']] as [Page,string][]).map(([p, label]) => (
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
      {page === 'edge'     && <TourneyBoard teams={teams} onLoadMatchup={loadMatchup} />}
      {page === 'settings' && <SettingsPage dataMode={dataMode} setDataMode={setDataMode} />}
    </div>
  );
}
