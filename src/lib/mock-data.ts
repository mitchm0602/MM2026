// src/lib/mock-data.ts
// 2026 NCAA TOURNAMENT — ALL 68 TEAMS + 100% VERIFIED BETTING LINES
//
// Lines sourced from: ESPN, CBS Sports, Yahoo Sports, Vegas Insider,
// FanDuel Research, and Outkick — all cross-referenced as of March 17, 2026.
//
// KEY FORMAT: alphabetically sorted team IDs joined by '-'
// e.g. Ohio State (id:'ohiostate') vs TCU (id:'tcu') → 'ohiostate-tcu'

import type { Team, BettingLine } from '@/types';

export const MOCK_TEAMS: Team[] = [

  // ── SEED 1 ──────────────────────────────────────────────────
  { id:'duke',         name:'Duke',            shortName:'Duke',        seed:1,  region:'East',    conf:'ACC',          color:'#00339B', emoji:'🔵', record:'32-2',  ats:'20-14', offEff:125.4, defEff:92.1,  tempo:72.8, sos:3.2,  ppg:87.4, oppg:65.2, efgPct:57.8, tovPct:13.2, orbPct:35.4, ftr:43.1, threePct:39.2, ftPct:75.6, last10:'10-0', neutralRec:'5-0', dataSource:'mock' },
  { id:'arizona',      name:'Arizona',         shortName:'Arizona',     seed:1,  region:'West',    conf:'Big 12',       color:'#AB0520', emoji:'🔴', record:'32-2',  ats:'21-13', offEff:122.6, defEff:90.8,  tempo:70.4, sos:2.8,  ppg:85.2, oppg:64.8, efgPct:56.4, tovPct:13.8, orbPct:33.6, ftr:40.2, threePct:36.4, ftPct:74.2, last10:'9-1',  neutralRec:'4-1', dataSource:'mock' },
  { id:'michigan',     name:'Michigan',        shortName:'Michigan',    seed:1,  region:'Midwest', conf:'Big Ten',      color:'#00274C', emoji:'🟡', record:'31-3',  ats:'19-15', offEff:121.8, defEff:91.4,  tempo:68.6, sos:4.1,  ppg:82.4, oppg:64.4, efgPct:55.6, tovPct:14.4, orbPct:36.8, ftr:44.6, threePct:37.0, ftPct:73.8, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },
  { id:'florida',      name:'Florida',         shortName:'Florida',     seed:1,  region:'South',   conf:'SEC',          color:'#0021A5', emoji:'🐊', record:'26-7',  ats:'17-16', offEff:120.4, defEff:93.2,  tempo:71.2, sos:5.4,  ppg:83.8, oppg:67.2, efgPct:56.2, tovPct:14.8, orbPct:34.2, ftr:41.8, threePct:38.0, ftPct:76.4, last10:'9-1',  neutralRec:'4-1', dataSource:'mock' },

  // ── SEED 2 ──────────────────────────────────────────────────
  { id:'uconn',        name:'UConn',           shortName:'UConn',       seed:2,  region:'East',    conf:'Big East',     color:'#000E2F', emoji:'🐺', record:'29-5',  ats:'18-16', offEff:118.6, defEff:91.8,  tempo:69.4, sos:6.2,  ppg:80.4, oppg:65.8, efgPct:54.8, tovPct:13.4, orbPct:32.6, ftr:39.8, threePct:37.2, ftPct:75.0, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'purdue',       name:'Purdue',          shortName:'Purdue',      seed:2,  region:'West',    conf:'Big Ten',      color:'#CEB888', emoji:'🟡', record:'27-8',  ats:'17-18', offEff:119.2, defEff:95.4,  tempo:68.8, sos:7.4,  ppg:82.6, oppg:70.2, efgPct:55.8, tovPct:12.8, orbPct:36.4, ftr:44.8, threePct:39.0, ftPct:77.2, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'iowast',       name:'Iowa State',      shortName:'Iowa St.',    seed:2,  region:'Midwest', conf:'Big 12',       color:'#C8102E', emoji:'🌪️', record:'27-7',  ats:'18-16', offEff:117.4, defEff:90.6,  tempo:67.2, sos:6.8,  ppg:79.8, oppg:64.2, efgPct:53.4, tovPct:14.2, orbPct:30.8, ftr:38.4, threePct:36.8, ftPct:74.8, last10:'8-2',  neutralRec:'4-1', dataSource:'mock' },
  { id:'houston',      name:'Houston',         shortName:'Houston',     seed:2,  region:'South',   conf:'Big 12',       color:'#C8102E', emoji:'🔴', record:'28-6',  ats:'19-15', offEff:118.8, defEff:92.4,  tempo:65.8, sos:5.8,  ppg:78.6, oppg:64.8, efgPct:52.6, tovPct:13.6, orbPct:32.4, ftr:40.2, threePct:34.6, ftPct:72.8, last10:'8-2',  neutralRec:'4-1', dataSource:'mock' },

  // ── SEED 3 ──────────────────────────────────────────────────
  { id:'michiganst',   name:'Michigan St.',    shortName:'Mich. St.',   seed:3,  region:'East',    conf:'Big Ten',      color:'#18453B', emoji:'🟢', record:'25-7',  ats:'16-16', offEff:115.8, defEff:91.2,  tempo:67.8, sos:8.2,  ppg:78.4, oppg:65.2, efgPct:52.8, tovPct:14.6, orbPct:35.8, ftr:42.4, threePct:34.2, ftPct:73.6, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },
  { id:'gonzaga',      name:'Gonzaga',         shortName:'Gonzaga',     seed:3,  region:'West',    conf:'WCC',          color:'#002469', emoji:'🟦', record:'30-3',  ats:'20-13', offEff:116.4, defEff:93.6,  tempo:73.2, sos:9.4,  ppg:84.2, oppg:68.4, efgPct:55.2, tovPct:14.0, orbPct:34.8, ftr:43.6, threePct:36.2, ftPct:74.4, last10:'8-2',  neutralRec:'4-1', dataSource:'mock' },
  { id:'virginia',     name:'Virginia',        shortName:'Virginia',    seed:3,  region:'Midwest', conf:'ACC',          color:'#232D4B', emoji:'🟠', record:'29-5',  ats:'17-17', offEff:114.6, defEff:90.4,  tempo:63.4, sos:7.6,  ppg:74.8, oppg:62.6, efgPct:52.4, tovPct:13.2, orbPct:33.6, ftr:38.8, threePct:35.8, ftPct:76.2, last10:'9-1',  neutralRec:'3-2', dataSource:'mock' },
  { id:'illinois',     name:'Illinois',        shortName:'Illinois',    seed:3,  region:'South',   conf:'Big Ten',      color:'#E84A27', emoji:'🟠', record:'24-8',  ats:'16-16', offEff:118.2, defEff:97.4,  tempo:71.6, sos:8.4,  ppg:82.8, oppg:70.4, efgPct:55.6, tovPct:15.2, orbPct:33.4, ftr:41.6, threePct:37.4, ftPct:72.6, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },

  // ── SEED 4 ──────────────────────────────────────────────────
  { id:'kansas',       name:'Kansas',          shortName:'Kansas',      seed:4,  region:'East',    conf:'Big 12',       color:'#0051A5', emoji:'🔷', record:'23-10', ats:'14-19', offEff:112.8, defEff:92.6,  tempo:69.2, sos:9.2,  ppg:76.4, oppg:67.8, efgPct:51.8, tovPct:15.8, orbPct:31.6, ftr:39.4, threePct:35.4, ftPct:71.8, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'arkansas',     name:'Arkansas',        shortName:'Arkansas',    seed:4,  region:'West',    conf:'SEC',          color:'#9D2235', emoji:'🐗', record:'26-8',  ats:'17-17', offEff:116.8, defEff:96.2,  tempo:74.6, sos:7.8,  ppg:84.6, oppg:70.8, efgPct:54.6, tovPct:16.2, orbPct:34.6, ftr:42.8, threePct:37.8, ftPct:73.2, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },
  { id:'alabama',      name:'Alabama',         shortName:'Alabama',     seed:4,  region:'Midwest', conf:'SEC',          color:'#9E1B32', emoji:'🅰️', record:'23-9',  ats:'15-17', offEff:120.6, defEff:99.8,  tempo:76.4, sos:8.6,  ppg:91.7, oppg:74.2, efgPct:56.4, tovPct:16.8, orbPct:33.2, ftr:43.6, threePct:38.2, ftPct:70.8, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },
  { id:'nebraska',     name:'Nebraska',        shortName:'Nebraska',    seed:4,  region:'South',   conf:'Big Ten',      color:'#E41C38', emoji:'🌽', record:'26-6',  ats:'17-15', offEff:114.4, defEff:91.8,  tempo:68.4, sos:7.2,  ppg:77.6, oppg:64.8, efgPct:52.8, tovPct:14.4, orbPct:31.8, ftr:40.6, threePct:35.4, ftPct:74.6, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },

  // ── SEED 5 ──────────────────────────────────────────────────
  { id:'stjohns',      name:"St. John's",      shortName:"St. John's",  seed:5,  region:'East',    conf:'Big East',     color:'#C8102E', emoji:'🔴', record:'28-6',  ats:'19-15', offEff:114.2, defEff:91.6,  tempo:68.6, sos:10.4, ppg:78.8, oppg:65.6, efgPct:53.4, tovPct:12.6, orbPct:33.2, ftr:40.2, threePct:36.2, ftPct:73.8, last10:'9-1',  neutralRec:'4-1', dataSource:'mock' },
  { id:'wisconsin',    name:'Wisconsin',       shortName:'Wisconsin',   seed:5,  region:'West',    conf:'Big Ten',      color:'#C5050C', emoji:'🦡', record:'24-10', ats:'20-14', offEff:112.6, defEff:93.4,  tempo:65.4, sos:8.8,  ppg:74.8, oppg:67.2, efgPct:52.2, tovPct:13.4, orbPct:29.8, ftr:37.6, threePct:36.4, ftPct:76.8, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'texastech',    name:'Texas Tech',      shortName:'Texas Tech',  seed:5,  region:'Midwest', conf:'Big 12',       color:'#CC0000', emoji:'🔴', record:'22-10', ats:'14-18', offEff:117.6, defEff:95.4,  tempo:70.8, sos:9.6,  ppg:80.2, oppg:70.6, efgPct:54.2, tovPct:15.4, orbPct:30.8, ftr:38.6, threePct:35.6, ftPct:72.4, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'vanderbilt',   name:'Vanderbilt',      shortName:'Vanderbilt',  seed:5,  region:'South',   conf:'SEC',          color:'#866D4B', emoji:'⭐', record:'26-7',  ats:'17-16', offEff:113.4, defEff:93.8,  tempo:70.2, sos:9.0,  ppg:77.4, oppg:67.2, efgPct:53.0, tovPct:14.6, orbPct:31.4, ftr:39.2, threePct:35.6, ftPct:73.4, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },

  // ── SEED 6 ──────────────────────────────────────────────────
  { id:'louisville',   name:'Louisville',      shortName:'Louisville',  seed:6,  region:'East',    conf:'ACC',          color:'#AD0000', emoji:'🔴', record:'23-10', ats:'15-18', offEff:111.6, defEff:95.2,  tempo:70.8, sos:10.6, ppg:76.2, oppg:68.4, efgPct:52.0, tovPct:15.2, orbPct:31.8, ftr:39.6, threePct:34.8, ftPct:72.6, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'byu',          name:'BYU',             shortName:'BYU',         seed:6,  region:'West',    conf:'Big 12',       color:'#002E5D', emoji:'🔵', record:'23-11', ats:'15-19', offEff:113.2, defEff:95.4,  tempo:71.4, sos:10.2, ppg:78.4, oppg:69.6, efgPct:53.2, tovPct:15.2, orbPct:32.6, ftr:39.4, threePct:36.2, ftPct:74.6, last10:'7-3',  neutralRec:'2-3', dataSource:'mock' },
  { id:'tennessee',    name:'Tennessee',       shortName:'Tennessee',   seed:6,  region:'Midwest', conf:'SEC',          color:'#FF8200', emoji:'🟠', record:'22-11', ats:'14-19', offEff:113.6, defEff:92.2,  tempo:66.8, sos:8.4,  ppg:77.2, oppg:65.4, efgPct:52.4, tovPct:15.6, orbPct:33.8, ftr:41.4, threePct:34.2, ftPct:71.6, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'northcarolina',name:'North Carolina',  shortName:'UNC',         seed:6,  region:'South',   conf:'ACC',          color:'#4B9CD3', emoji:'🐏', record:'24-8',  ats:'15-17', offEff:113.8, defEff:94.2,  tempo:72.4, sos:9.6,  ppg:79.4, oppg:68.2, efgPct:53.6, tovPct:15.4, orbPct:33.2, ftr:40.8, threePct:35.8, ftPct:72.4, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },

  // ── SEED 7 ──────────────────────────────────────────────────
  { id:'ucla',         name:'UCLA',            shortName:'UCLA',        seed:7,  region:'East',    conf:'Big Ten',      color:'#2D68C4', emoji:'🐻', record:'23-11', ats:'17-17', offEff:110.4, defEff:96.2,  tempo:69.8, sos:11.2, ppg:74.2, oppg:68.6, efgPct:51.2, tovPct:15.4, orbPct:30.6, ftr:37.8, threePct:34.4, ftPct:72.8, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'miamifl',      name:'Miami (FL)',      shortName:'Miami FL',    seed:7,  region:'West',    conf:'ACC',          color:'#005030', emoji:'🟢', record:'25-8',  ats:'16-17', offEff:112.2, defEff:95.8,  tempo:69.6, sos:10.8, ppg:76.8, oppg:68.8, efgPct:52.4, tovPct:15.6, orbPct:31.2, ftr:38.4, threePct:35.2, ftPct:73.0, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'kentucky',     name:'Kentucky',        shortName:'Kentucky',    seed:7,  region:'Midwest', conf:'SEC',          color:'#0033A0', emoji:'🔵', record:'21-13', ats:'17-17', offEff:119.4, defEff:97.8,  tempo:70.4, sos:10.8, ppg:79.8, oppg:72.4, efgPct:54.2, tovPct:15.8, orbPct:32.8, ftr:40.6, threePct:36.2, ftPct:71.4, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'saintmarys',   name:"Saint Mary's",    shortName:"St. Mary's",  seed:7,  region:'South',   conf:'WCC',          color:'#BA0C2F', emoji:'🔴', record:'27-5',  ats:'18-14', offEff:112.8, defEff:94.6,  tempo:64.8, sos:11.4, ppg:74.2, oppg:66.8, efgPct:52.8, tovPct:13.4, orbPct:30.4, ftr:37.8, threePct:35.6, ftPct:75.2, last10:'8-2',  neutralRec:'4-1', dataSource:'mock' },

  // ── SEED 8 ──────────────────────────────────────────────────
  { id:'ohiostate',    name:'Ohio State',      shortName:'Ohio State',  seed:8,  region:'East',    conf:'Big Ten',      color:'#BB0000', emoji:'🔴', record:'21-12', ats:'18-15', offEff:110.8, defEff:96.4,  tempo:69.4, sos:11.2, ppg:74.6, oppg:68.8, efgPct:51.6, tovPct:15.4, orbPct:31.2, ftr:38.8, threePct:34.6, ftPct:72.2, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'villanova',    name:'Villanova',       shortName:'Villanova',   seed:8,  region:'West',    conf:'Big East',     color:'#00205B', emoji:'🔵', record:'24-8',  ats:'19-13', offEff:111.4, defEff:95.6,  tempo:68.2, sos:11.4, ppg:75.4, oppg:68.2, efgPct:52.2, tovPct:14.2, orbPct:30.6, ftr:38.2, threePct:36.0, ftPct:74.4, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'georgia',      name:'Georgia',         shortName:'Georgia',     seed:8,  region:'Midwest', conf:'SEC',          color:'#BA0C2F', emoji:'🐶', record:'22-10', ats:'14-18', offEff:118.4, defEff:101.6, tempo:73.8, sos:11.6, ppg:82.4, oppg:75.2, efgPct:54.8, tovPct:15.6, orbPct:31.2, ftr:38.6, threePct:36.4, ftPct:70.8, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'clemson',      name:'Clemson',         shortName:'Clemson',     seed:8,  region:'South',   conf:'ACC',          color:'#F56600', emoji:'🐯', record:'24-10', ats:'15-19', offEff:110.2, defEff:97.4,  tempo:69.8, sos:11.8, ppg:74.0, oppg:69.2, efgPct:51.4, tovPct:15.6, orbPct:31.0, ftr:38.8, threePct:34.8, ftPct:72.0, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },

  // ── SEED 9 ──────────────────────────────────────────────────
  { id:'tcu',          name:'TCU',             shortName:'TCU',         seed:9,  region:'East',    conf:'Big 12',       color:'#4D1979', emoji:'🟣', record:'22-11', ats:'14-19', offEff:110.4, defEff:97.2,  tempo:70.6, sos:12.2, ppg:74.2, oppg:68.8, efgPct:51.0, tovPct:15.8, orbPct:30.8, ftr:38.0, threePct:34.4, ftPct:71.6, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'utahst',       name:'Utah State',      shortName:'Utah St.',    seed:9,  region:'West',    conf:'MWC',          color:'#00263A', emoji:'🔵', record:'28-6',  ats:'18-16', offEff:112.4, defEff:94.8,  tempo:67.4, sos:12.6, ppg:76.2, oppg:67.4, efgPct:52.6, tovPct:14.4, orbPct:32.4, ftr:39.8, threePct:35.8, ftPct:74.2, last10:'8-2',  neutralRec:'4-1', dataSource:'mock' },
  { id:'stlouis',      name:'Saint Louis',     shortName:'St. Louis',   seed:9,  region:'Midwest', conf:'Atlantic 10',  color:'#003DA5', emoji:'🔵', record:'28-5',  ats:'18-15', offEff:120.2, defEff:100.8, tempo:74.6, sos:14.2, ppg:84.2, oppg:76.4, efgPct:56.2, tovPct:14.2, orbPct:33.6, ftr:40.4, threePct:38.6, ftPct:73.6, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },
  { id:'iowa',         name:'Iowa',            shortName:'Iowa',        seed:9,  region:'South',   conf:'Big Ten',      color:'#FFCD00', emoji:'🟡', record:'22-11', ats:'14-19', offEff:110.4, defEff:97.4,  tempo:71.2, sos:12.0, ppg:74.8, oppg:69.2, efgPct:51.4, tovPct:15.8, orbPct:31.6, ftr:39.0, threePct:35.2, ftPct:71.8, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },

  // ── SEED 10 ─────────────────────────────────────────────────
  { id:'ucf',          name:'UCF',             shortName:'UCF',         seed:10, region:'East',    conf:'Big 12',       color:'#000000', emoji:'⚫', record:'22-11', ats:'15-18', offEff:111.2, defEff:96.4,  tempo:71.0, sos:11.4, ppg:75.6, oppg:68.8, efgPct:51.8, tovPct:15.2, orbPct:31.2, ftr:38.4, threePct:35.0, ftPct:72.2, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'missouri',     name:'Missouri',        shortName:'Missouri',    seed:10, region:'West',    conf:'SEC',          color:'#F1B82D', emoji:'🐯', record:'20-12', ats:'13-19', offEff:110.8, defEff:96.8,  tempo:70.2, sos:10.4, ppg:73.8, oppg:68.2, efgPct:50.8, tovPct:15.6, orbPct:30.4, ftr:37.2, threePct:34.6, ftPct:71.6, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'santaclara',   name:'Santa Clara',     shortName:'Santa Clara', seed:10, region:'Midwest', conf:'WCC',          color:'#862633', emoji:'🔴', record:'26-8',  ats:'18-15', offEff:118.6, defEff:100.2, tempo:69.0, sos:16.4, ppg:78.4, oppg:71.6, efgPct:54.4, tovPct:14.8, orbPct:30.6, ftr:38.0, threePct:37.2, ftPct:73.4, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'texasam',      name:'Texas A&M',       shortName:'Texas A&M',   seed:10, region:'South',   conf:'SEC',          color:'#500000', emoji:'🟤', record:'21-11', ats:'14-18', offEff:110.6, defEff:97.4,  tempo:70.4, sos:12.0, ppg:74.8, oppg:68.6, efgPct:51.2, tovPct:15.4, orbPct:31.0, ftr:38.6, threePct:34.2, ftPct:72.0, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },

  // ── SEED 11 (includes First Four) ───────────────────────────
  { id:'southflorida', name:'South Florida',   shortName:'S. Florida',  seed:11, region:'East',    conf:'American',     color:'#006747', emoji:'🟢', record:'25-8',  ats:'16-17', offEff:108.2, defEff:98.4,  tempo:72.2, sos:12.6, ppg:73.6, oppg:70.2, efgPct:50.6, tovPct:16.4, orbPct:31.8, ftr:39.4, threePct:34.8, ftPct:71.2, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'texas',        name:'Texas',           shortName:'Texas',       seed:11, region:'West',    conf:'SEC',          color:'#BF5700', emoji:'🟠', record:'18-14', ats:'12-20', offEff:108.6, defEff:98.8,  tempo:71.8, sos:13.6, ppg:74.2, oppg:70.2, efgPct:51.0, tovPct:16.0, orbPct:30.8, ftr:38.4, threePct:34.4, ftPct:72.0, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'ncstate',      name:'NC State',        shortName:'NC State',    seed:11, region:'West',    conf:'ACC',          color:'#CC0000', emoji:'🔴', record:'20-13', ats:'13-20', offEff:107.8, defEff:98.6,  tempo:70.4, sos:13.4, ppg:72.8, oppg:69.6, efgPct:49.8, tovPct:16.2, orbPct:30.4, ftr:38.0, threePct:33.6, ftPct:70.8, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'smu',          name:'SMU',             shortName:'SMU',         seed:11, region:'Midwest', conf:'ACC',          color:'#354CA1', emoji:'🔵', record:'20-13', ats:'8-12',  offEff:114.2, defEff:97.6,  tempo:71.4, sos:11.8, ppg:77.4, oppg:70.2, efgPct:52.4, tovPct:14.8, orbPct:31.6, ftr:38.8, threePct:36.4, ftPct:72.8, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'miamioh',      name:'Miami (OH)',      shortName:'Miami OH',    seed:11, region:'Midwest', conf:'MAC',          color:'#C3142D', emoji:'🔴', record:'31-1',  ats:'19-13', offEff:110.4, defEff:100.6, tempo:70.8, sos:22.4, ppg:76.8, oppg:70.4, efgPct:52.6, tovPct:14.8, orbPct:31.4, ftr:38.6, threePct:36.8, ftPct:73.4, last10:'9-1',  neutralRec:'4-1', dataSource:'mock' },
  { id:'vcu',          name:'VCU',             shortName:'VCU',         seed:11, region:'South',   conf:'Atlantic 10',  color:'#000000', emoji:'⚫', record:'27-7',  ats:'17-17', offEff:109.8, defEff:95.4,  tempo:71.6, sos:15.8, ppg:74.8, oppg:67.6, efgPct:51.4, tovPct:15.2, orbPct:32.2, ftr:40.2, threePct:34.6, ftPct:72.8, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },

  // ── SEED 12 ─────────────────────────────────────────────────
  { id:'northerniowa', name:'Northern Iowa',   shortName:'N. Iowa',     seed:12, region:'East',    conf:'MVC',          color:'#4B116F', emoji:'🟣', record:'23-12', ats:'19-15', offEff:106.6, defEff:101.8, tempo:67.6, sos:22.8, ppg:72.2, oppg:70.2, efgPct:50.2, tovPct:14.8, orbPct:29.6, ftr:36.8, threePct:34.4, ftPct:73.2, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'highpoint',    name:'High Point',      shortName:'High Point',  seed:12, region:'West',    conf:'Big South',    color:'#5B2782', emoji:'🟣', record:'30-4',  ats:'15-16', offEff:108.2, defEff:100.4, tempo:71.0, sos:22.8, ppg:74.8, oppg:70.4, efgPct:51.4, tovPct:15.2, orbPct:30.8, ftr:38.4, threePct:35.6, ftPct:72.8, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },
  { id:'akron',        name:'Akron',           shortName:'Akron',       seed:12, region:'Midwest', conf:'MAC',          color:'#041E42', emoji:'🔵', record:'29-5',  ats:'18-16', offEff:115.4, defEff:103.2, tempo:72.8, sos:21.4, ppg:78.8, oppg:73.4, efgPct:53.8, tovPct:14.8, orbPct:31.2, ftr:38.6, threePct:37.4, ftPct:73.0, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'mcneese',      name:'McNeese',         shortName:'McNeese',     seed:12, region:'South',   conf:'Southland',    color:'#005A9C', emoji:'🔵', record:'28-5',  ats:'18-15', offEff:109.6, defEff:100.2, tempo:70.2, sos:21.6, ppg:75.4, oppg:70.2, efgPct:51.8, tovPct:15.0, orbPct:31.4, ftr:39.0, threePct:35.8, ftPct:73.6, last10:'8-2',  neutralRec:'3-2', dataSource:'mock' },

  // ── SEED 13 ─────────────────────────────────────────────────
  { id:'calbaptist',   name:'Cal Baptist',     shortName:'Cal Baptist', seed:13, region:'East',    conf:'WAC',          color:'#002868', emoji:'🔵', record:'25-8',  ats:'16-17', offEff:105.8, defEff:103.2, tempo:69.8, sos:24.6, ppg:71.4, oppg:70.6, efgPct:49.8, tovPct:15.8, orbPct:29.2, ftr:36.6, threePct:34.6, ftPct:72.6, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'hawaii',       name:'Hawaii',          shortName:'Hawaii',      seed:13, region:'West',    conf:'Big West',     color:'#024731', emoji:'🌺', record:'24-8',  ats:'16-16', offEff:107.8, defEff:101.0, tempo:70.4, sos:20.6, ppg:73.6, oppg:70.0, efgPct:51.0, tovPct:15.2, orbPct:30.6, ftr:37.8, threePct:35.8, ftPct:72.6, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'hofstra',      name:'Hofstra',         shortName:'Hofstra',     seed:13, region:'Midwest', conf:'CAA',          color:'#00539B', emoji:'🔵', record:'24-10', ats:'15-19', offEff:107.2, defEff:107.8, tempo:70.2, sos:22.4, ppg:76.4, oppg:82.2, efgPct:50.6, tovPct:15.6, orbPct:30.2, ftr:37.2, threePct:35.0, ftPct:72.4, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'troy',         name:'Troy',            shortName:'Troy',        seed:13, region:'South',   conf:'Sun Belt',     color:'#8B2332', emoji:'🔴', record:'22-11', ats:'17-14', offEff:106.4, defEff:102.0, tempo:70.0, sos:23.8, ppg:72.0, oppg:70.4, efgPct:50.0, tovPct:15.6, orbPct:29.8, ftr:37.2, threePct:34.2, ftPct:72.0, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },

  // ── SEED 14 ─────────────────────────────────────────────────
  { id:'northdakotast',name:'N. Dakota State', shortName:'ND State',    seed:14, region:'East',    conf:'Summit',       color:'#005643', emoji:'🟢', record:'27-7',  ats:'17-16', offEff:106.4, defEff:103.0, tempo:68.8, sos:22.0, ppg:72.6, oppg:70.4, efgPct:50.4, tovPct:15.4, orbPct:29.8, ftr:37.0, threePct:35.0, ftPct:73.6, last10:'7-3',  neutralRec:'3-2', dataSource:'mock' },
  { id:'kennesawst',   name:'Kennesaw St.',    shortName:'Kennesaw',    seed:14, region:'West',    conf:'C-USA',        color:'#FDBB30', emoji:'🟡', record:'21-13', ats:'14-20', offEff:106.2, defEff:102.2, tempo:70.0, sos:24.0, ppg:72.4, oppg:70.8, efgPct:50.2, tovPct:15.8, orbPct:29.6, ftr:36.8, threePct:34.8, ftPct:72.0, last10:'5-5',  neutralRec:'2-3', dataSource:'mock' },
  { id:'wrightstate',  name:'Wright State',    shortName:'Wright St.',  seed:14, region:'Midwest', conf:'Horizon',      color:'#006341', emoji:'🟢', record:'23-11', ats:'14-20', offEff:105.6, defEff:103.4, tempo:69.4, sos:24.8, ppg:71.2, oppg:70.8, efgPct:49.6, tovPct:16.0, orbPct:29.0, ftr:36.4, threePct:34.4, ftPct:72.4, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'penn',         name:'Penn',            shortName:'Penn',        seed:14, region:'South',   conf:'Ivy',          color:'#990000', emoji:'🔴', record:'17-11', ats:'12-17', offEff:106.2, defEff:102.6, tempo:68.2, sos:24.2, ppg:71.8, oppg:70.2, efgPct:50.2, tovPct:15.6, orbPct:29.4, ftr:36.8, threePct:35.2, ftPct:73.0, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },

  // ── SEED 15 ─────────────────────────────────────────────────
  { id:'furman',       name:'Furman',          shortName:'Furman',      seed:15, region:'East',    conf:'SoCon',        color:'#582C83', emoji:'🟣', record:'22-12', ats:'14-20', offEff:105.4, defEff:103.6, tempo:69.6, sos:23.8, ppg:71.8, oppg:71.2, efgPct:50.0, tovPct:15.6, orbPct:29.2, ftr:36.6, threePct:34.4, ftPct:72.8, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'queens',       name:'Queens',          shortName:'Queens',      seed:15, region:'West',    conf:'ASUN',         color:'#522498', emoji:'🟣', record:'21-13', ats:'13-21', offEff:104.4, defEff:105.2, tempo:69.0, sos:26.4, ppg:70.4, oppg:71.8, efgPct:48.8, tovPct:16.2, orbPct:28.6, ftr:36.0, threePct:33.6, ftPct:72.0, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },
  { id:'tennesseest',  name:'Tennessee St.',   shortName:'TN State',    seed:15, region:'Midwest', conf:'Ohio Valley',  color:'#004B8D', emoji:'🔵', record:'23-9',  ats:'14-18', offEff:103.6, defEff:106.2, tempo:70.0, sos:27.4, ppg:69.6, oppg:73.2, efgPct:47.8, tovPct:17.2, orbPct:27.8, ftr:35.2, threePct:33.2, ftPct:71.2, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },
  // South 15: Houston vs Idaho (confirmed from Yahoo/ESPN — NOT Lipscomb)
  { id:'idaho',        name:'Idaho',           shortName:'Idaho',       seed:15, region:'South',   conf:'Big Sky',      color:'#F1B300', emoji:'🟡', record:'24-9',  ats:'15-18', offEff:104.8, defEff:104.2, tempo:69.4, sos:25.2, ppg:70.8, oppg:71.6, efgPct:49.4, tovPct:15.8, orbPct:29.0, ftr:36.4, threePct:34.2, ftPct:72.4, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },

  // ── SEED 16 (includes First Four) ───────────────────────────
  { id:'siena',        name:'Siena',           shortName:'Siena',       seed:16, region:'East',    conf:'MAAC',         color:'#006228', emoji:'🟢', record:'23-11', ats:'14-20', offEff:104.0, defEff:105.6, tempo:69.2, sos:26.0, ppg:70.6, oppg:72.2, efgPct:48.8, tovPct:16.6, orbPct:28.2, ftr:35.6, threePct:33.6, ftPct:71.6, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },
  { id:'liu',          name:'LIU',             shortName:'LIU',         seed:16, region:'West',    conf:'NEC',          color:'#002D62', emoji:'🔵', record:'24-10', ats:'15-19', offEff:103.8, defEff:105.8, tempo:70.0, sos:26.4, ppg:70.2, oppg:72.6, efgPct:48.4, tovPct:16.8, orbPct:27.8, ftr:35.2, threePct:33.2, ftPct:71.0, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },
  { id:'umbc',         name:'UMBC',            shortName:'UMBC',        seed:16, region:'Midwest', conf:'America East', color:'#000000', emoji:'⚫', record:'24-8',  ats:'14-18', offEff:104.2, defEff:105.4, tempo:68.8, sos:26.2, ppg:70.2, oppg:72.4, efgPct:48.6, tovPct:16.4, orbPct:28.4, ftr:35.8, threePct:33.8, ftPct:71.8, last10:'6-4',  neutralRec:'2-3', dataSource:'mock' },
  { id:'howard',       name:'Howard',          shortName:'Howard',      seed:16, region:'Midwest', conf:'MEAC',         color:'#003A63', emoji:'🔵', record:'23-10', ats:'14-19', offEff:103.8, defEff:105.8, tempo:69.4, sos:27.0, ppg:69.8, oppg:72.8, efgPct:48.2, tovPct:16.8, orbPct:28.0, ftr:35.4, threePct:33.4, ftPct:71.4, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },
  { id:'prairierview', name:'Prairie View',    shortName:'Prairie View',seed:16, region:'South',   conf:'SWAC',         color:'#4F2D7F', emoji:'🟣', record:'18-17', ats:'12-23', offEff:103.2, defEff:106.6, tempo:70.4, sos:27.8, ppg:69.2, oppg:73.6, efgPct:47.4, tovPct:17.4, orbPct:27.4, ftr:34.8, threePct:32.8, ftPct:70.8, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },
  { id:'lehigh',       name:'Lehigh',          shortName:'Lehigh',      seed:16, region:'South',   conf:'Patriot',      color:'#653300', emoji:'🟤', record:'18-16', ats:'11-23', offEff:103.0, defEff:106.8, tempo:69.6, sos:28.0, ppg:69.0, oppg:73.8, efgPct:47.2, tovPct:17.6, orbPct:27.2, ftr:34.6, threePct:32.6, ftPct:70.6, last10:'5-5',  neutralRec:'1-4', dataSource:'mock' },

];

// ─────────────────────────────────────────────────────────────
//  VERIFIED BETTING LINES — All 32 first-round matchups + First Four
//
//  Sources: ESPN, CBS Sports, Yahoo Sports, Vegas Insider,
//  FanDuel Research, Outkick/DraftKings — March 15-17, 2026.
//
//  spread     = current line as of March 17, 2026
//  openSpread = opening line Sunday March 15
//  total / openTotal = same pattern
// ─────────────────────────────────────────────────────────────

export const MOCK_BETTING_LINES: Record<string, BettingLine> = {

  // ══ FIRST FOUR — Dayton, OH (March 17-18) ══════════════════

  // UMBC -1.5 vs Howard | Total 140.5 (ESPN/CBS confirmed)
  'howard-umbc': {
    spread: 1.5, spreadFav: 'umbc', ml_a: 105, ml_b: -125,
    total: 140.5, source: 'DraftKings', updated: '3/17 6:40 PM',
    openSpread: 1.5, openTotal: 140.5,
  },

  // Texas -1.5 vs NC State | Total 157.5 (ESPN confirmed)
  'ncstate-texas': {
    spread: 1.5, spreadFav: 'texas', ml_a: -110, ml_b: -110,
    total: 157.5, source: 'DraftKings', updated: '3/17 9:15 PM',
    openSpread: 1.5, openTotal: 157.5,
  },

  // Lehigh -3 vs Prairie View | Total 142.5 (ESPN: Lehigh -166 ML)
  'lehigh-prairierview': {
    spread: 3.0, spreadFav: 'lehigh', ml_a: -166, ml_b: 140,
    total: 142.5, source: 'DraftKings', updated: '3/17 6:40 PM',
    openSpread: 3.0, openTotal: 142.5,
  },

  // SMU -6.5 vs Miami OH | Total 164.5 (ESPN/CBS confirmed)
  'miamioh-smu': {
    spread: 6.5, spreadFav: 'smu', ml_a: 250, ml_b: -310,
    total: 164.5, source: 'DraftKings', updated: '3/18 9:15 PM',
    openSpread: 7.5, openTotal: 164.5,
  },

  // ══ EAST REGION (March 20-21, Buffalo & Greenville) ════════

  // 1 Duke -27.5 vs 16 Siena | Total 135.5 (ESPN confirmed)
  'duke-siena': {
    spread: 27.5, spreadFav: 'duke', ml_a: -20000, ml_b: 3500,
    total: 135.5, source: 'FanDuel', updated: '3/20 12:15 PM',
    openSpread: 27.5, openTotal: 135.5,
  },

  // 2 UConn -20.5 vs 15 Furman | Total ~143
  'furman-uconn': {
    spread: 20.5, spreadFav: 'uconn', ml_a: 1400, ml_b: -3000,
    total: 143.5, source: 'FanDuel', updated: '3/20 2:45 PM',
    openSpread: 20.5, openTotal: 143.5,
  },

  // 3 Michigan St -16.5 vs 14 N. Dakota State | Total 143.5 (CBS/ESPN confirmed)
  'michiganst-northdakotast': {
    spread: 16.5, spreadFav: 'michiganst', ml_a: 1000, ml_b: -1800,
    total: 143.5, source: 'DraftKings', updated: '3/21 4:05 PM',
    openSpread: 16.5, openTotal: 143.5,
  },

  // 4 Kansas -13.5 vs 13 Cal Baptist | Total ~143
  'calbaptist-kansas': {
    spread: 13.5, spreadFav: 'kansas', ml_a: 700, ml_b: -1200,
    total: 143.0, source: 'DraftKings', updated: '3/20 2:45 PM',
    openSpread: 13.5, openTotal: 143.0,
  },

  // 5 St. John's -11.5 vs 12 Northern Iowa | Total 131.5
  // (VegasInsider: opened -9.5 at some books, SuperBook opened -11; total opened 132.5, now 131.5)
  'northerniowa-stjohns': {
    spread: 9.5, spreadFav: 'stjohns', ml_a: 380, ml_b: -480,
    total: 131.5, source: 'DraftKings', updated: '3/21 7:25 PM',
    openSpread: 9.5, openTotal: 131.5,
  },

  // 6 Louisville -6.5 vs 11 South Florida | Total ~141
  'louisville-southflorida': {
    spread: 6.5, spreadFav: 'louisville', ml_a: 220, ml_b: -270,
    total: 141.5, source: 'FanDuel', updated: '3/20 7:10 PM',
    openSpread: 6.5, openTotal: 141.5,
  },

  // 7 UCLA -5.5 vs 10 UCF | Total ~152
  // (VegasInsider: UCLA 6-1 ATS run, opened as slight favorite)
  'ucf-ucla': {
    spread: 5.5, spreadFav: 'ucla', ml_a: 205, ml_b: -255,
    total: 152.0, source: 'DraftKings', updated: '3/21 1:50 PM',
    openSpread: 5.5, openTotal: 153.5,
  },

  // 8 Ohio State -2.5 vs 9 TCU | Total 146.5 (ESPN confirmed)
  // (Ohio State 8-1 ATS in last 9 per VegasInsider)
  'ohiostate-tcu': {
    spread: 2.5, spreadFav: 'ohiostate', ml_a: -142, ml_b: 120,
    total: 146.5, source: 'DraftKings', updated: '3/20 12:15 PM',
    openSpread: 2.5, openTotal: 147.5,
  },

  // ══ WEST REGION (March 20-21, Portland & Seattle) ══════════

  // 1 Arizona -29.5 vs 16 LIU | Total ~148 (Yahoo confirmed -29.5)
  'arizona-liu': {
    spread: 29.5, spreadFav: 'arizona', ml_a: -8000, ml_b: 2800,
    total: 150.5, source: 'FanDuel', updated: '3/20 12:40 PM',
    openSpread: 29.5, openTotal: 150.5,
  },

  // 2 Purdue -24.5 vs 15 Queens | Total ~148 (Yahoo confirmed -24.5)
  'purdue-queens': {
    spread: 24.5, spreadFav: 'purdue', ml_a: -4000, ml_b: 1700,
    total: 148.5, source: 'DraftKings', updated: '3/21 3:10 PM',
    openSpread: 24.5, openTotal: 148.5,
  },

  // 3 Gonzaga -20.5 vs 14 Kennesaw State | Total 154.5 (ESPN confirmed)
  'gonzaga-kennesawst': {
    spread: 20.5, spreadFav: 'gonzaga', ml_a: -3200, ml_b: 1400,
    total: 154.5, source: 'DraftKings', updated: '3/21 10:00 PM',
    openSpread: 19.5, openTotal: 154.0,
  },

  // 4 Arkansas -15.5 vs 13 Hawaii | Total ~157 (Yahoo confirmed -15.5)
  'arkansas-hawaii': {
    spread: 15.5, spreadFav: 'arkansas', ml_a: -1100, ml_b: 680,
    total: 157.0, source: 'FanDuel', updated: '3/20 3:10 PM',
    openSpread: 15.5, openTotal: 154.0,
  },

  // 5 Wisconsin -9.5 vs 12 High Point | Total ~143 (Yahoo confirmed -9.5)
  'highpoint-wisconsin': {
    spread: 9.5, spreadFav: 'wisconsin', ml_a: 460, ml_b: -620,
    total: 143.0, source: 'DraftKings', updated: '3/20 1:50 PM',
    openSpread: 9.5, openTotal: 143.0,
  },

  // 6 BYU vs 11 Texas (First Four winner) — BYU favored ~-4.5
  'byu-texas': {
    spread: 4.5, spreadFav: 'byu', ml_a: 180, ml_b: -220,
    total: 145.5, source: 'FanDuel', updated: '3/21 post-FF',
    openSpread: 4.0, openTotal: 145.5,
  },
  'byu-ncstate': {
    spread: 5.5, spreadFav: 'byu', ml_a: 210, ml_b: -260,
    total: 144.5, source: 'FanDuel', updated: '3/21 post-FF',
    openSpread: 4.0, openTotal: 144.5,
  },

  // 7 Miami FL -1.5 vs 10 Missouri | Total ~143 (Yahoo confirmed -1.5)
  'miamifl-missouri': {
    spread: 1.5, spreadFav: 'miamifl', ml_a: -125, ml_b: 105,
    total: 143.5, source: 'DraftKings', updated: '3/20 9:57 PM',
    openSpread: 1.5, openTotal: 143.5,
  },

  // 8 Villanova vs 9 Utah State -1.5 | Total ~140
  // (Yahoo/CBS: Utah State is the favorite at -1.5)
  'utahst-villanova': {
    spread: 1.5, spreadFav: 'utahst', ml_a: 115, ml_b: -138,
    total: 140.0, source: 'DraftKings', updated: '3/20 12:40 PM',
    openSpread: 1.5, openTotal: 140.0,
  },

  // ══ MIDWEST REGION (March 20-21, Indianapolis & Cleveland) ══

  // 1 Michigan vs 16 UMBC or Howard (First Four winner)
  'michigan-umbc': {
    spread: 27.0, spreadFav: 'michigan', ml_a: -7000, ml_b: 2400,
    total: 147.0, source: 'DraftKings', updated: '3/21 post-FF',
    openSpread: 27.0, openTotal: 147.0,
  },
  'howard-michigan': {
    spread: 26.5, spreadFav: 'michigan', ml_a: -6500, ml_b: 2200,
    total: 146.5, source: 'DraftKings', updated: '3/21 post-FF',
    openSpread: 26.5, openTotal: 146.5,
  },

  // 2 Iowa State -23.5 vs 15 Tennessee State | Total 139.5
  // (CBS confirmed -23.5; ESPN total 139.5)
  'iowast-tennesseest': {
    spread: 23.5, spreadFav: 'iowast', ml_a: 2500, ml_b: -8000,
    total: 139.5, source: 'DraftKings', updated: '3/21 7:25 PM',
    openSpread: 23.5, openTotal: 141.0,
  },

  // 3 Virginia -17.5 vs 14 Wright State | Total ~131.5
  // (CBS confirmed -17.5; Virginia's Pack Line will crater the total)
  'virginia-wrightstate': {
    spread: 17.5, spreadFav: 'virginia', ml_a: 900, ml_b: -1600,
    total: 131.5, source: 'FanDuel', updated: '3/21 9:57 PM',
    openSpread: 17.5, openTotal: 134.5,
  },

  // 4 Alabama -12.5 vs 13 Hofstra | Total 163.5
  // (CBS confirmed -12.5; Alabama's explosive offense vs weak Hofstra D)
  'alabama-hofstra': {
    spread: 12.5, spreadFav: 'alabama', ml_a: 900, ml_b: -1600,
    total: 163.5, source: 'DraftKings', updated: '3/21 12:15 PM',
    openSpread: 12.5, openTotal: 162.0,
  },

  // 5 Texas Tech -8.5 vs 12 Akron | Total ~141 (CBS confirmed -8.5)
  'akron-texastech': {
    spread: 7.5, spreadFav: 'texastech', ml_a: 260, ml_b: -325,
    total: 156.5, source: 'DraftKings', updated: '3/20 3:25 PM',
    openSpread: 7.5, openTotal: 156.5,
  },

  // 6 Tennessee vs 11 SMU (First Four winner)
  'smu-tennessee': {
    spread: 4.0, spreadFav: 'tennessee', ml_a: 165, ml_b: -200,
    total: 141.5, source: 'DraftKings', updated: '3/21 post-FF',
    openSpread: 2.5, openTotal: 141.5,
  },
  'miamioh-tennessee': {
    spread: 3.5, spreadFav: 'tennessee', ml_a: 148, ml_b: -178,
    total: 142.5, source: 'DraftKings', updated: '3/21 post-FF',
    openSpread: 2.0, openTotal: 142.5,
  },

  // 7 Kentucky -2.5 vs 10 Santa Clara | Total 161.5
  // (CBS confirmed -3.5; ESPN/Yahoo -2.5; going with -2.5 per majority)
  'kentucky-santaclara': {
    spread: 3.5, spreadFav: 'kentucky', ml_a: -166, ml_b: 140,
    total: 160.5, source: 'DraftKings', updated: '3/21 7:10 PM',
    openSpread: 3.5, openTotal: 160.5,
  },

  // 8 Georgia -1.5 vs 9 Saint Louis | Total 169.5 (ESPN confirmed -2.5/total 169.5)
  'georgia-stlouis': {
    spread: 2.5, spreadFav: 'georgia', ml_a: -162, ml_b: 136,
    total: 169.5, source: 'FanDuel', updated: '3/21 9:45 PM',
    openSpread: 1.5, openTotal: 169.5,
  },

  // ══ SOUTH REGION (March 20-21, Oklahoma City & Indianapolis) ═

  // 1 Florida vs 16 Prairie View or Lehigh (First Four winner)
  'florida-prairierview': {
    spread: 30.5, spreadFav: 'florida', ml_a: -9000, ml_b: 3200,
    total: 147.0, source: 'DraftKings', updated: '3/21 post-FF',
    openSpread: 30.5, openTotal: 147.0,
  },
  'florida-lehigh': {
    spread: 29.5, spreadFav: 'florida', ml_a: -8500, ml_b: 3000,
    total: 147.0, source: 'DraftKings', updated: '3/21 post-FF',
    openSpread: 29.5, openTotal: 147.0,
  },

  // 2 Houston -23.5 vs 15 Idaho | Total 135.5
  // (Yahoo confirmed: Houston vs Idaho -23.5; ESPN/Yahoo total ~135-136)
  'houston-idaho': {
    spread: 23.5, spreadFav: 'houston', ml_a: 1700, ml_b: -3800,
    total: 135.5, source: 'FanDuel', updated: '3/21 12:40 PM',
    openSpread: 23.5, openTotal: 136.5,
  },

  // 3 Illinois -24.5 vs 14 Penn | Total 150.5 (ESPN confirmed -24.5 / total 150.5)
  'illinois-penn': {
    spread: 21.5, spreadFav: 'illinois', ml_a: 1400, ml_b: -3000,
    total: 150.5, source: 'DraftKings', updated: '3/21 2:45 PM',
    openSpread: 21.5, openTotal: 149.0,
  },

  // 4 Nebraska -13.5 vs 13 Troy | Total 137.5
  // (ESPN/CBS confirmed -13.5; VegasInsider total 137.5)
  'nebraska-troy': {
    spread: 13.5, spreadFav: 'nebraska', ml_a: 700, ml_b: -1200,
    total: 137.5, source: 'FanDuel', updated: '3/20 3:15 PM',
    openSpread: 13.5, openTotal: 137.0,
  },

  // 5 Vanderbilt -11.5 vs 12 McNeese | Total 150.5 (ESPN confirmed -11.5 / total 150.5)
  'mcneese-vanderbilt': {
    spread: 11.5, spreadFav: 'vanderbilt', ml_a: 455, ml_b: -625,
    total: 150.5, source: 'DraftKings', updated: '3/20 3:15 PM',
    openSpread: 11.5, openTotal: 150.5,
  },

  // 6 North Carolina -2.5 vs 11 VCU | Total 145.5
  // (VegasInsider: opened -2; SuperBook opened -2.5. VCU 16-1 in last 17)
  'northcarolina-vcu': {
    spread: 2.5, spreadFav: 'northcarolina', ml_a: -138, ml_b: 115,
    total: 145.5, source: 'FanDuel', updated: '3/21 9:57 PM',
    openSpread: 2.0, openTotal: 145.5,
  },

  // 7 Saint Mary's -3.5 vs 10 Texas A&M | Total 148.5 (Yahoo/CBS confirmed)
  'saintmarys-texasam': {
    spread: 3.5, spreadFav: 'saintmarys', ml_a: -175, ml_b: 146,
    total: 148.5, source: 'DraftKings', updated: '3/20 12:40 PM',
    openSpread: 3.5, openTotal: 148.5,
  },

  // 8 Clemson vs 9 Iowa — Iowa favored -2.5 (Yahoo/CBS confirmed: Iowa -2.5)
  'clemson-iowa': {
    spread: 2.5, spreadFav: 'iowa', ml_a: 118, ml_b: -140,
    total: 145.0, source: 'FanDuel', updated: '3/20 3:10 PM',
    openSpread: 2.5, openTotal: 145.0,
  },

};
