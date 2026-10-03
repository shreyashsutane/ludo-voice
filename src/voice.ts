// WebRTC audio mesh. Signaling goes through the room's WebSocket ({t:'sig'}).
export class Voice{pcs=new Map<string,RTCPeerConnection>();stream?:MediaStream;ice:RTCIceServer[]=[];q:Promise<any>=Promise.resolve();
 constructor(public me:string,public send:(m:any)=>void,public onStream:(pid:string,s:MediaStream|null)=>void){}
 async start(){this.ice=(await fetch('/api/ice').then(r=>r.json())).iceServers;
  this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});this.send({t:'sig',data:{k:'hi'}});}
 mute(m:boolean){this.stream?.getAudioTracks().forEach(t=>t.enabled=!m);}
 stop(){this.stream?.getTracks().forEach(t=>t.stop());this.stream=undefined;[...this.pcs.keys()].forEach(p=>this.drop(p));}
 drop(p:string){this.pcs.get(p)?.close();this.pcs.delete(p);this.onStream(p,null);}
 peer(p:string){let pc=this.pcs.get(p);if(pc)return pc;pc=new RTCPeerConnection({iceServers:this.ice});this.pcs.set(p,pc);
  this.stream!.getTracks().forEach(t=>pc!.addTrack(t,this.stream!));
  pc.onicecandidate=e=>e.candidate&&this.send({t:'sig',to:p,data:{k:'ice',c:e.candidate}});
  pc.ontrack=e=>this.onStream(p,e.streams[0]);
  pc.onconnectionstatechange=()=>{if(pc!.connectionState==='failed')this.drop(p);};return pc;}
 onSig(from:string,d:any){this.q=this.q.then(()=>this.handle(from,d)).catch(console.warn);}
 async handle(from:string,d:any){if(!this.stream)return;
  if(d.k==='hi'){if(!d.re){this.drop(from);this.send({t:'sig',to:from,data:{k:'hi',re:true}});}
   const pc=this.peer(from);if(this.me<from&&!pc.localDescription){await pc.setLocalDescription(await pc.createOffer());this.send({t:'sig',to:from,data:{k:'offer',s:pc.localDescription}});}}
  else if(d.k==='offer'){const pc=this.peer(from);await pc.setRemoteDescription(d.s);await pc.setLocalDescription(await pc.createAnswer());this.send({t:'sig',to:from,data:{k:'answer',s:pc.localDescription}});}
  else if(d.k==='answer')await this.pcs.get(from)?.setRemoteDescription(d.s);
  else if(d.k==='ice')await this.pcs.get(from)?.addIceCandidate(d.c);}}
