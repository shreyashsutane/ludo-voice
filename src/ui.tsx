import {useEffect,useState} from 'react';
export const AV=['😎','🦊','🐼','🦁','🐯','🐸','👾','🤖'];
export const THEMES=[{n:'Neon Night',p:0,bg:'#0e1626',cell:'#eef4ff',line:'#26365a'},{n:'Sunset',p:150,bg:'#2a1420',cell:'#ffe9d6',line:'#7a3552'},{n:'Forest',p:300,bg:'#0f2218',cell:'#e6f5df',line:'#2f6a45'},{n:'Midnight Gold',p:500,bg:'#14120a',cell:'#fff3c4',line:'#8a6d1a'}];
export type Stats={games:number;wins:number;coins:number;av:string;theme:number;owned:number[]};
export type Cfg={sound:boolean;vibe:boolean;automove:boolean};
const parse=(k:string)=>{try{return JSON.parse(localStorage.getItem(k)||'{}');}catch{return{};}};
export const loadStats=():Stats=>({games:0,wins:0,coins:0,av:AV[0],theme:0,owned:[0],...parse('st')});
export const loadCfg=():Cfg=>({sound:true,vibe:true,automove:true,...parse('cfg')});
export const level=(s:Stats)=>{const xp=s.games*10+s.wins*40,l=Math.floor(Math.sqrt(xp/20))+1,lo=(l-1)**2*20,hi=l*l*20;return{l,pct:Math.round((xp-lo)/(hi-lo)*100)};};
let ac:AudioContext|undefined;
export function sfx(k:'roll'|'cap'|'turn'|'win'|'step',on:boolean){if(!on)return;try{
 ac=ac||new (window.AudioContext||(window as any).webkitAudioContext)();
 if(ac.state==='suspended'){ac.resume();}
 const t=ac.currentTime;
 if(k==='step'){
  const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';
  o.frequency.setValueAtTime(680,t);o.frequency.exponentialRampToValueAtTime(320,t+0.07);
  g.gain.setValueAtTime(.28,t);g.gain.exponentialRampToValueAtTime(.001,t+0.07);
  o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+0.07);return;}
 const seq:number[][]={roll:[[280,.05],[420,.05],[560,.06]],cap:[[580,.08],[300,.14]],turn:[[660,.08],[880,.12]],win:[[523,.1],[659,.1],[784,.15],[1046,.25]]}[k]||[];
 let cur=t;for(const [f,d] of seq){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(.18,cur);g.gain.exponentialRampToValueAtTime(.001,cur+d);o.connect(g);g.connect(ac.destination);o.start(cur);o.stop(cur+d);cur+=d;}}catch{}}
const TABS=[['home','🏠','Home'],['profile','👤','Profile'],['shop','🛍','Shop'],['ranks','🏆','Ranks'],['settings','⚙️','Settings']];
export const TabBar=({tab,set}:{tab:string;set:(t:string)=>void})=><nav className="tabs">{TABS.map(([k,i,l])=><button key={k} className={tab===k?'on':''} onClick={()=>set(k)}><span>{i}</span>{l}</button>)}</nav>;
export function Profile({st,setSt,name,setName}:{st:Stats;setSt:(s:Stats)=>void;name:string;setName:(n:string)=>void}){const L=level(st);
 return<div><h2>Profile</h2><div className="hero"><div className="av big">{st.av}</div><input value={name} maxLength={14} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
  <div className="avs">{AV.map(a=><button key={a} className={a===st.av?'on':''} onClick={()=>setSt({...st,av:a})}>{a}</button>)}</div>
  <div className="lvl"><b>Level {L.l}</b><div className="bar2"><i style={{width:L.pct+'%'}}/></div></div>
  <div className="stats"><div><b>{st.games}</b>Games</div><div><b>{st.wins}</b>Wins</div><div><b>{st.games?Math.round(st.wins/st.games*100):0}%</b>Win rate</div><div><b>🪙 {st.coins}</b>Coins</div></div>
  <p className="sub">Stats and coins are stored on this device only.</p></div>;}
export function Shop({st,setSt}:{st:Stats;setSt:(s:Stats)=>void}){
 return<div><h2>Shop</h2><p className="sub">🪙 {st.coins} · earn 10 per game and 50 per win</p>{THEMES.map((t,i)=>{const own=st.owned.includes(i),eq=st.theme===i;
  return<div key={i} className="item"><div className="sw" style={{background:t.bg,borderColor:t.line}}><i style={{background:t.cell}}/><i style={{background:t.cell}}/><i style={{background:t.cell}}/></div>
   <div className="ci grow"><b>{t.n}</b><span>Board theme</span></div>
   <button className={eq?'alt':'cta sm'} disabled={eq||(!own&&st.coins<t.p)} onClick={()=>own?setSt({...st,theme:i}):setSt({...st,coins:st.coins-t.p,owned:[...st.owned,i],theme:i})}>{eq?'Equipped':own?'Equip':`🪙 ${t.p}`}</button></div>;})}</div>;}
export function Ranks({me}:{me:string}){const [rows,setRows]=useState<any[]|null>(null);const [bad,setBad]=useState(false);
 useEffect(()=>{fetch('/api/leaderboard').then(r=>r.json()).then(setRows).catch(()=>setBad(true));},[]);
 return<div><h2>Leaderboard</h2>{bad&&<p className="err">Could not load rankings. Check your connection.</p>}{!rows&&!bad&&<p className="sub">Loading…</p>}
  {rows&&!rows.length&&<p className="sub">No finished games yet. Win one to take the top spot.</p>}
  {rows?.map((r,i)=><div key={r.id} className={'item'+(r.id===me?' me':'')}><b className="rk">{i+1}</b><div className="av">{r.av||'🙂'}</div><div className="ci grow"><b>{r.n}</b><span>{r.g} games</span></div><b>{r.w} wins</b></div>)}</div>;}
export function Settings({cfg,setCfg,reset}:{cfg:Cfg;setCfg:(c:Cfg)=>void;reset:()=>void}){
 return<div><h2>Settings</h2>
  <label className="item"><span className="grow">Sound effects</span><input type="checkbox" checked={cfg.sound} onChange={e=>setCfg({...cfg,sound:e.target.checked})}/></label>
  <label className="item"><span className="grow">Vibrate on your turn</span><input type="checkbox" checked={cfg.vibe} onChange={e=>setCfg({...cfg,vibe:e.target.checked})}/></label>
  <label className="item"><span className="grow">Auto-move single legal token</span><input type="checkbox" checked={cfg.automove} onChange={e=>setCfg({...cfg,automove:e.target.checked})}/></label>
  <h3>How to play</h3><ul className="how"><li>Roll a 6 to bring a token out of your yard.</li><li>Finishing needs the exact roll to reach the center.</li><li>A 6, a capture or reaching home gives another roll.</li><li>Landing on an opponent sends them back, except on star and start squares.</li><li>Bring all 4 tokens home first to win.</li><li>Miss two turns and a bot plays for you until you return.</li></ul>
  <button className="alt danger" onClick={()=>confirm('Erase coins, stats and your identity on this device?')&&reset()}>Reset my data</button></div>;}
