(() => {
'use strict';

const W=1920,H=1080,R=8,C=8;
const FONT='Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif';
const MOBILE_LAYOUT=!!(window.matchMedia?.('(pointer: coarse)').matches||window.navigator?.maxTouchPoints>0);
const CELL=MOBILE_LAYOUT?110:96,BX=(W-C*CELL)/2,BY=MOBILE_LAYOUT?130:150;
const BERRY_SIZE=MOBILE_LAYOUT ? .90 : .82;
const TYPES=['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
const Campaign=window.BerriesCampaign;
const KEY=Campaign.KEY;
const TEST_LEVELS=Object.keys(Campaign.LEVELS).map(Number);
const LV=Campaign.LEVELS;
const pause=ms=>window.BerriesLifecycle.wait(ms);
const inBounds=(r,c)=>r>=0&&r<R&&c>=0&&c<C;
function loadSave(){return Campaign.read()}
function saveLocal(data){localStorage.setItem(KEY,JSON.stringify(data));window.BerriesYandex?.saveCloudData?.(data,false)}
function fit(img,maxW,maxH){const s=Math.min(maxW/img.width,maxH/img.height);img.setScale(s);return img}

class Sfx{
  constructor(scene){this.s=scene;this.nodes=new Set();this._muted=localStorage.getItem("berries_sfx_muted")==="1";this.master=2.35;this.last={};this.voices={};scene.events.once('shutdown',()=>{this.stopAll();for(const pool of Object.values(this.voices))for(const sound of pool)sound.destroy()})}
  get muted(){return this._muted}
  set muted(v){this._muted=!!v;localStorage.setItem("berries_sfx_muted",v?"1":"0");if(v)this.stopAll()}
  stopAll(){for(const timer of this.berryTimers||[])timer.remove(false);this.berryTimers?.clear();for(const pool of Object.values(this.voices))for(const sound of pool)sound.stop();for(const node of this.nodes){try{node.stop()}catch{}}this.nodes.clear()}
  sample(key,volume=.5,detune=0){
    if(!this.s.cache.audio.exists(key))return false;
    if(this.muted||window.BerriesLifecycle.paused)return true;
    this.unlock();
    const now=performance.now(),stamp='sample:'+key;
    // Coalesce simultaneous hits, not later hits during the previous file's tail.
    if(this.last[stamp]!=null&&now-this.last[stamp]<60)return true;
    this.last[stamp]=now;
    const pool=this.voices[key]||(this.voices[key]=[]);
    let voice=pool.find(sound=>!sound.isPlaying);
    if(!voice&&pool.length<3){voice=this.s.sound.add(key);pool.push(voice)}
    if(!voice){voice=pool.shift();voice.stop();pool.push(voice)}
    voice.play({volume,detune});return true;
  }
  berryPop(chain=1){
    if(!this.s.cache.audio.exists('sfx_berry_pop'))return false;
    if(this.muted||window.BerriesLifecycle.paused||document.hidden)return true;
    // One gentle pop per destroyed berry. clearCells() calls this once for every berry,
    // so long cascades stay audible without turning into a loud overlapping burst.
    if(!this.can('berry-burst',95))return true;
    return this.sample('sfx_berry_pop',.18,(Math.random()-.5)*70+Math.min(chain-1,4)*10);
  }
  iceBreak(){if(!this.sample('sfx_ice_break',.45))this.crack()}
  ctx(){return this.s.sound?.context}
  unlock(){const c=this.ctx();if(!window.BerriesLifecycle.paused&&c?.state==='suspended')c.resume().catch(()=>{})}
  can(name,ms=28){const n=performance.now();if((this.last[name]||0)+ms>n)return false;this.last[name]=n;return true}
  tone(f,d=.06,g=.02,t='sine',end=0,delay=0){if(this.muted||window.BerriesLifecycle.paused)return;this.unlock();const c=this.ctx();if(!c)return;const n=c.currentTime+delay,o=c.createOscillator(),a=c.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(55,f+end),n+d);a.gain.setValueAtTime(.0001,n);a.gain.exponentialRampToValueAtTime(g*this.master,n+.004);a.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(a).connect(c.destination);this.nodes.add(o);o.onended=()=>this.nodes.delete(o);o.start(n);o.stop(n+d+.03)}
  click(){if(this.can('click'))this.tone(560,.035,.020,'triangle',55)}
  bad(){if(this.can('bad',120)){this.tone(200,.09,.020,'triangle',-60);this.tone(125,.07,.010,'sine',-20,.025)}}
  swap(){if(this.can('swap',50)){this.tone(290,.055,.016,'sine',160);this.tone(430,.045,.010,'triangle',110,.024)}}
  pop(chain=1){if(this.sample('sfx_berry_pop',.18))return;if(!this.can('pop',20))return;const p=1+Math.min(chain,5)*.04+(Math.random()-.5)*.08;this.tone(210*p,.07,.027,'sine',95);this.tone(420*p,.045,.009,'triangle',120,.012);if(chain>=3&&Math.random()>.35)this.tone(900+chain*45,.08,.008,'sine',190,.015)}
  crack(){if(this.can('crack',60)){this.tone(900,.045,.013,'square',-470);this.tone(430,.07,.013,'triangle',-180,.012)}}
  wood(){if(this.can('wood',70)){this.tone(225,.055,.018,'triangle',-95);this.tone(120,.07,.012,'sine',-30,.012)}}
  spark(){if(this.can('spark',55)){this.tone(920,.085,.012,'sine',330);this.tone(1320,.065,.009,'sine',130,.035)}}
  whoosh(){if(this.can('whoosh',65)){this.tone(270,.12,.015,'sine',500);this.tone(560,.10,.008,'triangle',280,.025)}}
  specialLine(dir){
    if(!this.can('special-line-'+dir,105))return;
    if(this.sample('sfx_special_line',.82,dir==='h'?-55:70))return;
    if(dir==='h'){
      this.tone(620,.115,.032,'sine',760);
      this.tone(940,.085,.018,'triangle',430,.026);
      this.tone(1480,.055,.010,'triangle',-720,.010);
    }else{
      this.tone(1180,.115,.030,'sine',-650);
      this.tone(760,.095,.018,'triangle',-300,.024);
      this.tone(1460,.055,.010,'triangle',-700,.010);
    }
  }
  specialCreate(){
    if(!this.can('special-create',100))return;
    if(this.sample('sfx_special_create',.78))return;
    this.tone(820,.095,.020,'sine',340);
    this.tone(1260,.085,.015,'triangle',260,.035);
  }
  specialCombo(){
    if(!this.can('special-combo',380))return;
    if(this.sample('sfx_special_combo',.86))return;
    this.tone(320,.20,.035,'sine',520);
    this.tone(760,.15,.026,'triangle',760,.018);
    this.tone(1280,.13,.018,'sine',420,.060);
  }
  rainbow(){
    if(!this.can('special-rainbow',420))return;
    if(this.sample('sfx_special_rainbow',.84))return;
    this.tone(420,.18,.020,'sine',920);
    [720,960,1260,1680].forEach((f,i)=>this.tone(f,.11,.022,'sine',180,i*.036));
  }
  bomb(){
    if(this.muted||window.BerriesLifecycle.paused||!this.can('bomb',120))return;
    this.tone(155,.27,.085,'sine',-95);this.tone(290,.13,.028,'triangle',-170,.008);
    this.tone(920,.065,.032,'triangle',-590,.010);
    const c=this.ctx();if(!c)return;
    const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*.18),c.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1500;
    gain.gain.setValueAtTime(.090*this.master,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);
    source.connect(filter).connect(gain).connect(c.destination);this.nodes.add(source);
    source.onended=()=>{this.nodes.delete(source);source.disconnect();filter.disconnect();gain.disconnect()};source.start();
  }
  reward(){[640,860,1100].forEach((f,i)=>this.tone(f,.10,.013,'sine',130,i*.055))}
  win(){[523,659,784,1046].forEach((f,i)=>this.tone(f,.15,.020,'sine',100,i*.075))}
  lose(){[392,330,262].forEach((f,i)=>this.tone(f,.15,.017,'sine',-18,i*.085))}
}
const MUSIC_TRACKS={
music_menu:'audio/music/music_menu_morning.mp3',
music_gameplay_calm:'audio/music/music_gameplay_calm_devonshire_moderato.mp3',
music_gameplay_magic:'audio/music/music_gameplay_magic_escape_room.mp3?v=audio-96k'
};
class MusicBus{
constructor(scene){
this.s=scene;this.current=null;this.sound=null;this.volume=.30;this.closed=false;
try{this._muted=localStorage.getItem('berries_music_muted')==='1'}catch{this._muted=false}
this.onVisibility=()=>this.applyPause();
document.addEventListener('visibilitychange',this.onVisibility);
scene.events.once('shutdown',()=>{this.closed=true;this.stop();document.removeEventListener('visibilitychange',this.onVisibility)});
this.play(scene.sys.settings.key==='Play'?(scene.no>=21?'music_gameplay_magic':'music_gameplay_calm'):'music_menu');
window.__berriesPauseAudio=v=>window.BerriesLifecycle.set("legacy-audio",v);
window.BerriesLifecycle.register(scene);
}
get muted(){return this._muted}
set muted(v){this._muted=!!v;try{localStorage.setItem('berries_music_muted',v?'1':'0')}catch{}if(v)this.stop()}
play(key){
this.wanted=key;
if(this.closed||this.muted||this.current===key)return;
this.stop();
if(!this.s.cache.audio.exists(key)){
if(!MUSIC_TRACKS[key]||this.loading===key)return;
this.loading=key;
this.s.load.once('filecomplete-audio-'+key,()=>{this.loading=null;if(!this.closed&&!this.muted&&this.wanted===key)this.play(key)});
this.s.load.audio(key,MUSIC_TRACKS[key]);
if(!this.s.load.isLoading())this.s.load.start();
return;
}
this.current=key;this.sound=this.s.sound.add(key,{loop:true,volume:this.volume});this.sound.play();this.applyPause();
}
stop(){
this.cueTween?.stop();this.cueTween=null;
this.duckTimer?.remove?.(false);this.duckTimer=null;
if(this.cueSound){this.cueSound.destroy();this.cueSound=null}
for(const cue of this.comboVoices||[]){try{cue.stop();cue.destroy()}catch{}}
this.comboVoices?.clear?.();
if(this.sound){this.sound.destroy();this.sound=null}this.current=null;
}
duck(ms=320,factor=.55){
if(!this.sound||this.muted||this.paused||window.BerriesLifecycle.paused||document.hidden)return;
this.duckTimer?.remove?.(false);
this.sound.setVolume(this.volume*factor);
this.duckTimer=this.s.time.delayedCall(ms,()=>{
  this.duckTimer=null;
  if(this.sound&&!this.muted&&!this.paused&&!window.BerriesLifecycle.paused&&!document.hidden)this.sound.setVolume(this.volume);
});
}
accent(kind,repeatClassic=false){
if(this.closed||this.muted||this.paused||window.BerriesLifecycle.paused||document.hidden)return false;
const key=kind==='victory'?'music_victory_accent':'music_combo_accent';
if(!this.s.cache.audio.exists(key))return false;
const now=this.s.time.now;
if(kind!=='victory'&&repeatClassic){
  this.comboVoices??=new Set();
  const cue=this.s.sound.add(key,{volume:.46});
  this.comboVoices.add(cue);
  if(this.sound)this.sound.setVolume(this.volume*.30);
  cue.once('complete',()=>{
    this.comboVoices?.delete(cue);cue.destroy();
    if(!this.comboVoices?.size&&this.sound)this.sound.setVolume(this.volume);
  });
  cue.play();
  return true;
}
if(kind!=='victory'&&(this.cueSound||now<(this.nextAccent||0)))return false;
this.nextAccent=kind==='victory'?this.nextAccent:now+6500;
this.cueTween?.stop();if(this.cueSound)this.cueSound.destroy();
const cue=this.cueSound=this.s.sound.add(key,{volume:0});
if(this.sound)this.sound.setVolume(this.volume*.26);
cue.once('complete',()=>{
if(this.cueSound!==cue)return;
this.cueTween?.stop();this.cueTween=null;cue.destroy();this.cueSound=null;
if(this.sound&&!this.comboVoices?.size)this.sound.setVolume(this.volume);
});
cue.play();
this.cueTween=this.s.tweens.add({targets:cue,volume:.48,duration:65});
return true;
}
applyPause(){
const sounds=[this.sound,this.cueSound,...(this.comboVoices||[])];
for(const sound of sounds){
if(!sound)continue;
if(this.paused||window.BerriesLifecycle.paused||document.hidden)sound.pause();else if(!this.muted&&sound.isPaused)sound.resume();
}
}
pause(v){this.paused=!!v;this.applyPause()}
}
window.BerriesMusicBus=MusicBus;

class Boot extends Phaser.Scene{
  constructor(){super('Boot')}
  preload(){
    const t=this.add.text(W/2,H/2,'Загружаем лес…',{fontSize:'36px',color:'#fff7dc'}).setOrigin(.5);this.load.on('progress',v=>t.setText(`Загружаем лес… ${Math.round(v*100)}%`));
    this.load.audio('sfx_berry_pop','audio/sfx/berry_pop_soft.mp3');
    this.load.audio('sfx_ice_break','audio/sfx/ice_break.mp3');
    this.load.audio('sfx_special_create','audio/sfx/special_create_hybrid.mp3');
    this.load.audio('sfx_special_line','audio/sfx/special_line_hybrid.mp3');
    this.load.audio('sfx_special_rainbow','audio/sfx/special_rainbow_hybrid.mp3');
    this.load.audio('sfx_special_combo','audio/sfx/special_combo_hybrid.mp3');
    this.load.audio('music_combo_accent','audio/music/accents/combo.mp3');
    this.load.audio('music_victory_accent','audio/music/accents/victory.mp3');
    const I=(k,p)=>this.load.image(k,p+'?v=ui-20260917-payments');
    I('head_boosters','assets/ui/panels/panel_head_boosters.png');I('panel_king_shop','assets/ui/panels/panel_king_shop.png');
    I('goals_panel_new','assets/ui/panels/panel22.png');I('shop_plaque_new','assets/ui/panels/panel23.png');I('coin_shop_new','assets/ui/panels/popup33.png');
    I('map_level_panel','assets/ui/panels/panel_level.png');I('time_panel','assets/ui/panels/panel_time.png');
    I('wood_flat','assets/ui/panels/panel_3.png');
    I('title','assets/backgrounds/background_title_forest.jpg');I('gamebg','assets/backgrounds/background_game_forest.jpg');I('mapbg','assets/map/map_forest_background.jpg');I('logo','assets/ui/panels/logo_main.png');I('plevel','assets/ui/panels/panel_level_title.png');I('pgoals','assets/ui/panels/panel_goals.png');I('pboost','assets/ui/panels/panel_boosters.png');I('plives','assets/ui/panels/panel_lives.png');I('pcoins','assets/ui/panels/panel_coins.png');I('btn','assets/ui/buttons/button_wood.png');
    I('popup_win','assets/ui/popups/popup_level_win.png');I('popup_lose','assets/ui/popups/popup_level_lose.png');
    I('popup_royal_shop','assets/ui/popups/popup_shop_main.png');
    I('level_done_new','assets/ui/buttons/level_completed5.png');I('level_current_new','assets/ui/buttons/level_current7.png');I('level_locked_new','assets/ui/buttons/level_completed7.png');
    I('map_header_levels','assets/map/map_header_levels.png');['idle','point','celebrate','sad'].forEach(x=>I('king_'+x,'assets/characters/king/king_'+x+'.png'));
    I('ice1','assets/blockers/blocker_ice_1.png');I('ice2','assets/blockers/blocker_ice_2.png');I('acorn','assets/blockers/goal_acorn.png');I('roots','assets/blockers/blocker_roots.png');
    I('line_h','assets/specials/special_line_h.png');I('line_v','assets/specials/special_line_v.png');I('rainbow','assets/specials/special_rainbow.png');I('bombsp','assets/specials/special_bomb.png');
    I('hammer','assets/boosters/booster_hammer.png');I('shuffle','assets/boosters/booster_shuffle.png');I('fan','assets/boosters/booster_fan.png');['back','coin','settings'].forEach(x=>I('ui_'+x,'assets/ui/icons/ui_'+x+'.png'));TYPES.forEach(x=>I('b_'+x,'assets/berries/berry_'+x+'.png'));
  }
  async create(){await window.berriesDigitsReady;await window.BerriesYandex.init();await window.BerriesYandex.restoreCampaign();window.BerriesLanguage=window.BerriesYandex.language;this.scene.start('Title')}
}
class Title extends Phaser.Scene{
  constructor(){super('Title')}
  create(){window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();this.fx=new Sfx(this);this.music=new MusicBus(this);this.add.image(W/2,H/2,'title').setDisplaySize(W,H);fit(this.add.image(W/2,345,'logo'),820,560);this.makeButton(W/2,805,'ИГРАТЬ',()=>this.scene.start('Map'));window.BerriesYandex.loadingReady();
    this.add.rectangle(W/2,974,1110,128,0x3a2417,.68).setStrokeStyle(3,0xe8c77d,.75);
    this.add.text(W/2,974,'Меняй соседние ягоды местами и собирай от трёх в ряд.\nВыполняй цели слева, пока не закончатся ходы.',{fontFamily:FONT,fontSize:'31px',fontStyle:'bold',lineSpacing:8,align:'center',color:'#fff8d9',stroke:'#3b2012',strokeThickness:6}).setOrigin(.5)
  }
  makeButton(x,y,label,cb){const c=this.add.container(x,y),b=fit(this.add.image(0,0,'btn'),432,156).setInteractive({useHandCursor:true}),tx=this.add.text(0,0,label,{fontFamily:FONT,fontSize:'49px',fontStyle:'bold',color:'#ffe9a0',stroke:'#6b2e17',strokeThickness:9}).setOrigin(.5);c.add([b,tx]);b.on('pointerdown',()=>{this.fx.click();this.tweens.add({targets:c,scale:.95,duration:75,yoyo:true,onComplete:cb})})}
}
class Map extends Phaser.Scene{
  constructor(){super('Map')}
  create(){window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();this.fx=new Sfx(this);this.add.image(W/2,H/2,'mapbg').setDisplaySize(W,H);this.add.text(W/2,75,'ЛЕСНОЕ КОРОЛЕВСТВО',{fontSize:'44px',fontStyle:'bold',color:'#fff1b0',stroke:'#542b15',strokeThickness:8}).setOrigin(.5);const sv=loadSave(),done=new Set(sv.done||[]),a=[{n:1,x:360,y:760},{n:6,x:610,y:610},{n:11,x:860,y:735},{n:16,x:1110,y:545},{n:21,x:1370,y:670},{n:30,x:1580,y:410}];a.forEach(({n,x,y},i)=>{const unlocked=i===0||done.has(a[i-1]?.n),k=done.has(n)?'lvl_completed':(unlocked?'lvl_current':'lvl_locked'),im=fit(this.add.image(x,y,k),150,150);if(unlocked)im.setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.fx.click();this.scene.start('Play',{n})});this.add.text(x,y,String(n),{fontSize:'42px',fontStyle:'bold',color:unlocked?'#fff4ca':'#b9a98d',stroke:'#5b2c14',strokeThickness:7}).setOrigin(.5);this.tweens.add({targets:im,y:y-8,duration:1400+i*90,yoyo:true,repeat:-1,ease:'Sine.inOut'})});const k=fit(this.add.image(1660,815,'king_point'),330,330);this.tweens.add({targets:k,y:800,angle:{from:-2,to:2},duration:1250,yoyo:true,repeat:-1,ease:'Sine.inOut'})}
}

class Play extends Phaser.Scene{
  constructor(){super('Play')}
  init(d){this.no=+d.n||1;this.cfg=LV[this.no]||LV[1]}
  create(){
    this.attemptId=Campaign.begin(this.no);
    if(!this.attemptId){this.scene.start('Map');return false}
    const attemptId=this.attemptId;this.events.once('shutdown',()=>Campaign.abandon(attemptId));
    this.winRewardDoubled=false;
    window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();this.fx=new Sfx(this);this.music=new MusicBus(this);
    this.moves=this.cfg.m;this.score=0;this.busy=false;this.sel=null;this.last=null;this.boosterMode=null;this.continueUsed=false;this.hintTimer=null;this.hintObjs=[];
    this.goals=this.cfg.g.map(x=>({type:x[0],id:x[1],need:x[2],done:0}));this.inventory=Campaign.read().inventory;this.board=Array.from({length:R},()=>Array(C).fill(null));this.cell=Array.from({length:R},()=>Array.from({length:C},()=>({ice:0,block:null,over:null})));this.spr=Array.from({length:R},()=>Array(C).fill(null));
    this.add.image(W/2,H/2,'gamebg').setDisplaySize(W,H);this.add.rectangle(W/2,H/2,W,H,0x06140a,.08);this.hud();this.cfg.ice.forEach(([r,c,h])=>this.cell[r][c].ice=h);this.cfg.ac.forEach(([r,c])=>this.cell[r][c].block='acorn');this.cfg.root.forEach(([r,c])=>this.cell[r][c].block='roots');this.seed();this.drawAll(true);this.updateHud();this.kingAnim('idle');this.scheduleHint();
  }
  hud(){
    fit(this.add.image(W/2,64,'plevel'),560,125);this.add.text(W/2,64,`УРОВЕНЬ ${this.no}`,{fontSize:'44px',fontStyle:'bold',color:'#ffeeb0',stroke:'#622f17',strokeThickness:8}).setOrigin(.5);this.add.text(115,64,'←',{fontSize:'58px',fontStyle:'bold',color:'#fff5c7',stroke:'#4f2a15',strokeThickness:7}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});this.mt=this.add.text(1510,64,'',{fontSize:'34px',fontStyle:'bold',color:'#fff5cb',stroke:'#4e2b16',strokeThickness:6}).setOrigin(.5);this.st=this.add.text(1720,64,'',{fontSize:'26px',color:'#fff5cb',stroke:'#4e2b16',strokeThickness:5}).setOrigin(.5);
    fit(this.add.image(285,410,'pgoals'),430,570);this.add.text(285,205,'ЦЕЛИ',{fontSize:'38px',fontStyle:'bold',color:'#ffeaae',stroke:'#613117',strokeThickness:7}).setOrigin(.5);this.gt=this.goals.map((g,i)=>this.add.text(285,300+i*105,'',{fontSize:'27px',fontStyle:'bold',align:'center',color:'#4a3826',stroke:'#fff2cf',strokeThickness:2,wordWrap:{width:320}}).setOrigin(.5));
    fit(this.add.image(1640,365,'pboost'),375,445);this.add.text(1640,205,'БУСТЕРЫ',{fontSize:'30px',fontStyle:'bold',color:'#ffeaae',stroke:'#613117',strokeThickness:6}).setOrigin(.5);this.boosterButtons={};[['hammer',1540,320],['shuffle',1640,320],['fan',1740,320]].forEach(([id,x,y])=>{const im=fit(this.add.image(x,y,id),88,88).setInteractive({useHandCursor:true}),tx=this.add.text(x,y+68,'',{fontSize:'22px',fontStyle:'bold',color:'#fff6d0',stroke:'#4b2915',strokeThickness:4}).setOrigin(.5);im.on('pointerdown',()=>this.pickBooster(id));this.boosterButtons[id]={im,tx}});this.boosterHint=this.add.text(1640,455,'',{fontSize:'20px',align:'center',color:'#fff1c9',stroke:'#4b2915',strokeThickness:4,wordWrap:{width:300}}).setOrigin(.5);
    this.king=fit(this.add.image(1650,750,'king_idle'),330,330);this.kingBaseY=750;this.kingBaseScale=this.king.scaleX;
    const q=this.add.graphics();q.fillStyle(0x302014,.72);q.fillRoundedRect(BX-25,BY-25,C*CELL+50,R*CELL+50,32);q.lineStyle(6,0xd2a45c,.85);q.strokeRoundedRect(BX-25,BY-25,C*CELL+50,R*CELL+50,32);for(let r=0;r<R;r++)for(let c=0;c<C;c++){q.fillStyle((r+c)%2?0x4a6d3c:0x557b43,.68);q.fillRoundedRect(BX+c*CELL+4,BY+r*CELL+4,CELL-8,CELL-8,16)}
  }
  seed(){const a=TYPES.slice(0,this.cfg.n);for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(this.cell[r][c].block)continue;let id,t=0;do{id=Phaser.Utils.Array.GetRandom(a);t++}while(t<30&&((c>1&&this.board[r][c-1]?.id===id&&this.board[r][c-2]?.id===id)||(r>1&&this.board[r-1][c]?.id===id&&this.board[r-2][c]?.id===id)));this.board[r][c]={id,sp:null}}if(!this.hasMove())this.shuffleBoard()}
  pos(r,c){return{x:BX+c*CELL+CELL/2,y:BY+r*CELL+CELL/2}}
  render(r,c,first=false,fall=false){const ce=this.cell[r][c],p=this.pos(r,c);if(this.spr[r][c])this.spr[r][c].destroy();if(ce.over)ce.over.destroy();this.spr[r][c]=null;ce.over=null;if(ce.block){this.spr[r][c]=fit(this.add.image(p.x,p.y,ce.block),CELL*.84,CELL*.84).setDepth(4).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.tap(r,c))}else if(this.board[r][c]){const it=this.board[r][c],key=it.sp==='bomb'?'bombsp':(it.sp||'b_'+it.id),im=fit(this.add.image(p.x,p.y,key),CELL*BERRY_SIZE,CELL*BERRY_SIZE).setDepth(3).setInteractive({useHandCursor:true});if(it.id==='strawberry'&&!it.sp)im.setAngle(-13);const sx=im.scaleX,sy=im.scaleY,ang=im.angle;im.setData({r,c,sx,sy,ang});im.on('pointerdown',()=>this.tap(r,c));this.spr[r][c]=im;if(first){im.setScale(sx*.25,sy*.25);this.tweens.add({targets:im,scaleX:sx,scaleY:sy,duration:260+r*24,ease:'Back.out'})}else if(fall){const ty=im.y;im.y=BY-100-r*12;im.angle=ang+(Math.random()-.5)*18;this.tweens.add({targets:im,y:ty,angle:ang,duration:300+r*34,ease:'Bounce.out'})}}
    if(ce.ice){ce.over=fit(this.add.image(p.x,p.y,ce.ice>1?'ice2':'ice1'),CELL*.98,CELL*.98).setDepth(6).setAlpha(1);const ring=this.add.circle(p.x,p.y,CELL*.43,0x8cdcff,.08).setStrokeStyle(3,0xcdf4ff,.9).setDepth(5.5);ce.over._ring=ring;ce.over.once('destroy',()=>ring.destroy())}
  }
  drawAll(first=false,fall=false){for(let r=0;r<R;r++)for(let c=0;c<C;c++)this.render(r,c,first,fall)}
  resetHint(){this.hideHint();this.scheduleHint()}
  scheduleHint(){clearTimeout(this.hintTimer);this.hintTimer=setTimeout(()=>{if(!this.busy&&!this.boosterMode)this.showHint()},5200)}
  findHintMove(){for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(!this.board[r][c]||this.cell[r][c].block||this.cell[r][c].ice)continue;for(const [dr,dc] of [[1,0],[0,1]]){const rr=r+dr,cc=c+dc;if(!inBounds(rr,cc)||!this.board[rr][cc]||this.cell[rr][cc].block||this.cell[rr][cc].ice)continue;this.swapData({r,c},{r:rr,c:cc});const ok=this.groups().length>0;this.swapData({r,c},{r:rr,c:cc});if(ok)return [{r,c},{r:rr,c:cc}]}}return null}
  showHint(){const m=this.findHintMove();if(!m)return;this.hideHint();m.forEach(p=>{const s=this.spr[p.r][p.c];if(!s)return;const ring=this.add.circle(s.x,s.y,CELL*.43,0xffe36d,.08).setStrokeStyle(5,0xfff3a0,1).setDepth(8);this.tweens.add({targets:[ring,s],scaleX:'+=0.08',scaleY:'+=0.08',alpha:{from:1,to:.55},duration:520,yoyo:true,repeat:3,ease:'Sine.inOut'});this.hintObjs.push(ring)});this.fx.spark();setTimeout(()=>this.hideHint(),2300)}
  hideHint(){for(const o of this.hintObjs)o.destroy?.();this.hintObjs=[]}
  tap(r,c){if(this.busy)return;this.resetHint();if(this.boosterMode){this.useBoosterAt(r,c);return}if(this.cell[r][c].block||this.cell[r][c].ice||!this.board[r][c]){if(this.cell[r][c].ice)this.fx.crack();return}this.fx.click();if(!this.sel){this.select(r,c);return}if(this.sel.r===r&&this.sel.c===c){this.unselect();return}if(Math.abs(this.sel.r-r)+Math.abs(this.sel.c-c)!==1){this.unselect();this.select(r,c);return}const a={...this.sel};this.unselect();this.swap(a,{r,c})}
  select(r,c){this.sel={r,c};const s=this.spr[r][c],sx=s.getData('sx'),sy=s.getData('sy');s.setTint(0xfff4c2);this.tweens.add({targets:s,scaleX:sx*1.08,scaleY:sy*1.08,duration:130,yoyo:true,repeat:-1,ease:'Sine.inOut'})}
  unselect(){if(!this.sel)return;const s=this.spr[this.sel.r]?.[this.sel.c];if(s){this.tweens.killTweensOf(s);s.clearTint();s.setScale(s.getData('sx'),s.getData('sy')).setAngle(s.getData('ang')||0)}this.sel=null}
  async swap(a,b){this.busy=true;this.hideHint();this.last=b;this.fx.swap();const A=this.spr[a.r][a.c],B=this.spr[b.r][b.c];await Promise.all([this.move(A,b),this.move(B,a)]);this.swapData(a,b);const rainbow=this.board[a.r][a.c]?.sp==='rainbow'||this.board[b.r][b.c]?.sp==='rainbow';if(rainbow){this.spr[a.r][a.c]=B;this.spr[b.r][b.c]=A;this.moves--;const target=this.board[a.r][a.c]?.sp==='rainbow'?this.board[b.r][b.c]:this.board[a.r][a.c],set=new Set();for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(this.board[r][c]?.id===target?.id)set.add(`${r},${c}`);set.add(`${a.r},${a.c}`);set.add(`${b.r},${b.c}`);this.rainbowFx();await this.clearCells(set,1);await this.fallRefill();await this.resolve();this.busy=false;this.updateHud();this.endCheck();this.scheduleHint();return}const ok=this.groups().length>0;if(!ok){this.fx.bad();await Promise.all([this.move(A,a),this.move(B,b)]);this.swapData(a,b);this.busy=false;this.scheduleHint();return}this.moves--;const t=this.spr[a.r][a.c];this.spr[a.r][a.c]=this.spr[b.r][b.c];this.spr[b.r][b.c]=t;await this.resolve();this.busy=false;this.updateHud();this.endCheck();this.scheduleHint()}
  move(s,p){if(!s)return Promise.resolve();const q=this.pos(p.r,p.c);return new Promise(z=>this.tweens.add({targets:s,x:q.x,y:q.y,duration:210,ease:'Sine.inOut',onComplete:z}))}
  swapData(a,b){const t=this.board[a.r][a.c];this.board[a.r][a.c]=this.board[b.r][b.c];this.board[b.r][b.c]=t}
  groups(){let out=[];for(let r=0;r<R;r++){let c=0;while(c<C){const x=this.board[r][c];if(!x){c++;continue}let e=c+1;while(e<C&&this.board[r][e]?.id===x.id)e++;if(e-c>=3)out.push({id:x.id,dir:'h',p:Array.from({length:e-c},(_,i)=>({r,c:c+i}))});c=e}}for(let c=0;c<C;c++){let r=0;while(r<R){const x=this.board[r][c];if(!x){r++;continue}let e=r+1;while(e<R&&this.board[e][c]?.id===x.id)e++;if(e-r>=3)out.push({id:x.id,dir:'v',p:Array.from({length:e-r},(_,i)=>({r:r+i,c}))});r=e}}return out}
  findCreation(gs){for(const h of gs.filter(g=>g.dir==='h'))for(const v of gs.filter(g=>g.dir==='v'&&g.id===h.id)){const hk=new Set(h.p.map(p=>`${p.r},${p.c}`)),x=v.p.find(p=>hk.has(`${p.r},${p.c}`));if(x)return {at:this.last&&hk.has(`${this.last.r},${this.last.c}`)&&v.p.some(p=>p.r===this.last.r&&p.c===this.last.c)?this.last:x,sp:'bomb'}}const g=gs.slice().sort((a,b)=>b.p.length-a.p.length)[0];if(!g)return null;const sp=g.p.length>=5?'rainbow':g.p.length===4?(g.dir==='h'?'line_h':'line_v'):null;if(!sp)return null;const at=g.p.find(p=>this.last&&p.r===this.last.r&&p.c===this.last.c)||g.p[Math.floor(g.p.length/2)];return {at,sp}}
  async resolve(){let chain=0;while(true){const gs=this.groups();if(!gs.length)break;chain++;const create=this.findCreation(gs),set=new Set();gs.forEach(g=>g.p.forEach(p=>set.add(`${p.r},${p.c}`)));if(create)set.delete(`${create.at.r},${create.at.c}`);await this.clearCells(set,chain);if(create&&this.board[create.at.r][create.at.c]){this.board[create.at.r][create.at.c].sp=create.sp;this.render(create.at.r,create.at.c);this.specialCreateFx(create.at);this.kingReact(chain>=2?'celebrate':'point',650)}await this.fallRefill();await pause(90)}if(!this.hasMove())await this.autoShuffle()}
  expandSpecials(set){let changed=true;while(changed){changed=false;for(const key of [...set]){const [r,c]=key.split(',').map(Number),it=this.board[r][c];if(!it?.sp)continue;const before=set.size;if(it.sp==='line_h')for(let x=0;x<C;x++)set.add(`${r},${x}`);if(it.sp==='line_v')for(let y=0;y<R;y++)set.add(`${y},${c}`);if(it.sp==='bomb')for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(inBounds(y,x))set.add(`${y},${x}`);if(set.size>before)changed=true}}return set}
  burst(x,y,color=0xffe36d,n=8){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,d=28+Math.random()*55,p=this.add.circle(x,y,3+Math.random()*4,color,.95).setDepth(12);this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,scale:0,alpha:0,duration:260+Math.random()*220,ease:'Quad.out',onComplete:()=>p.destroy()})}}
  lineFx(r,c,dir){const p=this.pos(r,c),g=this.add.graphics().setDepth(11);g.lineStyle(14,0xfff4a3,.95);if(dir==='h')g.lineBetween(BX,p.y,BX+C*CELL,p.y);else g.lineBetween(p.x,BY,p.x,BY+R*CELL);g.alpha=.95;this.tweens.add({targets:g,alpha:0,duration:260,onComplete:()=>g.destroy()});this.burst(p.x,p.y,0xffe36d,12)}
  bombFx(r,c){const p=this.pos(r,c),ring=this.add.circle(p.x,p.y,12,0xffd36a,.18).setStrokeStyle(8,0xffc84b,1).setDepth(12);this.tweens.add({targets:ring,scale:7,alpha:0,duration:330,ease:'Quad.out',onComplete:()=>ring.destroy()});this.burst(p.x,p.y,0xff9b3d,18);this.cameras.main.shake(120,.005)}
  rainbowFx(){const ring=this.add.circle(BX+C*CELL/2,BY+R*CELL/2,40,0xffffff,.04).setStrokeStyle(12,0xffffff,.85).setDepth(12);this.tweens.add({targets:ring,scale:9,alpha:0,duration:480,onComplete:()=>ring.destroy()});this.fx.whoosh();this.kingReact('celebrate',850)}
  specialCreateFx(p){const q=this.pos(p.r,p.c),ring=this.add.circle(q.x,q.y,18,0xffffff,.04).setStrokeStyle(6,0xfff0a5,1).setDepth(12);this.tweens.add({targets:ring,scale:3,alpha:0,duration:300,onComplete:()=>ring.destroy()});this.burst(q.x,q.y,0xffffb0,14);this.music?.duck?.(180,.72);this.fx.specialCreate?.()}
  async clearCells(initial,chain=1){const set=this.expandSpecials(new Set(initial)),damageRoots=new Set(),damageAcorns=new Set(),damagedIce=new Set();for(const key of set){const [r,c]=key.split(',').map(Number),it=this.board[r][c];if(it?.sp)this.music?.duck?.(420,it.sp==='bomb'?.32:.42);if(it?.sp==='line_h'){this.fx.specialLine('h');this.lineFx(r,c,'h')}if(it?.sp==='line_v'){this.fx.specialLine('v');this.lineFx(r,c,'v')}if(it?.sp==='bomb'){this.fx.bomb();this.bombFx(r,c)}if(it?.sp==='rainbow')this.rainbowFx();if(this.cell[r][c].block==='roots')damageRoots.add(key);if(this.cell[r][c].block==='acorn')damageAcorns.add(key);for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(!inBounds(rr,cc))continue;if(this.cell[rr][cc].block==='roots')damageRoots.add(`${rr},${cc}`);if(this.cell[rr][cc].block==='acorn')damageAcorns.add(`${rr},${cc}`)}}
    for(const key of set){const [r,c]=key.split(',').map(Number),it=this.board[r][c],ce=this.cell[r][c];const p=this.pos(r,c);if(ce.ice>0){damagedIce.add(key);ce.ice--;if(ce.ice===0)this.bumpGoal('ice',null,1);this.fx.iceBreak();this.iceShards(p.x,p.y);this.render(r,c);continue}if(!it)continue;this.bumpGoal('berry',it.id,1);this.score+=50*Math.min(2,1+(chain-1)*.25);this.fx.pop(chain);this.burst(p.x,p.y,0xffd66f,6);const s=this.spr[r][c];if(s)await new Promise(z=>this.tweens.add({targets:s,scaleX:s.scaleX*1.22,scaleY:s.scaleY*.68,alpha:0,duration:145,ease:'Quad.in',onComplete:z}));this.board[r][c]=null;this.render(r,c)}
    for(const key of damageRoots){const [r,c]=key.split(',').map(Number);if(this.cell[r][c].block==='roots'){this.cell[r][c].block=null;this.bumpGoal('roots',null,1);this.fx.wood();const p=this.pos(r,c);this.burst(p.x,p.y,0x9c6b3c,10);this.render(r,c)}}
    for(const key of damageAcorns){const [r,c]=key.split(',').map(Number);if(damagedIce.has(key))continue;if(this.cell[r][c].block==='acorn'&&this.cell[r][c].ice>0){this.cell[r][c].ice--;if(!this.cell[r][c].ice)this.bumpGoal('ice',null,1);this.fx.iceBreak();const p=this.pos(r,c);this.iceShards(p.x,p.y);this.render(r,c);continue}if(this.cell[r][c].block==='acorn'&&!this.cell[r][c].ice){this.cell[r][c].block=null;this.bumpGoal('acorn',null,1);this.fx.spark();const p=this.pos(r,c);this.burst(p.x,p.y,0xffe48d,10);this.render(r,c)}}this.updateHud();if(chain>=2)this.kingReact('celebrate',520)}
  async fallRefill(){for(let c=0;c<C;c++){const slots=[];for(let r=R-1;r>=0;r--)if(!this.cell[r][c].block)slots.push(r);const vals=[];for(const r of slots)if(this.board[r][c])vals.push(this.board[r][c]);for(const r of slots)this.board[r][c]=vals.shift()||{id:Phaser.Utils.Array.GetRandom(TYPES.slice(0,this.cfg.n)),sp:null}}this.drawAll(false,true);await pause(560)}
  hasMove(){for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(!this.board[r][c]||this.cell[r][c].block||this.cell[r][c].ice)continue;for(const [dr,dc] of [[1,0],[0,1]]){const rr=r+dr,cc=c+dc;if(!inBounds(rr,cc)||!this.board[rr][cc]||this.cell[rr][cc].block||this.cell[rr][cc].ice)continue;this.swapData({r,c},{r:rr,c:cc});const ok=this.groups().length>0;this.swapData({r,c},{r:rr,c:cc});if(ok)return true}}return false}
  shuffleBoard(){const movable=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(this.board[r][c]&&!this.cell[r][c].block&&!this.cell[r][c].ice)movable.push(this.board[r][c]);Phaser.Utils.Array.Shuffle(movable);let i=0;for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(this.board[r][c]&&!this.cell[r][c].block&&!this.cell[r][c].ice)this.board[r][c]=movable[i++]}
  async autoShuffle(){this.busy=true;for(let k=0;k<25;k++){this.shuffleBoard();if(this.groups().length===0&&this.hasMove())break}this.fx.whoosh();this.drawAll(false,true);await pause(600);this.busy=false}
  pickBooster(id){if(this.busy||this.inventory[id]<=0)return;this.resetHint();this.fx.click();if(id==='shuffle'){this.useShuffle();return}this.boosterMode=this.boosterMode===id?null:id;this.boosterHint.setText(this.boosterMode==='hammer'?'Молоток: выбери клетку':this.boosterMode==='fan'?'Веер: выбери ряд':'');this.refreshBoosters()}
  async useBoosterAt(r,c){const id=this.boosterMode;if(!id||this.inventory[id]<=0||!Campaign.consume(id))return;this.busy=true;this.boosterMode=null;this.boosterHint.setText('');if(id==='hammer'){this.inventory.hammer--;const ce=this.cell[r][c],p=this.pos(r,c);if(ce.ice>0){ce.ice--;if(ce.ice===0)this.bumpGoal('ice',null,1);this.fx.iceBreak();this.iceShards(p.x,p.y)}else if(ce.block==='roots'){ce.block=null;this.bumpGoal('roots',null,1);this.fx.wood();this.burst(p.x,p.y,0x9c6b3c,12)}else if(ce.block==='acorn'){ce.block=null;this.bumpGoal('acorn',null,1);this.fx.spark();this.burst(p.x,p.y,0xffe48d,12)}else if(this.board[r][c]){const it=this.board[r][c];this.bumpGoal('berry',it.id,1);this.board[r][c]=null;this.fx.pop(1);this.burst(p.x,p.y,0xffd66f,10)}this.render(r,c);await this.fallRefill();await this.resolve()}else if(id==='fan'){this.inventory.fan--;const set=new Set();for(let cc=0;cc<C;cc++)set.add(`${r},${cc}`);this.fx.whoosh();this.lineFx(r,c,'h');await this.clearCells(set,2);await this.fallRefill();await this.resolve()}this.busy=false;this.refreshBoosters();this.updateHud();this.endCheck();this.scheduleHint()}
  async useShuffle(){if(this.busy||this.inventory.shuffle<=0||!Campaign.consume('shuffle'))return;this.busy=true;this.inventory.shuffle--;for(let k=0;k<30;k++){this.shuffleBoard();if(this.groups().length===0&&this.hasMove())break}this.fx.whoosh();this.drawAll(false,true);await pause(600);this.busy=false;this.refreshBoosters();this.scheduleHint()}
  refreshBoosters(){for(const id of Object.keys(this.boosterButtons)){const b=this.boosterButtons[id];b.tx.setText(`×${this.inventory[id]}`);b.im.clearTint();if(this.boosterMode===id)b.im.setTint(0xffe29a);b.im.setAlpha(this.inventory[id]<=0?.4:1)}}
  bumpGoal(type,id,n){for(const g of this.goals)if(g.type===type&&(id==null||g.id===id))g.done=Math.min(g.need,g.done+n)}
  updateHud(){this.mt.setText(`ХОДЫ  ${this.moves}`);this.st?.setText(`СЧЁТ ${Math.round(this.score)}`);this.goals.forEach((g,i)=>{const name=g.type==='berry'?({'strawberry':'Клубника','raspberry':'Малина','blueberry':'Черника','gooseberry':'Крыжовник','blackberry':'Ежевика','cloudberry':'Морошка'}[g.id]||g.id):g.type==='ice'?'Лёд':g.type==='acorn'?'Жёлуди':g.type==='roots'?'Корни':'Очки',done=g.type==='score'?Math.min(g.need,Math.round(this.score)):g.done;this.gt[i].setText(`${name}\n${done} / ${g.need}`)});this.refreshBoosters()}
  allDone(){return this.goals.every(g=>g.type==='score'?this.score>=g.need:g.done>=g.need)}
  endCheck(){if(this.allDone())this.win();else if(this.moves<=0)this.lose()}
  kingAnim(state){if(!this.king)return;this.king.setTexture('king_'+state);this.tweens.killTweensOf(this.king);this.king.y=this.kingBaseY;this.king.setScale(this.kingBaseScale);this.tweens.add({targets:this.king,y:this.kingBaseY-10,scaleX:this.kingBaseScale*1.035,scaleY:this.kingBaseScale*.975,angle:{from:-1.2,to:1.2},duration:1050,yoyo:true,repeat:-1,ease:'Sine.inOut'})}
  kingReact(state='point',ms=650){if(!this.king||this.busy&&state==='idle')return;this.king.setTexture('king_'+state);this.tweens.killTweensOf(this.king);this.king.setScale(this.kingBaseScale);this.tweens.add({targets:this.king,y:this.kingBaseY-28,scaleX:this.kingBaseScale*1.08,scaleY:this.kingBaseScale*1.08,duration:180,yoyo:true,repeat:1,ease:'Back.out',onComplete:()=>{if(this.scene.isActive())this.kingAnim('idle')}});setTimeout(()=>{if(this.scene.isActive()&&this.king.texture.key!=='king_sad'&&this.king.texture.key!=='king_celebrate')this.kingAnim('idle')},ms)}
  async win(){if(this.busy)return;this.busy=true;clearTimeout(this.hintTimer);window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();this.kingAnim('celebrate');this.fx.win();Campaign.win(this.attemptId);this.updateHud();this.resultPopup(true,Campaign.read())}
  async lose(){if(this.busy)return;this.busy=true;clearTimeout(this.hintTimer);window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();Campaign.lose(this.attemptId);this.updateHud();this.kingAnim('sad');this.fx.lose();this.resultPopup(false,Campaign.read())}

}

const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#183d24',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},render:{antialias:true,pixelArt:false,roundPixels:false},scene:[Boot,Title,Map,Play]});
game.sound.pauseOnBlur=false;
window.__berriesGame=game;
})();
