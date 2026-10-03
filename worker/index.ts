import {DurableObject} from 'cloudflare:workers';
import {newGame,doRoll,doMove,legal,Game} from '../src/engine';
const AVS=['😎','🦊','🐼','🦁','🐯','🐸','👾','🤖','🙂'];
const CODE=/^[A-Z0-9]{6}$/,EMO=['😂','😎','😡','👏','😭','🔥'];
const TURN_MS=30000,BOT_MS=1500,IDLE_MS=864e5,MAX_SOCKETS=16,MAX_MSG=8192;
const SEC={'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
const rnd=(n:number)=>{const b=new Uint8Array(1),lim=256-256%n;do crypto.getRandomValues(b);while(b[0]>=lim);return b[0]%n;};
const hash=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).slice(0,8)].map(x=>x.toString(16).padStart(2,'0')).join('');
const arm=(g:Game)=>{g.deadline=Date.now()+(g.players[g.turn]?.bot?BOT_MS:TURN_MS);};
let ice:{at:number;v:any}|null=null;
async function getIce(env:any){const stun={urls:'stun:stun.cloudflare.com:3478'};
 if(!env.TURN_KEY_ID||!env.TURN_API_TOKEN)return[stun];
 if(ice&&Date.now()-ice.at<36e5)return ice.v;
 try{const r=await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,{method:'POST',headers:{Authorization:`Bearer ${env.TURN_API_TOKEN}`,'Content-Type':'application/json'},body:'{"ttl":14400}'});
  if(!r.ok)throw 0;const j:any=await r.json();const v=[stun,...([] as any[]).concat(j.iceServers)];ice={at:Date.now(),v};return v;}catch{return[stun];}}
const sameOrigin=(req:Request,u:URL)=>{const o=req.headers.get('Origin');if(!o)return false;try{return new URL(o).host===u.host;}catch{return false;}};
export default {async fetch(req:Request,env:any):Promise<Response>{try{const u=new URL(req.url);
 if(u.pathname.startsWith('/ws/')){const code=u.pathname.slice(4).toUpperCase();
  if(!CODE.test(code))return new Response('Bad room code',{status:400});
  if(req.headers.get('Upgrade')!=='websocket')return new Response('Expected WebSocket',{status:426});
  if(!sameOrigin(req,u))return new Response('Forbidden',{status:403});
  return env.ROOM.get(env.ROOM.idFromName(code)).fetch(req);}
 if(u.pathname==='/api/ice'){const site=req.headers.get('Sec-Fetch-Site');if(site&&site!=='same-origin')return new Response('Forbidden',{status:403});
  return Response.json({iceServers:await getIce(env)},{headers:SEC});}
 if(u.pathname==='/api/leaderboard'){const site=req.headers.get('Sec-Fetch-Site');if(site&&site!=='same-origin')return new Response('Forbidden',{status:403});
  const top=await (env.LB.get(env.LB.idFromName('global')) as any).top();return Response.json(top,{headers:{'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=30'}});}
 if(u.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
 return env.ASSETS.fetch(req);}catch(e){console.error(e);return new Response('Server error',{status:500});}}};
export class Room extends DurableObject{
 rl=new Map<WebSocket,number[]>();
 botTimer:any=null;
 constructor(s:any,e:any){super(s,e);s.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));}
 async fetch(_:Request){if(this.ctx.getWebSockets().length>=MAX_SOCKETS)return new Response('Room full',{status:503});
  const [c,s]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(s);return new Response(null,{status:101,webSocket:c});}
 pid(ws:WebSocket){return (ws.deserializeAttachment() as any)?.pid as string|undefined;}
 ok(ws:WebSocket){const t=Date.now(),a=(this.rl.get(ws)||[]).filter(x=>t-x<10000);a.push(t);this.rl.set(ws,a);return a.length<=120;}
 bcast(o:any){const s=JSON.stringify(o);for(const w of this.ctx.getWebSockets())try{w.send(s);}catch{}}
 plan(g:Game){
  if(this.botTimer){clearTimeout(this.botTimer);this.botTimer=null;}
  if(g.status!=='playing'||this.ctx.getWebSockets().length===0)return;
  const cur=g.players[g.turn];if(!cur)return;
  const delay=cur.bot?BOT_MS:Math.max(200,g.deadline-Date.now());
  this.botTimer=setTimeout(()=>this.step(),delay);
 }
 async step(){
  let g:Game=(await this.ctx.storage.get<Game>('g'))??newGame();
  if(g.status!=='playing')return;
  const cur=g.players[g.turn];if(!cur)return;
  if(!cur.bot){
   cur.miss=(cur.miss||0)+1;
   if(cur.miss>=2)cur.bot=true;
   g.roll=null;g.msg=`${cur.name} timed out`;
   g.turn=(g.turn+1)%g.players.length;
  }else{
   if(g.roll===null)doRoll(g,1+rnd(6));
   if(g.status==='playing'&&g.roll!==null){
    const mv=legal(g.tokens[cur.color],g.roll);
    if(mv.length>0)doMove(g,mv[rnd(mv.length)]);
   }
  }
  arm(g);
  await this.save(g);
 }
 async save(g:Game){if(g.status==='done'&&!g.counted&&g.players.length>1){g.counted=true;const E=this.env as any;try{await E.LB.get(E.LB.idFromName('global')).record(g.players.map(p=>({id:p.id,name:p.name,av:p.av||'🙂',win:p.color===g.winner})));}catch(e){console.error(e);}}
  await this.ctx.storage.put('g',g);await this.ctx.storage.setAlarm(g.status==='playing'?g.deadline:Date.now()+IDLE_MS);this.bcast({t:'state',g});this.plan(g);}
 async webSocketMessage(ws:WebSocket,raw:string|ArrayBuffer){
  if(typeof raw!=='string'||raw.length>MAX_MSG)return;
  if(!this.ok(ws)){ws.close(1008,'Rate limit');return;}
  let m:any;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
  let me=this.pid(ws);
  if(m.t==='join'){if(typeof m.key!=='string'||m.key.length<16||m.key.length>64)return;me=await hash(m.key);ws.serializeAttachment({pid:me});}
  if(!me)return;
  if(m.t==='sig'){const s=JSON.stringify({t:'sig',from:me,data:m.data});for(const o of this.ctx.getWebSockets())if(o!==ws&&(!m.to||this.pid(o)===m.to))try{o.send(s);}catch{}return;}
  if(m.t==='emo'){if(EMO.includes(m.e))this.bcast({t:'emo',pid:me,e:m.e});return;}
  if(m.t==='chat'){const txt=String(m.text||'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,60);if(txt){let g:Game=(await this.ctx.storage.get<Game>('g'))??newGame();const p=g.players.find(q=>q.id===me);this.bcast({t:'chat',pid:me,name:p?.name||'Player',text:txt,color:p?.color??0});}return;}
  let g:Game=(await this.ctx.storage.get<Game>('g'))??newGame();
  const cur=g.players[g.turn];
  if(m.t==='join'){const name=String(m.name??'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,14)||'Player';
   const p=g.players.find(q=>q.id===me);
   const av=AVS.includes(m.av)?m.av:'🙂';
   if(p){p.name=name;p.av=av;p.bot=false;p.miss=0;}
   else if(g.status==='lobby'&&g.players.length<4){const used=g.players.map(q=>q.color);g.players.push({id:me,name,av,color:[0,1,2,3].find(c=>!used.includes(c))!});}
   if(g.status==='playing'&&this.ctx.getWebSockets().length===1)arm(g);
   ws.send(JSON.stringify({t:'you',id:me}));}
  else if(m.t==='add_bot'&&g.status==='lobby'&&g.players[0]?.id===me&&g.players.length<4){
   const used=g.players.map(q=>q.color);const color=[0,1,2,3].find(c=>!used.includes(c))!;
   const BOT_NAMES=['Nova Bot','Apex Bot','Cyber Bot'];const bCount=g.players.filter(q=>q.bot).length;
   g.players.push({id:`bot-${color}`,name:BOT_NAMES[bCount]||`Bot ${color+1}`,av:'🤖',color,bot:true});}
  else if(m.t==='kick_bot'&&g.status==='lobby'&&g.players[0]?.id===me){
   const bIdx=[...g.players].reverse().findIndex(q=>q.bot);
   if(bIdx!==-1)g.players.splice(g.players.length-1-bIdx,1);}
  else if(m.t==='start'&&g.status==='lobby'&&g.players[0]?.id===me){
   const players=g.players.map(p=>({id:p.id,name:p.name,av:p.av,color:p.color,bot:p.bot}));
   if(players.length===1){
    const BOT_NAMES=['Nova Bot','Apex Bot','Cyber Bot'];const used=players.map(q=>q.color);
    [0,1,2,3].filter(c=>!used.includes(c)).forEach((c,idx)=>{
     players.push({id:`bot-${c}`,name:BOT_NAMES[idx],av:'🤖',color:c,bot:true});
    });}
   g={...newGame(),gid:crypto.randomUUID(),players,status:'playing'};arm(g);}
  else if(m.t==='again'&&g.status==='done'&&g.players[0]?.id===me){g={...newGame(),players:g.players.map(p=>({id:p.id,name:p.name,av:p.av,color:p.color,bot:p.bot}))};}
  else if(g.status==='playing'&&cur?.id===me){cur.bot=false;cur.miss=0;
   if(m.t==='roll'&&g.roll===null)doRoll(g,1+rnd(6));else if(m.t==='move'&&g.roll!==null&&Number.isInteger(m.i)){if(!doMove(g,m.i))return;}else return;arm(g);}
  else return;
  await this.save(g);}
 async alarm(){await this.step();}
 async webSocketClose(ws:WebSocket){this.rl.delete(ws);if(this.ctx.getWebSockets().length===0&&this.botTimer){clearTimeout(this.botTimer);this.botTimer=null;}try{ws.close();}catch{}}}
export class Leaderboard extends DurableObject{
 async record(rows:{id:string;name:string;av:string;win:boolean}[]){const m:Record<string,any>=(await this.ctx.storage.get('m'))||{};
  for(const r of rows){const e=m[r.id]||{n:r.name,av:r.av,w:0,g:0};e.n=r.name;e.av=r.av;e.g++;if(r.win)e.w++;m[r.id]=e;}
  const k=Object.keys(m);if(k.length>500){k.sort((a,b)=>m[b].w-m[a].w||m[b].g-m[a].g);k.slice(500).forEach(x=>delete m[x]);}
  await this.ctx.storage.put('m',m);}
 async top(){const m:Record<string,any>=(await this.ctx.storage.get('m'))||{};
  return Object.entries(m).map(([id,e])=>({id,...e})).sort((a,b)=>b.w-a.w||b.g-a.g||String(a.n).localeCompare(String(b.n))).slice(0,20);}}
