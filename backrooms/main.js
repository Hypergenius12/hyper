import * as THREE from 'three';

const SET={fov:82,sensScale:5,volume:0.85,fogFar:30,grain:true,vignette:true,bobbing:true};

/* ═══════ RENDERER ═══════ */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.domElement.id='three';
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a0800);
scene.fog=new THREE.FogExp2(0x0a0800,0.046);
let baseFogDensity=0.046;
let baseAmbIntensity=0.12;
let baseHemiIntensity=0.20;
let sanity=1.0;

const camera=new THREE.PerspectiveCamera(SET.fov,innerWidth/innerHeight,0.05,80);
camera.position.set(48,1.64,48); // Spawn in exact center of chunk 0,0

let gameState = 'menu'; // menu, playing, dead
let currentLevel = 0;
let levelTime = 0;


addEventListener('resize',()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

/* ═══════ GRAIN ═══════ */
const grainCv=document.getElementById('grain');
const grainCtx=grainCv.getContext('2d');
let grainF=0;
function tickGrain(){
  if(!SET.grain)return;
  if(++grainF%3!==0)return;
  const id=grainCtx.createImageData(320,180),d=id.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}
  grainCtx.putImageData(id,0,0);
}

/* ═══════ AUDIO ═══════ */
class SFX{
  constructor(){
    this.ctx=null;
    this.master=null;
    this.stepCD=0;
    this.on=false;
    this.approachGain=null;
    this.approachOsc=null;
  }
  init(){
    if(this.ctx)return;
    this.ctx=new AudioContext();
    this.master=this.ctx.createGain();this.master.gain.value=SET.volume;
    this.master.connect(this.ctx.destination);

    // Continuous entity approach rumble node
    this.approachOsc=this.ctx.createOscillator();
    this.approachOsc.type='sine';
    this.approachOsc.frequency.value=52;
    const rumbleFilter=this.ctx.createBiquadFilter();
    rumbleFilter.type='lowpass';
    rumbleFilter.frequency.value=80;
    this.approachGain=this.ctx.createGain();
    this.approachGain.gain.value=0;
    this.approachOsc.connect(rumbleFilter);
    rumbleFilter.connect(this.approachGain);
    this.approachGain.connect(this.master);
    this.approachOsc.start();

    this._hum();this._drone();this._schedDist();this.on=true;
  }
  _noise(sec){
    const len=this.ctx.sampleRate*sec,buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;return buf;
  }
  _hum(){
    [[60,.022],[120,.016],[180,.01],[240,.005]].forEach(([f,a])=>{
      const osc=this.ctx.createOscillator(),g=this.ctx.createGain();
      osc.frequency.value=f+(Math.random()-.5)*.4;osc.type='sine';g.gain.value=a;
      const lfo=this.ctx.createOscillator(),lg=this.ctx.createGain();
      lfo.frequency.value=.06+Math.random()*.12;lg.gain.value=a*.1;
      lfo.connect(lg);lg.connect(g.gain);lfo.start();
      osc.connect(g);g.connect(this.master);osc.start();
    });
  }
  _drone(){
    const src=this.ctx.createBufferSource();src.buffer=this._noise(4);src.loop=true;
    const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=60;
    const g=this.ctx.createGain();g.gain.value=.06;
    src.connect(lp);lp.connect(g);g.connect(this.master);src.start();
  }
  _schedDist(){
    setTimeout(()=>{
      if(Math.random()<0.6) this._distant();
      else this._echoClank();
      this._schedDist();
    },6000+Math.random()*20000);
  }
  _distant(){
    if(!this.on)return;
    const dur=1.5+Math.random()*4,src=this.ctx.createBufferSource();src.buffer=this._noise(dur);
    const bp=this.ctx.createBiquadFilter();bp.type='bandpass';
    bp.frequency.value=80+Math.random()*800;bp.Q.value=1.2+Math.random()*4;
    const pan=this.ctx.createStereoPanner();pan.pan.value=(Math.random()-.5)*1.8;
    const g=this.ctx.createGain();
    const vol=.05+Math.random()*.1,now=this.ctx.currentTime;
    g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(vol,now+.5);
    g.gain.setValueAtTime(vol,now+dur-.5);g.gain.linearRampToValueAtTime(0,now+dur);
    src.connect(bp);bp.connect(pan);pan.connect(g);g.connect(this.master);src.start();
  }
  _echoClank(){
    if(!this.on)return;
    const dur = 0.15 + Math.random()*0.25;
    const osc = this.ctx.createOscillator();
    osc.type = Math.random()>0.5 ? 'square' : 'sawtooth';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150 + Math.random()*800, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + dur);
    
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 300 + Math.random()*1500; bp.Q.value = 4 + Math.random()*4;
    
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(.12 + Math.random()*.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = 0.3 + Math.random()*0.5;
    
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.55 + Math.random()*0.15;
    
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = (Math.random()-.5)*1.6;
    
    osc.connect(bp); bp.connect(g);
    g.connect(pan); pan.connect(this.master);
    
    g.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(pan);
    
    osc.start(now); osc.stop(now + dur);
  }
  step(dt,mv,sp){
    if(!this.on||!mv){this.stepCD=0;return;}
    this.stepCD-=dt;if(this.stepCD<=0){this.stepCD=sp?.26:.44;this._stp();}
  }
  _stp(){
    const len=this.ctx.sampleRate*.1,buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.085));
    const src=this.ctx.createBufferSource();src.buffer=buf;
    const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=130;
    const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=540;
    const g=this.ctx.createGain();g.gain.value=.36;
    src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(this.master);src.start();
  }
  buzz(dur=.12){
    if(!this.on)return;
    const osc=this.ctx.createOscillator(),g=this.ctx.createGain();
    osc.frequency.value=116+Math.random()*20;osc.type='sawtooth';
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(.024,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);
    osc.connect(g);g.connect(this.master);osc.start();osc.stop(now+dur);
  }
  growl(){
    if(!this.on)return;
    const dur=2.5+Math.random()*2;
    const src=this.ctx.createBufferSource();src.buffer=this._noise(dur);
    const bp=this.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=60+Math.random()*80;bp.Q.value=3+Math.random()*4;
    const g=this.ctx.createGain();
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(.14+Math.random()*.06,now+.4);
    g.gain.linearRampToValueAtTime(0,now+dur);
    src.connect(bp);bp.connect(g);g.connect(this.master);src.start();
  }
  _thump(delay=0,vol=0.38){
    if(!this.on)return;
    const now=this.ctx.currentTime+delay;
    const osc=this.ctx.createOscillator();
    const g=this.ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(62,now);
    osc.frequency.exponentialRampToValueAtTime(28,now+0.12);
    g.gain.setValueAtTime(vol,now);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.12);
    osc.connect(g);g.connect(this.master);
    osc.start(now);osc.stop(now+0.13);
  }
  _heartbeat(vol=0.42){
    if(!this.on)return;
    this._thump(0,vol);
    this._thump(0.08,vol*0.72);
  }
  _entityApproach(dist){
    if(!this.approachGain||!this.on)return;
    let target=0;
    if(dist<20){
      const factor=Math.max(0,Math.min(1,(20-dist)/18));
      target=factor*0.15;
    }
    const now=this.ctx.currentTime;
    this.approachGain.gain.setTargetAtTime(target,now,0.08);
  }
  entityStep(){
    if(!this.on)return;
    const len=this.ctx.sampleRate*0.14,buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*0.04));
    const src=this.ctx.createBufferSource();src.buffer=buf;
    const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=140;
    const g=this.ctx.createGain();g.gain.value=0.52;
    src.connect(lp);lp.connect(g);g.connect(this.master);src.start();
  }
  chunkCrackle(){
    if(!this.on)return;
    const dur=0.07;
    const src=this.ctx.createBufferSource();src.buffer=this._noise(dur);
    const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1400;
    const g=this.ctx.createGain();const now=this.ctx.currentTime;
    g.gain.setValueAtTime(0.05,now);
    g.gain.exponentialRampToValueAtTime(0.001,now+dur);
    src.connect(hp);hp.connect(g);g.connect(this.master);src.start();
  }
  loudCrackle(){
    if(!this.on)return;
    const dur=0.55;
    const src=this.ctx.createBufferSource();src.buffer=this._noise(dur);
    const bp=this.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=850;bp.Q.value=1.8;
    const g=this.ctx.createGain();const now=this.ctx.currentTime;
    g.gain.setValueAtTime(0.48,now);
    g.gain.exponentialRampToValueAtTime(0.002,now+dur);
    src.connect(bp);bp.connect(g);g.connect(this.master);src.start();
  }
}
const sfx=new SFX();

/* ═══════ TEXTURES ═══════ */
const texLoader = new THREE.TextureLoader();
const realWallTex = texLoader.load('wallpaper.png');
realWallTex.wrapS = realWallTex.wrapT = THREE.RepeatWrapping;
realWallTex.repeat.set(2, 2);

function mkFloorTextures(){
  const S=512;
  const cv=document.createElement('canvas');cv.width=cv.height=S;
  const cvR=document.createElement('canvas');cvR.width=cvR.height=S;
  const c=cv.getContext('2d'), cR=cvR.getContext('2d');
  
  c.fillStyle='#b5a642';c.fillRect(0,0,S,S);
  cR.fillStyle='#d9d9d9';cR.fillRect(0,0,S,S);

  for(let i=0;i<S*S*.4;i++){
    const x=Math.random()*S,y=Math.random()*S;
    const len=.8+Math.random()*2.2,a=Math.random()*Math.PI*2;
    const v=(Math.random()-.5)*38;
    c.strokeStyle=`rgba(${72+v|0},${56+v|0},${10+v|0},.24)`;
    c.lineWidth=.5;c.beginPath();c.moveTo(x,y);
    c.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);c.stroke();
  }

  for(let i=0;i<30;i++){
    const x=Math.random()*S,y=Math.random()*S,r=8+Math.random()*28;
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(26,16,0,.12)');g.addColorStop(1,'rgba(26,16,0,0)');
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    
    const gR=cR.createRadialGradient(x,y,0,x,y,r);
    gR.addColorStop(0,'rgba(40,40,40,1)'); 
    gR.addColorStop(1,'rgba(217,217,217,0)');
    cR.fillStyle=gR;cR.fillRect(x-r,y-r,r*2,r*2);
  }
  
  const map=new THREE.CanvasTexture(cv); map.wrapS=map.wrapT=THREE.RepeatWrapping; map.repeat.set(6,6);
  const rough=new THREE.CanvasTexture(cvR); rough.wrapS=rough.wrapT=THREE.RepeatWrapping; rough.repeat.set(6,6);
  return {map, rough};
}

function mkCeil(){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#d0c688';c.fillRect(0,0,S,S);
  const TL=128;
  for(let row=0;row<4;row++){
    for(let col=0;col<4;col++){
      const tx=col*TL,ty=row*TL;
      const vr=(Math.random()-.5)*12|0;
      c.fillStyle=`rgba(${145+vr},${133+vr},${82+vr},.11)`;
      c.fillRect(tx+2,ty+2,TL-4,TL-4);
      for(let py=9;py<TL-5;py+=9){
        for(let px=9;px<TL-5;px+=9){
          if(Math.random()<.58){
            c.fillStyle='rgba(52,40,12,.13)';
            c.beginPath();c.arc(tx+px,ty+py,.85,0,Math.PI*2);c.fill();
          }
        }
      }
    }
  }
  c.strokeStyle='rgba(0,0,0,.22)';c.lineWidth=2.5;
  for(let x=0;x<=S;x+=TL){c.beginPath();c.moveTo(x,0);c.lineTo(x,S);c.stroke();}
  for(let y=0;y<=S;y+=TL){c.beginPath();c.moveTo(0,y);c.lineTo(S,y);c.stroke();}
  for(let i=0;i<10;i++){
    const x=Math.random()*S,y=Math.random()*S,r=8+Math.random()*28;
    const g2=c.createRadialGradient(x,y,0,x,y,r);
    g2.addColorStop(0,'rgba(88,65,8,.24)');g2.addColorStop(.5,'rgba(68,50,5,.10)');g2.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.8,1.8);return t;
}

function mkCardboard(){
  const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#a08040';c.fillRect(0,0,S,S);
  for(let y=0;y<S;y+=3){
    const a=.04+Math.random()*.04;c.strokeStyle=`rgba(60,40,10,${a})`;c.lineWidth=.8+Math.random()*.6;
    c.beginPath();c.moveTo(0,y+Math.random()*.5);c.lineTo(S,y+Math.random()*.5);c.stroke();
  }
  for(let i=0;i<S*S*.15;i++){
    const x=Math.random()*S|0,y=Math.random()*S|0,v=(Math.random()-.5)*24|0;
    c.fillStyle=`rgba(${90+v},${65+v},${20+v},.08)`;c.fillRect(x,y,1,1);
  }
  for(let i=0;i<2;i++){
    const horiz=Math.random()>.5,pos=S*.2+Math.random()*S*.6;
    c.strokeStyle='rgba(40,25,5,.12)';c.lineWidth=1.2;
    c.beginPath();if(horiz){c.moveTo(0,pos);c.lineTo(S,pos);}else{c.moveTo(pos,0);c.lineTo(pos,S);}c.stroke();
  }
  if(Math.random()<.6){
    const ty=S*.3+Math.random()*S*.4;
    c.fillStyle='rgba(180,165,110,.14)';c.fillRect(0,ty-6,S,12);
    c.strokeStyle='rgba(120,100,50,.08)';c.lineWidth=.5;c.strokeRect(0,ty-6,S,12);
  }
  for(let i=0;i<8;i++){
    const x=Math.random()*S,y=Math.random()*S,r=4+Math.random()*18;
    const g2=c.createRadialGradient(x,y,0,x,y,r);
    g2.addColorStop(0,'rgba(35,20,2,.15)');g2.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  if(Math.random()<.5){
    c.save();c.globalAlpha=.06;c.font='bold 18px monospace';c.fillStyle='#2a1800';
    const words=['FRAGILE','THIS SIDE UP','LOT 4207','HANDLE WITH CARE','QTY: 12'];
    const word=words[Math.random()*words.length|0];
    c.translate(S*.5,S*.5);c.rotate((Math.random()-.5)*.3);
    c.fillText(word,-c.measureText(word).width/2,6);c.restore();
  }
  const edge=c.createLinearGradient(0,0,0,S);
  edge.addColorStop(0,'rgba(0,0,0,.06)');edge.addColorStop(.1,'rgba(0,0,0,0)');
  edge.addColorStop(.9,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(0,0,0,.08)');
  c.fillStyle=edge;c.fillRect(0,0,S,S);
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

const {map: floorMap, rough: floorRough} = mkFloorTextures();
const matW=new THREE.MeshLambertMaterial({map:realWallTex,side:THREE.DoubleSide});
const matF=new THREE.MeshStandardMaterial({map:floorMap, roughnessMap:floorRough, metalness:0.2, color:0xffffff});
const matC=new THREE.MeshLambertMaterial({map:mkCeil()});
const boxMat=new THREE.MeshLambertMaterial({map:mkCardboard()});
const pipeMat=new THREE.MeshLambertMaterial({color:0x707058});
const housingMat=new THREE.MeshLambertMaterial({color:0x555544});
const trimMat=new THREE.MeshLambertMaterial({color:0x090703});
const cabinetMat=new THREE.MeshStandardMaterial({color:0x6a6c6e, roughness:0.35, metalness:0.75});
const ventMat=new THREE.MeshLambertMaterial({color:0x050505});
// Level -1 warehouse props
const whPipeMat=new THREE.MeshStandardMaterial({color:0x555555, roughness:0.4, metalness:0.8});
const whShelfMat=new THREE.MeshStandardMaterial({color:0x444444, roughness:0.5, metalness:0.7});
const whCrateMat=new THREE.MeshLambertMaterial({color:0x333333});
const whPendantMat=new THREE.MeshStandardMaterial({color:0x333333, roughness:0.3, metalness:0.9});
const whPuddleMat=new THREE.MeshStandardMaterial({color:0x080810, roughness:0.02, metalness:0.95, transparent:true, opacity:0.5});
const whPillarMat=new THREE.MeshStandardMaterial({color:0x444444, roughness:0.85, metalness:0.1});

// Procedural warehouse textures
function mkWarehouseFloorTex(){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#3a3a3e';c.fillRect(0,0,S,S);
  for(let i=0;i<S*S*.4;i++){
    const x=Math.random()*S,y=Math.random()*S;
    const v=(Math.random()-.5)*16;
    c.fillStyle=`rgba(${58+v|0},${58+v|0},${62+v|0},.2)`;
    c.fillRect(x,y,1+Math.random()*2,1+Math.random()*2);
  }
  for(let i=0;i<8;i++){
    c.strokeStyle=`rgba(20,20,22,${.12+Math.random()*.15})`;
    c.lineWidth=.5+Math.random()*1.5;
    c.beginPath();
    let x=Math.random()*S,y=Math.random()*S;
    c.moveTo(x,y);
    for(let j=0;j<10;j++){x+=Math.random()*50-25;y+=Math.random()*50-25;c.lineTo(x,y);}
    c.stroke();
  }
  for(let i=0;i<6;i++){
    const x=Math.random()*S,y=Math.random()*S,r=12+Math.random()*35;
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(15,15,18,.22)');g.addColorStop(1,'rgba(15,15,18,0)');
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);return t;
}
function mkWarehouseWallTex(){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');
  c.fillStyle='#5a5a62';c.fillRect(0,0,S,S);
  const bw=64,bh=32;
  for(let y=0;y<S;y+=bh){
    const off=(Math.floor(y/bh)%2)*bw/2;
    for(let x=-bw;x<S+bw;x+=bw){
      c.strokeStyle='rgba(35,35,40,.35)';c.lineWidth=2;
      c.strokeRect(x+off,y,bw,bh);
      const v=(Math.random()-.5)*10;
      c.fillStyle=`rgba(${90+v|0},${90+v|0},${96+v|0},.15)`;
      c.fillRect(x+off+2,y+2,bw-4,bh-4);
    }
  }
  for(let i=0;i<4;i++){
    const x=Math.random()*S;
    const g=c.createLinearGradient(x,0,x,S);
    g.addColorStop(0,'rgba(30,35,40,.25)');g.addColorStop(.4,'rgba(30,35,40,.1)');g.addColorStop(1,'rgba(30,35,40,0)');
    c.fillStyle=g;c.fillRect(x-8,0,16+Math.random()*12,S);
  }
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;
}
const whFloorTex=mkWarehouseFloorTex();
const whWallTex=mkWarehouseWallTex();
const matWHWall=new THREE.MeshStandardMaterial({map:whWallTex, side:THREE.DoubleSide, roughness:0.9, metalness:0.05});
const matWHFloor=new THREE.MeshStandardMaterial({map:whFloorTex, roughness: 0.92, metalness: 0.05});
const matWHCeil=new THREE.MeshLambertMaterial({color:0x2a2a30});

/* ═══════ PRNG ═══════ */
class PRNG {
  constructor(seed) { this.seed = seed; }
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/* ═══════ INFINITE CHUNKING ═══════ */
const CSZ=24, CELL=4;
let WH=2.72;
const chunkData = new Map();
const activeChunks = new Map();
let globalFixtures = [];
let lastPlayerChunkX = null, lastPlayerChunkZ = null;

function getChunkKey(cx, cz) { return `${cx},${cz}`; }

function generateChunkData(cx, cz) {
  const prng = new PRNG(Math.abs(cx * 10000 + cz) ^ 12345);
  const m = Array(CSZ).fill(0).map(() => Array(CSZ).fill(false));

  if (currentLevel === -1) {
    for (let r = 0; r < CSZ; r++) {
      for (let c = 0; c < CSZ; c++) m[r][c] = true;
    }
    for (let i = 0; i < 6; i++) {
      const horiz = prng.next() > 0.5;
      const pos = 2 + Math.floor(prng.next() * (CSZ - 4));
      const len = 6 + Math.floor(prng.next() * 10);
      const start = Math.floor(prng.next() * (CSZ - len));
      const gapPos = start + 2 + Math.floor(prng.next() * (len - 4));
      const gapSize = 1 + Math.floor(prng.next() * 2);
      for (let j = start; j < Math.min(start + len, CSZ); j++) {
        if (j >= gapPos && j < gapPos + gapSize) continue;
        if (horiz) { if(pos < CSZ) m[pos][j] = false; }
        else { if(j < CSZ) m[j][pos] = false; }
      }
    }
    for (let r = 4; r < CSZ-3; r += 4) {
      for (let c = 4; c < CSZ-3; c += 4) {
        if (prng.next() < 0.6) {
          m[r][c] = false;
          if (prng.next() < 0.3 && r+1 < CSZ && c+1 < CSZ) {
            m[r+1][c] = false; m[r][c+1] = false; m[r+1][c+1] = false;
          }
        }
      }
    }
    for (let i = 0; i < 2; i++) {
      const rx = 3 + Math.floor(prng.next() * (CSZ - 10));
      const ry = 3 + Math.floor(prng.next() * (CSZ - 10));
      const rw = 4 + Math.floor(prng.next() * 3);
      const rh = 4 + Math.floor(prng.next() * 3);
      for (let j = rx; j < Math.min(rx+rw, CSZ); j++) {
        if(ry < CSZ) m[ry][j] = false;
        if(ry+rh-1 < CSZ) m[ry+rh-1][j] = false;
      }
      for (let j = ry; j < Math.min(ry+rh, CSZ); j++) {
        if(rx < CSZ) m[j][rx] = false;
        if(rx+rw-1 < CSZ) m[j][rx+rw-1] = false;
      }
      const doorSide = Math.floor(prng.next() * 4);
      const doorOff = 1 + Math.floor(prng.next() * 2);
      if(doorSide===0 && ry<CSZ && rx+doorOff<CSZ) m[ry][rx+doorOff]=true;
      else if(doorSide===1 && ry+rh-1<CSZ && rx+doorOff<CSZ) m[ry+rh-1][rx+doorOff]=true;
      else if(doorSide===2 && rx<CSZ && ry+doorOff<CSZ) m[ry+doorOff][rx]=true;
      else if(rx+rw-1<CSZ && ry+doorOff<CSZ) m[ry+doorOff][rx+rw-1]=true;
    }
    for (let i = 0; i < CSZ; i++) {
      m[0][i] = true; m[CSZ-1][i] = true;
      m[i][0] = true; m[i][CSZ-1] = true;
    }
    return { m, prng };
  }

  function carve(x, y) {
    m[y][x] = true;
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => prng.next() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < CSZ-1 && ny > 0 && ny < CSZ-1 && !m[ny][nx]) {
        m[y + dy/2][x + dx/2] = true;
        carve(nx, ny);
      }
    }
  }

  carve(2, 2);
  carve(CSZ-3, CSZ-3);

  for (let y = 1; y < CSZ-1; y++) {
    for (let x = 1; x < CSZ-1; x++) {
      if (!m[y][x]) {
        const horiz = m[y][x-1] && m[y][x+1] && !m[y-1][x] && !m[y+1][x];
        const vert = m[y-1][x] && m[y+1][x] && !m[y][x-1] && !m[y][x+1];
        if ((horiz || vert) && prng.next() < 0.22) {
          m[y][x] = true;
        }
      }
    }
  }

  for (let i = 1; i < CSZ-1; i+=2) {
    m[0][i] = true; 
    m[CSZ-1][i] = true; 
    m[i][0] = true; 
    m[i][CSZ-1] = true; 
  }
  
  const numRooms = 1 + Math.floor(prng.next() * 2);
  for(let i=0; i<numRooms; i++) {
    const rx = 2 + Math.floor(prng.next() * (CSZ - 6));
    const ry = 2 + Math.floor(prng.next() * (CSZ - 6));
    for(let r=ry; r<ry+3; r++) {
      for(let c=rx; c<rx+3; c++) {
        m[r][c] = true;
      }
    }
    if (prng.next() < 0.6) m[ry+1][rx+1] = false;
  }

  if (cx === 0 && cz === 0) {
    for(let y=10; y<=14; y++) {
      for(let x=10; x<=14; x++) {
        m[y][x] = true;
      }
    }
  }
  
  return { m, prng };
}

function mergeBatch(geos,mat){
  if(geos.length===0) return null;
  let n=0;for(const g of geos)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),IDX=[];
  let off=0;
  for(const g of geos){
    const cnt=g.attributes.position.count;
    P.set(g.attributes.position.array,off*3);N.set(g.attributes.normal.array,off*3);
    U.set(g.attributes.uv.array,off*2);
    const gi=g.index?.array;
    if(gi)for(let i=0;i<gi.length;i++)IDX.push(gi[i]+off);
    else for(let i=0;i<cnt;i++)IDX.push(i+off);
    off+=cnt;g.dispose();
  }
  const bg=new THREE.BufferGeometry();
  bg.setAttribute('position',new THREE.BufferAttribute(P,3));
  bg.setAttribute('normal',new THREE.BufferAttribute(N,3));
  bg.setAttribute('uv',new THREE.BufferAttribute(U,2));
  bg.setIndex(IDX);return new THREE.Mesh(bg,mat);
}

function buildChunk(cx, cz) {
  const key = getChunkKey(cx, cz);
  if (!chunkData.has(key)) chunkData.set(key, generateChunkData(cx, cz));
  const {m, prng} = chunkData.get(key);

  const chunkGroup = new THREE.Group();
  const chunkFixtures = [];

  const wg=[], fg=[], cg=[], trg=[];
  const offsetX = cx * CSZ * CELL;
  const offsetZ = cz * CSZ * CELL;

  for(let row=0;row<CSZ;row++){
    for(let col=0;col<CSZ;col++){
      if(!m[row][col])continue;
      const lx = col*CELL+CELL/2, lz = row*CELL+CELL/2;
      const wx = offsetX + lx, wz = offsetZ + lz;

      const gf=new THREE.PlaneGeometry(CELL,CELL);gf.rotateX(-Math.PI/2);gf.translate(wx,0,wz);fg.push(gf);
      const gc=new THREE.PlaneGeometry(CELL,CELL);gc.rotateX(Math.PI/2);gc.translate(wx,WH,wz);cg.push(gc);

      const wall=(x,z,ry)=>{
        const g=new THREE.PlaneGeometry(CELL,WH);g.rotateY(ry);g.translate(x,WH/2,z);wg.push(g);
      };
      
      const getM = (r, c) => {
        if (r>=0 && r<CSZ && c>=0 && c<CSZ) return m[r][c];
        const nx = cx + (c<0 ? -1 : (c>=CSZ ? 1 : 0));
        const nz = cz + (r<0 ? -1 : (r>=CSZ ? 1 : 0));
        const nk = getChunkKey(nx, nz);
        if (!chunkData.has(nk)) chunkData.set(nk, generateChunkData(nx, nz));
        const nm = chunkData.get(nk).m;
        return nm[(r+CSZ)%CSZ][(c+CSZ)%CSZ];
      };

      if(!getM(row-1,col)) wall(wx, wz-CELL/2, 0);
      if(!getM(row+1,col)) wall(wx, wz+CELL/2, Math.PI);
      if(!getM(row,col-1)) wall(wx-CELL/2, wz, Math.PI/2);
      if(!getM(row,col+1)) wall(wx+CELL/2, wz, -Math.PI/2);
    }
  }

  const mW = currentLevel === -1 ? matWHWall : matW;
  const mF = currentLevel === -1 ? matWHFloor : matF;
  const mC = currentLevel === -1 ? matWHCeil : matC;
  const mw=mergeBatch(wg,mW), mf=mergeBatch(fg,mF), mc=mergeBatch(cg,mC), mt=mergeBatch(trg,trimMat);
  if(mw) chunkGroup.add(mw);
  if(mf) chunkGroup.add(mf);
  if(mc) chunkGroup.add(mc);
  if(mt) chunkGroup.add(mt);

  /* — Props & Lights — */
  if (currentLevel === -1) {
    for(let row=1;row<CSZ;row+=3){
      for(let col=1;col<CSZ;col+=3){
        if(!m[row][col] || prng.next() < 0.15) continue;
        const wx = offsetX + col*CELL+CELL/2;
        const wz = offsetZ + row*CELL+CELL/2;
        const dead = prng.next() < 0.15;
        const swaying = !dead && prng.next() < 0.2;
        const chainLen = 2.0 + prng.next() * 2.0;
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,chainLen,4), whPipeMat);
        chain.position.set(wx, WH - chainLen/2, wz);
        chunkGroup.add(chain);
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 8, 1, true), whPendantMat);
        shade.position.set(wx, WH - chainLen - 0.12, wz);
        shade.rotation.x = Math.PI;
        chunkGroup.add(shade);
        const bulbColor = dead ? 0x020204 : 0x99aacc;
        const eMat = new THREE.MeshStandardMaterial({color:bulbColor, emissive:bulbColor, emissiveIntensity:dead?0.02:0.9, roughness:0.3});
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), eMat);
        bulb.position.set(wx, WH - chainLen - 0.08, wz);
        chunkGroup.add(bulb);
        if(!dead){
          chunkFixtures.push({
            pos: new THREE.Vector3(wx, WH - chainLen - 0.1, wz),
            eMat: eMat,
            base: 35+prng.next()*25,
            wSpd: 0.8+prng.next()*1.5,
            wPha: prng.next()*Math.PI*2,
            wAmp: 4,
            doFlick: prng.next()<.25,
            flickOn: false,
            flickCD: 2+prng.next()*6,
            flickDur: 0,
            intensity: 40,
            swaying: swaying,
            swayParent: shade,
            swayBulb: bulb,
            swayChain: chain,
            swayBaseX: wx,
            swayBaseZ: wz,
            swaySpeed: 0.3+prng.next()*0.5,
            swayPhase: prng.next()*Math.PI*2
          });
        }
      }
    }
    for(let row=3;row<CSZ-2;row+=5){
      for(let col=3;col<CSZ-2;col+=5){
        if(m[row][col]) continue;
        const wx = offsetX + col*CELL+CELL/2;
        const wz = offsetZ + row*CELL+CELL/2;
        const pH = WH;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, pH, 1.2), whPillarMat);
        pillar.position.set(wx, pH/2, wz);
        chunkGroup.add(pillar);
      }
    }
    for(let i=0; i<4; i++) {
      const row = 1+Math.floor(prng.next()*(CSZ-2)), col = 1+Math.floor(prng.next()*(CSZ-2));
      if(!m[row][col]) continue;
      const wx = offsetX + col*CELL+CELL/2;
      const wz = offsetZ + row*CELL+CELL/2;
      const shelfH = 2.0 + prng.next()*1.5;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, shelfH, 0.6), whShelfMat);
      shelf.position.set(wx, shelfH/2, wz);
      shelf.rotation.y = prng.next()*Math.PI;
      chunkGroup.add(shelf);
      for(let s=0; s<3; s++){
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.55), whShelfMat);
        plank.position.set(wx, 0.5 + s*0.65, wz);
        plank.rotation.y = shelf.rotation.y;
        chunkGroup.add(plank);
      }
    }
    for(let i=0; i<3; i++) {
      const row = Math.floor(prng.next()*CSZ);
      const wz = offsetZ + row*CELL+CELL/2;
      const pipeR = 0.06 + prng.next()*0.06;
      const pLen = CSZ*CELL;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(pipeR,pipeR,pLen,6), whPipeMat);
      pipe.rotation.z = Math.PI/2;
      pipe.position.set(offsetX + pLen/2, WH - 0.3 - prng.next()*0.5, wz);
      chunkGroup.add(pipe);
    }
    for(let i=0; i<6; i++) {
      const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
      if(!m[row][col]) continue;
      const wx = offsetX + col*CELL+CELL/2 + (prng.next()-.5)*2;
      const wz = offsetZ + row*CELL+CELL/2 + (prng.next()-.5)*2;
      const segs = 16;
      const baseR = 0.6 + prng.next()*0.8;
      const verts = [0, 0.004, 0];
      const indices = [];
      for(let s=0; s<segs; s++){
        const angle = (s/segs)*Math.PI*2;
        const r = baseR * (0.5 + prng.next()*0.7);
        verts.push(Math.cos(angle)*r, 0.004, Math.sin(angle)*r);
      }
      for(let s=0; s<segs; s++){
        indices.push(0, s+1, (s%segs)+1+1 > segs ? 1 : s+2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const puddle = new THREE.Mesh(geo, whPuddleMat);
      puddle.position.set(wx, 0, wz);
      puddle.scale.set(1+prng.next()*0.8, 1, 0.6+prng.next()*0.8);
      puddle.rotation.y = prng.next()*Math.PI*2;
      chunkGroup.add(puddle);
    }
  } else {
    const tubeGeo=new THREE.BoxGeometry(1.2,0.04,0.10);
    for(let row=1;row<CSZ;row+=3){
      for(let col=1;col<CSZ;col+=3){
        if(!m[row][col] || prng.next() < 0.2) continue;
        const wx = offsetX + col*CELL+CELL/2;
        const wz = offsetZ + row*CELL+CELL/2;
        
        if(prng.next() < 0.12) {
          const vent = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), ventMat);
          vent.rotation.x = Math.PI/2;
          vent.position.set(wx, WH-0.005, wz);
          chunkGroup.add(vent);
          continue;
        }
        
        const dead = prng.next() < 0.12;
        const brokenHanging = !dead && prng.next() < 0.08;
        
        const housing=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.025,0.16),housingMat);
        housing.position.set(wx,WH-.005,wz); 
        
        const eMat=new THREE.MeshStandardMaterial({color:0xfff6d0,emissive:0xfff6d0,emissiveIntensity:dead?0.03:0.92,roughness:.6});
        const tube=new THREE.Mesh(tubeGeo,eMat);tube.position.set(wx,WH-.025,wz);
        
        if(brokenHanging) {
          housing.rotation.z = Math.PI/5.5;
          housing.position.y -= 0.15;
          housing.position.x += 0.2;
          tube.rotation.z = Math.PI/5.5;
          tube.position.y -= 0.15;
          tube.position.x += 0.2;
        }
        
        chunkGroup.add(housing);
        chunkGroup.add(tube);
        
        if(!dead){
          const lightY = brokenHanging ? WH - 0.28 : WH - 0.13;
          chunkFixtures.push({
            pos: new THREE.Vector3(wx, lightY, wz),
            eMat: eMat,
            base: .88+prng.next()*.55,
            wSpd: 1.4+prng.next()*3.5,
            wPha: prng.next()*Math.PI*2,
            wAmp: .055,
            doFlick: prng.next()<.15,
            flickOn: false,
            flickCD: 3+prng.next()*10,
            flickDur: 0,
            intensity: 1.35
          });
        }
      }
    }

    for(let i=0; i<6; i++) {
      const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
      if(m[row][col] && prng.next() < 0.6) {
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.6), cabinetMat);
        cab.position.set(offsetX + col*CELL+CELL/2+(prng.next()-.5)*CELL*.6, 0.7, offsetZ + row*CELL+CELL/2+(prng.next()-.5)*CELL*.6);
        cab.rotation.y = prng.next()*Math.PI*2;
        chunkGroup.add(cab);
      }
    }

    for(let i=0; i<5; i++) {
      const row = Math.floor(prng.next()*CSZ), col = Math.floor(prng.next()*CSZ);
      if(m[row][col]) {
        const w=.35+prng.next()*.5, d=.3+prng.next()*.4, h=.25+prng.next()*.45;
        const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),boxMat);
        box.position.set(offsetX + col*CELL+CELL/2+(prng.next()-.5)*CELL*.6, h/2, offsetZ + row*CELL+CELL/2+(prng.next()-.5)*CELL*.6);
        box.rotation.y = prng.next()*Math.PI*2;
        chunkGroup.add(box);
      }
    }
  }

  scene.add(chunkGroup);
  activeChunks.set(key, {group: chunkGroup, fixtures: chunkFixtures});
  globalFixtures.push(...chunkFixtures);
}

function updateChunks(playerX, playerZ) {
  const pChunkX = Math.floor(playerX / (CSZ * CELL));
  const pChunkZ = Math.floor(playerZ / (CSZ * CELL));
  const radius = 1;

  if (lastPlayerChunkX !== null && (pChunkX !== lastPlayerChunkX || pChunkZ !== lastPlayerChunkZ)) {
    sfx.chunkCrackle();
  }
  lastPlayerChunkX = pChunkX;
  lastPlayerChunkZ = pChunkZ;

  const needed = new Set();
  for(let dz=-radius; dz<=radius; dz++){
    for(let dx=-radius; dx<=radius; dx++){
      needed.add(getChunkKey(pChunkX+dx, pChunkZ+dz));
    }
  }

  for (const [key, chunk] of activeChunks.entries()) {
    if (!needed.has(key)) {
      scene.remove(chunk.group);
      globalFixtures = globalFixtures.filter(f => !chunk.fixtures.includes(f));
      activeChunks.delete(key);
    }
  }

  for (const key of needed) {
    if (!activeChunks.has(key)) {
      const [cx, cz] = key.split(',').map(Number);
      buildChunk(cx, cz);
    }
  }
}

/* ═══════ AMBIENT & LIGHT POOL ═══════ */
const ambientLight = new THREE.AmbientLight(0xd4aa18,0.12);
scene.add(ambientLight);
const hemiLight = new THREE.HemisphereLight(0xd4a010,0x5a4800,.20);
scene.add(hemiLight);

const lightPool = [];
for(let i=0; i<24; i++) {
  const pl = new THREE.PointLight(0xd4aa28, 0, 14, 1.7);
  pl._baseColor = new THREE.Color(0xd4aa28);
  scene.add(pl);
  lightPool.push(pl);
}

const playerLight = new THREE.SpotLight(0x8899aa, 0, 0, Math.PI/5, 0.6, 2.0);
playerLight.visible = false;
scene.add(playerLight);
scene.add(playerLight.target);

/* ═══════ ENTITY / MONSTER ═══════ */
class Entity{
  constructor(){
    this.group=new THREE.Group();
    scene.add(this.group);
    this.pos=new THREE.Vector2();
    this.dir=new THREE.Vector2(1,0);
    this.speed=1.8;
    this.chaseSpeed=5.5;
    this.state='wander';
    this.stateTimer=0;
    this.lastGrowl=0;
    this.heartbeatCD=0;
    this.footstepCD=0;
    this.glow=null;
    this.arms=[];
    this.legs=[];
    this.torso=null;
    this.setVisuals(0);
    setTimeout(() => this._spawn(camera.position), 500);
  }
    
  setVisuals(lvl) {
    while(this.group.children.length > 0){ 
      this.group.remove(this.group.children[0]); 
    }
    
    if (lvl === 0) {
      // Tall, lanky humanoid figure
      const bodyMat = new THREE.MeshLambertMaterial({color: 0x050508});
      
      // Extremely narrow torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.4, 0.18), bodyMat);
      torso.position.y = 1.35;
      this.group.add(torso);
      this.torso = torso;

      // Elongated head, sagging low onto torso
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bodyMat);
      head.scale.set(1, 1.4, 0.9);
      head.position.set(0, 1.95, 0);
      this.group.add(head);

      // Glowing white stark eyes
      const eyeMat = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5});
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eyeL.position.set(-0.07, 1.98, 0.16);
      this.group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eyeR.position.set(0.07, 1.98, 0.16);
      this.group.add(eyeR);

      // Long arms reaching down, rotated slightly outward
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.3, 0.09), bodyMat);
      armL.position.set(-0.21, 1.25, 0);
      armL.rotation.z = 0.09;
      this.group.add(armL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.3, 0.09), bodyMat);
      armR.position.set(0.21, 1.25, 0);
      armR.rotation.z = -0.09;
      this.group.add(armR);

      // Thin legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), bodyMat);
      legL.position.set(-0.08, 0.425, 0);
      this.group.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), bodyMat);
      legR.position.set(0.08, 0.425, 0);
      this.group.add(legR);

      // Cold white-blue glow
      this.glow = new THREE.PointLight(0xaaccff, 0.8, 10, 2);
      this.glow.position.y = 1.7;
      this.group.add(this.glow);

      this.arms = [armL, armR];
      this.legs = [legL, legR];
    } else if (lvl === -1) {
      // The Smiler (disturbing enlarged presence)
      const cloudMat = new THREE.MeshLambertMaterial({color: 0x000000, transparent: true, opacity: 0.96});
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), cloudMat);
      cloud.position.y = 1.8;
      this.group.add(cloud);

      const eyeMat = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2});
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
      eyeL.position.set(-0.2, 1.95, 0.62);
      this.group.add(eyeL);

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
      eyeR.position.set(0.2, 1.95, 0.62);
      this.group.add(eyeR);

      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16, Math.PI), eyeMat);
      smile.position.set(0, 1.68, 0.62);
      smile.rotation.z = Math.PI;
      this.group.add(smile);

      this.glow = new THREE.PointLight(0xffffff, 0.7, 14, 2);
      this.glow.position.y = 1.8;
      this.group.add(this.glow);

      this.torso = cloud;
      this.arms = [];
      this.legs = [];
    }
  }
  _spawn(playerPos){
    if(!playerPos) return;
    for(let i=0; i<100; i++) {
      const dist = 30 + Math.random()*30;
      const angle = Math.random() * Math.PI * 2;
      const nx = playerPos.x + Math.cos(angle) * dist;
      const nz = playerPos.z + Math.sin(angle) * dist;
      
      if(this._canWalk(nx, nz)){
        this.pos.set(nx, nz);
        this.group.position.set(this.pos.x, 0, this.pos.y);
        this.state = 'wander';
        this.dir.set(1, 0);
        return;
      }
    }
    this.pos.set(playerPos.x+10, playerPos.z+10);
    this.group.position.set(this.pos.x, 0, this.pos.y);
  }
  _canWalk(wx,wz){
    return isWalkable(wx, wz);
  }
  _pickWanderDir(){
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-.5);
    for(const[dx,dz]of dirs){
      if(this._canWalk(this.pos.x+dx*CELL,this.pos.y+dz*CELL)){this.dir.set(dx,dz);return;}
    }
  }
  update(dt,time,playerPos){
    const toPlayer=new THREE.Vector2(playerPos.x-this.pos.x,playerPos.z-this.pos.y);
    const dist=toPlayer.length();

    if (dist > 150) { this._spawn(playerPos); return dist; }

    // Chase distance triggers
    if(dist<22&&this.state!=='chase'){this.state='chase';this.stateTimer=0;}
    else if(dist>32&&this.state==='chase'){this.state='wander';this.stateTimer=0;this._pickWanderDir();}
    if(dist<20&&time-this.lastGrowl>6){this.lastGrowl=time;sfx.growl();}

    // Warning heartbeat based on proximity
    if(dist<15 && gameState==='playing'){
      this.heartbeatCD-=dt;
      const interval = dist < 8 ? 0.85 : 2.4;
      if(this.heartbeatCD<=0){
        sfx._heartbeat(dist < 8 ? 0.55 : 0.38);
        this.heartbeatCD = interval;
      }
    } else {
      this.heartbeatCD = 0;
    }

    // Continuous entity approach rumble
    sfx._entityApproach(dist);

    this.stateTimer+=dt;
    let spd=0;
    if(this.state==='wander'){
      spd=this.speed;
      if(this.stateTimer>2+Math.random()*3){this.stateTimer=0;this._pickWanderDir();}
      const nx=this.pos.x+this.dir.x*spd*dt, nz=this.pos.y+this.dir.y*spd*dt;
      if(this._canWalk(nx,nz)){this.pos.set(nx,nz);}else{this._pickWanderDir();this.stateTimer=0;}
    }else if(this.state==='chase'){
      // Buff speed if player sanity is drained
      const buff = sanity <= 0 ? 0.9 : 0;
      spd=this.chaseSpeed + buff;
      if(dist>1){
        const d=toPlayer.normalize();
        const nx=this.pos.x+d.x*spd*dt, nz=this.pos.y+d.y*spd*dt;
        if(this._canWalk(nx,nz)){this.pos.set(nx,nz);}
        else{
          if(this._canWalk(nx,this.pos.y))this.pos.x=nx;
          else if(this._canWalk(this.pos.x,nz))this.pos.y=nz;
        }
      }
      // Chasing footsteps every 0.4s
      this.footstepCD-=dt;
      if(this.footstepCD<=0 && gameState==='playing'){
        sfx.entityStep();
        this.footstepCD = 0.4;
      }
    } else {
      this.footstepCD = 0;
    }

    this.group.position.x=this.pos.x; this.group.position.z=this.pos.y;
    if(this.state==='chase'&&dist>1) this.group.rotation.y=Math.atan2(toPlayer.x,toPlayer.y);
    else if(this.dir.lengthSq()>0) this.group.rotation.y=Math.atan2(this.dir.x,this.dir.y);

    const walkCycle=Math.sin(time*8)*.25*(spd>0?1:0);
    if(this.arms.length>0){this.arms[0].rotation.x=walkCycle; this.arms[1].rotation.x=-walkCycle;}
    if(this.legs.length>0){this.legs[0].rotation.x=-walkCycle; this.legs[1].rotation.x=walkCycle;}
    if(this.torso) this.torso.rotation.z=Math.sin(time*3)*.02;

    // PointLight intensification & color lerp
    if(this.glow){
      if(currentLevel === 0){
        if(this.state === 'chase'){
          this.glow.color.lerp(new THREE.Color(0xff4400), dt * 3);
          this.glow.intensity = THREE.MathUtils.lerp(this.glow.intensity, 1.8 + Math.sin(time*10)*0.25, dt * 4);
        } else {
          this.glow.color.lerp(new THREE.Color(0xaaccff), dt * 2);
          this.glow.intensity = THREE.MathUtils.lerp(this.glow.intensity, 0.8 + Math.sin(time*2)*0.1, dt * 2);
        }
      } else {
        this.glow.intensity = 0.6 + Math.sin(time*2)*.15 + (this.state==='chase'?.35:0);
      }
    }

    // Distance warning & chromatic aberration
    const warnEl=document.getElementById('warn');
    if(dist<16 && gameState==='playing'){
      warnEl.style.opacity=Math.min(1,(16-dist)/12)*.45;
      const chroma = Math.max(0, (16 - dist) / 16);
      renderer.domElement.style.filter = `hue-rotate(${Math.sin(time*12)*chroma*35}deg) contrast(${1 + chroma*0.25})`;
    } else {
      warnEl.style.opacity='0';
      renderer.domElement.style.filter='none';
    }
    return dist;
  }
}
const entity=new Entity();

/* ═══════ COLLISION ═══════ */
const RAD=.36;
function isWalkable(wx, wz) {
  const cx = Math.floor(wx / (CSZ * CELL));
  const cz = Math.floor(wz / (CSZ * CELL));
  const key = getChunkKey(cx, cz);
  if (!chunkData.has(key)) chunkData.set(key, generateChunkData(cx, cz));
  const m = chunkData.get(key).m;
  const lx = Math.floor((wx - cx * CSZ * CELL) / CELL);
  const lz = Math.floor((wz - cz * CSZ * CELL) / CELL);
  if(lx>=0 && lx<CSZ && lz>=0 && lz<CSZ) return m[lz][lx];
  return false;
}

function slide(ox,oz,nx,nz){
  if(isWalkable(nx-RAD,nz)&&isWalkable(nx+RAD,nz)&&isWalkable(nx,nz-RAD)&&isWalkable(nx,nz+RAD))return[nx,nz];
  if(isWalkable(nx-RAD,oz)&&isWalkable(nx+RAD,oz))return[nx,oz];
  if(isWalkable(ox,nz-RAD)&&isWalkable(ox,nz+RAD))return[ox,nz];
  return[ox,oz];
}

/* ═══════ POINTER LOCK ═══════ */
const overlayEl=document.getElementById('overlay');
const pauseEl=document.getElementById('pause');
let locked=false,gameStarted=false,yaw=0,pitch=0;

function doLock(){renderer.domElement.requestPointerLock();}
document.getElementById('startBtn').addEventListener('click',e=>{e.stopPropagation();sfx.init();gameStarted=true;gameState='playing';doLock();});
overlayEl.addEventListener('click',()=>{if(!gameStarted) return; sfx.init();gameStarted=true;gameState='playing';doLock();});
document.getElementById('resumeBtn').addEventListener('click',()=>{pauseEl.style.display='none';doLock();});
document.getElementById('menuBtn').addEventListener('click',()=>{pauseEl.style.display='none';gameStarted=false;overlayEl.style.display='flex';});
document.getElementById('respawnBtn').addEventListener('click',()=>{
  document.getElementById('deathScreen').style.display='none';
  document.body.classList.remove('is-dead');
  document.body.classList.remove('shake');
  sanity = 1.0;
  const sBar = document.getElementById('sanityBar');
  if(sBar){ sBar.style.width = '100%'; sBar.style.backgroundColor = '#c8b040'; }
  gameState='playing';
  loadLevel(currentLevel);
  doLock();
});
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===renderer.domElement;
  if(locked){overlayEl.style.display='none';pauseEl.style.display='none';if(sfx.ctx&&sfx.ctx.state==='suspended')sfx.ctx.resume();}
  else if(gameStarted){pauseEl.style.display='flex';}
});
document.addEventListener('mousemove',e=>{
  if(!locked)return;
  const sens=.001+SET.sensScale*.00025;
  yaw-=e.movementX*sens;pitch-=e.movementY*sens;
  pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,pitch));
});

const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});


/* ═══════ LEVEL LOGIC ═══════ */
function loadLevel(lvl) {
  if (lvl === -1) {
    const staticEl = document.getElementById('flashOverlay');
    staticEl.style.opacity = '1';
    let flickCount = 0;
    const flickInterval = setInterval(() => {
      staticEl.style.background = flickCount % 2 === 0 
        ? `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence baseFrequency="${0.5+Math.random()*0.5}" numOctaves="4" seed="${Math.random()*999|0}"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>') center/cover`
        : 'black';
      flickCount++;
      if (flickCount >= 16) {
        clearInterval(flickInterval);
        staticEl.style.background = 'black';
        sfx.loudCrackle();
        setTimeout(() => { 
          staticEl.style.opacity = '0'; 
          setTimeout(() => { staticEl.style.background = 'white'; }, 1000);
        }, 500);
      }
    }, 75);
  }
  currentLevel = lvl;
  levelTime = 0;
  
  for (const [key, chunk] of activeChunks.entries()) {
    scene.remove(chunk.group);
  }
  activeChunks.clear();
  chunkData.clear();
  globalFixtures = [];

  if (lvl === 0) {
    baseFogDensity = 0.046 * (30 / SET.fogFar);
    baseAmbIntensity = 0.12;
    baseHemiIntensity = 0.20;
    scene.fog.color.setHex(0x0a0800);
    scene.fog.density = baseFogDensity;
    scene.background.setHex(0x0a0800);
    ambientLight.color.setHex(0xd4aa18); ambientLight.intensity = baseAmbIntensity;
    hemiLight.color.setHex(0xd4a010); hemiLight.groundColor.setHex(0x5a4800); hemiLight.intensity = baseHemiIntensity;
    lightPool.forEach(pl => { pl.color.setHex(0xd4aa28); pl.distance = 14; pl.decay = 1.7; });
    entity.speed = 1.8;
    entity.chaseSpeed = 5.5;
    WH = 2.72;
    playerLight.visible = false;
  } else if (lvl === -1) {
    baseFogDensity = 0.012;
    baseAmbIntensity = 0.40;
    baseHemiIntensity = 0.35;
    scene.fog.color.setHex(0x020210);
    scene.fog.density = baseFogDensity;
    scene.background.setHex(0x020210);
    ambientLight.color.setHex(0x445566); ambientLight.intensity = baseAmbIntensity;
    hemiLight.color.setHex(0x556677); hemiLight.groundColor.setHex(0x1a1a22); hemiLight.intensity = baseHemiIntensity;
    lightPool.forEach(pl => { pl.color.setHex(0x8899bb); pl.distance = 0; pl.decay = 2; });
    entity.speed = 1.6;
    entity.chaseSpeed = 3.8;
    WH = 8.0;
    playerLight.visible = true;
    playerLight.intensity = 15;
  }
  
  entity.setVisuals(lvl);
  camera.position.set(48, 1.64, 48);
  entity.pos.set(-1000, -1000);
  entity.group.position.set(-1000, 0, -1000);
  entity.state = 'wander';
  entity._pickWanderDir();
  
  updateChunks(camera.position.x, camera.position.z);
  setTimeout(() => entity._spawn(camera.position), 600);
}

/* ═══════ SETTINGS ═══════ */
function bindS(id,vid,init,suf,cb){
  const el=document.getElementById(id),vl=document.getElementById(vid);
  el.value=init;vl.textContent=init+suf;
  el.addEventListener('input',()=>{const v=+el.value;vl.textContent=v+suf;cb(v);});
}
bindS('sFov','vFov',82,'\u00b0',v=>{SET.fov=v;camera.fov=v;camera.updateProjectionMatrix();});
bindS('sFog','vFog',30,'m',v=>{SET.fogFar=v;baseFogDensity=.046*(30/v);scene.fog.density=baseFogDensity;});
bindS('sSens','vSens',5,'',v=>{SET.sensScale=v;});
bindS('sVol','vVol',85,'',v=>{SET.volume=v/100;if(sfx.master)sfx.master.gain.value=v/100;});
document.getElementById('tGrain').addEventListener('change',function(){SET.grain=this.checked;grainCv.style.opacity=SET.grain?'.055':'0';});
document.getElementById('tVig').addEventListener('change',function(){SET.vignette=this.checked;document.getElementById('vignette').style.opacity=SET.vignette?'1':'0';});
document.getElementById('tBob').addEventListener('change',function(){SET.bobbing=this.checked;});

/* ═══════ GAME LOOP ═══════ */
const cxEl=document.getElementById('cx'),czEl=document.getElementById('cz');
const clock=new THREE.Clock();
let bobT=0,bobA=0;
const _fwd=new THREE.Vector3(),_rgt=new THREE.Vector3(),_mv=new THREE.Vector3();

updateChunks(camera.position.x, camera.position.z);
loadLevel(0);

(function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;

  // Level -1 Timer
  if (locked) {
    levelTime += dt;
    if (currentLevel === 0) {
      const timeLimit = 180;
      if (levelTime >= timeLimit) {
        loadLevel(-1);
      }
    }
  }

  // Dynamic fog breathing
  const fogPulse = Math.sin(time * (Math.PI * 2 / 8.0)) * (currentLevel === 0 ? 0.004 : 0.0015);
  scene.fog.density = Math.max(0.004, baseFogDensity + fogPulse);

  // Subtle ambient light flicker
  const ambFlicker = (Math.sin(time * 6.5) * 0.006 + (Math.random() - 0.5) * 0.005) * (sanity <= 0 ? 2.5 : 1.0);
  ambientLight.intensity = Math.max(0.02, baseAmbIntensity + ambFlicker);
  hemiLight.intensity = Math.max(0.04, baseHemiIntensity + ambFlicker * 1.2);

  let moving=false,sprint=false;
  if(locked){
    sprint=keys['ShiftLeft']||keys['ShiftRight'];
    const spd=sprint?5.0:2.5;
    _fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));
    _rgt.set(Math.cos(yaw),0,-Math.sin(yaw));
    _mv.set(0,0,0);
    if(keys['KeyW']||keys['ArrowUp'])_mv.addScaledVector(_fwd,1);
    if(keys['KeyS']||keys['ArrowDown'])_mv.addScaledVector(_fwd,-1);
    if(keys['KeyA']||keys['ArrowLeft'])_mv.addScaledVector(_rgt,-1);
    if(keys['KeyD']||keys['ArrowRight'])_mv.addScaledVector(_rgt,1);
    if(_mv.lengthSq()>0){
      moving=true;_mv.normalize().multiplyScalar(spd*dt);
      const[rx,rz]=slide(camera.position.x,camera.position.z,camera.position.x+_mv.x,camera.position.z+_mv.z);
      camera.position.x=rx;camera.position.z=rz;
      
      updateChunks(camera.position.x, camera.position.z);
    }
  }

  // Entity update
  const entDist = entity.update(dt,time,camera.position);

  // Camera Shake when near entity
  if(entDist < 8 && gameState === 'playing'){
    const shakeAmp = entDist < 3 ? 0.015 : 0.003 * ((8 - entDist) / 5);
    pitch += (Math.random() * 2 - 1) * shakeAmp;
    yaw += (Math.random() * 2 - 1) * shakeAmp;
  }

  // Head bobbing & camera rotation
  if(moving&&SET.bobbing){bobT+=dt*(sprint?2.8:1.85);bobA=THREE.MathUtils.lerp(bobA,1,dt*10);}
  else{bobA=THREE.MathUtils.lerp(bobA,0,dt*8);}
  camera.position.y=1.64+Math.sin(bobT*Math.PI*2)*.036*bobA;

  // Sanity logic & camera roll
  if(locked && gameState === 'playing'){
    let drain = 0.0022 * dt;
    if(entDist < 20){
      drain += dt * ((20 - entDist) / 20) * 0.016;
    }
    sanity = Math.max(0, sanity - drain);
    const sBar = document.getElementById('sanityBar');
    if(sBar){
      sBar.style.width = (sanity * 100).toFixed(1) + '%';
      sBar.style.backgroundColor = sanity < 0.25 ? '#cc2200' : '#c8b040';
    }
    if(SET.vignette){
      const vigEl = document.getElementById('vignette');
      vigEl.style.opacity = (1.0 + (1.0 - sanity) * 0.5).toFixed(2);
    }
    if(SET.grain){
      grainCv.style.opacity = (0.055 + (1.0 - sanity) * 0.035).toFixed(3);
    }
  }

  const camRoll = (gameState === 'playing') ? Math.sin(time * 0.9) * 0.02 * (1.0 - sanity) : 0;
  camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,camRoll,'YXZ'));

  if(playerLight.visible){
    playerLight.position.copy(camera.position);
    const lightDir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    playerLight.target.position.copy(camera.position).add(lightDir.multiplyScalar(5));
  }

  // Fixtures flicker
  for(let i=0;i<globalFixtures.length;i++){
    const fd = globalFixtures[i];
    const base = fd.base + Math.sin(time*fd.wSpd+fd.wPha)*fd.wAmp;
    if(fd.doFlick){
      if(!fd.flickOn){
        fd.flickCD-=dt; fd.intensity=base;
        if(fd.flickCD<=0){fd.flickOn=true;fd.flickDur=.08+Math.random()*.55;sfx.buzz(Math.min(fd.flickDur*.5,.3));fd.flickCD=2.5+Math.random()*14;}
      } else {
        fd.intensity=(Math.random()<.45)?.03:base*.9;
        fd.flickDur-=dt;
        if(fd.flickDur<=0){fd.flickOn=false;fd.intensity=base;}
      }
    }else{fd.intensity=base;}

    // Aggressive erratic flicker when sanity is 0
    if(sanity <= 0 && Math.random() < 0.04){
      fd.intensity *= (Math.random() < 0.5 ? 0.15 : 1.4);
    }

    if(fd.eMat) fd.eMat.emissiveIntensity = THREE.MathUtils.clamp(fd.intensity*.72, 0, 1);
    if(fd.swaying && fd.swayParent){
      const sway = Math.sin(time*fd.swaySpeed+fd.swayPhase)*0.4;
      fd.swayParent.position.x = fd.swayBaseX + sway;
      fd.swayBulb.position.x = fd.swayBaseX + sway;
      fd.pos.x = fd.swayBaseX + sway;
    }
  }

  // Light pool
  globalFixtures.forEach(f => f.distSq = f.pos.distanceToSquared(camera.position));
  globalFixtures.sort((a,b) => a.distSq - b.distSq);
  
  for(let i=0; i<lightPool.length; i++) {
    const pl = lightPool[i];
    if (i < globalFixtures.length && globalFixtures[i].distSq < 2500) {
      const f = globalFixtures[i];
      pl.position.copy(f.pos);
      pl.intensity = f.intensity;
    } else {
      pl.intensity = 0;
    }
  }

  // DEATH CHECK
  if(entDist < 1.5 && gameState === 'playing'){
    gameState = 'dead';
    document.exitPointerLock();

    if(sfx.on){
      const osc=sfx.ctx.createOscillator(),g=sfx.ctx.createGain();
      osc.type='sawtooth';
      const now=sfx.ctx.currentTime;
      osc.frequency.setValueAtTime(800,now);
      osc.frequency.exponentialRampToValueAtTime(200,now+0.8);
      g.gain.setValueAtTime(.35,now);
      g.gain.exponentialRampToValueAtTime(.001,now+1.2);
      osc.connect(g);g.connect(sfx.master);osc.start();osc.stop(now+1.2);

      const nSrc=sfx.ctx.createBufferSource();nSrc.buffer=sfx._noise(.6);
      const ng=sfx.ctx.createGain();ng.gain.setValueAtTime(.3,now);ng.gain.exponentialRampToValueAtTime(.001,now+.6);
      nSrc.connect(ng);ng.connect(sfx.master);nSrc.start();
    }

    const ex = entity.pos.x - camera.position.x;
    const ez = entity.pos.y - camera.position.z;
    yaw = Math.atan2(-ex, -ez);
    pitch = 0;
    camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));

    // Fast camera shake
    document.body.classList.add('shake');

    // White flash
    const flashEl = document.getElementById('flashOverlay');
    flashEl.style.background = 'white';
    flashEl.style.opacity = '1';

    // Show coordinates
    const coordsEl = document.getElementById('deathCoords');
    if (coordsEl) {
      coordsEl.textContent = `X ${camera.position.x.toFixed(1)}   Z ${camera.position.z.toFixed(1)}`;
    }

    setTimeout(() => {
      flashEl.style.opacity = '0';
    }, 320);

    setTimeout(() => {
      document.body.classList.remove('shake');
      document.body.classList.add('is-dead');
      document.getElementById('deathScreen').style.display = 'flex';
    }, 650);
  }

  sfx.step(dt,moving,sprint);
  tickGrain();

  const lvlTr = document.getElementById('hud-tr');
  if (currentLevel === 0) {
    const timeLeft = Math.max(0, 180 - Math.floor(levelTime));
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const colon = Math.floor(time) % 2 === 0 ? ':' : ' ';
    lvlTr.textContent = `LEVEL 0 [${m}${colon}${s.toString().padStart(2, '0')}]`;
  } else {
    lvlTr.textContent = `LEVEL -1`;
  }

  cxEl.textContent=camera.position.x.toFixed(1);
  czEl.textContent=camera.position.z.toFixed(1);
  renderer.render(scene,camera);
})();
