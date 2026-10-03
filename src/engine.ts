// Pure Ludo rules, shared by client and server. progress: -1 yard, 0..50 track, 51..55 home column, 56 home.
export const START=[0,13,26,39], SAFE=[0,8,13,21,26,34,39,47];
export type Player={id:string;name:string;color:number;av?:string;bot?:boolean;miss?:number};
export type Game={players:Player[];tokens:number[][];turn:number;roll:number|null;last:{color:number;v:number}|null;status:'lobby'|'playing'|'done';winner:number|null;msg:string;deadline:number;gid:string;counted?:boolean};
export const newGame=():Game=>({players:[],tokens:[0,1,2,3].map(()=>[-1,-1,-1,-1]),turn:0,roll:null,last:null,status:'lobby',winner:null,msg:'',deadline:0,gid:''});
export const legal=(t:number[],r:number)=>t.map((p,i)=>(p===-1?r===6:p+r<=56)?i:-1).filter(i=>i>=0);
export const absCell=(c:number,p:number)=>p>=0&&p<=50?(START[c]+p)%52:-1;
export function doRoll(g:Game,v:number){const c=g.players[g.turn].color;g.last={color:c,v};
 if(legal(g.tokens[c],v).length){g.roll=v;g.msg='';}else{g.msg='No move';g.turn=(g.turn+1)%g.players.length;}}
export function doMove(g:Game,i:number){const c=g.players[g.turn].color,r=g.roll!;if(!legal(g.tokens[c],r).includes(i))return false;
 const n=g.tokens[c][i]===-1?0:g.tokens[c][i]+r;g.tokens[c][i]=n;let bonus=r===6;g.msg='';
 const a=absCell(c,n);
 if(a>=0&&!SAFE.includes(a))g.tokens.forEach((ts,o)=>{if(o!==c)ts.forEach((p,j)=>{if(absCell(o,p)===a){ts[j]=-1;bonus=true;g.msg='Captured!';}})});
 if(n===56)bonus=true;g.roll=null;
 if(g.tokens[c].every(p=>p===56)){g.status='done';g.winner=c;return true;}
 if(!bonus)g.turn=(g.turn+1)%g.players.length;return true;}
