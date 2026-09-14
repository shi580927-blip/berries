/* Безумные ягодки — vertical slice v0.1 */
(() => {
  'use strict';

  const W = 1920;
  const H = 1080;
  const ROWS = 8;
  const COLS = 8;
  const CELL = 96;
  const BOARD_X = 576;
  const BOARD_Y = 178;
  const BERRY_TYPES = ['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];

  const LEVELS = {
    1:  { moves:18, berries:5, goals:[{type:'collect_berry', id:'strawberry', count:12}], ice:[], acorns:[], roots:[] },
    6:  { moves:18, berries:6, goals:[{type:'score', count:900}], ice:[], acorns:[], roots:[] },
    11: { moves:20, berries:6, goals:[{type:'break_ice', count:8}], ice:[[1,1,1],[1,6,1],[3,2,1],[3,5,1],[5,2,1],[5,5,1],[6,1,1],[6,6,1]], acorns:[], roots:[] },
    16: { moves:20, berries:6, goals:[{type:'collect_acorn', count:4}], ice:[], acorns:[[2,2],[2,5],[5,2],[5,5]], roots:[] },
    21: { moves:20, berries:6, goals:[{type:'break_roots', count:8}], ice:[], acorns:[], roots:[[1,2],[1,5],[2,1],[2,6],[5,1],[5,6],[6,2],[6,5]] },
    30: { moves:24, berries:6, goals:[{type:'break_ice', count:12},{type:'collect_acorn', count:4},{type:'break_roots', count:6}],
          ice:[[0,1,1],[0,6,1],[1,0,1],[1,7,1],[3,3,2],[3,4,2],[4,3,2],[4,4,2],[6,0,1],[6,7,1],[7,1,1],[7,6,1]],
          acorns:[[2,2],[2,5],[5,2],[5,5]], roots:[[1,3],[1,4],[3,1],[4,6],[6,3],[6,4]] }
  };

  const SAVE_KEY = 'berries_vertical_slice_v01';

  class TinySfx {
    constructor(scene) { this.scene = scene; }
    ctx() { return this.scene.sound && this.scene.sound.context ? this.scene.sound.context : null; }
    tone(freq=440, duration=.06, gain=.025, type='sine', slide=0) {
      const ctx = this.ctx(); if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide), now+duration);
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(gain, now+.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now+duration);
      osc.connect(g).connect(ctx.destination); osc.start(now); osc.stop(now+duration+.02);
    }
    pop(pitch=1){ this.tone(180*pitch,.055,.022,'sine',70); }
    click(){ this.tone(520,.03,.014,'triangle',60); }
    bad(){ this.tone(180,.08,.018,'triangle',-35); }
    crack(){ this.tone(900,.045,.012,'square',-450); this.tone(420,.06,.01,'triangle',-160); }
    sparkle(){ this.tone(920,.08,.012,'sine',420); setTimeout(()=>this.tone(1320,.07,.009,'sine',180),35); }
    win(){ [523,659,784].forEach((f,i)=>setTimeout(()=>this.tone(f,.17,.02,'sine',160),i*90)); }
    lose(){ [392,330,262].forEach((f,i)=>setTimeout(()=>this.tone(f,.16,.016,'sine',-20),i*90)); }
  }

  class BootScene extends Phaser.Scene {
    constructor(){ super('Boot'); }
    preload(){
      const p = this.add.text(W/2,H/2,'Загружаем лес…',{fontFamily:'Arial',fontSize:'36px',color:'#fff7dc'}).setOrigin(.5);
      this.load.on('progress',v=>p.setText(`Загружаем лес… ${Math.round(v*100)}%`));
      this.load.on('complete',()=>p.destroy());
      this.load.image('bg_title','assets/backgrounds/background_title_forest.jpg');
      this.load.image('bg_game','assets/backgrounds/background_game_forest.jpg');
      this.load.image('bg_map','assets/map/map_forest_background.jpg');
      this.load.image('logo','assets/ui/panels/logo_main.png');
      this.load.image('panel_level','assets/ui/panels/panel_level_title.png');
      this.load.image('panel_goals','assets/ui/panels/panel_goals.png');
      this.load.image('panel_progress','assets/ui/panels/panel_progress.png');
      this.load.image('button_wood','assets/ui/buttons/button_wood.png');
      this.load.image('button_blue','assets/ui/buttons/button_blue.png');
      this.load.image('level_normal','assets/ui/buttons/level_normal.png');
      this.load.image('level_current','assets/ui/buttons/level_current.png');
      this.load.image('level_completed','assets/ui/buttons/level_completed.png');
      this.load.image('level_locked','assets/ui/buttons/level_locked.png');
      this.load.image('king_idle','assets/characters/king/king_idle.png');
      this.load.image('king_point','assets/characters/king/king_point.png');
      this.load.image('king_celebrate','assets/characters/king/king_celebrate.png');
      this.load.image('king_sad','assets/characters/king/king_sad.png');
      this.load.image('ice_1','assets/blockers/blocker_ice_1.png');
      this.load.image('ice_2','assets/blockers/blocker_ice_2.png');
      this.load.image('acorn','assets/blockers/goal_acorn.png');
      this.load.image('roots','assets/blockers/blocker_roots.png');
      this.load.image('special_line_h','assets/specials/special_line_h.png');
      this.load.image('special_line_v','assets/specials/special_line_v.png');
      this.load.image('special_rainbow','assets/specials/special_rainbow.png');
      this.load.image('special_bomb','assets/specials/special_bomb.png');
      BERRY_TYPES.forEach(id=>this.load.image(`berry_${id}`,`assets/berries/berry_${id}.png`));
    }
    create(){ this.scene.start('Title'); }
  }

  class TitleScene extends Phaser.Scene {
    constructor(){ super('Title'); }
    create(){
      this.add.image(W/2,H/2,'bg_title').setDisplaySize(W,H);
      this.add.rectangle(W/2,H/2,W,H,0x07180d,.08);
      const logo = this.add.image(W/2,360,'logo').setScale(.52);
      this.tweens.add({targets:logo,y:350,duration:2200,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.makeButton(W/2,805,'ИГРАТЬ',()=>this.scene.start('Map'));
      this.add.text(W/2,970,'vertical slice • уровни 1 / 6 / 11 / 16 / 21 / 30',{fontFamily:'Arial',fontSize:'24px',color:'#fbecc1',stroke:'#4c2a14',strokeThickness:4}).setOrigin(.5);
    }
    makeButton(x,y,label,cb){
      const c=this.add.container(x,y); const bg=this.add.image(0,0,'button_wood').setDisplaySize(360,132).setInteractive({useHandCursor:true});
      const t=this.add.text(0,-2,label,{fontFamily:'Arial',fontSize:'46px',fontStyle:'bold',color:'#ffe9a0',stroke:'#6b2e17',strokeThickness:8}).setOrigin(.5);
      c.add([bg,t]);
      bg.on('pointerdown',()=>{ this.tweens.add({targets:c,scale:.95,duration:70,yoyo:true}); cb(); });
      return c;
    }
  }

  class MapScene extends Phaser.Scene {
    constructor(){ super('Map'); }
    create(){
      this.add.image(W/2,H/2,'bg_map').setDisplaySize(W,H);
      this.add.rectangle(W/2,H/2,W,H,0x06130b,.08);
      this.add.text(W/2,80,'ТЕСТОВАЯ КАРТА ГЛАВЫ',{fontFamily:'Arial',fontSize:'44px',fontStyle:'bold',color:'#fff1b0',stroke:'#542b15',strokeThickness:8}).setOrigin(.5);
      const saved=this.getSave(); const completed=new Set(saved.completed||[]);
      const nodes=[{n:1,x:360,y:760},{n:6,x:610,y:610},{n:11,x:860,y:735},{n:16,x:1110,y:545},{n:21,x:1370,y:670},{n:30,x:1580,y:410}];
      nodes.forEach(({n,x,y},i)=>{
        const key=completed.has(n)?'level_completed':(i===0||completed.has(nodes[i-1]?.n)?'level_current':'level_normal');
        const b=this.add.image(x,y,key).setDisplaySize(150,150).setInteractive({useHandCursor:true});
        this.add.text(x,y-2,String(n),{fontFamily:'Arial',fontSize:'42px',fontStyle:'bold',color:'#fff4ca',stroke:'#5b2c14',strokeThickness:7}).setOrigin(.5);
        b.on('pointerdown',()=>this.scene.start('Game',{level:n}));
        this.tweens.add({targets:b,scaleX:1.03,scaleY:1.03,duration:1400+i*120,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      });
      const k=this.add.image(1660,830,'king_point').setScale(.33);
      this.tweens.add({targets:k,y:815,duration:1600,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.add.text(1590,1000,'Выбери тестовый уровень',{fontFamily:'Arial',fontSize:'28px',color:'#fff7dc',stroke:'#4b2914',strokeThickness:5}).setOrigin(.5);
    }
    getSave(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');}catch{return{};} }
  }

  class GameScene extends Phaser.Scene {
    constructor(){ super('Game'); }
    init(data){ this.levelNo=Number(data.level||1); this.cfg=LEVELS[this.levelNo]||LEVELS[1]; }
    create(){
      this.sfx=new TinySfx(this);
      this.moves=this.cfg.moves; this.score=0; this.busy=false; this.selected=null; this.lastSwap=null; this.cascade=0;
      this.goalState=this.cfg.goals.map(g=>({...g,done:0}));
      this.board=Array.from({length:ROWS},()=>Array(COLS).fill(null));
      this.cells=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>({ice:0,blocker:null,overlay:null})));
      this.sprites=Array.from({length:ROWS},()=>Array(COLS).fill(null));
      this.add.image(W/2,H/2,'bg_game').setDisplaySize(W,H);
      this.add.rectangle(W/2,H/2,W,H,0x06140a,.12);
      this.drawHud(); this.prepareCells(); this.generateBoard(); this.drawBoard(); this.updateHud(); this.animateKing('idle');
    }
    prepareCells(){ this.cfg.ice.forEach(([r,c,hp])=>this.cells[r][c].ice=hp); this.cfg.acorns.forEach(([r,c])=>this.cells[r][c].blocker='acorn'); this.cfg.roots.forEach(([r,c])=>this.cells[r][c].blocker='roots'); }
    generateBoard(){
      const active=BERRY_TYPES.slice(0,this.cfg.berries);
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
        if(this.cells[r][c].blocker){ this.board[r][c]=null; continue; }
        let id, tries=0;
        do { id=Phaser.Utils.Array.GetRandom(active); tries++; }
        while(tries<30 && ((c>=2&&this.board[r][c-1]?.id===id&&this.board[r][c-2]?.id===id)||(r>=2&&this.board[r-1][c]?.id===id&&this.board[r-2][c]?.id===id)));
        this.board[r][c]={id,special:null};
      }
      if(!this.hasPossibleMove()) this.shuffleData();
    }
    drawHud(){
      this.add.image(W/2,70,'panel_level').setDisplaySize(540,120);
      this.levelText=this.add.text(W/2,68,`УРОВЕНЬ ${this.levelNo}`,{fontFamily:'Arial',fontSize:'44px',fontStyle:'bold',color:'#ffeeb0',stroke:'#622f17',strokeThickness:8}).setOrigin(.5);
      this.add.text(135,72,'←',{fontFamily:'Arial',fontSize:'58px',fontStyle:'bold',color:'#fff5c7',stroke:'#4f2a15',strokeThickness:7}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.scene.start('Map'));
      this.movesText=this.add.text(1550,72,'',{fontFamily:'Arial',fontSize:'34px',fontStyle:'bold',color:'#fff5cb',stroke:'#4e2b16',strokeThickness:6}).setOrigin(.5);
      this.scoreText=this.add.text(1730,72,'',{fontFamily:'Arial',fontSize:'28px',color:'#fff5cb',stroke:'#4e2b16',strokeThickness:5}).setOrigin(.5);
      this.add.image(300,430,'panel_goals').setDisplaySize(430,560);
      this.add.text(300,225,'ЦЕЛИ',{fontFamily:'Arial',fontSize:'38px',fontStyle:'bold',color:'#ffeaae',stroke:'#613117',strokeThickness:7}).setOrigin(.5);
      this.goalTexts=[];
      this.goalState.forEach((g,i)=>this.goalTexts.push(this.add.text(300,315+i*105,'',{fontFamily:'Arial',fontSize:'27px',fontStyle:'bold',align:'center',color:'#fff4d5',stroke:'#4b2915',strokeThickness:5,wordWrap:{width:330}}).setOrigin(.5)));
      this.king=this.add.image(1650,650,'king_idle').setScale(.36);
      this.add.text(1650,930,'Каскады + ASMR FX\nуже включены',{fontFamily:'Arial',fontSize:'24px',align:'center',color:'#fff4d6',stroke:'#4b2915',strokeThickness:5}).setOrigin(.5);
      const g=this.add.graphics(); g.fillStyle(0x3b1e12,.72); g.fillRoundedRect(BOARD_X-28,BOARD_Y-28,COLS*CELL+56,ROWS*CELL+56,34); g.lineStyle(7,0xc88943,.85); g.strokeRoundedRect(BOARD_X-28,BOARD_Y-28,COLS*CELL+56,ROWS*CELL+56,34);
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const x=BOARD_X+c*CELL,y=BOARD_Y+r*CELL; g.fillStyle((r+c)%2?0x466b38:0x547943,.62); g.fillRoundedRect(x+4,y+4,CELL-8,CELL-8,16); }
    }
    drawBoard(){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) this.renderCell(r,c,true); }
    renderCell(r,c,initial=false){
      const cell=this.cells[r][c],x=BOARD_X+c*CELL+CELL/2,y=BOARD_Y+r*CELL+CELL/2;
      if(this.sprites[r][c]){ this.sprites[r][c].destroy(); this.sprites[r][c]=null; } if(cell.overlay){ cell.overlay.destroy(); cell.overlay=null; }
      if(cell.blocker){ const s=this.add.image(x,y,cell.blocker==='acorn'?'acorn':'roots').setDisplaySize(CELL*.84,CELL*.84).setDepth(4); this.sprites[r][c]=s; }
      else if(this.board[r][c]){ const item=this.board[r][c],key=item.special?`special_${item.special}`:`berry_${item.id}`; const s=this.add.image(x,y,key).setDisplaySize(CELL*.82,CELL*.82).setDepth(3).setInteractive({useHandCursor:true}); s.setData({r,c}); s.on('pointerdown',()=>this.onTile(r,c)); this.sprites[r][c]=s; if(initial){ s.setScale(.3); this.tweens.add({targets:s,scaleX:1,scaleY:1,duration:260+30*r,ease:'Back.out'}); } }
      if(cell.ice>0) cell.overlay=this.add.image(x,y,cell.ice>1?'ice_2':'ice_1').setDisplaySize(CELL*.95,CELL*.95).setDepth(5).setAlpha(.82);
    }
    onTile(r,c){
      if(this.busy||this.cells[r][c].blocker||!this.board[r][c]) return; this.sfx.click();
      if(!this.selected){ this.select(r,c); return; } if(this.selected.r===r&&this.selected.c===c){ this.unselect(); return; }
      const d=Math.abs(this.selected.r-r)+Math.abs(this.selected.c-c); if(d!==1){ this.unselect(); this.select(r,c); return; }
      const a={...this.selected}; this.unselect(); this.trySwap(a,{r,c});
    }
    select(r,c){ this.selected={r,c}; const s=this.sprites[r][c]; this.tweens.add({targets:s,scaleX:1.08,scaleY:1.08,duration:110,yoyo:true,repeat:-1,ease:'Sine.inOut'}); s.setTint(0xfff4c2); }
    unselect(){ if(!this.selected)return; const s=this.sprites[this.selected.r]?.[this.selected.c]; if(s){ this.tweens.killTweensOf(s); s.clearTint(); s.setScale(1); } this.selected=null; }
    async trySwap(a,b){
      this.busy=true; this.lastSwap=b; const A=this.sprites[a.r][a.c],B=this.sprites[b.r][b.c]; await Promise.all([this.moveSprite(A,b.r,b.c),this.moveSprite(B,a.r,a.c)]); this.swapData(a,b); const matches=this.findMatches(); const rainbow=this.handleRainbowSwap(a,b);
      if(matches.length===0&&!rainbow){ this.sfx.bad(); await Promise.all([this.moveSprite(A,a.r,a.c),this.moveSprite(B,b.r,b.c)]); this.swapData(a,b); this.busy=false; return; }
      this.moves--; this.sfx.pop(1); this.syncSpriteGridAfterSwap(a,b); if(rainbow) await this.resolveRainbow(rainbow); await this.resolveLoop(); this.busy=false; this.updateHud(); this.checkEnd();
    }
    handleRainbowSwap(a,b){ const ia=this.board[b.r][b.c],ib=this.board[a.r][a.c]; if(ia?.special==='rainbow'&&ib&&!ib.special) return {pos:b,target:ib.id}; if(ib?.special==='rainbow'&&ia&&!ia.special) return {pos:a,target:ia.id}; return null; }
    async resolveRainbow(info){ const coords=[]; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(this.board[r][c]?.id===info.target)coords.push({r,c}); coords.push(info.pos); this.sfx.sparkle(); await this.clearCoords(this.uniqueCoords(coords),1,true); await this.collapseAndRefill(); }
    async resolveLoop(){
      this.cascade=0;
      while(true){
        const groups=this.findMatchGroups(); if(!groups.length) break; this.cascade++; const clear=[],protectedCells=new Set();
        for(const g of groups){ let special=null; if(g.coords.length>=5) special='rainbow'; else if(g.coords.length===4) special=g.orientation==='h'?'line_h':'line_v'; const spawn=special?this.pickSpecialSpawn(g):null; if(spawn){ protectedCells.add(`${spawn.r},${spawn.c}`); this.board[spawn.r][spawn.c]={id:g.id,special}; } g.coords.forEach(p=>{ if(!protectedCells.has(`${p.r},${p.c}`)) clear.push(p); }); }
        if(this.cascade>=3) this.sfx.sparkle(); else this.sfx.pop(1+this.cascade*.04); const expanded=this.expandSpecialEffects(clear); const finalClear=this.uniqueCoords(expanded).filter(p=>!protectedCells.has(`${p.r},${p.c}`)); await this.clearCoords(finalClear,this.cascade,false); protectedCells.forEach(k=>{ const [r,c]=k.split(',').map(Number); this.renderCell(r,c,false); }); await this.collapseAndRefill();
      }
      if(!this.hasPossibleMove()){ this.shuffleData(); this.redrawAll(); this.showToast('Нет ходов — перемешиваем!'); }
    }
    findMatches(){ return this.findMatchGroups().flatMap(g=>g.coords); }
    findMatchGroups(){
      const groups=[];
      for(let r=0;r<ROWS;r++){ let c=0; while(c<COLS){ const item=this.board[r][c]; if(!item||item.special==='rainbow'){c++;continue;} let e=c+1; while(e<COLS&&this.board[r][e]?.id===item.id&&this.board[r][e]?.special!=='rainbow')e++; if(e-c>=3)groups.push({id:item.id,orientation:'h',coords:Array.from({length:e-c},(_,i)=>({r,c:c+i}))}); c=e; } }
      for(let c=0;c<COLS;c++){ let r=0; while(r<ROWS){ const item=this.board[r][c]; if(!item||item.special==='rainbow'){r++;continue;} let e=r+1; while(e<ROWS&&this.board[e][c]?.id===item.id&&this.board[e][c]?.special!=='rainbow')e++; if(e-r>=3)groups.push({id:item.id,orientation:'v',coords:Array.from({length:e-r},(_,i)=>({r:r+i,c}))}); r=e; } }
      return groups;
    }
    pickSpecialSpawn(g){ if(this.lastSwap&&g.coords.some(p=>p.r===this.lastSwap.r&&p.c===this.lastSwap.c)) return {...this.lastSwap}; return g.coords[Math.floor(g.coords.length/2)]; }
    expandSpecialEffects(coords){ const out=[...coords]; coords.forEach(p=>{ const item=this.board[p.r]?.[p.c]; if(!item?.special)return; if(item.special==='line_h')for(let c=0;c<COLS;c++)out.push({r:p.r,c}); if(item.special==='line_v')for(let r=0;r<ROWS;r++)out.push({r,c:p.c}); if(item.special==='bomb')for(let rr=p.r-1;rr<=p.r+1;rr++)for(let cc=p.c-1;cc<=p.c+1;cc++)if(this.inBounds(rr,cc))out.push({r:rr,c:cc}); }); return out; }
    async clearCoords(coords,cascade=1){
      const anims=[],adjacentBlockers=new Set();
      coords.forEach(({r,c})=>{
        if(!this.inBounds(r,c))return; const cell=this.cells[r][c];
        if(cell.ice>0){ cell.ice--; this.markGoal('break_ice',1); this.sfx.crack(); if(cell.overlay){ this.tweens.add({targets:cell.overlay,alpha:0,scaleX:.7,scaleY:.7,duration:140,onComplete:()=>cell.overlay?.destroy()}); cell.overlay=null; } }
        if(cell.blocker){ this.hitBlocker(r,c); return; } const item=this.board[r][c]; if(!item)return;
        this.markGoal('collect_berry',1,item.id); this.score+=Math.round(50*Math.min(2,1+(cascade-1)*.25)); const s=this.sprites[r][c];
        if(s){ anims.push(new Promise(res=>this.tweens.add({targets:s,scaleX:1.28,scaleY:.72,alpha:0,duration:130,ease:'Quad.in',onComplete:()=>{s.destroy();res();}}))); this.sprites[r][c]=null; } this.board[r][c]=null;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{ const rr=r+dr,cc=c+dc;if(this.inBounds(rr,cc)&&this.cells[rr][cc].blocker)adjacentBlockers.add(`${rr},${cc}`); });
      });
      adjacentBlockers.forEach(k=>{ const [r,c]=k.split(',').map(Number); this.hitBlocker(r,c); }); await Promise.all(anims); this.updateHud();
    }
    hitBlocker(r,c){ const cell=this.cells[r][c]; if(!cell.blocker)return; const type=cell.blocker; this.sfx.crack(); const s=this.sprites[r][c]; if(s)this.tweens.add({targets:s,angle:{from:-4,to:4},duration:45,yoyo:true,repeat:2}); cell.blocker=null; if(type==='acorn')this.markGoal('collect_acorn',1); if(type==='roots')this.markGoal('break_roots',1); if(s)this.tweens.add({targets:s,alpha:0,scaleX:.4,scaleY:.4,y:'-=18',duration:180,onComplete:()=>s.destroy()}); this.sprites[r][c]=null; this.board[r][c]=null; }
    async collapseAndRefill(){
      const active=BERRY_TYPES.slice(0,this.cfg.berries);
      for(let c=0;c<COLS;c++){ let segmentBottom=ROWS-1; while(segmentBottom>=0){ while(segmentBottom>=0&&this.cells[segmentBottom][c].blocker)segmentBottom--; if(segmentBottom<0)break; let segmentTop=segmentBottom; while(segmentTop-1>=0&&!this.cells[segmentTop-1][c].blocker)segmentTop--; const items=[]; for(let r=segmentBottom;r>=segmentTop;r--)if(this.board[r][c])items.push(this.board[r][c]); let idx=0; for(let r=segmentBottom;r>=segmentTop;r--)this.board[r][c]=idx<items.length?items[idx++]:null; for(let r=segmentTop;r<=segmentBottom;r++)if(!this.board[r][c])this.board[r][c]={id:Phaser.Utils.Array.GetRandom(active),special:null}; segmentBottom=segmentTop-1; } }
      this.redrawAll(true); await this.delay(190);
    }
    redrawAll(bounce=false){ for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ this.renderCell(r,c,false); const s=this.sprites[r][c]; if(bounce&&s&&!this.cells[r][c].blocker){ s.setScale(.78); this.tweens.add({targets:s,scaleX:1,scaleY:1,duration:160+15*r,ease:'Back.out'}); } } }
    shuffleData(){ const active=BERRY_TYPES.slice(0,this.cfg.berries); let tries=0; do{ for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(!this.cells[r][c].blocker)this.board[r][c]={id:Phaser.Utils.Array.GetRandom(active),special:null}; tries++; }while((this.findMatches().length||!this.hasPossibleMove())&&tries<50); }
    hasPossibleMove(){ for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ if(!this.board[r][c])continue; for(const [dr,dc] of [[0,1],[1,0]]){ const rr=r+dr,cc=c+dc;if(!this.inBounds(rr,cc)||!this.board[rr][cc])continue; this.swapData({r,c},{r:rr,c:cc}); const ok=this.findMatches().length>0; this.swapData({r,c},{r:rr,c:cc}); if(ok)return true; } } return false; }
    swapData(a,b){ const t=this.board[a.r][a.c]; this.board[a.r][a.c]=this.board[b.r][b.c]; this.board[b.r][b.c]=t; }
    syncSpriteGridAfterSwap(a,b){ const t=this.sprites[a.r][a.c]; this.sprites[a.r][a.c]=this.sprites[b.r][b.c]; this.sprites[b.r][b.c]=t; }
    moveSprite(s,r,c){ if(!s)return Promise.resolve(); const x=BOARD_X+c*CELL+CELL/2,y=BOARD_Y+r*CELL+CELL/2; return new Promise(res=>this.tweens.add({targets:s,x,y,duration:145,ease:'Sine.inOut',onComplete:res})); }
    markGoal(type,amount,id=null){ this.goalState.forEach(g=>{ if(g.type!==type)return; if(type==='collect_berry'&&g.id!==id)return; g.done=Math.min(g.count,g.done+amount); }); }
    goalsDone(){ return this.goalState.every(g=>g.type==='score' ? this.score>=g.count : g.done>=g.count); }
    updateHud(){ this.movesText?.setText(`ХОДЫ: ${this.moves}`); this.scoreText?.setText(`СЧЁТ: ${this.score}`); this.goalState.forEach((g,i)=>{ const labels={collect_berry:`Собрать ${this.berryRu(g.id)}`,break_ice:'Разбить лёд',collect_acorn:'Собрать жёлуди',break_roots:'Убрать корни',score:'Набрать очки'}; const current=g.type==='score'?this.score:g.done; this.goalTexts[i]?.setText(`${labels[g.type]}\n${Math.min(current,g.count)} / ${g.count}`); }); }
    berryRu(id){ return ({strawberry:'клубнику',raspberry:'малину',blueberry:'чернику',gooseberry:'крыжовник',blackberry:'ежевику',cloudberry:'морошку'})[id]||id; }
    checkEnd(){ if(this.goalsDone()){ this.busy=true; this.saveComplete(); this.sfx.win(); this.animateKing('celebrate'); this.time.delayedCall(650,()=>this.showEnd(true)); } else if(this.moves<=0){ this.busy=true; this.sfx.lose(); this.animateKing('sad'); this.time.delayedCall(500,()=>this.showEnd(false)); } }
    showEnd(win){
      this.add.rectangle(W/2,H/2,W,H,0x07100a,.72).setDepth(20); this.add.rectangle(W/2,H/2,720,450,0x4d2917,.96).setStrokeStyle(8,0xd4934b).setDepth(21);
      this.add.text(W/2,H/2-120,win?'ПОБЕДА!':'ПОЧТИ ПОЛУЧИЛОСЬ!',{fontFamily:'Arial',fontSize:52,fontStyle:'bold',color:'#ffe8a3',stroke:'#6b2d16',strokeThickness:8}).setOrigin(.5).setDepth(22);
      this.add.text(W/2,H/2-45,win?`Счёт: ${this.score}`:'Можно повторить уровень',{fontFamily:'Arial',fontSize:30,color:'#fff5d6'}).setOrigin(.5).setDepth(22);
      const label=win?'К КАРТЕ':'ЕЩЁ РАЗ',b=this.add.image(W/2,H/2+105,'button_wood').setDisplaySize(320,112).setDepth(22).setInteractive({useHandCursor:true});
      this.add.text(W/2,H/2+103,label,{fontFamily:'Arial',fontSize:36,fontStyle:'bold',color:'#ffe9a8',stroke:'#5d2c15',strokeThickness:7}).setOrigin(.5).setDepth(23);
      b.on('pointerdown',()=>win?this.scene.start('Map'):this.scene.restart({level:this.levelNo}));
      if(!win&&this.moves<=0)this.add.text(W/2,H/2+185,'Rewarded +5 ходов подключим к SDK на следующем проходе',{fontFamily:'Arial',fontSize:20,color:'#dfe9d8'}).setOrigin(.5).setDepth(22);
    }
    saveComplete(){ let s={}; try{s=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch{} const set=new Set(s.completed||[]); set.add(this.levelNo); s.completed=[...set].sort((a,b)=>a-b); localStorage.setItem(SAVE_KEY,JSON.stringify(s)); }
    animateKing(state){ const key=state==='celebrate'?'king_celebrate':state==='sad'?'king_sad':'king_idle'; this.king.setTexture(key); this.tweens.killTweensOf(this.king); this.king.setScale(.36); this.king.setAngle(0); if(state==='celebrate')this.tweens.add({targets:this.king,y:'-=35',scaleX:.39,scaleY:.39,duration:220,yoyo:true,repeat:3,ease:'Back.out'}); else if(state==='sad')this.tweens.add({targets:this.king,angle:-3,duration:650,yoyo:true,repeat:-1,ease:'Sine.inOut'}); else this.tweens.add({targets:this.king,y:'-=12',duration:1800,yoyo:true,repeat:-1,ease:'Sine.inOut'}); }
    showToast(text){ const t=this.add.text(W/2,1000,text,{fontFamily:'Arial',fontSize:'28px',fontStyle:'bold',color:'#fff4cf',stroke:'#4d2a16',strokeThickness:6}).setOrigin(.5).setDepth(15); this.tweens.add({targets:t,y:960,alpha:0,duration:1300,ease:'Quad.out',onComplete:()=>t.destroy()}); }
    uniqueCoords(arr){ const m=new Map(); arr.forEach(p=>{if(this.inBounds(p.r,p.c))m.set(`${p.r},${p.c}`,p)}); return [...m.values()]; }
    inBounds(r,c){ return r>=0&&r<ROWS&&c>=0&&c<COLS; }
    delay(ms){ return new Promise(res=>this.time.delayedCall(ms,res)); }
  }

  const config={ type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#10261a',scene:[BootScene,TitleScene,MapScene,GameScene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},render:{antialias:true,pixelArt:false,roundPixels:false},audio:{disableWebAudio:false} };
  window.berriesGame=new Phaser.Game(config);
})();
