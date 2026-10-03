import {useEffect,useRef,useState} from 'react';
import {Game,START,SAFE,legal} from './engine';import {Voice} from './voice';
import {THEMES,Stats,Cfg,loadStats,loadCfg,level,sfx,initAudio,TabBar,Profile,Shop,Ranks,Settings} from './ui';
const COL=['#ff4757','#22d37a','#3b82f6','#f5b800'],NAME=['Red','Green','Blue','Yellow'];
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
 const prev=useRef<Game|null>(null);const counted=useRef('');const cfgRef=useRef(cfg);
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
  if(newG.status==='lobby'||!tokensRef.current){
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
 useEffect(()=>{if(!room||!go)return;let dead=false,t:any,ping:any;
  const open=()=>{const w=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/${room}`);ws.current=w;
   w.onopen=()=>{setOnline(true);w.send(JSON.stringify({t:'join',key,name,av:st.av}));ping=setInterval(()=>w.readyState===1&&w.send('ping'),25000);};
   w.onmessage=e=>{if(e.data==='pong')return;const m=JSON.parse(e.data);if(m.t==='state')onStateRef.current?.(m.g);
    else if(m.t==='you'){setMyId(m.id);if(!voice.current)voice.current=new Voice(m.id,send,(p,s)=>setStreams(o=>{const n={...o};s?n[p]=s:delete n[p];return n;}));}
    else if(m.t==='sig')voice.current?.onSig(m.from,m.data);
    else if(m.t==='emo'){setEmo(o=>({...o,[m.pid]:m.e}));setTimeout(()=>setEmo(o=>{const n={...o};delete n[m.pid];return n;}),2500);}
    else if(m.t==='chat'){
     setChats(o=>[...o.slice(-20),{id:m.pid,name:m.name,text:m.text,color:m.color}]);
     setBubble(o=>({...o,[m.pid]:m.text}));
     sfx('chat',cfgRef.current.sound);
     setTimeout(()=>setBubble(o=>{const n={...o};delete n[m.pid];return n;}),3500);};};
   w.onclose=()=>{setOnline(false);clearInterval(ping);if(!dead)t=setTimeout(open,1500);};};open();
  return()=>{dead=true;clearTimeout(t);clearTimeout(animTimer.current);clearTimeout(autoTimer.current);clearTimeout(rollTimer.current);clearTimeout(landTimer.current);isAnimatingRef.current=false;ws.current?.close();voice.current?.stop();voice.current=undefined;};},[room,go]);
 useEffect(()=>{const p=prev.current;prev.current=g;if(!g||!p)return;const cur=g.players[g.turn];
  if(g.status==='done'&&p.status!=='done')sfx('win',cfg.sound);
  else if(g.status==='playing'&&g.roll!==null&&(p.roll===null||p.last!==g.last||p.turn!==g.turn)){sfx('roll',cfg.sound);startRollAnim();}
  if(g.turn!==p.turn&&cur?.id===myId&&g.status==='playing'){sfx('turn',cfg.sound);if(cfg.vibe)navigator.vibrate?.(120);}
  if(g.status==='done'&&g.gid&&counted.current!==g.gid){counted.current=g.gid;const me=g.players.find(q=>q.id===myId);
   if(me){const w=g.winner===me.color;setSt(s=>({...s,games:s.games+1,wins:s.wins+(w?1:0),coins:s.coins+10+(w?50:0)}));}}},[g]);
 useEffect(()=>{clearTimeout(autoTimer.current);if(!cfg.automove||!g||g.status!=='playing'||animating||isAnimatingRef.current)return;const cur=g.players[g.turn];if(cur?.id!==myId||g.roll===null)return;
  const myTokens=g.tokens[cur.color];const mvs=legal(myTokens,g.roll);if(mvs.length===0)return;
  const shouldAuto=mvs.length===1||(mvs.length>1&&mvs.every(i=>myTokens[i]===-1));
  if(shouldAuto){const tgt=mvs[0];autoTimer.current=setTimeout(()=>{send({t:'move',i:tgt});},280);}return()=>clearTimeout(autoTimer.current);
 },[g?.status,g?.roll,g?.turn,animating,myId,cfg.automove]);
 const enter=(r:string)=>{r=clean(r);if(!name.trim()||r.length!==6){setErr('Enter your name and a 6-character room code');return;}
  setErr('');location.hash=r;setRoom(r);setGo(true);};
 const leave=()=>{if(g?.status==='playing'&&!confirm('Leave the game? A bot will play for you.'))return;clearTimeout(animTimer.current);clearTimeout(autoTimer.current);clearTimeout(rollTimer.current);clearTimeout(landTimer.current);setRolling(false);setLanded(false);setRollFace(null);isAnimatingRef.current=false;pendingG.current=null;setAnimating(false);setStepping(null);setDispTokens(null);tokensRef.current=[0,1,2,3].map(()=>[-1,-1,-1,-1]);setGo(false);setG(null);setRoom('');setOn(false);setStreams({});location.hash='';prev.current=null;};
 const toggleVoice=async()=>{if(!voice.current){setErr('Still connecting. Try again in a moment.');return;}try{if(on){voice.current.stop();setOn(false);}else{await voice.current.start();setOn(true);setMuted(false);setErr('');}}catch{setErr('Microphone blocked. Allow mic access and retry.');}};
 const T=THEMES[st.theme]||THEMES[0],L=level(st);
 if(!g){if(go)return<div className="scr center"><div className="spin"/><p>Connecting to room {room}…</p><button className="alt" onClick={leave}>Cancel</button></div>;
  return<><div className="scr">{tab==='home'&&<div className="homev"><div className="me"><div className="av big">{st.av}</div><div className="ci"><b>{name||'Player'}</b><span>Level {L.l} · 🪙 {st.coins}</span></div></div>
   <h1>LUDO <span>ONLINE</span></h1><p className="sub">Play with friends and talk while you play. 2 to 4 players.</p>
   <input placeholder="Your name" value={name} maxLength={14} onChange={e=>setName(e.target.value)}/>
   <button className="cta" onClick={()=>enter(makeCode())}>CREATE ROOM</button>
   <div className="row"><input placeholder="Room code" defaultValue={room} id="rc" maxLength={6}/><button className="alt" onClick={()=>enter((document.getElementById('rc') as HTMLInputElement).value)}>Join</button></div>
   {err&&<p className="err">{err}</p>}</div>}
   {tab==='profile'&&<Profile st={st} setSt={setSt} name={name} setName={setName}/>}{tab==='shop'&&<Shop st={st} setSt={setSt}/>}
   {tab==='ranks'&&<Ranks me={myId}/>}{tab==='settings'&&<Settings cfg={cfg} setCfg={setCfg} reset={()=>{localStorage.clear();location.hash='';location.reload();}}/>}</div><TabBar tab={tab} set={setTab}/></>;}
 const me=g.players.find(p=>p.id===myId),cur=g.players[g.turn],mine=g.status==='playing'&&cur?.id===myId,mc=me?.color??0,host=g.players[0]?.id===myId;
 const mvs=mine&&g.roll!==null?legal(g.tokens[mc],g.roll):[];
 const isOne=mvs.length===1||(mvs.length>1&&mvs.every(i=>g.tokens[mc][i]===-1));
 const movable=!animating&&mine&&g.roll!==null?mvs:[];
 const seen:Record<string,number>={};const secs=Math.max(0,Math.ceil((g.deadline-now)/1000));
 let label='ROLL DICE',dis=true,act=()=>{initAudio();sfx('roll',cfg.sound);startRollAnim();send({t:'roll'});},cap='';
 if(g.status==='lobby'){
  const solo=g.players.length===1;
  label=host?(solo?'START (WITH BOTS)':'START GAME'):'WAITING FOR HOST';
  dis=!host;
  act=()=>send({t:'start'});
  cap=`${g.players.length}/4 joined`;
 }
 else if(g.status==='playing'){const can=!animating&&mine&&g.roll===null&&!rolling;label=can?'ROLL DICE':mine?(animating?'MOVING…':(rolling?'ROLLING…':(isOne&&cfg.automove?'AUTO-MOVING…':'PICK A TOKEN'))):`${cur.name.toUpperCase()}'S TURN`;dis=!can;cap=mine?(rolling?'Rolling dice…':(g.roll===null?'Your turn':(animating?'Moving forward…':(isOne&&cfg.automove?'Auto-moving…':'Tap a glowing token')))):`${cur.name}'s turn`;}
 else{label=host?'PLAY AGAIN':'GAME OVER';dis=!host;act=()=>send({t:'again'});cap=`${NAME[g.winner!]} wins!`;}
 const share=()=>{if(navigator.share)navigator.share({title:'Ludo Online',url:location.href}).catch(()=>{});else{navigator.clipboard?.writeText(location.href);say('Invite link copied');}};
 const cell=(x:number,y:number,f:string,k:string,star=false)=><g key={k}><rect x={x+.06} y={y+.06} width={.88} height={.88} rx={.14} fill={f} className="cell"/>{star&&<text x={x+.5} y={y+.72} fontSize=".6" textAnchor="middle" fill="#ffb020">★</text>}</g>;
 const card=(c:number)=>{const p=g.players.find(q=>q.color===c);const a=g.status==='playing'&&!!p&&cur?.id===p.id;const h=g.tokens[c].filter(x=>x===56).length;
  return<div key={c} className={'card'+(a?' act':'')+(p?'':' empty')} style={{'--c':COL[c]} as any}>{p&&bubble[p.id]&&<div className="bubble" style={{'--c':COL[c]} as any}>💬 {bubble[p.id]}</div>}<div className="av">{p?(p.av||'🙂'):'?'}</div>
   <div className="ci"><b>{p?p.name:'Waiting…'}</b><span>{p?(p.id===myId?'You · ':'')+(a?`Turn · ${secs}s`:p.bot?'Bot':`${h}/4 home`):NAME[c]}</span></div>{p&&emo[p.id]&&<i className="emo">{emo[p.id]}</i>}</div>;};
 const win=g.players.find(p=>p.color===g.winner);
 const renderTokens=dispTokens||g.tokens;
 renderTokens.forEach((ts,c)=>{if(!g.players.some(p=>p.color===c))return;ts.forEach((p,i)=>{if(p>=0&&p<56&&!(stepping?.c===c&&stepping?.i===i)){const [x,y]=pos(c,p,i);const k=x+','+y;seen[k]=(seen[k]||0)+1;}});});
 return<div className="game">{!online&&<div className="banner">Reconnecting…</div>}{toast&&<div className="toast">{toast}</div>}
  <header><button className="ic" onClick={leave} title="Leave room">←</button>
  <div className="ttl">LUDO <span>ONLINE</span><small onClick={share} style={{cursor:'pointer'}} title="Tap to share invite link">Room {room} 🔗</small></div>
  <button className={'ic'+(on?' live':'')} onClick={toggleVoice} title="Voice chat">🎙</button></header>
  {Object.entries(streams).map(([k,s])=><Audio key={k} s={s}/>)}{err&&<p className="err">{err}</p>}
  <div className="cards">{card(0)}{card(1)}</div>
  <div className="boardwrap" style={{background:T.bg,borderColor:T.line}}><svg viewBox="-0.15 -0.15 15.3 15.3" preserveAspectRatio="none">
   {[0,1,2,3].map(c=>{const [ox,oy]=yard(c);const isTurn=g.status==='playing'&&cur?.color===c;return<g key={c}>
    <rect x={ox+.5} y={oy+.5} width={5} height={5} rx={.7} fill={COL[c]} fillOpacity={isTurn?".24":".12"} stroke={COL[c]} strokeWidth={isTurn?".13":".08"} className={"glow"+(isTurn?" pulse-yard":"")} style={{color:COL[c]}}/>
    {[0,1,2,3].map(i=>{const [x,y]=pos(c,-1,i);return<circle key={i} cx={x} cy={y} r={.55} fill="#0b1220" stroke={COL[c]} strokeOpacity=".4" strokeWidth=".05"/>;})}</g>;})}
   {PATH.map(([x,y],i)=>cell(x,y,START.includes(i)?COL[START.indexOf(i)]:T.cell,'t'+i,SAFE.includes(i)&&!START.includes(i)))}
   {HOME.map((h,c)=>[0,1,2,3,4].map(k=>cell(h[0]+h[2]*k,h[1]+h[3]*k,COL[c],`h${c}${k}`)))}
   <rect x={6} y={6} width={3} height={3} rx={.38} fill="#0a101d" stroke={mine&&g.roll===null?COL[cur?.color??0]:"#253554"} strokeWidth={mine&&g.roll===null?".08":".06"}/>
   {renderTokens.map((ts,c)=>g.players.some(p=>p.color===c)&&ts.map((p,i)=>{let [x,y]=pos(c,p,i);const isHop=stepping?.c===c&&stepping?.i===i;
    const isWon=p===56;
    if(p>=0&&!isWon&&!isHop){const k=x+','+y;const tot=seen[k]||1;if(tot>1){x+=(i-1.5)*.14;y-=(i-1.5)*.14;}}
    const can=c===mc&&movable.includes(i);
    return<g key={c+'-'+i} className={'tok'+(isHop?' hop':'')} style={{transform:`translate(${x}px,${y}px)`,cursor:can?'pointer':'default'}} onClick={()=>{clearTimeout(autoTimer.current);if(can&&!animating){initAudio();sfx('step',cfg.sound);send({t:'move',i});}}}>{can&&<circle r={.5} className="ring"/>}
     <circle r={isWon?.22:(isHop?.44:.36)} fill={COL[c]} stroke={isWon?"#ffb020":"#0b1220"} strokeWidth={isWon?".04":".07"} style={{transition:'r .18s ease'}}/>
     {isWon?<text fontSize=".2" textAnchor="middle" dy=".07" fill="#fff" fontWeight="900">★</text>:<circle cx={-.1} cy={-.12} r={.12} fill="#fff" fillOpacity=".55"/>}</g>;}))}
   {(()=>{const dispV=(rolling&&rollFace)?rollFace:(g.last?.v??0);
    return<g className={"dice"+(rolling?" rolling":"")+(landed?" land":"")+(mine&&g.roll===null&&!rolling?" tap-me":"")} onClick={()=>!dis&&g.status==='playing'&&act()} style={{cursor:!dis?'pointer':'default'}}>
     <rect x={6.82} y={6.52} width={1.36} height={1.36} rx={.28} fill="#f4f8ff" stroke="#b0c4e8" strokeWidth=".03"/>
     {PIPS[dispV].map(i=><circle key={i} cx={7.13+(i%3)*.37} cy={6.83+Math.floor(i/3)*.37} r={.11} fill={g.last?COL[g.last.color]:"#16213a"}/>)}</g>;})()}
   <text x={7.5} y={8.55} fontSize=".28" fontWeight="700" textAnchor="middle" fill={mine&&g.roll===null?"#3ff0a0":"#9fb3d9"}>{cap}</text>
  </svg></div>
  <div className="cards">{card(3)}{card(2)}</div>
  {pick&&<div className="picker">{EMO.map(e=><button key={e} onClick={()=>{send({t:'emo',e});setPick(false);}}>{e}</button>)}</div>}
  <div className="bar">
   {g.status==='lobby'?(
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
   <div className="chat-list">{chats.length===0?<div style={{color:'#8ea2cc',fontSize:'.78rem',textAlign:'center',padding:'8px 0'}}>No messages yet. Send a quick chat!</div>:chats.map((c,i)=><div key={i} className="chat-item"><b style={{color:COL[c.color]}}>{c.name}:</b><span>{c.text}</span></div>)}</div>
   <form className="chat-form" onSubmit={e=>{e.preventDefault();sendChat(msg);}}><input className="chat-input" placeholder="Type a message…" value={msg} maxLength={60} onChange={e=>setMsg(e.target.value)}/><button type="submit" className="chat-send">Send</button></form></div>}
  {g.status==='done'&&<div className="modal"><div className="sheet"><div className="trophy">🏆</div><h2 style={{color:COL[g.winner!]}}>{win?.name} wins!</h2>
   {me&&<p className="sub">{g.winner===mc?'+60':'+10'} 🪙 earned</p>}{host&&<button className="cta" onClick={()=>send({t:'again'})}>PLAY AGAIN</button>}{!host&&<p className="sub">Waiting for the host to start another game…</p>}<button className="alt" onClick={leave}>Leave room</button></div></div>}</div>;}
