(() => {
  'use strict';

  const CELL=96;
  const pause=ms=>new Promise(r=>setTimeout(r,ms));

  function getProto(){
    const s=window.__berriesGame?.scene?.keys?.Play;
    return s?Object.getPrototypeOf(s):null;
  }

  function patch(){
    const p=getProto();
    if(!p||p.__berriesFixV09)return false;
    p.__berriesFixV09=true;

    // Replace the unsafe timeout-unlock from v07. Never force busy=false while a cascade
    // is still mutating the board: that could allow a second move mid-resolution and freeze state.
    p.resolve=async function resolveV09(){
      let chain=0;
      const MAX_CHAINS=24;
      while(chain<MAX_CHAINS){
        const gs=this.groups();
        if(!gs.length)break;
        chain++;
        const create=this.findCreation(gs),set=new Set();
        gs.forEach(g=>g.p.forEach(q=>set.add(`${q.r},${q.c}`)));
        if(create)set.delete(`${create.at.r},${create.at.c}`);
        await this.clearCells(set,chain);
        if(create&&this.board?.[create.at.r]?.[create.at.c]){
          this.board[create.at.r][create.at.c].sp=create.sp;
          this.render(create.at.r,create.at.c);
          this.specialCreateFx(create.at);
          this.kingReact?.(chain>=2?'celebrate':'point',650);
        }
        await this.fallRefill();
        await pause(70);
      }
      if(chain>=MAX_CHAINS){
        // Safety exit for pathological refill chains: make a clean playable board,
        // but do not unlock input in the middle of animation work.
        for(let i=0;i<30;i++){
          this.shuffleBoard();
          if(this.groups().length===0&&this.hasMove())break;
        }
        this.drawAll(false,false);
        await pause(80);
      }
      if(!this.hasMove())await this.autoShuffle();
    };

    // Animated hint: golden glow around the TWO berries that should be swapped.
    // No filled circles under berries and no alpha fade on the berry itself.
    p.hideHint=function hideHintV09(){
      clearTimeout(this.hintCleanupTimer);
      for(const o of this.hintObjs||[]){
        try{this.tweens.killTweensOf(o);o.destroy?.()}catch{}
      }
      this.hintObjs=[];
      for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        const s=this.spr?.[r]?.[c];
        if(!s)continue;
        s.setAlpha(1);
        const sx=s.getData?.('sx'),sy=s.getData?.('sy'),ang=s.getData?.('ang');
        if(sx&&sy){
          this.tweens.killTweensOf(s);
          s.setScale(sx,sy);
          if(Number.isFinite(ang))s.setAngle(ang);
        }
      }
    };

    p.showHint=function showHintV09(){
      const move=this.findHintMove?.();
      if(!move)return;
      this.hideHint();
      this.hintObjs=[];

      move.forEach((q,idx)=>{
        const s=this.spr?.[q.r]?.[q.c];
        if(!s)return;
        const ring1=this.add.circle(s.x,s.y,CELL*.43,0xffd65a,.015)
          .setStrokeStyle(5,0xffd75a,.95).setDepth(8);
        const ring2=this.add.circle(s.x,s.y,CELL*.50,0xffef9a,.005)
          .setStrokeStyle(2,0xffffc7,.80).setDepth(8);
        const glow=this.add.circle(s.x,s.y,CELL*.37,0xffc928,.10).setDepth(2.8);
        this.hintObjs.push(ring1,ring2,glow);

        this.tweens.add({targets:ring1,scale:{from:.94,to:1.10},alpha:{from:.98,to:.35},duration:620+idx*80,yoyo:true,repeat:3,ease:'Sine.inOut'});
        this.tweens.add({targets:ring2,scale:{from:1.02,to:1.18},alpha:{from:.75,to:.12},duration:760+idx*70,yoyo:true,repeat:2,ease:'Sine.inOut'});
        this.tweens.add({targets:glow,alpha:{from:.18,to:.04},scale:{from:.96,to:1.09},duration:560,yoyo:true,repeat:4,ease:'Sine.inOut'});

        const sx=s.getData('sx')||s.scaleX,sy=s.getData('sy')||s.scaleY;
        this.tweens.add({targets:s,scaleX:sx*1.045,scaleY:sy*1.045,duration:390,yoyo:true,repeat:3,ease:'Sine.inOut'});
      });

      this.hintCleanupTimer=setTimeout(()=>{
        if(!this.scene?.isActive?.())return;
        this.hideHint();
        this.scheduleHint?.();
      },2850);
    };

    // Make direct special activation robust: input always unlocks in finally.
    const swapV08=p.swap;
    p.swap=async function swapV09(a,b){
      try{
        return await swapV08.call(this,a,b);
      }catch(err){
        console.error('[berries] swap failed',err);
        // Rebuild only the visual references if something went wrong; keep the level alive.
        try{this.drawAll(false,false)}catch{}
      }finally{
        if(this.scene?.isActive?.()&&!this.allDone?.()&&this.moves>0){
          this.busy=false;
          this.updateHud?.();
          this.scheduleHint?.();
        }
      }
    };

    return true;
  }

  let tries=0;
  const t=setInterval(()=>{tries++;if(patch()||tries>250)clearInterval(t)},20);
})();
