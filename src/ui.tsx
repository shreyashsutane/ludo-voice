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
export function initAudio(){
 try{
  ac=ac||new (window.AudioContext||(window as any).webkitAudioContext)();
  if(ac.state==='suspended')ac.resume();
 }catch{}
}
if(typeof window!=='undefined'){
 const unlock=()=>{initAudio();};
 window.addEventListener('pointerdown',unlock,{passive:true});
 window.addEventListener('touchstart',unlock,{passive:true});
 window.addEventListener('click',unlock,{passive:true});
}
export function sfx(k:'roll'|'cap'|'turn'|'win'|'step'|'chat',on:boolean){if(!on)return;try{
 initAudio();if(!ac)return;
 const t=ac.currentTime;
 if(k==='step'){
  const o1=ac.createOscillator(),g1=ac.createGain();o1.type='triangle';
  o1.frequency.setValueAtTime(620,t);o1.frequency.exponentialRampToValueAtTime(360,t+0.08);
  g1.gain.setValueAtTime(0.01,t);g1.gain.linearRampToValueAtTime(0.30,t+0.005);g1.gain.exponentialRampToValueAtTime(0.001,t+0.085);
  o1.connect(g1);g1.connect(ac.destination);o1.start(t);o1.stop(t+0.09);
  const o2=ac.createOscillator(),g2=ac.createGain();o2.type='sine';
  o2.frequency.setValueAtTime(310,t);o2.frequency.exponentialRampToValueAtTime(180,t+0.06);
  g2.gain.setValueAtTime(0.01,t);g2.gain.linearRampToValueAtTime(0.20,t+0.004);g2.gain.exponentialRampToValueAtTime(0.001,t+0.065);
  o2.connect(g2);g2.connect(ac.destination);o2.start(t);o2.stop(t+0.07);return;}
 if(k==='roll'){
  const bounces=[{o:0.00,g:0.28,f:880,w:420},{o:0.065,g:0.22,f:1080,w:360},{o:0.13,g:0.17,f:760,w:480},{o:0.19,g:0.12,f:950,w:320},{o:0.25,g:0.07,f:820,w:390}];
  const len=Math.floor(ac.sampleRate*0.035),nb=ac.createBuffer(1,len,ac.sampleRate),d=nb.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*0.35));
  bounces.forEach(b=>{
   const bt=t+b.o;
   const src=ac!.createBufferSource(),bf=ac!.createBiquadFilter(),bg=ac!.createGain();
   src.buffer=nb;bf.type='bandpass';bf.frequency.setValueAtTime(b.f,bt);bf.Q.value=2.0;
   bg.gain.setValueAtTime(b.g*0.65,bt);bg.gain.exponentialRampToValueAtTime(0.001,bt+0.032);
   src.connect(bf);bf.connect(bg);bg.connect(ac!.destination);src.start(bt);
   const wo=ac!.createOscillator(),wg=ac!.createGain();wo.type='triangle';
   wo.frequency.setValueAtTime(b.w,bt);wo.frequency.exponentialRampToValueAtTime(b.w*0.65,bt+0.038);
   wg.gain.setValueAtTime(0.01,bt);wg.gain.linearRampToValueAtTime(b.g*0.85,bt+0.003);wg.gain.exponentialRampToValueAtTime(0.001,bt+0.04);
   wo.connect(wg);wg.connect(ac!.destination);wo.start(bt);wo.stop(bt+0.042);});return;}
 if(k==='turn'){
  [[783.99,0],[1046.50,0.14]].forEach(([freq,offset])=>{
   const o=ac!.createOscillator(),g=ac!.createGain();o.type='sine';o.frequency.value=freq;
   g.gain.setValueAtTime(0.01,t+offset);g.gain.linearRampToValueAtTime(0.22,t+offset+0.015);g.gain.exponentialRampToValueAtTime(0.001,t+offset+0.42);
   o.connect(g);g.connect(ac!.destination);o.start(t+offset);o.stop(t+offset+0.45);});return;}
 if(k==='cap'){
  const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';
  o.frequency.setValueAtTime(520,t);o.frequency.exponentialRampToValueAtTime(220,t+0.12);
  g.gain.setValueAtTime(0.01,t);g.gain.linearRampToValueAtTime(0.25,t+0.005);g.gain.exponentialRampToValueAtTime(0.001,t+0.13);
  o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+0.14);return;}
 if(k==='win'){
  [[523.25,0],[659.25,0.11],[783.99,0.22],[987.77,0.33],[1046.50,0.46]].forEach(([freq,offset])=>{
   const o=ac!.createOscillator(),g=ac!.createGain();o.type='sine';o.frequency.value=freq;
   g.gain.setValueAtTime(0.01,t+offset);g.gain.linearRampToValueAtTime(0.20,t+offset+0.012);g.gain.exponentialRampToValueAtTime(0.001,t+offset+0.40);
   o.connect(g);g.connect(ac!.destination);o.start(t+offset);o.stop(t+offset+0.42);});return;}
 if(k==='chat'){
  const o=ac.createOscillator(),g=ac.createGain();o.type='sine';
  o.frequency.setValueAtTime(520,t);o.frequency.exponentialRampToValueAtTime(840,t+0.07);
  g.gain.setValueAtTime(0.01,t);g.gain.linearRampToValueAtTime(0.20,t+0.005);g.gain.exponentialRampToValueAtTime(0.001,t+0.08);
  o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+0.09);return;}}catch{}}
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
