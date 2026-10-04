import {useEffect,useRef,useState} from 'react';
import {Game,START,SAFE,legal,doRoll,doMove,newGame} from './engine';import {Voice} from './voice';
import {useAudioActivity} from './audioMeter';
import {THEMES,AV,Stats,Cfg,loadStats,loadCfg,level,sfx,initAudio,TabBar,Profile,Shop,Ranks,Settings} from './ui';
const COL=['#ff4757','#22d37a','#3b82f6','#f5b800'],NAME=['Red','Green','Blue','Yellow'];
function PieceGraphic({shape,color,isWon,isHop}:{shape:string;color:string;isWon:boolean;isHop:boolean}){
 if(isWon)return<g><circle r={.22} fill={color} stroke="#ffb020" strokeWidth=".04"/><text fontSize=".2" textAnchor="middle" dy=".07" fill="#fff" fontWeight="900">★</text></g>;
 const s=isHop?1.2:0.96;
 if(shape==='crystal')return<g transform={`scale(${s})`}><polygon points="0,-0.44 0.35,-0.15 0.35,0.25 0,0.44 -0.35,0.25 -0.35,-0.15" fill={color} fillOpacity="0.9" stroke="#ffffff" strokeWidth="0.05"/><polygon points="0,-0.44 0.35,-0.15 0,0 -0.35,-0.15" fill="#ffffff" fillOpacity="0.45"/><polygon points="0,0 0.35,0.25 0,0.44 -0.35,0.25" fill="#000000" fillOpacity="0.32"/><circle cx="0" cy="0" r="0.09" fill="#ffffff"/></g>;
 if(shape==='reactor')return<g transform={`scale(${s})`}><circle r={0.46} fill="none" stroke={color} strokeWidth="0.06" strokeDasharray="0.3 0.16"/><circle r={0.35} fill="#0d0716" stroke={color} strokeWidth="0.04"/><circle r={0.22} fill={color}/><line x1="-0.26" y1="0" x2="0.26" y2="0" stroke="#ffffff" strokeWidth="0.04"/><line x1="0" y1="-0.26" x2="0.26" y2="0.26" stroke="#ffffff" strokeWidth="0.04"/><circle r={0.07} fill="#ffffff"/></g>;
 if(shape==='seal')return<g transform={`scale(${s})`}><circle r={0.44} fill={color} stroke="#fbbf24" strokeWidth="0.06"/><circle r={0.34} fill="#061f14" fillOpacity="0.35" stroke="#ffffff" strokeWidth="0.03" strokeOpacity="0.7"/><ellipse cx="-0.1" cy="-0.12" rx="0.14" ry="0.07" fill="#ffffff" fillOpacity="0.45"/><text fontSize="0.32" textAnchor="middle" dy="0.11" fill="#fef08a" fontWeight="900">⚜</text></g>;
 if(shape==='crown')return<g transform={`scale(${s})`}><ellipse cx="0" cy="0.02" rx="0.36" ry="0.32" fill={color}/><ellipse cx="-0.09" cy="-0.08" rx="0.14" ry="0.1" fill="#ffffff" fillOpacity="0.3"/><path d="M-0.34 0.16 L-0.3 -0.12 L-0.12 0.04 L0 -0.26 L0.12 0.04 L0.3 -0.12 L0.34 0.16 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.03"/><rect x="-0.36" y="0.15" width="0.72" height="0.15" rx="0.07" fill="#d97706" stroke="#fbbf24" strokeWidth="0.03"/><circle cx="-0.3" cy="-0.12" r="0.06" fill="#fff" stroke="#d97706" strokeWidth="0.02"/><circle cx="0" cy="-0.26" r="0.075" fill="#fff" stroke="#d97706" strokeWidth="0.02"/><circle cx="0.3" cy="-0.12" r="0.06" fill="#fff" stroke="#d97706" strokeWidth="0.02"/><circle cx="0" cy="0.02" r="0.1" fill={color} stroke="#fbbf24" strokeWidth="0.03"/><circle cx="-0.18" cy="0.22" r="0.04" fill={color}/><circle cx="0" cy="0.22" r="0.045" fill="#fff"/><circle cx="0.18" cy="0.22" r="0.04" fill={color}/></g>;
 return<g><circle r={isHop?.44:.36} fill={color} stroke="#0b1220" strokeWidth=".07" style={{transition:'r .18s ease'}}/><circle cx={-.1} cy={-.12} r={.12} fill="#fff" fillOpacity=".55"/></g>;
}
const PATH:[number,number][]=(()=>{let [x,y]=[1,6];const o:[number,number][]=[[x,y]];
 const D:any={R:[1,0],L:[-1,0],U:[0,-1],D:[0,1],a:[1,-1],b:[1,1],c:[-1,1],d:[-1,-1]};
 'R4a1U5R2D5b1R5D2L5c1D5L2U5d1L5U2'.match(/[A-Za-z]\d/g)!.forEach(s=>{for(let i=0;i<+s[1];i++){x+=D[s[0]][0];y+=D[s[0]][1];o.push([x,y]);}});return o;})();
const HOME=[[1,7,1,0],[7,1,0,1],[13,7,-1,0],[7,13,0,-1]];
const PIPS=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]],EMO=['😂','😎','😡','👏','😭','🔥'];
const QUICK=['Hello! 👋','Good game! 🤝','Well played! 👏','Roll a 6! 🎲','Nice move! 🔥','Oops! 😅'];
const yard=(c:number)=>[c===1||c===2?9:0,c>=2?9:0];
const WIN_SLOTS:[number,number][]=[[6.42,6.42],[8.58,6.42],[8.58,8.32],[6.42,8.32]];
function pos(c:number,p:number,i:number):[number,number]{
 if(p===-1){const [ox,oy]=yard(c);return[ox+2+(i%2)*2,oy+2+Math.floor(i/2)*2];}
 if(p<=50){const [x,y]=PATH[(START[c]+p)%52];return[x+.5,y+.5];}
 if(p<=55){const h=HOME[c],k=p-51;return[h[0]+h[2]*k+.5,h[1]+h[3]*k+.5];}
 const [bx,by]=WIN_SLOTS[c];return[bx+(i%2===0?-0.16:0.16),by+(i<2?-0.16:0.16)];}
const key=localStorage.lk||(localStorage.lk=crypto.randomUUID().replace(/-/g,''));
const clean=(s:string)=>s.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
const makeCode=()=>{const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';return[...crypto.getRandomValues(new Uint8Array(6))].map(x=>a[x%a.length]).join('');};
function Audio({s}:{s:MediaStream}){const r=useRef<HTMLAudioElement>(null);useEffect(()=>{r.current!.srcObject=s;},[s]);return<audio ref={r} autoPlay/>;}
export default function App(){
 const [room,setRoom]=useState(clean(location.hash.slice(1)));const [name,setName]=useState<string>(localStorage.name||'');
 const [g,setG]=useState<Game|null>(null);const [on,setOn]=useState(false);const [muted,setMuted]=useState(false);const [err,setErr]=useState('');
 const [go,setGo]=useState(false);const [myId,setMyId]=useState('');const [pick,setPick]=useState(false);const [emo,setEmo]=useState<Record<string,string>>({});
 const [chats,setChats]=useState<{id:string;name:string;text:string;color:number}[]>([]);const [bubble,setBubble]=useState<Record<string,string>>({});
 const [chatOpen,setChatOpen]=useState(false);const [msg,setMsg]=useState('');
 const [tab,setTab]=useState('home');const [st,setSt]=useState<Stats>(loadStats);const [cfg,setCfg]=useState<Cfg>(loadCfg);
 const [online,setOnline]=useState(false);const [toast,setToast]=useState('');const [now,setNow]=useState(Date.now());
 const [dispTokens,setDispTokens]=useState<number[][]|null>(null);const [stepping,setStepping]=useState<{c:number;i:number}|null>(null);
 const [animating,setAnimating]=useState(false);const animTimer=useRef<any>(null);const autoTimer=useRef<any>(null);
 const pendingG=useRef<Game|null>(null);const tokensRef=useRef<number[][]>([0,1,2,3].map(()=>[-1,-1,-1,-1]));
 const isAnimatingRef=useRef(false);const onStateRef=useRef<(g:Game)=>void>();
 const [streams,setStreams]=useState<Record<string,MediaStream>>({});const ws=useRef<WebSocket>();const voice=useRef<Voice>();
 const [offline,setOffline]=useState(false);const [passSetup,setPassSetup]=useState(false);
 const [passCount,setPassCount]=useState<2|3|4>(4);
 const [passNames,setPassNames]=useState<string[]>(['Player 1','Player 2','Player 3','Player 4']);
 const [passAvs,setPassAvs]=useState<string[]>(['😎','🦊','🐼','🦁']);
 const speaking=useAudioActivity(streams,voice.current?.stream,myId,on);
 const prev=useRef<Game|null>(null);const counted=useRef('');const cfgRef=useRef(cfg);const lastSeq=useRef(0);
 const send=(m:any)=>ws.current?.readyState===1&&ws.current.send(JSON.stringify(m));
 const sendChat=(t:string)=>{const cleanT=t.trim().slice(0,60);if(!cleanT)return;send({t:'chat',text:cleanT});setMsg('');sfx('chat',cfgRef.current.sound);};
 const [rolling,setRolling]=useState(false);const [rollFace,setRollFace]=useState<number|null>(null);
 const [landed,setLanded]=useState(false);const rollTimer=useRef<any>(null);const landTimer=useRef<any>(null);
 const startRollAnim=()=>{
  clearTimeout(rollTimer.current);clearTimeout(landTimer.current);
  setRolling(true);setLanded(false);
  const start=Date.now();
  const shuffle=()=>{
   if(Date.now()-start<420){
    setRollFace(1+Math.floor(Math.random()*6));
    rollTimer.current=setTimeout(shuffle,45);
   }else{
    setRolling(false);setRollFace(null);setLanded(true);
    landTimer.current=setTimeout(()=>setLanded(false),280);
   }
  };
  shuffle();
 };
 const say=(t:string)=>{setToast(t);setTimeout(()=>setToast(''),2200);};
 useEffect(()=>{cfgRef.current=cfg;localStorage.cfg=JSON.stringify(cfg);},[cfg]);
 useEffect(()=>{localStorage.st=JSON.stringify(st);},[st]);useEffect(()=>{localStorage.name=name;},[name]);
 useEffect(()=>{crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)).then(b=>setMyId([...new Uint8Array(b).slice(0,8)].map(x=>x.toString(16).padStart(2,'0')).join('')));},[]);
 useEffect(()=>{if(g?.status!=='playing')return;const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i);},[g?.status]);
 const onState=(newG:Game)=>{
  if(newG.seq&&lastSeq.current&&newG.seq<lastSeq.current)return;
  const seqGap=newG.seq&&lastSeq.current?(newG.seq-lastSeq.current):1;
  if(newG.seq)lastSeq.current=newG.seq;
  if(newG.status==='lobby'||!tokensRef.current||seqGap>1){
   clearTimeout(animTimer.current);pendingG.current=null;isAnimatingRef.current=false;
   tokensRef.current=newG.tokens.map(ts=>[...ts]);setDispTokens(newG.tokens.map(ts=>[...ts]));
   setStepping(null);setAnimating(false);setG(newG);return;}
  if(isAnimatingRef.current){
   pendingG.current=newG;
   return;}
  const prevTs=tokensRef.current;let moved:{c:number;i:number;from:number;to:number}|null=null;const captured:{c:number;i:number}[]=[];
  for(let c=0;c<4;c++)for(let i=0;i<4;i++){const o=prevTs[c]?.[i]??-1,n=newG.tokens[c]?.[i]??-1;if(o!==n){if((o===-1&&n===0)||n>o)moved={c,i,from:o,to:n};else if(o>=0&&n===-1)captured.push({c,i});}}
  if(!moved){
   clearTimeout(animTimer.current);isAnimatingRef.current=false;
   tokensRef.current=newG.tokens.map(ts=>[...ts]);setDispTokens(newG.tokens.map(ts=>[...ts]));
   setStepping(null);setAnimating(false);setG(newG);return;}
  clearTimeout(animTimer.current);isAnimatingRef.current=true;setAnimating(true);setStepping({c:moved.c,i:moved.i});
  setG(p=>p?{...p,roll:null,last:newG.last||p.last}:newG);
  const steps:number[]=[];if(moved.from===-1)steps.push(0);else for(let p=moved.from+1;p<=moved.to;p++)steps.push(p);
  let stepIdx=0;
  const finishAnim=()=>{
   isAnimatingRef.current=false;setStepping(null);setAnimating(false);
   tokensRef.current=newG.tokens.map(ts=>[...ts]);setDispTokens(newG.tokens.map(ts=>[...ts]));
   setG(newG);
   if(pendingG.current){const nxt=pendingG.current;pendingG.current=null;onState(nxt);}};
  const doStep=()=>{
   if(stepIdx<steps.length){const nextP=steps[stepIdx++];tokensRef.current=tokensRef.current.map((ts,c)=>c===moved!.c?ts.map((p,i)=>i===moved!.i?nextP:p):[...ts]);setDispTokens(tokensRef.current.map(ts=>[...ts]));sfx('step',cfgRef.current.sound);animTimer.current=setTimeout(doStep,210);}
   else{if(captured.length>0){animTimer.current=setTimeout(()=>{tokensRef.current=tokensRef.current.map((ts,c)=>ts.map((p,i)=>captured.some(cap=>cap.c===c&&cap.i===i)?-1:p));setDispTokens(tokensRef.current.map(ts=>[...ts]));sfx('cap',cfgRef.current.sound);animTimer.current=setTimeout(finishAnim,180);},100);}
   else{finishAnim();}}};
  animTimer.current=setTimeout(doStep,30);};
 onStateRef.current=onState;
 useEffect(()=>{if(!room||!go)return;let dead=false,t:any,ping:any,retry=0;
  const open=()=>{
   if(dead)return;
   clearTimeout(t);
   const w=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/${room}`);ws.current=w;
   w.onopen=()=>{retry=0;setOnline(true);w.send(JSON.stringify({t:'join',key,name,av:st.av}));clearInterval(ping);ping=setInterval(()=>w.readyState===1&&w.send('ping'),20000);};
   w.onmessage=e=>{if(e.data==='pong')return;const m=JSON.parse(e.data);if(m.t==='state')onStateRef.current?.(m.g);
    else if(m.t==='you'){setMyId(m.id);if(!voice.current)voice.current=new Voice(m.id,send,(p,s)=>setStreams(o=>{const n={...o};s?n[p]=s:delete n[p];return n;}));}
    else if(m.t==='sig')voice.current?.onSig(m.from,m.data);
    else if(m.t==='emo'){setEmo(o=>({...o,[m.pid]:m.e}));setTimeout(()=>setEmo(o=>{const n={...o};delete n[m.pid];return n;}),2500);}
    else if(m.t==='chat'){
     setChats(o=>[...o.slice(-20),{id:m.pid,name:m.name,text:m.text,color:m.color}]);
     setBubble(o=>({...o,[m.pid]:m.text}));
     sfx('chat',cfgRef.current.sound);
     setTimeout(()=>setBubble(o=>{const n={...o};delete n[m.pid];return n;}),3500);};};
   w.onclose=()=>{
    setOnline(false);clearInterval(ping);
    if(!dead){
     const delay=Math.min(8000,800*Math.pow(1.4,retry))+Math.random()*300;
     retry++;
     t=setTimeout(open,delay);
    }
   };
  };
  open();
  const onWake=()=>{
   if(dead)return;
   if(!ws.current||ws.current.readyState===WebSocket.CLOSED||ws.current.readyState===WebSocket.CLOSING){
    retry=0;open();
   }else if(ws.current.readyState===WebSocket.OPEN){
    ws.current.send('ping');
   }
  };
  const onVis=()=>{if(document.visibilityState==='visible')onWake();};
  document.addEventListener('visibilitychange',onVis);
  window.addEventListener('online',onWake);
  return()=>{
   dead=true;clearTimeout(t);clearInterval(ping);
   document.removeEventListener('visibilitychange',onVis);
   window.removeEventListener('online',onWake);
   clearTimeout(animTimer.current);clearTimeout(autoTimer.current);clearTimeout(rollTimer.current);clearTimeout(landTimer.current);
   isAnimatingRef.current=false;ws.current?.close();voice.current?.stop();voice.current=undefined;
  };
 },[room,go]);
 useEffect(()=>{const p=prev.current;prev.current=g;if(!g||!p)return;const cur=g.players[g.turn];
  if(g.status==='done'&&p.status!=='done')sfx('win',cfg.sound);
  else if(g.status==='playing'&&g.roll!==null&&(p.roll===null||p.last!==g.last||p.turn!==g.turn)){if(!rolling){sfx('roll',cfg.sound);startRollAnim();}}
  if(g.turn!==p.turn&&(offline||cur?.id===myId)&&g.status==='playing'){sfx('turn',cfg.sound);if(cfg.vibe)navigator.vibrate?.(120);}
  if(g.status==='done'&&g.gid&&counted.current!==g.gid){counted.current=g.gid;const me=g.players.find(q=>q.id===myId);
   if(me){const w=g.winner===me.color;setSt(s=>({...s,games:s.games+1,wins:s.wins+(w?1:0),coins:s.coins+10+(w?50:0)}));}}},[g]);
 useEffect(()=>{clearTimeout(autoTimer.current);if(!cfg.automove||!g||g.status!=='playing'||animating||isAnimatingRef.current||rolling)return;
  const cur=g.players[g.turn];if(!cur||g.roll===null)return;
  const isMyTurn=offline||cur.id===myId;if(!isMyTurn)return;
  const myTokens=g.tokens[cur.color];const mvs=legal(myTokens,g.roll);if(mvs.length===0)return;
  const shouldAuto=mvs.length===1||(mvs.length>1&&mvs.every(i=>myTokens[i]===-1));
  if(shouldAuto){const tgt=mvs[0];autoTimer.current=setTimeout(()=>{
   if(offline){setG(prevG=>{if(!prevG||prevG.status!=='playing'||prevG.roll==null)return prevG;const curP=prevG.players[prevG.turn];if(!curP)return prevG;const tok=prevG.tokens[curP.color];const valid=legal(tok,prevG.roll);if(!valid.includes(tgt))return prevG;const cl:Game=JSON.parse(JSON.stringify(prevG));doMove(cl,tgt);onState(cl);return cl;});}
   else{send({t:'move',i:tgt});}
  },320);}return()=>clearTimeout(autoTimer.current);
 },[g?.status,g?.roll,g?.turn,animating,rolling,myId,offline,cfg.automove]);
 const startPassAndPlay=()=>{
  const cols=passCount===2?[0,2]:passCount===3?[0,1,2]:[0,1,2,3];
  const plrs=cols.map((c,idx)=>({
   id:`local-${c}`,
   name:(passNames[idx]||`Player ${idx+1}`).trim()||`Player ${idx+1}`,
   av:passAvs[idx]||AV[idx%AV.length],
   color:c,
   bot:false
  }));
  const og:Game={...newGame(),gid:'offline-'+Date.now(),players:plrs,status:'playing',deadline:0};
  setOffline(true);setPassSetup(false);
  tokensRef.current=og.tokens.map(ts=>[...ts]);setDispTokens(og.tokens.map(ts=>[...ts]));
  setG(og);
 };
 const enter=(r:string)=>{r=clean(r);if(!name.trim()){setErr('Please enter your name');return;}if(r.length!==6){setErr('Invalid 6-character room code');return;}
  setErr('');location.hash=r;setRoom(r);setGo(true);};
 const leave=()=>{
  if(offline){
   if(confirm('Quit offline game?')){setOffline(false);setG(null);tokensRef.current=[0,1,2,3].map(()=>[-1,-1,-1,-1]);setDispTokens(null);}
   return;
  }
  if(g?.status==='playing'&&!confirm('Leave the game? A bot will play for you.'))return;clearTimeout(animTimer.current);clearTimeout(autoTimer.current);clearTimeout(rollTimer.current);clearTimeout(landTimer.current);setRolling(false);setLanded(false);setRollFace(null);isAnimatingRef.current=false;pendingG.current=null;setAnimating(false);setStepping(null);setDispTokens(null);tokensRef.current=[0,1,2,3].map(()=>[-1,-1,-1,-1]);setGo(false);setG(null);setRoom('');setOn(false);setStreams({});location.hash='';prev.current=null;};
 const toggleVoice=async()=>{if(!voice.current){setErr('Still connecting. Try again in a moment.');return;}try{if(on){voice.current.stop();setOn(false);}else{await voice.current.start();setOn(true);setMuted(false);setErr('');}}catch{setErr('Microphone blocked. Allow mic access and retry.');}};
 const T=THEMES[st.theme]||THEMES[0],L=level(st);
 const themeCol=T.colors||COL;
 const isInvite=!g&&!go&&room.length===6;
 if(!g){if(go)return<div className="scr center"><div className="spin"/><p>Connecting to room {room}…</p><button className="alt" onClick={leave}>Cancel</button></div>;
  return<><div className="scr">{tab==='home'&&(isInvite?(
   <div className="homev" style={{gap:'16px',paddingTop:'1vh'}}>
    <div style={{textAlign:'center'}}>
     <span className="badge-pill">🎉 GAME INVITATION</span>
     <h1 style={{marginTop:'8px',marginBottom:'2px'}}>LUDO <span>ONLINE</span></h1>
     <p className="sub">A friend has invited you to jump into a live match!</p>
    </div>
    <div className="invite-card">
     <div className="room-callout">
      <span className="lbl">ROOM CODE</span>
      <span className="code">{room}</span>
      <span className="subnote">Locked & ready to connect</span>
     </div>
     <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
      <label style={{fontSize:'.78rem',color:'#8ea2cc',fontWeight:600}}>YOUR NAME</label>
      <input placeholder="Enter your player name" value={name} maxLength={14} autoFocus onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enter(room)}/>
     </div>
     <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
       <label style={{fontSize:'.78rem',color:'#8ea2cc',fontWeight:600}}>CHOOSE AVATAR</label>
       <span style={{fontSize:'1.2rem'}}>{st.av}</span>
      </div>
      <div className="avs" style={{gridTemplateColumns:'repeat(8,1fr)',gap:'4px'}}>
       {AV.map(a=><button key={a} type="button" className={a===st.av?'on':''} onClick={()=>setSt(s=>({...s,av:a}))}>{a}</button>)}
      </div>
     </div>
     <button className="cta" style={{width:'100%',marginTop:'4px'}} onClick={()=>enter(room)}>▶ JOIN ROOM</button>
     {err&&<p className="err">{err}</p>}
    </div>
    <button className="alt" style={{background:'none',border:'none',color:'#8ea2cc',fontSize:'.82rem',textDecoration:'underline',cursor:'pointer',textAlign:'center'}} onClick={()=>{setRoom('');location.hash='';setErr('');}}>or Create your own game instead</button>
   </div>
  ):(
   <div className="homev"><div className="me"><div className="av big">{st.av}</div><div className="ci"><b>{name||'Player'}</b><span>Level {L.l} · 🪙 {st.coins}</span></div></div>
    <h1>LUDO <span>ONLINE</span></h1><p className="sub">Play with friends and talk while you play. 2 to 4 players.</p>
    {passSetup?(
     <div className="player-setup-card" style={{gap:'12px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
       <span style={{fontWeight:800,fontSize:'1.1rem'}}>📱 Pass & Play Setup</span>
       <button className="alt" style={{padding:'4px 10px',fontSize:'.78rem'}} onClick={()=>setPassSetup(false)}>✕ Cancel</button>
      </div>
      <p className="sub" style={{margin:0,fontSize:'.82rem'}}>Play with friends on 1 phone. Pass device on each turn!</p>
      <div>
       <label style={{fontSize:'.74rem',color:'#8ea2cc',fontWeight:700,display:'block',marginBottom:'6px'}}>NUMBER OF PLAYERS</label>
       <div className="pill-group">
        {([2,3,4] as const).map(n=><button key={n} type="button" className={'pill-btn'+(passCount===n?' active':'')} onClick={()=>setPassCount(n)}>{n} Players</button>)}
       </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
       {Array.from({length:passCount}).map((_,idx)=>{
        const colIdx=passCount===2?(idx===0?0:2):idx;
        return<div key={idx} style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,.04)',padding:'6px 10px',borderRadius:'10px',borderLeft:`4px solid ${COL[colIdx]}`}}>
         <span style={{fontSize:'1.3rem'}}>{passAvs[idx]||'🙂'}</span>
         <input style={{padding:'8px',fontSize:'.88rem'}} value={passNames[idx]||''} maxLength={12} placeholder={`Player ${idx+1}`} onChange={e=>{const n=[...passNames];n[idx]=e.target.value;setPassNames(n);}}/>
         <div style={{display:'flex',gap:'2px'}}>
          {['😎','🦊','🐼','🦁','🤖','👑'].slice(0,3).map(a=><button key={a} type="button" style={{background:'none',padding:'2px',fontSize:'.95rem'}} onClick={()=>{const n=[...passAvs];n[idx]=a;setPassAvs(n);}}>{a}</button>)}
         </div>
        </div>;
       })}
      </div>
      <button className="cta" style={{width:'100%',marginTop:'4px'}} onClick={startPassAndPlay}>▶ START PASS & PLAY</button>
     </div>
    ):(
     <>
      <input placeholder="Your name" value={name} maxLength={14} onChange={e=>setName(e.target.value)}/>
      <button className="cta" onClick={()=>enter(makeCode())}>CREATE ONLINE ROOM</button>
      <div className="row"><input placeholder="Room code" defaultValue={room} id="rc" maxLength={6}/><button className="alt" onClick={()=>enter((document.getElementById('rc') as HTMLInputElement).value)}>Join</button></div>
      <div style={{display:'flex',alignItems:'center',gap:'10px',margin:'4px 0'}}>
       <div style={{flex:1,height:'1px',background:'rgba(255,255,255,.1)'}}></div>
       <span style={{fontSize:'.72rem',color:'#8ea2cc',fontWeight:700,letterSpacing:'.06em'}}>OR PLAY OFFLINE</span>
       <div style={{flex:1,height:'1px',background:'rgba(255,255,255,.1)'}}></div>
      </div>
      <button className="alt" style={{border:'1.5px solid #38bdf8',background:'rgba(16,36,70,.7)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:800,fontSize:'.95rem',padding:'12px',color:'#fff'}} onClick={()=>setPassSetup(true)}>
       📱 PASS & PLAY (1 PHONE)
      </button>
      <a href="/docs" target="_blank" rel="noopener noreferrer" className="alt" style={{border:'1.5px solid rgba(168,85,247,.6)',background:'rgba(30,18,50,.7)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:700,fontSize:'.86rem',padding:'10px',color:'#e2d4f8',textDecoration:'none'}}>
       📖 OPEN SYSTEM DOCS (10 PAGES)
      </a>
     </>
    )}
    {err&&<p className="err">{err}</p>}
   </div>
  ))}
  {tab==='profile'&&<Profile st={st} setSt={setSt} name={name} setName={setName}/>}{tab==='shop'&&<Shop st={st} setSt={setSt}/>}
  {tab==='ranks'&&<Ranks me={myId}/>}{tab==='settings'&&<Settings cfg={cfg} setCfg={setCfg} reset={()=>{localStorage.clear();location.hash='';location.reload();}}/>}</div><TabBar tab={tab} set={setTab}/></>;}
 const cur=g.players[g.turn],me=offline?cur:g.players.find(p=>p.id===myId),mine=g.status==='playing'&&(offline||cur?.id===myId),mc=me?.color??cur?.color??0,host=offline||me?.id===(g.hostId||g.players[0]?.id);
 const mvs=mine&&g.roll!==null?legal(g.tokens[mc],g.roll):[];
 const isOne=mvs.length===1||(mvs.length>1&&mvs.every(i=>g.tokens[mc][i]===-1));
 const movable=!animating&&mine&&g.roll!==null?mvs:[];
 const seen:Record<string,number>={};const secs=Math.max(0,Math.ceil((g.deadline-now)/1000));
 let label='ROLL DICE',dis=true,act=()=>{
  initAudio();sfx('roll',cfg.sound);startRollAnim();
  if(offline){
   const v=1+Math.floor(Math.random()*6);
   setTimeout(()=>{setG(p=>p?(()=>{const cl:Game=JSON.parse(JSON.stringify(p));doRoll(cl,v);return cl;})():null);},420);
  }else{send({t:'roll'});}
 },cap='';
 if(g.status==='lobby'){
  const solo=g.players.length===1;
  label=host?(solo?'START (WITH BOTS)':'START GAME'):'WAITING FOR HOST';
  dis=!host;
  act=()=>send({t:'start'});
  cap=`${g.players.length}/4 joined`;
 }
 else if(g.status==='playing'){const can=!animating&&mine&&g.roll===null&&!rolling;label=can?'ROLL DICE':mine?(animating?'MOVING…':(rolling?'ROLLING…':(isOne&&cfg.automove?'AUTO-MOVING…':'PICK A TOKEN'))):`${cur.name.toUpperCase()}'S TURN`;dis=!can;cap=mine?(rolling?'Rolling dice…':(g.roll===null?'Your turn':(animating?'Moving forward…':(isOne&&cfg.automove?'Auto-moving…':'Tap a glowing token')))):`${cur.name}'s turn`;}
 else{label=host?'PLAY AGAIN':'GAME OVER';dis=!host;act=()=>{if(offline){startPassAndPlay();}else{send({t:'again'});}};cap=`${NAME[g.winner!]} wins!`;}
 const share=()=>{if(navigator.share)navigator.share({title:'Ludo Online',url:location.href}).catch(()=>{});else{navigator.clipboard?.writeText(location.href);say('Invite link copied');}};
 const cell=(x:number,y:number,f:string,k:string,star=false)=><g key={k}><rect x={x+.06} y={y+.06} width={.88} height={.88} rx={.14} fill={f} className="cell"/>{star&&<text x={x+.5} y={y+.72} fontSize=".6" textAnchor="middle" fill="#ffb020">★</text>}</g>;
 const card=(c:number)=>{const p=g.players.find(q=>q.color===c);const a=g.status==='playing'&&!!p&&cur?.id===p.id;const h=g.tokens[c].filter(x=>x===56).length;
  const isConn=offline||(p?(p.bot||(g.connected?.[p.id]!==false)):false);
  const isH=!offline&&p&&p.id===(g.hostId||g.players[0]?.id);
  const isSpk=!offline&&p&&!!speaking[p.id];
  return<div key={c} className={'card'+(a?' act':'')+(p?'':' empty')} style={{'--c':themeCol[c],...(offline&&!p?{opacity:0.28,borderStyle:'dashed'}:{})} as any}>{p&&bubble[p.id]&&<div className="bubble" style={{'--c':themeCol[c]} as any}>💬 {bubble[p.id]}</div>}<div className={'av'+(isSpk?' speaking':'')}>{p?(p.av||'🙂'):'—'}</div>
   <div className="ci"><b>{p?p.name:(offline?'Inactive Seat':'Waiting…')}{isH&&g.status==='lobby'?' 👑':''}{isSpk?<span className="wave-bars"><span></span><span></span><span></span></span>:null}</b><span>{p?(offline?(a?'Current Turn':`${h}/4 home`):(p.id===myId?'You · ':'')+(a?`Turn · ${secs}s`:!isConn?'⚡ Reconnecting…':p.bot?'Bot':`${h}/4 home`)):(offline?'Not in match':NAME[c])}</span></div>{p&&emo[p.id]&&<i className="emo">{emo[p.id]}</i>}</div>;};
 const win=g.players.find(p=>p.color===g.winner);
 const renderTokens=dispTokens||g.tokens;
 renderTokens.forEach((ts,c)=>{if(!g.players.some(p=>p.color===c))return;ts.forEach((p,i)=>{if(p>=0&&p<56&&!(stepping?.c===c&&stepping?.i===i)){const [x,y]=pos(c,p,i);const k=x+','+y;seen[k]=(seen[k]||0)+1;}});});
 return<div className="game">{!online&&!offline&&<div className="banner">Reconnecting…</div>}{toast&&<div className="toast">{toast}</div>}
  <header><button className="ic" onClick={leave} title={offline?"Exit offline game":"Leave room"}>←</button>
  <div className="ttl">{offline?(<>PASS & <span>PLAY</span><small style={{color:'#34d399'}}>📱 1 Device Offline</small></>):(<>LUDO <span>ONLINE</span><small onClick={share} style={{cursor:'pointer'}} title="Tap to share invite link">Room {room} 🔗</small></>)}</div>
  {offline?<div style={{width:'32px'}}/>:<button className={'ic'+(on?' live':'')} onClick={toggleVoice} title="Voice chat">🎙</button>}</header>
  {offline&&<div className="pass-banner" style={{'--c':themeCol[cur?.color??0]} as any}><span>👉 Turn: <b>{cur?.name}</b></span><span className="pass-pill" style={{'--c':themeCol[cur?.color??0]} as any}>Pass phone to {cur?.name}</span></div>}
  {Object.entries(streams).map(([k,s])=><Audio key={k} s={s}/>)}{err&&<p className="err">{err}</p>}
  <div className="cards">{card(0)}{card(1)}</div>
  <div className="boardwrap" style={{background:T.bg,borderColor:T.line,boxShadow:`0 8px 32px rgba(0,0,0,.7),0 0 24px ${T.glow}33`}}><svg viewBox="-0.15 -0.15 15.3 15.3" preserveAspectRatio="none">
   {[0,1,2,3].map(c=>{const [ox,oy]=yard(c);const isTurn=g.status==='playing'&&cur?.color===c;const activeP=g.players.some(p=>p.color===c);return<g key={c}>
    <rect x={ox+.5} y={oy+.5} width={5} height={5} rx={.7} fill={themeCol[c]} fillOpacity={!activeP?0.04:(isTurn?".24":".12")} stroke={themeCol[c]} strokeOpacity={!activeP?0.2:1} strokeWidth={isTurn?".13":".08"} className={"glow"+(isTurn?" pulse-yard":"")} style={{color:themeCol[c]}}/>
    {[0,1,2,3].map(i=>{const [x,y]=pos(c,-1,i);return<circle key={i} cx={x} cy={y} r={.55} fill="#0b1220" stroke={themeCol[c]} strokeOpacity={!activeP?".15":".4"} strokeWidth=".05"/>;})}</g>;})}
   {PATH.map(([x,y],i)=>cell(x,y,START.includes(i)?themeCol[START.indexOf(i)]:T.cell,'t'+i,SAFE.includes(i)&&!START.includes(i)))}
   {HOME.map((h,c)=>[0,1,2,3,4].map(k=>cell(h[0]+h[2]*k,h[1]+h[3]*k,themeCol[c],`h${c}${k}`)))}
   <rect x={6} y={6} width={3} height={3} rx={.38} fill="#0a101d" stroke={mine&&g.roll===null?themeCol[cur?.color??0]:T.line} strokeWidth={mine&&g.roll===null?".08":".06"}/>
   {renderTokens.map((ts,c)=>g.players.some(p=>p.color===c)&&ts.map((p,i)=>{let [x,y]=pos(c,p,i);const isHop=stepping?.c===c&&stepping?.i===i;
    const isWon=p===56;
    if(p>=0&&!isWon&&!isHop){const k=x+','+y;const tot=seen[k]||1;if(tot>1){x+=(i-1.5)*.14;y-=(i-1.5)*.14;}}
    const can=c===mc&&movable.includes(i);
    return<g key={c+'-'+i} className={'tok'+(isHop?' hop':'')} style={{transform:`translate(${x}px,${y}px)`,cursor:can?'pointer':'default'}} onClick={()=>{clearTimeout(autoTimer.current);if(can&&!animating){initAudio();sfx('step',cfg.sound);if(offline){setG(prevG=>{if(!prevG||prevG.status!=='playing'||prevG.roll==null)return prevG;const curP=prevG.players[prevG.turn];if(!curP)return prevG;const tok=prevG.tokens[curP.color];const valid=legal(tok,prevG.roll);if(!valid.includes(i))return prevG;const cl:Game=JSON.parse(JSON.stringify(prevG));doMove(cl,i);onState(cl);return cl;});}else{send({t:'move',i});}}}}>{can&&<circle r={.5} className="ring"/>}
     <PieceGraphic shape={T.shape} color={themeCol[c]} isWon={isWon} isHop={isHop} /></g>;}))}
   {(()=>{const dispV=(rolling&&rollFace)?rollFace:(g.last?.v??0);
    return<g className={"dice"+(rolling?" rolling":"")+(landed?" land":"")+(mine&&g.roll===null&&!rolling?" tap-me":"")} onClick={()=>!dis&&g.status==='playing'&&act()} style={{cursor:!dis?'pointer':'default'}}>
     <rect x={6.82} y={6.52} width={1.36} height={1.36} rx={.28} fill="#f4f8ff" stroke="#b0c4e8" strokeWidth=".03"/>
     {PIPS[dispV].map(i=><circle key={i} cx={7.13+(i%3)*.37} cy={6.83+Math.floor(i/3)*.37} r={.11} fill={g.last?themeCol[g.last.color]:"#16213a"}/>)}</g>;})()}
   <text x={7.5} y={8.55} fontSize=".28" fontWeight="700" textAnchor="middle" fill={mine&&g.roll===null?"#3ff0a0":"#9fb3d9"}>{cap}</text>
  </svg></div>
  <div className="cards">{card(3)}{card(2)}</div>
  {pick&&<div className="picker">{EMO.map(e=><button key={e} onClick={()=>{send({t:'emo',e});setPick(false);}}>{e}</button>)}</div>}
  <div className="bar">
   {offline?(
    <><button className="side" onClick={leave}>Exit 🚪</button>
    <button className="cta" disabled={dis} onClick={act}>{label}</button>
    <button className="side" onClick={()=>say(`Pass phone to ${cur.name}!`)}>Pass 📱</button></>
   ):g.status==='lobby'?(
    <><button className="side" onClick={()=>host&&g.players.length<4?send({t:'add_bot'}):share()}>{host&&g.players.length<4?'+ Bot 🤖':'Share 🔗'}</button>
    <button className="cta" disabled={dis} onClick={act}>{label}</button>
    <button className="side" onClick={()=>host&&g.players.some(p=>p.bot)?send({t:'kick_bot'}):share()}>{host&&g.players.some(p=>p.bot)?'- Bot ❌':'Invite 📋'}</button></>
   ):(
    <><button className="side" onClick={()=>setChatOpen(!chatOpen)}>Chat 💬</button>
    <button className="cta" disabled={dis} onClick={act}>{label}</button>
    <button className="side" onClick={()=>setPick(!pick)}>Emojis 😀</button></>
   )}
  </div>
  {chatOpen&&<div className="chat-drawer"><div className="chat-head"><span>Game Chat 💬</span><button onClick={()=>setChatOpen(false)}>✕</button></div>
   <div className="quick-chats">{QUICK.map(q=><button key={q} onClick={()=>sendChat(q)}>{q}</button>)}</div>
   <div className="chat-list">{chats.length===0?<div style={{color:'#8ea2cc',fontSize:'.78rem',textAlign:'center',padding:'8px 0'}}>No messages yet. Send a quick chat!</div>:chats.map((c,i)=><div key={i} className="chat-item"><b style={{color:themeCol[c.color]}}>{c.name}:</b><span>{c.text}</span></div>)}</div>
   <form className="chat-form" onSubmit={e=>{e.preventDefault();sendChat(msg);}}><input className="chat-input" placeholder="Type a message…" value={msg} maxLength={60} onChange={e=>setMsg(e.target.value)}/><button type="submit" className="chat-send">Send</button></form></div>}
  {g.status==='done'&&<div className="modal"><div className="sheet"><div className="trophy">🏆</div><h2 style={{color:themeCol[g.winner!]}}>{win?.name} wins!</h2>
   {!offline&&me&&<p className="sub">{g.winner===mc?'+60':'+10'} 🪙 earned</p>}
   {offline&&<p className="sub">Awesome match! Well played everyone.</p>}
   <button className="cta" onClick={act}>PLAY AGAIN</button>
   <button className="alt" onClick={leave}>{offline?'Back to Menu':'Leave room'}</button></div></div>}</div>;}
