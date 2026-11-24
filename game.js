(()=>{'use strict';
const cv=document.getElementById('game');const ui=id=>document.getElementById(id);
const gl=cv.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
if(!gl){ui('error').hidden=false;ui('error').textContent='WebGL is unavailable. Enable hardware acceleration or try Chrome, Edge, or Safari on a supported device.';return;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const rng=(seed)=>{let t=seed>>>0;return()=>{t+=0x6d2b79f5;let v=t;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);return ((v^(v>>>14))>>>0)/4294967296;};};
const vertex=`attribute vec3 position;attribute vec3 normal;uniform mat4 uVP;uniform mat4 uModel;uniform vec3 uColor;uniform vec3 uEye;varying vec3 vColor;varying float vFog;void main(){vec4 world=uModel*vec4(position,1.);vec3 norm=normalize(mat3(uModel)*normal);float sunlight=max(.23,dot(norm,normalize(vec3(-.38,.85,.45)))*.7+.38);vColor=uColor*sunlight;vFog=clamp(length(world.xyz-uEye)/150.,0.,.85);gl_Position=uVP*world;}`;
const fragment=`precision mediump float;varying vec3 vColor;varying float vFog;void main(){gl_FragColor=vec4(mix(vColor,vec3(.69,.85,.95),vFog*.63),1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let prog;try{prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));}catch(e){ui('error').hidden=false;ui('error').textContent='Could not initialize WebGL: '+e.message;return;}
gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(.54,.79,.96,1);
const attribPos=gl.getAttribLocation(prog,'position'),attribNormal=gl.getAttribLocation(prog,'normal');
const uVP=gl.getUniformLocation(prog,'uVP'),uModel=gl.getUniformLocation(prog,'uModel'),uColor=gl.getUniformLocation(prog,'uColor'),uEye=gl.getUniformLocation(prog,'uEye');
function meshFrom(list){const v=new Float32Array(list),buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,v,gl.STATIC_DRAW);return{buffer:buf,count:v.length/6};}
function emit(out,a,b,c){const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],nx=ab[1]*ac[2]-ab[2]*ac[1],ny=ab[2]*ac[0]-ab[0]*ac[2],nz=ab[0]*ac[1]-ab[1]*ac[0],m=Math.hypot(nx,ny,nz)||1;for(const p of [a,b,c])out.push(...p,nx/m,ny/m,nz/m);}
function makeBox(){const a=[],p=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];for(const f of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[7,6,2,3],[0,1,5,4]]){emit(a,p[f[0]],p[f[1]],p[f[2]]);emit(a,p[f[0]],p[f[2]],p[f[3]]);}return meshFrom(a);}
function makeCone(sides=9){const out=[],apex=[0,.5,0],center=[0,-.5,0];for(let i=0;i<sides;i++){const angle=i*TAU/sides,nxt=(i+1)*TAU/sides,p1=[Math.sin(angle)*.5,-.5,Math.cos(angle)*.5],p2=[Math.sin(nxt)*.5,-.5,Math.cos(nxt)*.5];emit(out,apex,p2,p1);emit(out,center,p1,p2);}return meshFrom(out);}
function makeCylinder(sides=10){const out=[];for(let i=0;i<sides;i++){const a=i*TAU/sides,b=(i+1)*TAU/sides,p=[Math.sin(a)*.5,-.5,Math.cos(a)*.5],q=[Math.sin(b)*.5,-.5,Math.cos(b)*.5],r=[p[0],.5,p[2]],s=[q[0],.5,q[2]];emit(out,p,s,r);emit(out,p,q,s);emit(out,[0,.5,0],r,s);emit(out,[0,-.5,0],q,p);}return meshFrom(out);}
function makeSphere(lat=9,lon=12){const v=[];const point=(a,b)=>[Math.sin(a)*Math.sin(b)*.5,Math.cos(a)*.5,Math.sin(a)*Math.cos(b)*.5];for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const a=i*Math.PI/lat,b=j*TAU/lon,c=(i+1)*Math.PI/lat,d=(j+1)*TAU/lon;if(i>0)emit(v,point(a,b),point(c,b),point(a,d));if(i<lat-1)emit(v,point(a,d),point(c,b),point(c,d));}return meshFrom(v);}
const models={box:makeBox(),cone:makeCone(),cylinder:makeCylinder(),sphere:makeSphere()};
const colorHex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const COLORS={grass:0x70be73,lightGrass:0x98d47e,sea:0x419ccc,sand:0xf8db9e,soil:0x986a4b,stone:0x8fa1b2,stone2:0xb4bdc9,wood:0x916346,roof:0xf28a70,roof2:0x5f8dbb,trunk:0x967657,palm:0x4eae67,palm2:0x2d8b54,player:0xffe0a0,shirt:0x356cc5,white:0xffffff,enemy:0xf16d69,med:0x5bea85,zone:0x42d5ff,bullet:0xffe66d};
function matMul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let z=0;for(let k=0;k<4;k++)z+=a[k*4+r]*b[c*4+k];o[c*4+r]=z;}return o;}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),out=new Float32Array(16);out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;out[14]=2*far*near/(near-far);return out;}
function lookAt(eye,target){let z=[eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]];let len=Math.hypot(...z)||1;z=z.map(v=>v/len);let x=[z[2],0,-z[0]];len=Math.hypot(...x)||1;x=x.map(v=>v/len);let y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];const out=new Float32Array(16);out[0]=x[0];out[1]=y[0];out[2]=z[0];out[4]=x[1];out[5]=y[1];out[6]=z[1];out[8]=x[2];out[9]=y[2];out[10]=z[2];out[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);out[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);out[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);out[15]=1;return out;}
function modelMatrix(x,y,z,sx,sy,sz,angle=0){const a=Math.cos(angle),b=Math.sin(angle);return new Float32Array([a*sx,0,-b*sx,0,0,sy,0,0,b*sz,0,a*sz,0,x,y,z,1]);}
let vp;function draw(shape,x,y,z,sx,sy,sz,color,angle=0){const m=models[shape];gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.vertexAttribPointer(attribPos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(attribNormal,3,gl.FLOAT,false,24,12);gl.enableVertexAttribArray(attribPos);gl.enableVertexAttribArray(attribNormal);gl.uniformMatrix4fv(uModel,false,modelMatrix(x,y,z,sx,sy,sz,angle));gl.uniform3fv(uColor,colorHex(color));gl.drawArrays(gl.TRIANGLES,0,m.count);}
const staticMeshes=[],obstacles=[],supplies=[],loot=[];
const WEAPONS={blaster:{name:'Blaster',damage:34,delay:.26,speed:43,mag:12,reserve:72,color:0xffde65},rapid:{name:'Rapid Blaster',damage:16,delay:.10,speed:49,mag:28,reserve:140,color:0x83efff},heavy:{name:'Heavy Blaster',damage:54,delay:.64,speed:38,mag:6,reserve:42,color:0xffaa79}};
const KIT_POSITIONS=[[11,14],[-17,10],[37,11],[-34,-19],[10,-35],[40,-34],[-42,38],[30,36]];
const CAMP_POSITIONS=[[-48,-6],[-26,42],[2,44],[44,7],[8,-48],[-48,-42],[44,41],[-4,-17],[-25,-45],[49,-20],[-14,20],[27,43]];
const DIFFICULTIES={easy:{speed:3.4,accuracy:.43,aggression:1.25,damage:8,hp:75},normal:{speed:4.9,accuracy:1,aggression:2.5,damage:12,hp:100},hard:{speed:6.0,accuracy:1.75,aggression:4.3,damage:16,hp:125}};
const HEROES={explorer:{label:'Explorer',shirt:0x356cc5,hat:0xffd66b},ranger:{label:'Ranger',shirt:0x3eaa76,hat:0xe99555},astronaut:{label:'Space Scout',shirt:0xb17cea,hat:0xe9f0ff}};
let difficulty='normal',hero='explorer',aimAssist=true;
try{const saved=JSON.parse(localStorage.getItem('last-island-3d-prefs')||'{}');if(DIFFICULTIES[saved.difficulty])difficulty=saved.difficulty;if(HEROES[saved.hero])hero=saved.hero;if(typeof saved.aimAssist==='boolean')aimAssist=saved.aimAssist;}catch{}
function persistPrefs(){try{localStorage.setItem('last-island-3d-prefs',JSON.stringify({difficulty,hero,aimAssist}));}catch{}}
const difficultySelect=ui('difficulty');difficultySelect.value=difficulty;difficultySelect.addEventListener('change',()=>{difficulty=difficultySelect.value;persistPrefs();});
const aimToggle=ui('aim-assist');aimToggle.checked=aimAssist;aimToggle.addEventListener('change',()=>{aimAssist=aimToggle.checked;persistPrefs();});
function selectHero(which){if(!HEROES[which])return;hero=which;for(const b of document.querySelectorAll('.hero-choice')){b.classList.toggle('selected',b.dataset.hero===hero);b.setAttribute('aria-pressed',String(b.dataset.hero===hero));}persistPrefs();}
for(const b of document.querySelectorAll('.hero-choice'))b.addEventListener('click',()=>selectHero(b.dataset.hero));selectHero(hero);

function isLineBlocked(a,b){return obstacles.some(o=>{const dx=b.x-a.x,dz=b.z-a.z,denom=dx*dx+dz*dz||1,t=clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/denom,0,1);return Math.hypot(a.x+dx*t-o.x,a.z+dz*t-o.z)<o.r+.25;});}
// Each weapon keeps its own magazine and reserve when a different slot is selected.
function replenish(entity,type){const config=WEAPONS[type];entity.weapon=type;entity.ammo=config.mag;entity.reserve=config.reserve;entity.reload=0;}
function giveWeapon(type){
 if(!WEAPONS[type])return;
 if(!player.slots[type]){player.slots[type]={ammo:WEAPONS[type].mag,reserve:WEAPONS[type].reserve};notify('🎁 New weapon unlocked: '+WEAPONS[type].name);}
 else{player.slots[type].reserve+=WEAPONS[type].mag*2;notify('📦 '+WEAPONS[type].name+' ammunition!');}
 equipWeapon(type);
}
function equipWeapon(type){
 if(mode!=='playing'||!player.slots[type]||player.weapon===type)return;
 // Stop pending reload safely; ammo already in the current slot stays there.
 player.reload=0;
 player.weapon=type;player.shot=Math.max(player.shot,.12);
 notify('🔫 Equipped '+WEAPONS[type].name);sfx(780,.07);updateInventory();
}
function cycleWeapon(dir=1){const held=Object.keys(WEAPONS).filter(w=>player.slots[w]);if(held.length<2)return;const index=held.indexOf(player.weapon);equipWeapon(held[(index+dir+held.length)%held.length]);}


const put=(shape,x,y,z,sx,sy,sz,color,angle=0)=>staticMeshes.push({shape,x,y,z,sx,sy,sz,color,angle});
const layoutRand=rng(91843);
function world(){staticMeshes.length=0;obstacles.length=0;supplies.length=0;loot.length=0;
 put('box',0,-2.8,0,129,5,129,COLORS.soil);put('box',0,-.25,0,128,.7,128,COLORS.grass); // Square stylized island with blue sea outside
 put('box',0,-9,0,400,8,400,COLORS.sea);
 for(let i=0;i<50;i++){const x=rndCoord(),z=rndCoord();if(Math.abs(x)<6&&Math.abs(z)<6)continue;put('box',x,-.06,z,rnd(1,3),.12,rnd(1,3),i%2?COLORS.lightGrass:COLORS.grass);}
 // Island landmarks and subtle elevation shapes: landmarks stay decorative so the walkable navigation remains reliable.
 for(const [x,z,w,h,color] of [[-45,25,13,3,0xe6bd88],[41,15,12,4,0xb9beee],[-10,42,16,2.4,0xd6b59c],[25,-45,11,3,0xc7a9e4]]){
  put('cylinder',x,h*.27,z,w,h*.55,w,color);
  put('cone',x,h*.65,z,w*1.04,h*.45,w*1.04,color);
 }
 // A visible beacon and a beachside lookout add orientation and distinctive scenery.
 put('cylinder',-47,4,-43,1.5,8,1.5,0xf8f1d2);
 put('sphere',-47,8.5,-43,2.2,2.2,2.2,0xffe578);
 put('box',44,2.4,-45,5,4,5,0xffdcb4);
 put('cone',44,5.5,-45,7,3.5,7,0xfc7c83);
 // Low houses and rocks provide cover, but don't create a giant impassable maze.
 const houses=[[-28,2],[31,-20],[-12,-29],[21,28]];
 houses.forEach(([x,z],i)=>{put('box',x,2.5,z,8,5,7,i%2?0xffd69c:0xf1d6b7);put('cone',x,6,z,11,4,10,i%2?COLORS.roof2:COLORS.roof,Math.PI/4);put('box',x,1.9,z+3.53,1.8,3,.2,COLORS.wood);obstacles.push({x,z,r:5.1});});
 for(let i=0;i<22;i++){let x=(layoutRand()-.5)*105,z=(layoutRand()-.5)*105;if(Math.hypot(x,z)<13||obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<8))continue;const sz=1.8+layoutRand()*2.4;put('sphere',x,sz*.35,z,sz*1.8,sz,sz*1.25,i%2?COLORS.stone:COLORS.stone2);obstacles.push({x,z,r:sz*.85});}
 for(let i=0;i<44;i++){let x=(layoutRand()-.5)*117,z=(layoutRand()-.5)*117;if(Math.hypot(x,z)<12||obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<7))continue;const h=3.3+layoutRand()*2.5;put('cylinder',x,h/2,z,.8,h,.8,COLORS.trunk);for(let j=0;j<3;j++)put('cone',x,h+1+j*.9,z,3.7-j*.55,2.9,3.7-j*.55,j%2?COLORS.palm:COLORS.palm2);}
 for(const [x,z] of [[8,9],[-36,28],[38,22],[-35,-35],[13,-38],[37,-37]])supplies.push({x,z,active:true});
 KIT_POSITIONS.forEach(([x,z],i)=>loot.push({x,z,type:i%4===0?'armor':i%4===1?'rapid':i%4===2?'ammo':'heavy',active:true}));
 // Additional recognizable supply camps, with pickups distributed around the entire island.
 CAMP_POSITIONS.forEach(([x,z],i)=>{
  const point=freeAt(x,z,.8)?{x,z}:findOpenCamp(x,z);
  loot.push({...point,type:['ammo','armor','rapid','heavy'][i%4],active:true});
  put('box',point.x,-.01,point.z,4,.16,4,i%2?0xf3d7a1:0xa3eab8);
  for(const dx of [-1.4,1.4])put('cylinder',point.x+dx,.55,point.z-1.4,.18,1.1,.18,0xffffff);
 });
}
function rndCoord(){return (layoutRand()-.5)*112;}
function findOpenCamp(x,z){for(let radius=2;radius<17;radius+=2)for(let i=0;i<16;i++){const a=i*TAU/16,xx=clamp(x+Math.cos(a)*radius,-57,57),zz=clamp(z+Math.sin(a)*radius,-57,57);if(freeAt(xx,zz,.8))return{x:xx,z:zz};}return{x:0,z:0};}

world();
const BOT_COUNT=12,matchSeconds=195;
let player,bots,bullets,mode='menu',time=0,zoneR=59,zoneX=0,zoneZ=0,kills=0,noiseTime=0,last=0,acc=0,hopHeld=false,muted=false,mouseDown=false,pointerId=-1,pointerX=0,pointerY=0,hitFlash=0,hitMarker=0;
let yaw=0,pitch=.22;const keyState={},touch={x:0,z:0,fire:false,jump:false};
const botColors=[0xf8796e,0xffc36e,0xc89dff,0x86dccc,0xf78fba,0xe1b777];
function spawn(){player={id:0,x:0,z:0,y:23,vy:0,yaw:0,hp:100,armor:0,alive:true,shot:0,dropping:true};replenish(player,'blaster');player.slots={blaster:{ammo:WEAPONS.blaster.mag,reserve:WEAPONS.blaster.reserve}};bots=[];const random=rng(2026);for(let i=0;i<BOT_COUNT;i++){const a=i*TAU/BOT_COUNT+random()*.3,d=19+random()*33;bots.push({id:i+1,x:Math.sin(a)*d,z:Math.cos(a)*d,y:0,vy:0,yaw:a+Math.PI,hp:DIFFICULTIES[difficulty].hp,alive:true,shot:1+random()*2,think:random()*2,strafe:i%2?1:-1,tactic:'advance',tacticTimer:0,path:[],pathTimer:0,pathGoal:null,stuckTime:0,lastX:Math.sin(a)*d,lastZ:Math.cos(a)*d,color:botColors[i%botColors.length],step:0});}bullets=[];for(const s of supplies)s.active=true;for(const box of loot)box.active=true;hitFlash=0;hitMarker=0;time=0;zoneR=59;zoneX=0;zoneZ=0;kills=0;yaw=0;pitch=.22;last=0;acc=0;notify('🪂 Parachuting! Steer toward a safe landing spot.');ui('drop-status').hidden=false;ui('drop-status').textContent='🪂 PARACHUTING · steer to land';}
function notify(v){ui('notice').textContent=v;noiseTime=2.6;}
function toggleOverlay(title,desc,button,fn){ui('pre-match').hidden=!(mode==='menu'||mode==='over');ui('overlay-title').textContent=title;ui('overlay-text').textContent=desc;ui('start').textContent=button;ui('start').onclick=fn;ui('overlay').hidden=false;}
function start(){difficulty=difficultySelect.value;persistPrefs();spawn();mode='playing';ui('overlay').hidden=true;ui('pre-match').hidden=false;updateInventory();Object.keys(keyState).forEach(k=>keyState[k]=false);touch.fire=false;touch.jump=false;touch.x=0;touch.z=0;cv.focus();}
ui('start').onclick=start;
function end(won){if(mode!=='playing')return;mode='over';toggleOverlay(won?'🏆 ISLAND CHAMPION!':'💥 YOU WERE ELIMINATED',won?'You are the last survivor! '+kills+' eliminations. Great battle!':'You made '+kills+' eliminations. Try new routes, use buildings for cover, and watch the shrinking storm.','PLAY AGAIN',start);}
function pause(){if(mode==='playing'){mode='paused';toggleOverlay('⏸️ MATCH PAUSED','Your current match is frozen. Continue when ready.','RESUME',()=>{mode='playing';ui('overlay').hidden=true;last=0;});}else if(mode==='paused'){mode='playing';ui('overlay').hidden=true;last=0;}}
ui('pause').addEventListener('click',pause);ui('sound').addEventListener('click',()=>{muted=!muted;ui('sound').textContent=muted?'🔇':'🔊';});
let audio;function sfx(freq,duration=.05){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='square';o.frequency.setValueAtTime(freq,audio.currentTime);v.gain.setValueAtTime(.012,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function insideIsland(x,z){return Math.max(Math.abs(x),Math.abs(z))<61.5;}
function freeAt(x,z,r=.75){return insideIsland(x,z)&&!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+r);}
function move(entity,vx,vz,dt){const dx=vx*dt,dz=vz*dt;if(freeAt(entity.x+dx,entity.z))entity.x+=dx;if(freeAt(entity.x,entity.z+dz))entity.z+=dz;}
function damage(target,amount,owner){if(!target.alive)return;
 if(target===player){const absorbed=Math.min(player.armor,amount*.65);player.armor=Math.max(0,player.armor-absorbed);amount-=absorbed;hitFlash=.42;}
 if(owner===player&&target!==player)hitMarker=.24;
 target.hp=Math.max(0,target.hp-amount);if(target.hp>0)return;target.alive=false;if(target===player){end(false);return;}if(owner===player){kills++;notify('🎯 ELIMINATION! '+kills+' total');sfx(790,.15);}if(bots.every(b=>!b.alive))end(true);}
function beginReload(){if(mode!=='playing'||player.reload>0||player.dropping)return;const w=WEAPONS[player.weapon],slot=player.slots[player.weapon];if(slot.ammo>=w.mag||slot.reserve<=0)return;player.reload=player.weapon==='heavy'?1.65:1.15;notify('🔄 Reloading '+w.name+'…');updateInventory();}
function switchWeapon(type){if(mode==='playing')giveWeapon(type);}
function updateInventory(){if(!player)return;const slot=player.slots[player.weapon];ui('weapon').textContent=WEAPONS[player.weapon].name;ui('ammo').textContent=player.reload>0?'RELOADING':slot.ammo+' / '+slot.reserve;ui('armor').textContent=Math.ceil(player.armor);ui('reload').disabled=player.reload>0||player.dropping||slot.reserve<=0||slot.ammo>=WEAPONS[player.weapon].mag;
 for(const b of document.querySelectorAll('.weapon-slot')){const type=b.dataset.weapon,held=player.slots[type];b.disabled=!held;b.classList.toggle('equipped',player.weapon===type);b.setAttribute('aria-pressed',String(player.weapon===type));const ammo=b.querySelector('.slot-ammo');if(ammo)ammo.textContent=held?held.ammo+' / '+held.reserve:'LOCKED';}
}
function fire(shooter){if(!shooter.alive||shooter.shot>0||(shooter===player&&player.dropping))return;
 const isPlayer=shooter===player;
 if(isPlayer){if(shooter.reload>0)return;const slot=shooter.slots[shooter.weapon];if(slot.ammo<=0){beginReload();return;}slot.ammo--;}
 const weapon=isPlayer?WEAPONS[shooter.weapon]:null;
 shooter.shot=isPlayer?weapon.delay:.75+rnd(.15,.45);
 let a=shooter.yaw;
 // Optional child-friendly aim assistance gently nudges projectiles toward visible bots near the reticle.
 if(isPlayer&&aimAssist){let candidate=null,near=.25;
  for(const b of bots){if(!b.alive||isLineBlocked(shooter,b))continue;const dd=dist(shooter,b);if(dd>32||dd<.1)continue;
   const aim=Math.atan2(b.x-shooter.x,b.z-shooter.z),delta=Math.abs(angleDelta(aim,a));
   if(delta<near){candidate=aim;near=delta;}}
  if(candidate!==null)a+=angleDelta(candidate,a)*.72;
 }
 bullets.push({x:shooter.x+Math.sin(a)*1.05,y:shooter.y+1.32,z:shooter.z+Math.cos(a)*1.05,dx:Math.sin(a),dz:Math.cos(a),owner:shooter,life:1.25,damage:isPlayer?weapon.damage:DIFFICULTIES[difficulty].damage,speed:isPlayer?weapon.speed:37,color:isPlayer?weapon.color:0xff7474});
 if(isPlayer){sfx(shooter.weapon==='heavy'?195:shooter.weapon==='rapid'?440:320,.055);updateInventory();}
}

// Coarse 4-unit navigation grid, rebuilt once for the island's circular cover.
// A* uses 8-way traversal with corner-cut prevention, bounded search, and cached bot paths.
const NAV_STEP=4,NAV_MIN=-60,NAV_DIM=31;
let navWalkable=null;
const navId=(x,z)=>z*NAV_DIM+x;
const navCoord=(world)=>clamp(Math.round((world-NAV_MIN)/NAV_STEP),0,NAV_DIM-1);
const navPoint=(x,z)=>({x:NAV_MIN+x*NAV_STEP,z:NAV_MIN+z*NAV_STEP});
function buildNavigation(){navWalkable=new Uint8Array(NAV_DIM*NAV_DIM);for(let z=0;z<NAV_DIM;z++)for(let x=0;x<NAV_DIM;x++){const pt=navPoint(x,z);navWalkable[navId(x,z)]=freeAt(pt.x,pt.z,1.25)?1:0;}}
function nearestNode(pt){const gx=navCoord(pt.x),gz=navCoord(pt.z);if(navWalkable[navId(gx,gz)])return navId(gx,gz);
 for(let rad=1;rad<=5;rad++)for(let z=Math.max(0,gz-rad);z<=Math.min(NAV_DIM-1,gz+rad);z++)for(let x=Math.max(0,gx-rad);x<=Math.min(NAV_DIM-1,gx+rad);x++)if(navWalkable[navId(x,z)])return navId(x,z);
 return -1;
}
function pathfind(from,to){
 if(!navWalkable)buildNavigation();const start=nearestNode(from),goal=nearestNode(to);if(start<0||goal<0)return[];if(start===goal)return[navPoint(goal%NAV_DIM,Math.floor(goal/NAV_DIM))];
 const total=NAV_DIM*NAV_DIM,g=new Float64Array(total).fill(Infinity),came=new Int32Array(total).fill(-1),closed=new Uint8Array(total),open=[start];g[start]=0;
 const heuristic=i=>Math.hypot(i%NAV_DIM-goal%NAV_DIM,Math.floor(i/NAV_DIM)-Math.floor(goal/NAV_DIM));
 let examined=0;
 while(open.length&&examined++<total){let best=0,bestValue=Infinity;for(let i=0;i<open.length;i++){const score=g[open[i]]+heuristic(open[i]);if(score<bestValue){best=i;bestValue=score;}}const cur=open.splice(best,1)[0];if(closed[cur])continue;if(cur===goal){const route=[];let n=cur;while(n>=0&&route.length<total){route.push(navPoint(n%NAV_DIM,Math.floor(n/NAV_DIM)));if(n===start)break;n=came[n];}route.reverse();return route;}
 closed[cur]=1;const x=cur%NAV_DIM,z=Math.floor(cur/NAV_DIM);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
  if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=NAV_DIM||nz>=NAV_DIM)continue;
  const next=navId(nx,nz);if(!navWalkable[next]||closed[next])continue;
  if(dx&&dz&&(!navWalkable[navId(x+dx,z)]||!navWalkable[navId(x,z+dz)]))continue;
  const cost=g[cur]+(dx&&dz?Math.SQRT2:1);if(cost<g[next]){g[next]=cost;came[next]=cur;open.push(next);}
 }
 }
 return[];
}
function steerBotAroundCover(bot,destination,dt){
 const direct=isLineBlocked(bot,destination);bot.pathTimer-=dt;
 if(bot.pathTimer<=0||!bot.pathGoal||dist(bot.pathGoal,destination)>7){bot.path=direct?pathfind(bot,destination):[];bot.pathGoal={x:destination.x,z:destination.z};bot.pathTimer=.9+(bot.id%5)*.19;}
 while(bot.path.length&&dist(bot,bot.path[0])<2.5)bot.path.shift();
 let next=bot.path.length?bot.path[0]:destination;
 // If a waypoint is directly obstructed, refresh on the next update.
 if(bot.path.length&&isLineBlocked(bot,next)){bot.pathTimer=0;next=destination;}
 const a=Math.atan2(next.x-bot.x,next.z-bot.z);const speed=DIFFICULTIES[difficulty].speed;
 const oldX=bot.x,oldZ=bot.z;move(bot,Math.sin(a)*speed,Math.cos(a)*speed,dt);
 if(Math.hypot(bot.x-oldX,bot.z-oldZ)<speed*dt*.25){bot.stuckTime+=dt;if(bot.stuckTime>.45){bot.pathTimer=0;bot.stuckTime=0;bot.strafe*=-1;}}else bot.stuckTime=0;
 return a;
}

function closestEnemy(bot){let target=player.alive?player:null,best=target?dist(bot,target):1e6;for(const other of bots){if(other===bot||!other.alive)continue;const d=dist(bot,other);if(d<best){best=d;target=other;}}return[target,best];}
function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
function step(dt){if(mode!=='playing')return;
 if(player.dropping){
  const left=(keyState.KeyA||keyState.ArrowLeft?-1:0)+(keyState.KeyD||keyState.ArrowRight?1:0)+touch.x;
  const forward=(keyState.KeyW||keyState.ArrowUp?1:0)-(keyState.KeyS||keyState.ArrowDown?1:0)-touch.z;
  const speed=7.5/Math.max(1,Math.hypot(left,forward));
  move(player,(Math.cos(yaw)*left+Math.sin(yaw)*forward)*speed,(Math.cos(yaw)*forward-Math.sin(yaw)*left)*speed,dt);
  player.y=Math.max(0,player.y-6.7*dt);player.yaw=yaw;
  if(player.y===0){player.dropping=false;player.vy=0;ui('drop-status').hidden=true;notify('🏝️ Landed! Collect loot and survive the storm!');sfx(660,.13);}
  return;
 }
 time+=dt;const fraction=clamp(time/matchSeconds,0,1);zoneR=lerp(59,8,fraction**.7);zoneX=lerp(0,7,fraction);zoneZ=lerp(0,-6,fraction);
 hitFlash=Math.max(0,hitFlash-dt);hitMarker=Math.max(0,hitMarker-dt);ui('damage-flash').style.opacity=String(hitFlash/.42*.43);ui('crosshair').classList.toggle('hit',hitMarker>0);
 const left=(keyState.KeyA||keyState.ArrowLeft?-1:0)+(keyState.KeyD||keyState.ArrowRight?1:0)+touch.x;
 const forward=(keyState.KeyW||keyState.ArrowUp?1:0)-(keyState.KeyS||keyState.ArrowDown?1:0)-touch.z;
 const norm=Math.max(1,Math.hypot(left,forward));const velocity=8.6;
 move(player,(Math.cos(yaw)*left+Math.sin(yaw)*forward)*velocity/norm,(Math.cos(yaw)*forward-Math.sin(yaw)*left)*velocity/norm,dt);
 player.yaw=yaw;player.shot=Math.max(0,player.shot-dt);
 if(player.reload>0){player.reload=Math.max(0,player.reload-dt);if(player.reload===0){const w=WEAPONS[player.weapon],slot=player.slots[player.weapon],n=Math.min(w.mag-slot.ammo,slot.reserve);slot.ammo+=n;slot.reserve-=n;notify('✅ Reloaded!');updateInventory();}}
 if(keyState.KeyR){keyState.KeyR=false;beginReload();}for(const [code,type] of [['Digit1','blaster'],['Digit2','rapid'],['Digit3','heavy']])if(keyState[code]){keyState[code]=false;equipWeapon(type);}
 if((keyState.KeyE||touch.jump)&&player.y<=.001&&player.vy<=0){player.vy=8.0;sfx(560,.09);}
 player.y=Math.max(0,player.y+player.vy*dt);player.vy=player.y===0?0:player.vy-21*dt;
 if((keyState.Space||keyState.KeyF||touch.fire||mouseDown)&&mode==='playing')fire(player);
 for(const s of supplies){if(s.active&&Math.hypot(player.x-s.x,player.z-s.z)<1.8&&player.hp<100){s.active=false;player.hp=Math.min(100,player.hp+37);notify('💚 Supply kit! +37 health');sfx(850,.13);}}
 for(const box of loot){if(!box.active||Math.hypot(player.x-box.x,player.z-box.z)>2.1)continue;
 if(box.type==='armor'){player.armor=Math.min(75,player.armor+45);notify('🛡️ Armor +45!');}
 else if(box.type==='ammo'){player.slots[player.weapon].reserve+=WEAPONS[player.weapon].mag*2;notify('📦 Bonus ammo collected!');}
 else{switchWeapon(box.type);}
 box.active=false;sfx(720,.10);updateInventory();}
 for(const b of bots){if(!b.alive)continue;b.shot=Math.max(0,b.shot-dt);b.think-=dt;b.step+=dt;b.tacticTimer-=dt;
 let [target,d]=closestEnemy(b);if(!target)continue;
 const outside=Math.hypot(b.x-zoneX,b.z-zoneZ)>zoneR-3;
 const blockedLine=isLineBlocked(b,target);
 if(b.tacticTimer<=0){
  b.tacticTimer=1.6+(b.id%4)*.27;
  b.tactic=outside?'zone':b.hp<DIFFICULTIES[difficulty].hp*.32?'retreat':blockedLine?'flank':d<10?'evade':d>25?'advance':'strafe';
  if(Math.random()<.18)b.strafe*=-1;
 }
 const baseAngle=Math.atan2(target.x-b.x,target.z-b.z);
 const goal=outside?{x:zoneX,z:zoneZ}:b.tactic==='retreat'?{x:b.x-(target.x-b.x)*.65,z:b.z-(target.z-b.z)*.65}:b.tactic==='flank'?{x:target.x+Math.cos(baseAngle)*b.strafe*9,z:target.z-Math.sin(baseAngle)*b.strafe*9}:b.tactic==='evade'||b.tactic==='strafe'?{x:b.x+Math.cos(baseAngle)*b.strafe*9,z:b.z-Math.sin(baseAngle)*b.strafe*9}:target;
 goal.x=clamp(goal.x,-57,57);goal.z=clamp(goal.z,-57,57);
 // Use A* when cover obstructs the desired destination. Retain tactical behavior in clear space.
 const heading=steerBotAroundCover(b,goal,dt);
 b.yaw+=clamp(angleDelta(heading,b.yaw),-dt*3.1,dt*3.1);
 const blocked=blockedLine;
 if(!outside&&!blocked&&d<31&&Math.abs(angleDelta(baseAngle,b.yaw))<.36&&Math.random()<dt*DIFFICULTIES[difficulty].aggression&&Math.random()<DIFFICULTIES[difficulty].accuracy*.65)fire(b);
 if(Math.hypot(b.x-zoneX,b.z-zoneZ)>zoneR)damage(b,8.7*dt,null);
 }
 for(let i=bullets.length-1;i>=0;i--){const p=bullets[i];p.life-=dt;p.x+=p.dx*p.speed*dt;p.z+=p.dz*p.speed*dt;
 let hit=p.life<=0||!insideIsland(p.x,p.z)||obstacles.some(o=>Math.hypot(o.x-p.x,o.z-p.z)<o.r+.1);
 if(!hit){for(const target of [player,...bots]){if(target===p.owner||!target.alive)continue;if(Math.hypot(target.x-p.x,target.z-p.z)<.95&&Math.abs((target.y+1.3)-p.y)<1.9){damage(target,p.damage,p.owner);hit=true;break;}}}
 if(hit)bullets.splice(i,1);
 }
 if(Math.hypot(player.x-zoneX,player.z-zoneZ)>zoneR){damage(player,13*dt,null);if(Math.floor(time*3)%3===0&&noiseTime<.35)notify('⚠️ STORM DAMAGE! GET INSIDE THE RING');}
 if(noiseTime>0)noiseTime=Math.max(0,noiseTime-dt);if(noiseTime===0)ui('notice').textContent='';
 if(mode==='playing'&&Math.floor(time*10)%2===0){ui('hp').textContent=Math.ceil(player.hp);updateInventory();ui('kills').textContent=kills;ui('alive').textContent=bots.filter(x=>x.alive).length+1;ui('zone').textContent=Math.round(zoneR);ui('clock').textContent=Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0');}
}
function character(c,isPlayer){if(!c.alive)return;const x=c.x,z=c.z,y=c.y;const body=isPlayer?HEROES[hero].shirt:c.color;draw('sphere',x,.03,z,1.13,.06,1.13,0x355b4a);
 draw('box',x,y+1.5,z,.85,1.05,.54,body,c.yaw);
 draw('sphere',x,y+2.30,z,.63,.65,.63,isPlayer?0xffd49f:0xf5d3b2);if(isPlayer){draw('box',x,y+2.69,z,.75,.18,.65,HEROES[hero].hat,c.yaw);draw('box',x+Math.sin(c.yaw)*.21,y+2.63,z+Math.cos(c.yaw)*.21,.55,.1,.25,HEROES[hero].hat,c.yaw);}
 if(isPlayer&&c.dropping){
  draw('sphere',x,y+5,z,7.8,2.1,7.8,0xffbd72);
  for(const [dx,dz] of [[-2.4,-1.8],[2.4,-1.8],[-2.4,1.8],[2.4,1.8]]){
   draw('cylinder',x+dx*.5,y+3,z+dz*.5,.045,3.9,.045,0xf6f3e7);
  }
 }
 const swing=Math.sin((time*8+c.id)*1.4)*.12;
 draw('box',x+Math.cos(c.yaw)*.29,y+.51,z-Math.sin(c.yaw)*.29,.28,.92,.36,0x39476a,swing);
 draw('box',x-Math.cos(c.yaw)*.29,y+.51,z+Math.sin(c.yaw)*.29,.28,.92,.36,0x39476a,-swing);
 draw('box',x+Math.cos(c.yaw)*.53,y+1.5,z-Math.sin(c.yaw)*.53,.28,.82,.32,0xf0bf8f,c.yaw);
 draw('box',x-Math.cos(c.yaw)*.53,y+1.5,z+Math.sin(c.yaw)*.53,.28,.82,.32,0xf0bf8f,c.yaw);
 draw('box',x+Math.sin(c.yaw)*.43,y+1.52,z+Math.cos(c.yaw)*.43,.15,.21,1.25,0x2d3a4f,c.yaw);
 if(!isPlayer&&c.hp<100){draw('box',x,y+2.85,z,.85,.1,.12,0x5d2632);draw('box',x-.425*(1-c.hp/100),y+2.85,z+.02,.85*c.hp/100,.1,.15,0x6fee81);}
}
// Lightweight 2D tactical map: no dependency on external map services.
const mapCanvas=ui('minimap'),mapCtx=mapCanvas.getContext('2d');
function drawMap(){if(!mapCtx||!player)return;const c=mapCtx,w=mapCanvas.width,h=mapCanvas.height;
 c.clearRect(0,0,w,h);c.fillStyle='#368e69';c.fillRect(0,0,w,h);
 const mx=x=>(x+64)/128*w,mz=z=>(z+64)/128*h;
 c.strokeStyle='#ffffff22';c.lineWidth=1;for(let i=-48;i<=48;i+=16){c.beginPath();c.moveTo(mx(i),0);c.lineTo(mx(i),h);c.moveTo(0,mz(i));c.lineTo(w,mz(i));c.stroke();}
 for(const o of obstacles){c.fillStyle='#42566c';c.beginPath();c.arc(mx(o.x),mz(o.z),Math.max(1,o.r*w/128),0,TAU);c.fill();}
 for(const box of loot)if(box.active){c.fillStyle='#ffdc61';c.fillRect(mx(box.x)-2,mz(box.z)-2,4,4);}
 for(const s of supplies)if(s.active){c.fillStyle='#72f3a4';c.fillRect(mx(s.x)-2,mz(s.z)-2,4,4);}
 c.strokeStyle='#87e8ff';c.lineWidth=3;c.beginPath();c.arc(mx(zoneX),mz(zoneZ),zoneR*w/128,0,TAU);c.stroke();
 for(const b of bots)if(b.alive){c.fillStyle='#ff9d67';c.beginPath();c.arc(mx(b.x),mz(b.z),3,0,TAU);c.fill();}
 c.fillStyle='#d6ff86';c.strokeStyle='#183d54';c.lineWidth=1.5;c.beginPath();c.arc(mx(player.x),mz(player.z),4.7,0,TAU);c.fill();c.stroke();
 c.save();c.translate(mx(player.x),mz(player.z));c.rotate(-yaw);c.fillStyle='#ffffff';c.beginPath();c.moveTo(0,-9);c.lineTo(3.5,-3.5);c.lineTo(-3.5,-3.5);c.closePath();c.fill();c.restore();
}
ui('map-toggle').addEventListener('click',()=>ui('minimap-wrap').classList.toggle('collapsed'));
function render(){const ratio=Math.min(2,window.devicePixelRatio||1),w=Math.max(2,Math.floor(cv.clientWidth*ratio)),h=Math.max(2,Math.floor(cv.clientHeight*ratio));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 if(!player)return;drawMap();const eyex=player.x-Math.sin(yaw)*12,eyez=player.z-Math.cos(yaw)*12,eyey=player.y+6.1+Math.sin(pitch)*7;const eye=[eyex,eyey,eyez],target=[player.x,player.y+1.35,player.z+3*Math.cos(yaw)];vp=matMul(perspective(Math.PI/3,cv.width/cv.height,.1,410),lookAt(eye,target));gl.uniformMatrix4fv(uVP,false,vp);gl.uniform3fv(uEye,eye);
 for(const o of staticMeshes)draw(o.shape,o.x,o.y,o.z,o.sx,o.sy,o.sz,o.color,o.angle);
 for(const p of supplies)if(p.active){draw('box',p.x,.42,p.z,1.7,.85,1.7,0xf5f7e4);draw('box',p.x,.88,p.z,.35,.15,1.12,COLORS.med);draw('box',p.x,.89,p.z,1.12,.15,.35,COLORS.med);}
 for(const box of loot)if(box.active){const y=.68+Math.sin(time*2+box.x)*.14,color=box.type==='armor'?0x6ed9fe:box.type==='rapid'?0xffe26e:box.type==='heavy'?0xff9b71:0xe9ceff;draw('box',box.x,y,box.z,1.35,1.12,1.35,color,time*.5);draw('box',box.x,y+.65,box.z,.65,.16,.65,0xffffff,time*.5);}
 // Storm perimeter is a glowing segmented wall. Its position shrinks continuously.
 for(let i=0;i<90;i++){const a=i*TAU/90;const x=zoneX+Math.cos(a)*zoneR,z=zoneZ+Math.sin(a)*zoneR;draw('box',x,.12,z,1.9,.23,.35,COLORS.zone,-a);if(i%5===0)draw('box',x,1.3,z,.27,2.5,.28,0x75f1ff);}
 for(const b of bots)character(b,false);character(player,true);
 for(const p of bullets)draw('sphere',p.x,p.y,p.z,.32,.32,.32,p.color);
}
const stickZone=ui('stick-zone'),knob=ui('stick-knob');let stickPointer=null;
function stickMove(e){if(e.pointerId!==stickPointer)return;const rect=stickZone.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,rad=rect.width*.33;const dx=clamp(e.clientX-cx,-rad,rad),dy=clamp(e.clientY-cy,-rad,rad),scale=Math.max(1,Math.hypot(dx,dy)/rad);knob.style.transform=`translate(${dx/scale}px,${dy/scale}px)`;touch.x=dx/rad/scale;touch.z=dy/rad/scale;}
stickZone.addEventListener('pointerdown',e=>{e.preventDefault();if(stickPointer!==null)return;stickPointer=e.pointerId;stickZone.setPointerCapture(e.pointerId);stickMove(e);});stickZone.addEventListener('pointermove',stickMove);
function stickEnd(e){if(stickPointer!==e.pointerId)return;stickPointer=null;touch.x=0;touch.z=0;knob.style.transform='translate(0,0)';}
for(const evt of ['pointerup','pointercancel','lostpointercapture'])stickZone.addEventListener(evt,stickEnd);
for(const [id,field] of [['fire','fire'],['jump','jump']]){const b=ui(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch[field]=true;});for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,()=>{touch[field]=false;});}
cv.addEventListener('pointerdown',e=>{if(mode!=='playing')return;pointerId=e.pointerId;pointerX=e.clientX;pointerY=e.clientY;cv.setPointerCapture(e.pointerId);if(e.pointerType==='mouse')mouseDown=true;});
cv.addEventListener('pointermove',e=>{if(e.pointerId!==pointerId||mode!=='playing')return;const dx=e.clientX-pointerX,dy=e.clientY-pointerY;pointerX=e.clientX;pointerY=e.clientY;yaw+=dx*.006;pitch=clamp(pitch-dy*.0035,-.24,.65);});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(evt,e=>{if(e.pointerId===pointerId){pointerId=-1;mouseDown=false;}});
ui('reload').addEventListener('click',beginReload);
for(const b of document.querySelectorAll('.weapon-slot'))b.addEventListener('click',()=>equipWeapon(b.dataset.weapon));
ui('cycle-weapon').addEventListener('click',()=>cycleWeapon());
cv.addEventListener('wheel',e=>{if(mode!=='playing')return;e.preventDefault();cycleWeapon(e.deltaY>=0?1:-1);},{passive:false});
document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();keyState[e.code]=true;if(e.code==='KeyP'&&!e.repeat)pause();});document.addEventListener('keyup',e=>{keyState[e.code]=false;});
function resetInput(){mouseDown=false;touch.fire=false;touch.jump=false;touch.x=0;touch.z=0;knob.style.transform='translate(0,0)';stickPointer=null;pointerId=-1;Object.keys(keyState).forEach(k=>keyState[k]=false);}
window.addEventListener('blur',()=>{resetInput();if(mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(mode==='playing')pause();}});
document.addEventListener('contextmenu',e=>{if(e.target.closest('#app'))e.preventDefault();});
function loop(timestamp){const dt=last?clamp((timestamp-last)/1000,0,.07):0;last=timestamp;if(mode==='playing'){acc=Math.min(.12,acc+dt);while(acc>=1/60&&mode==='playing'){step(1/60);acc-=1/60;}}else acc=0;render();requestAnimationFrame(loop);}
spawn();mode='menu';requestAnimationFrame(loop);
})();