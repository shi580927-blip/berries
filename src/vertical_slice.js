(() => {
'use strict';

const W=1920,H=1080,R=8,C=8,CELL=96,BX=576,BY=178;
const TYPES=['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
const KEY='berries_vs_03';
const TEST_LEVELS=[1,6,11,16,21,30];

const LV={
  1:{m:18,n:5,g:[['berry','strawberry',12]],ice:[],ac:[],root:[]},
  6:{m:18,n:6,g:[['score',null,900]],ice:[],ac:[],root:[]},
  11:{m:20,n:6,g:[['ice',null,8]],ice:[[1,1,1],[1,6,1],[3,2,1],[3,5,1],[5,2,1],[5,5,1],[6,1,1],[6,6,1]],ac:[],root:[]},
  16:{m:20,n:6,g:[['acorn',null,4]],ice:[],ac:[[2,2],[2,5],[5,2],[5,5]],root:[]},
  21:{m:20,n:6,g:[['roots',null,8]],ice:[],ac:[],root:[[1,2],[1,5],[2,1],[2,6],[5,1],[5,6],[6,2],[6,5]]},
  30:{m:24,n:6,g:[['ice',null,12],['acorn',null,4],['roots',null,6]],ice:[[0,1,1],[0,6,1],[1,0,1],[1,7,1],[3,3,2],[3,4,2],[4,3,2],[4,4,2],[6,0,1],[6,7,1],[7,1,1],[7,6,1]],ac:[[2,2],[2,5],[5,2],[5,5]],root:[[1,3],[1,4],[3,1],[4,6],[6,3],[6,4]]}
};

const pause = ms => new Promise(r=>setTimeout(r,ms));
const inBounds=(r,c)=>r>=0&&r<R&&c>=0&&c<C;

function loadSave(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function saveLocal(data){localStorage.setItem(KEY,JSON.stringify(data));window.BerriesYandex?.saveCloudData?.(data,false)}

class Sfx{
  constructor(scene){this.s=scene;this.muted=false;this.master=.85;this.last={}}
  ctx(){return this.s.sound?.context}
  can(name,ms=35){let n=performance.now();if((this.last[name]||0)+ms>n)return false;this.last[name]=n;return true}
  tone(f,d=.06,g=.02,t='sine',end=0,delay=0){if(this.muted)return;let c=this.ctx();if(!c)return;let n=c.currentTime+delay,o=c.createOscillator(),a=c.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(55,f+end),n+d);a.gain.setValueAtTime(.0001,n);a.gain.exponentialRampToValueAtTime(g*this.master,n+.006);a.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(a).connect(c.destination);o.start(n);o.stop(n+d+.03)}
  click(){if(this.can('click'))this.tone(520,.03,.011,'triangle',45)}
  bad(){if(this.can('bad',120)){this.tone(190,.08,.014,'triangle',-55);this.tone(120,.06,.006,'sine',-20,.025)}}
  swap(){if(this.can('swap',55)){this.tone(250,.035,.006,'sine',120);this.tone(360,.03,.004,'triangle',80,.022)}}
  pop(chain=1){if(!this.can('pop',26))return;let p=1+Math.min(chain,5)*.035+(Math.random()-.5)*.06;this.tone(180*p,.05,.015,'sine',72);if(chain>=3&&Math.random()>.45)this.tone(820+chain*45,.065,.004,'sine',180,.012)}
  crack(){if(this.can('crack',70)){this.tone(860,.035,.007,'square',-420);this.tone(400,.055,.007,'triangle',-150,.01)}}
  wood(){if(this.can('wood',80)){this.tone(210,.045,.009,'triangle',-90);this.tone(115,.055,.007,'sine',-25,.015)}}
  spark(){if(this.can('spark',70)){this.tone(900,.07,.007,'sine',320);this.tone(1280,.055,.005,'sine',120,.035)}}
  whoosh(){if(this.can('whoosh',80)){this.tone(260,.10,.008,'sine',420);this.tone(520,.085,.004,'triangle',260,.025)}}
  bomb(){if(this.can('bomb',120)){this.tone(115,.12,.017,'sine',-35);this.tone(240,.07,.007,'triangle',-80,.015)}}
  reward(){[620,840,1080].forEach((f,i)=>this.tone(f,.09,.008,'sine',120,i*.055))}
  win(){[523,659,784,1046].forEach((f,i)=>this.tone(f,.14,.013,'sine',100,i*.075))}
  lose(){[392,330,262].forEach((f,i)=>this.tone(f,.14,.010,'sine',-18,i*.085))}
}

class MusicBus{
  constructor(scene){this.s=scene;this.current=null;this.muted=false;this.volume=.30}
  play(key){if(this.muted||this.current===key)return;this.stop();if(!this.s.cache.audio.exists(key))return;this.current=key;this.s.sound.play(key,{loop:true,volume:this.volume})}
  stop(){if(this.current){this.s.sound.stopByKey(this.current);this.current=null}}
  pause(v){if(v)this.s.sound.pauseAll();else this.s.sound.resumeAll()}
}

class Boot extends Phaser.Scene{
  constructor(){super('Boot')}
  preload(){
    let t=this.add.text(W/2,H/2,'Загружаем лес…',{fontSize:'36px',color:'#fff7dc'}).setOrigin(.5);
    this.load.on('progress',v=>t.setText(`Загружаем лес… ${Math.round(v*100)}%`));
    const I=(k,p)=>this.load.image(k,p);
    I('title','assets/backgrounds/background_title_forest.jpg');
    I('gamebg','assets/backgrounds/background_game_forest.jpg');
    I('mapbg','assets/map/map_forest_background.jpg');
    I('logo','assets/ui/panels/logo_main.png');
    I('plevel','assets/ui/panels/panel_level_title.png');
    I('pgoals','assets/ui/panels/panel_goals.png');
    I('pboost','assets/ui/panels/panel_boosters.png');
    I('btn','assets/ui/buttons/button_wood.png');
    I('btnblue','assets/ui/buttons/button_blue.png');
    ['normal','current','completed','locked'].forEach(x=>I('lvl_'+x,'assets/ui/buttons/level_'+x+'.png'));
    ['idle','point','celebrate','sad'].forEach(x=>I('king_'+x,'assets/characters/king/king_'+x+'.png'));
    I('ice1','assets/blockers/blocker_ice_1.png');I('ice2','assets/blockers/blocker_ice_2.png');
    I('acorn','assets/blockers/goal_acorn.png');I('roots','assets/blockers/blocker_roots.png');
    I('line_h','assets/specials/special_line_h.png');I('line_v','assets/specials/special_line_v.png');I('rainbow','assets/specials/special_rainbow.png');I('bombsp','assets/specials/special_bomb.png');
    I('hammer','assets/boosters/booster_hammer.png');I('shuffle','assets/boosters/booster_shuffle.png');I('fan','assets/boosters/booster_fan.png');
    TYPES.forEach(x=>I('b_'+x,'assets/berries/berry_'+x+'.png'));
    // Финальные music/SFX-файлы будут загружаться сюда после фактического добавления в audio/.
  }
  async create(){
    await window.BerriesYandex?.init?.();
    await window.BerriesYandex?.loadingReady?.();
    this.scene.start('Title');
  }
}

class Title extends Phaser.Scene{
  constructor(){super('Title')}
  create(){
    window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
    this.fx=new Sfx(this);this.music=new MusicBus(this);
    window.__berriesPauseAudio=v=>this.music.pause(v);
    this.add.image(W/2,H/2,'title').setDisplaySize(W,H);
    this.add.rectangle(W/2,H/2,W,H,0x07180d,.08);
    let l=this.add.image(W/2,350,'logo').setScale(.52);
    this.tweens.add({targets:l,y:365,duration:2100,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.makeButton(W/2,810,'ИГРАТЬ',()=>{this.fx.click();this.scene.start('Map')});
    this.add.text(W-55,35,'♪',{fontSize:'34px',color:'#fff3c0',stroke:'#4c2b16',strokeThickness:5}).setOrigin(1,0).setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.fx.click();this.music.muted=!this.music.muted;this.music.muted?this.music.stop():this.music.play('music_menu')});
  }
  makeButton(x,y,label,cb,blue=false){let c=this.add.container(x,y),b=this.add.image(0,0,blue?'btnblue':'btn').setDisplaySize(360,132).setInteractive({useHandCursor:true}),tx=this.add.text(0,0,label,{fontSize:'42px',fontStyle:'bold',color:'#ffe9a0',stroke:'#6b2e17',strokeThickness:8}).setOrigin(.5);c.add([b,tx]);b.on('pointerdown',()=>this.tweens.add({targets:c,scale:.95,duration:70,yoyo:true,onComplete:cb}));return c}
}

class Map extends Phaser.Scene{
  constructor(){super('Map')}
  create(){
    window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
    this.fx=new Sfx(this);
    this.add.image(W/2,H/2,'mapbg').setDisplaySize(W,H);this.add.rectangle(W/2,H/2,W,H,0x06130b,.08);
    this.add.text(W/2,75,'ЛЕСНОЕ КОРОЛЕВСТВО',{fontSize:'44px',fontStyle:'bold',color:'#fff1b0',stroke:'#542b15',strokeThickness:8}).setOrigin(.5);
    let sv=loadSave(),done=new Set(sv.done||[]);
    let a=[{n:1,x:360,y:760},{n:6,x:610,y:610},{n:11,x:860,y:735},{n:16,x:1110,y:545},{n:21,x:1370,y:670},{n:30,x:1580,y:410}];
    a.forEach(({n,x,y},i)=>{
      let unlocked=i===0||done.has(a[i-1]?.n),k=done.has(n)?'lvl_completed':(unlocked?'lvl_current':'lvl_locked');
      let im=this.add.image(x,y,k).setDisplaySize(150,150);
      if(unlocked)im.setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.fx.click();this.scene.start('Play',{n})});
      this.add.text(x,y,String(n),{fontSize:'42px',fontStyle:'bold',color:unlocked?'#fff4ca':'#b9a98d',stroke:'#5b2c14',strokeThickness:7}).setOrigin(.5);
      this.tweens.add({targets:im,y:y-8,duration:1400+i*90,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    });
    let k=this.add.image(1660,830,'king_point').setScale(.33);this.tweens.add({targets:k,y:812,duration:1700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.add.text(1650,960,'Тест: 1 • 6 • 11 • 16 • 21 • 30',{fontSize:'22px',color:'#fff1c3',stroke:'#4c2c19',strokeThickness:4}).setOrigin(.5);
  }
}

class Play extends Phaser.Scene{
  constructor(){super('Play')}
  init(d){this.no=+d.n||1;this.cfg=LV[this.no]||LV[1]}
  create(){
    window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();
    this.fx=new Sfx(this);this.music=new MusicBus(this);window.__berriesPauseAudio=v=>this.music.pause(v);
    this.moves=this.cfg.m;this.score=0;this.busy=false;this.sel=null;this.last=null;this.boosterMode=null;this.continueUsed=false;
    this.goals=this.cfg.g.map(x=>({type:x[0],id:x[1],need:x[2],done:0}));
    this.inventory={hammer:2,shuffle:2,fan:2};
    this.board=Array.from({length:R},()=>Array(C).fill(null));
    this.cell=Array.from({length:R},()=>Array.from({length:C},()=>({ice:0,block:null,over:null})));
    this.spr=Array.from({length:R},()=>Array(C).fill(null));
    this.add.image(W/2,H/2,'gamebg').setDisplaySize(W,H);this.add.rectangle(W/2,H/2,W,H,0x06140a,.12);
    this.hud();
    this.cfg.ice.forEach(([r,c,h])=>this.cell[r][c].ice=h);this.cfg.ac.forEach(([r,c])=>this.cell[r][c].block='acorn');this.cfg.root.forEach(([r,c])=>this.cell[r][c].block='roots');
    this.seed();this.drawAll(true);this.updateHud();this.kingAnim('idle');
  }

  hud(){
    this.add.image(W/2,70,'plevel').setDisplaySize(540,120);this.add.text(W/2,68,`УРОВЕНЬ ${this.no}`,{fontSize:'44px',fontStyle:'bold',color:'#ffeeb0',stroke:'#622f17',strokeThickness:8}).setOrigin(.5);
    this.add.text(115,68,'←',{fontSize:'58px',fontStyle:'bold',color:'#fff5c7',stroke:'#4f2a15',strokeThickness:7}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map')});
    this.mt=this.add.text(1515,70,'',{fontSize:'34px',fontStyle:'bold',color:'#fff5cb',stroke:'#4e2b16',strokeThickness:6}).setOrigin(.5);this.st=this.add.text(1720,70,'',{fontSize:'26px',color:'#fff5cb',stroke:'#4e2b16',strokeThickness:5}).setOrigin(.5);
    this.add.image(285,430,'pgoals').setDisplaySize(420,560);this.add.text(285,220,'ЦЕЛИ',{fontSize:'38px',fontStyle:'bold',color:'#ffeaae',stroke:'#613117',strokeThickness:7}).setOrigin(.5);
    this.gt=this.goals.map((g,i)=>this.add.text(285,315+i*105,'',{fontSize:'27px',fontStyle:'bold',align:'center',color:'#fff4d5',stroke:'#4b2915',strokeThickness:5,wordWrap:{width:320}}).setOrigin(.5));
    this.add.image(1640,380,'pboost').setDisplaySize(365,430);this.add.text(1640,225,'БУСТЕРЫ',{fontSize:'30px',fontStyle:'bold',color:'#ffeaae',stroke:'#613117',strokeThickness:6}).setOrigin(.5);
    this.boosterButtons={};[['hammer',1540,330],['shuffle',1640,330],['fan',1740,330]].forEach(([id,x,y])=>{let im=this.add.image(x,y,id).setDisplaySize(92,92).setInteractive({useHandCursor:true});let tx=this.add.text(x,y+72,'',{fontSize:'22px',fontStyle:'bold',color:'#fff6d0',stroke:'#4b2915',strokeThickness:4}).setOrigin(.5);im.on('pointerdown',()=>this.pickBooster(id));this.boosterButtons[id]={im,tx}});
    this.boosterHint=this.add.text(1640,465,'',{fontSize:'20px',align:'center',color:'#fff1c9',stroke:'#4b2915',strokeThickness:4,wordWrap:{width:300}}).setOrigin(.5);
    this.king=this.add.image(1650,760,'king_idle').setScale(.31);
    let q=this.add.graphics();q.fillStyle(0x3b1e12,.72);q.fillRoundedRect(BX-28,BY-28,C*CELL+56,R*CELL+56,34);q.lineStyle(7,0xc88943,.85);q.strokeRoundedRect(BX-28,BY-28,C*CELL+56,R*CELL+56,34);for(let r=0;r<R;r++)for(let c=0;c<C;c++){q.fillStyle((r+c)%2?0x466b38:0x547943,.62);q.fillRoundedRect(BX+c*CELL+4,BY+r*CELL+4,CELL-8,CELL-8,16)}
  }

  seed(){let a=TYPES.slice(0,this.cfg.n);for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(this.cell[r][c].block)continue;let id,t=0;do{id=Phaser.Utils.Array.GetRandom(a);t++}while(t<30&&((c>1&&this.board[r][c-1]?.id===id&&this.board[r][c-2]?.id===id)||(r>1&&this.board[r-1][c]?.id===id&&this.board[r-2][c]?.id===id)));this.board[r][c]={id,sp:null}}if(!this.hasMove())this.shuffleBoard()}
  pos(r,c){return{x:BX+c*CELL+CELL/2,y:BY+r*CELL+CELL/2}}
  render(r,c,first=false){let ce=this.cell[r][c],p=this.pos(r,c);if(this.spr[r][c])this.spr[r][c].destroy();if(ce.over)ce.over.destroy();this.spr[r][c]=null;ce.over=null;if(ce.block){this.spr[r][c]=this.add.image(p.x,p.y,ce.block).setDisplaySize(CELL*.84,CELL*.84).setDepth(4).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.tap(r,c))}else if(this.board[r][c]){let it=this.board[r][c],key=it.sp==='bomb'?'bombsp':(it.sp||'b_'+it.id),im=this.add.image(p.x,p.y,key).setDisplaySize(CELL*.82,CELL*.82).setDepth(3).setInteractive({useHandCursor:true});let sx=im.scaleX,sy=im.scaleY;im.setData({r,c,sx,sy});im.on('pointerdown',()=>this.tap(r,c));this.spr[r][c]=im;if(first){im.setScale(sx*.25,sy*.25);this.tweens.add({targets:im,scaleX:sx,scaleY:sy,duration:220+r*25,ease:'Back.out'})}}if(ce.ice)ce.over=this.add.image(p.x,p.y,ce.ice>1?'ice2':'ice1').setDisplaySize(CELL*.95,CELL*.95).setDepth(5).setAlpha(.82)}
  drawAll(first=false){for(let r=0;r<R;r++)for(let c=0;c<C;c++)this.render(r,c,first)}

  tap(r,c){
    if(this.busy)return;
    if(this.boosterMode){this.useBoosterAt(r,c);return}
    if(this.cell[r][c].block||!this.board[r][c])return;
    this.fx.click();if(!this.sel){this.select(r,c);return}if(this.sel.r===r&&this.sel.c===c){this.unselect();return}if(Math.abs(this.sel.r-r)+Math.abs(this.sel.c-c)!==1){this.unselect();this.select(r,c);return}let a={...this.sel};this.unselect();this.swap(a,{r,c});
  }
  select(r,c){this.sel={r,c};let s=this.spr[r][c],sx=s.getData('sx'),sy=s.getData('sy');s.setTint(0xfff4c2);this.tweens.add({targets:s,scaleX:sx*1.08,scaleY:sy*1.08,duration:110,yoyo:true,repeat:-1,ease:'Sine.inOut'})}
  unselect(){if(!this.sel)return;let s=this.spr[this.sel.r]?.[this.sel.c];if(s){this.tweens.killTweensOf(s);s.clearTint();s.setScale(s.getData('sx'),s.getData('sy'))}this.sel=null}

  async swap(a,b){
    this.busy=true;this.last=b;this.fx.swap();
    let A=this.spr[a.r][a.c],B=this.spr[b.r][b.c];await Promise.all([this.move(A,b),this.move(B,a)]);this.swapData(a,b);
    let rainbow=this.board[a.r][a.c]?.sp==='rainbow'||this.board[b.r][b.c]?.sp==='rainbow';
    if(rainbow){this.moves--;let target=this.board[a.r][a.c]?.sp==='rainbow'?this.board[b.r][b.c]:this.board[a.r][a.c];let set=new Set();for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(this.board[r][c]?.id===target?.id)set.add(`${r},${c}`);set.add(`${a.r},${a.c}`);set.add(`${b.r},${b.c}`);await this.clearCells(set,1);await this.fallRefill();await this.resolve();this.busy=false;this.updateHud();this.endCheck();return}
    let ok=this.groups().length>0;
    if(!ok){this.fx.bad();await Promise.all([this.move(A,a),this.move(B,b)]);this.swapData(a,b);this.busy=false;return}
    this.moves--;let t=this.spr[a.r][a.c];this.spr[a.r][a.c]=this.spr[b.r][b.c];this.spr[b.r][b.c]=t;await this.resolve();this.busy=false;this.updateHud();this.endCheck();
  }
  move(s,p){if(!s)return Promise.resolve();let q=this.pos(p.r,p.c);return new Promise(z=>this.tweens.add({targets:s,x:q.x,y:q.y,duration:145,ease:'Sine.inOut',onComplete:z}))}
  swapData(a,b){let t=this.board[a.r][a.c];this.board[a.r][a.c]=this.board[b.r][b.c];this.board[b.r][b.c]=t}

  groups(){let out=[];for(let r=0;r<R;r++){let c=0;while(c<C){let x=this.board[r][c];if(!x){c++;continue}let e=c+1;while(e<C&&this.board[r][e]?.id===x.id)e++;if(e-c>=3)out.push({id:x.id,dir:'h',p:Array.from({length:e-c},(_,i)=>({r,c:c+i}))});c=e}}for(let c=0;c<C;c++){let r=0;while(r<R){let x=this.board[r][c];if(!x){r++;continue}let e=r+1;while(e<R&&this.board[e][c]?.id===x.id)e++;if(e-r>=3)out.push({id:x.id,dir:'v',p:Array.from({length:e-r},(_,i)=>({r:r+i,c}))});r=e}}return out}
  findCreation(gs){
    for(let h of gs.filter(g=>g.dir==='h'))for(let v of gs.filter(g=>g.dir==='v'&&g.id===h.id)){let hk=new Set(h.p.map(p=>`${p.r},${p.c}`));let x=v.p.find(p=>hk.has(`${p.r},${p.c}`));if(x)return {at:this.last&&hk.has(`${this.last.r},${this.last.c}`)&&v.p.some(p=>p.r===this.last.r&&p.c===this.last.c)?this.last:x,sp:'bomb'}}
    let g=gs.slice().sort((a,b)=>b.p.length-a.p.length)[0];if(!g)return null;let sp=g.p.length>=5?'rainbow':g.p.length===4?(g.dir==='h'?'line_h':'line_v'):null;if(!sp)return null;let at=g.p.find(p=>this.last&&p.r===this.last.r&&p.c===this.last.c)||g.p[Math.floor(g.p.length/2)];return {at,sp};
  }

  async resolve(){
    let chain=0;
    while(true){let gs=this.groups();if(!gs.length)break;chain++;let create=this.findCreation(gs),set=new Set();gs.forEach(g=>g.p.forEach(p=>set.add(`${p.r},${p.c}`)));if(create)set.delete(`${create.at.r},${create.at.c}`);await this.clearCells(set,chain);if(create&&this.board[create.at.r][create.at.c]){this.board[create.at.r][create.at.c].sp=create.sp;this.render(create.at.r,create.at.c);this.fx.spark()}await this.fallRefill();await pause(30)}
    if(!this.hasMove()){await this.autoShuffle()}
  }

  expandSpecials(set){
    let changed=true;
    while(changed){changed=false;for(let key of [...set]){let [r,c]=key.split(',').map(Number),it=this.board[r][c];if(!it?.sp)continue;let before=set.size;if(it.sp==='line_h')for(let x=0;x<C;x++)set.add(`${r},${x}`);if(it.sp==='line_v')for(let y=0;y<R;y++)set.add(`${y},${c}`);if(it.sp==='bomb')for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(inBounds(y,x))set.add(`${y},${x}`);if(set.size>before)changed=true}}
    return set;
  }

  async clearCells(initial,chain=1){
    let set=this.expandSpecials(new Set(initial));
    let damageRoots=new Set(),damageAcorns=new Set();
    for(let key of set){let [r,c]=key.split(',').map(Number);let it=this.board[r][c];if(it?.sp==='line_h'||it?.sp==='line_v')this.fx.whoosh();if(it?.sp==='bomb'){this.fx.bomb();this.cameras.main.shake(90,.004)}if(it?.sp==='rainbow')this.fx.spark();for(let [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){let rr=r+dr,cc=c+dc;if(!inBounds(rr,cc))continue;if(this.cell[rr][cc].block==='roots')damageRoots.add(`${rr},${cc}`);if(this.cell[rr][cc].block==='acorn')damageAcorns.add(`${rr},${cc}`)}}
    for(let key of set){let [r,c]=key.split(',').map(Number),it=this.board[r][c],ce=this.cell[r][c];if(!it)continue;this.bumpGoal('berry',it.id,1);this.score+=50*Math.min(2,1+(chain-1)*.25);this.fx.pop(chain);let s=this.spr[r][c];if(s){await new Promise(z=>this.tweens.add({targets:s,scaleX:s.scaleX*1.18,scaleY:s.scaleY*.70,alpha:0,duration:95,ease:'Quad.in',onComplete:z}))}this.board[r][c]=null;if(ce.ice>0){ce.ice--;this.bumpGoal('ice',null,1);this.fx.crack()}this.render(r,c)}
    for(let key of damageRoots){let [r,c]=key.split(',').map(Number);if(this.cell[r][c].block==='roots'){this.cell[r][c].block=null;this.bumpGoal('roots',null,1);this.fx.wood();this.render(r,c)}}
    for(let key of damageAcorns){let [r,c]=key.split(',').map(Number);if(this.cell[r][c].block==='acorn'&&!this.cell[r][c].ice){this.cell[r][c].block=null;this.bumpGoal('acorn',null,1);this.fx.spark();this.render(r,c)}}
    this.updateHud();
  }

  async fallRefill(){
    for(let c=0;c<C;c++){
      let slots=[];for(let r=R-1;r>=0;r--)if(!this.cell[r][c].block)slots.push(r);
      let vals=[];for(let r of slots)if(this.board[r][c])vals.push(this.board[r][c]);
      for(let r of slots)this.board[r][c]=vals.shift()||{id:Phaser.Utils.Array.GetRandom(TYPES.slice(0,this.cfg.n)),sp:null};
    }
    this.drawAll();for(let r=0;r<R;r++)for(let c=0;c<C;c++){let s=this.spr[r][c];if(s&&!this.cell[r][c].block){let sy=s.scaleY,sx=s.scaleX;s.setScale(sx*.92,sy*.78);this.tweens.add({targets:s,scaleX:sx,scaleY:sy,duration:130+r*8,ease:'Back.out'})}}await pause(170)
  }

  hasMove(){
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(!this.board[r][c]||this.cell[r][c].block)continue;for(let [dr,dc] of [[1,0],[0,1]]){let rr=r+dr,cc=c+dc;if(!inBounds(rr,cc)||!this.board[rr][cc]||this.cell[rr][cc].block)continue;this.swapData({r,c},{r:rr,c:cc});let ok=this.groups().length>0;this.swapData({r,c},{r:rr,c:cc});if(ok)return true}}
    return false;
  }
  shuffleBoard(){let movable=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(this.board[r][c]&&!this.cell[r][c].block)movable.push(this.board[r][c]);Phaser.Utils.Array.Shuffle(movable);let i=0;for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(!this.cell[r][c].block&&this.board[r][c])this.board[r][c]=movable[i++]}
  async autoShuffle(){this.busy=true;for(let k=0;k<20;k++){this.shuffleBoard();if(this.groups().length===0&&this.hasMove())break}this.fx.whoosh();this.drawAll();await pause(250);this.busy=false}

  pickBooster(id){if(this.busy||this.inventory[id]<=0)return;this.fx.click();if(id==='shuffle'){this.useShuffle();return}this.boosterMode=this.boosterMode===id?null:id;this.boosterHint.setText(this.boosterMode==='hammer'?'Молоток: выбери клетку':this.boosterMode==='fan'?'Веер: выбери ряд':'');this.refreshBoosters()}
  async useBoosterAt(r,c){let id=this.boosterMode;if(!id||this.inventory[id]<=0)return;this.busy=true;this.boosterMode=null;this.boosterHint.setText('');if(id==='hammer'){this.inventory.hammer--;let ce=this.cell[r][c];if(ce.ice>0){ce.ice--;this.bumpGoal('ice',null,1);this.fx.crack()}else if(ce.block==='roots'){ce.block=null;this.bumpGoal('roots',null,1);this.fx.wood()}else if(ce.block==='acorn'){ce.block=null;this.bumpGoal('acorn',null,1);this.fx.spark()}else if(this.board[r][c]){let it=this.board[r][c];this.bumpGoal('berry',it.id,1);this.board[r][c]=null;this.fx.pop(1)}this.render(r,c);await this.fallRefill();await this.resolve()}else if(id==='fan'){this.inventory.fan--;let set=new Set();for(let c=0;c<C;c++)set.add(`${r},${c}`);this.fx.whoosh();await this.clearCells(set,2);await this.fallRefill();await this.resolve()}this.busy=false;this.refreshBoosters();this.updateHud();this.endCheck()}
  async useShuffle(){if(this.busy||this.inventory.shuffle<=0)return;this.busy=true;this.inventory.shuffle--;for(let k=0;k<30;k++){this.shuffleBoard();if(this.groups().length===0&&this.hasMove())break}this.fx.whoosh();this.drawAll();await pause(250);this.busy=false;this.refreshBoosters()}
  refreshBoosters(){for(let id of Object.keys(this.boosterButtons)){let b=this.boosterButtons[id];b.tx.setText(`×${this.inventory[id]}`);b.im.clearTint();if(this.boosterMode===id)b.im.setTint(0xffe29a);if(this.inventory[id]<=0)b.im.setAlpha(.4);else b.im.setAlpha(1)}}

  bumpGoal(type,id,n){for(let g of this.goals)if(g.type===type&&(id==null||g.id===id))g.done=Math.min(g.need,g.done+n)}
  updateHud(){this.mt.setText(`ХОДЫ  ${this.moves}`);this.st.setText(`СЧЁТ ${Math.round(this.score)}`);this.goals.forEach((g,i)=>{let name=g.type==='berry'?({'strawberry':'Клубника','raspberry':'Малина','blueberry':'Черника','gooseberry':'Крыжовник','blackberry':'Ежевика','cloudberry':'Морошка'}[g.id]||g.id):g.type==='ice'?'Лёд':g.type==='acorn'?'Жёлуди':g.type==='roots'?'Корни':'Очки';let done=g.type==='score'?Math.min(g.need,Math.round(this.score)):g.done;this.gt[i].setText(`${name}\n${done} / ${g.need}`)});this.refreshBoosters()}
  allDone(){return this.goals.every(g=>g.type==='score'?this.score>=g.need:g.done>=g.need)}
  endCheck(){if(this.allDone())this.win();else if(this.moves<=0)this.lose()}

  kingAnim(state){if(!this.king)return;this.king.setTexture('king_'+state);this.tweens.killTweensOf(this.king);this.tweens.add({targets:this.king,y:this.king.y-10,duration:1200,yoyo:true,repeat:-1,ease:'Sine.inOut'})}

  async win(){if(this.busy)return;this.busy=true;window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();this.kingAnim('celebrate');this.fx.win();let sv=loadSave(),done=new Set(sv.done||[]);done.add(this.no);sv.done=[...done];sv.coins=(sv.coins||0)+(this.no<=5?80:this.no<=10?100:this.no<=15?120:this.no<=20?140:this.no<=25?160:180);saveLocal(sv);this.resultPopup(true,sv)}
  async lose(){if(this.busy)return;this.busy=true;window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();this.kingAnim('sad');this.fx.lose();this.resultPopup(false,loadSave())}

  resultPopup(win,sv){
    let shade=this.add.rectangle(W/2,H/2,W,H,0x061008,.72).setDepth(30),box=this.add.container(W/2,H/2).setDepth(31),panel=this.add.image(0,0,'btn').setDisplaySize(760,500),title=this.add.text(0,-150,win?'ПОБЕДА!':'ПОЧТИ ПОЛУЧИЛОСЬ!',{fontSize:win?'58px':'46px',fontStyle:'bold',color:'#ffe89e',stroke:'#692f18',strokeThickness:9}).setOrigin(.5),sub=this.add.text(0,-55,win?`Награда: ${this.no<=5?80:this.no<=10?100:this.no<=15?120:this.no<=20?140:this.no<=25?160:180} монет`:'Можно взять ещё +5 ходов',{fontSize:'30px',color:'#fff5dc',stroke:'#512b18',strokeThickness:5}).setOrigin(.5);box.add([panel,title,sub]);
    const addBtn=(x,y,label,cb,blue=false)=>{let im=this.add.image(x,y,blue?'btnblue':'btn').setDisplaySize(310,115).setInteractive({useHandCursor:true}),tx=this.add.text(x,y,label,{fontSize:'28px',fontStyle:'bold',color:'#fff1bb',stroke:'#632e17',strokeThickness:6}).setOrigin(.5);box.add([im,tx]);im.on('pointerdown',cb);return im};
    if(win){addBtn(-170,95,'КАРТА',()=>this.scene.start('Map'));addBtn(170,95,'ЕЩЁ РАЗ',()=>this.scene.restart({n:this.no}),true)}else{
      let ad=addBtn(0,70,this.continueUsed?'РЕКЛАМА УЖЕ БЫЛА':'▶ +5 ХОДОВ',async()=>{if(this.continueUsed)return;ad.disableInteractive().setAlpha(.55);let ok=await window.BerriesYandex?.showRewardedVideo?.();if(ok){this.continueUsed=true;this.moves+=5;this.fx.reward();shade.destroy();box.destroy();this.busy=false;window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();this.kingAnim('idle');this.updateHud()}else{ad.setInteractive({useHandCursor:true}).setAlpha(1);sub.setText('Реклама сейчас недоступна') }},true);
      addBtn(-170,190,'КАРТА',()=>this.scene.start('Map'));addBtn(170,190,'ЗАНОВО',()=>this.scene.restart({n:this.no}));
      if(!window.BerriesYandex?.sdk&&!new URLSearchParams(location.search).has('mockAds'))this.add.text(W/2,H/2+315,'Для теста рекламы вне Яндекс Игр добавь ?mockAds=1',{fontSize:'20px',color:'#e9ddbd'}).setOrigin(.5).setDepth(32);
    }
    box.setScale(.82);box.setAlpha(0);this.tweens.add({targets:box,scale:1,alpha:1,duration:220,ease:'Back.out'});
  }
}

const game=new Phaser.Game({
  type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#183d24',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},
  render:{antialias:true,pixelArt:false,roundPixels:false},
  scene:[Boot,Title,Map,Play]
});

window.__berriesGame=game;
})();
