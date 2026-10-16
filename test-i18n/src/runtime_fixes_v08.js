(() => {
  'use strict';

  const W=1920,H=1080,CELL=96;
  const FONT='Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif';
  const pause=ms=>new Promise(r=>setTimeout(r,ms));

  function getProto(){
    const s=window.__berriesGame?.scene?.keys?.Play;
    return s?Object.getPrototypeOf(s):null;
  }

  function patch(){
    const p=getProto();
    if(!p||p.__berriesFixV08)return false;
    p.__berriesFixV08=true;

    // --- Hints must never leave a berry dimmed/translucent.
    const oldHideHint=p.hideHint;
    p.hideHint=function hideHintV08(){
      oldHideHint?.call(this);
      for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        const s=this.spr?.[r]?.[c];
        if(!s)continue;
        s.setAlpha(1);
        const sx=s.getData?.('sx'),sy=s.getData?.('sy');
        if(sx&&sy&&!this.sel?.r===r&&!this.sel?.c===c)s.setScale(sx,sy);
      }
    };

    // --- Make 2-layer ice visually unmistakable: inner icy ring + light pulse.
    const oldRender=p.render;
    p.render=function renderV08(r,c,first=false,fall=false){
      const ce=this.cell?.[r]?.[c];
      if(ce?._strengthRing){ce._strengthRing.destroy();ce._strengthRing=null}
      oldRender.call(this,r,c,first,fall);
      if(ce?.ice>1){
        const q=this.pos(r,c);
        const ring=this.add.circle(q.x,q.y,CELL*.32,0xbdefff,.04)
          .setStrokeStyle(4,0xe8fbff,.95).setDepth(6.2);
        ce._strengthRing=ring;
        this.tweens.add({targets:ring,scale:1.08,alpha:{from:.95,to:.55},duration:700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      }
    };

    // --- Generic special art has no berry color, so special activation must be obvious.
    // Line/bomb specials now activate when swapped with ANY adjacent berry.
    const oldSwap=p.swap;
    p.swap=async function swapV08(a,b){
      const sa=this.board?.[a.r]?.[a.c]?.sp;
      const sb=this.board?.[b.r]?.[b.c]?.sp;
      const directSpecial=(sa&&sa!=='rainbow')||(sb&&sb!=='rainbow');
      if(!directSpecial)return oldSwap.call(this,a,b);

      this.busy=true;
      this.hideHint?.();
      this.last=b;
      this.fx?.swap?.();
      const A=this.spr[a.r][a.c],B=this.spr[b.r][b.c];
      await Promise.all([this.move(A,b),this.move(B,a)]);
      this.swapData(a,b);
      const tmp=this.spr[a.r][a.c];this.spr[a.r][a.c]=this.spr[b.r][b.c];this.spr[b.r][b.c]=tmp;
      this.moves--;

      const fire=new Set();
      if(sa)fire.add(`${b.r},${b.c}`);
      if(sb)fire.add(`${a.r},${a.c}`);
      this.kingReact?.('celebrate',850);
      await this.clearCells(fire,2);
      await this.fallRefill();
      await this.resolve();
      this.busy=false;
      this.updateHud();
      this.endCheck();
      this.scheduleHint?.();
    };

    // --- Richer moment-to-moment FX and readable cascade events.
    const oldClear=p.clearCells;
    p.clearCells=async function clearCellsV08(initial,chain=1){
      if(chain>=2){
        const labels=['КОМБО!','СОЧНО!','ЕЩЁ!','ВАУ!'];
        const label=labels[Math.min(chain-2,labels.length-1)];
        const t=this.add.text(W/2,128,label,{fontFamily:FONT,fontSize:chain>=4?'48px':'40px',fontStyle:'bold',color:'#fff59b',stroke:'#7b3517',strokeThickness:8}).setOrigin(.5).setDepth(24).setScale(.7).setAlpha(0);
        this.tweens.add({targets:t,scale:1.12,alpha:1,y:112,duration:180,ease:'Back.out',yoyo:true,hold:170,onComplete:()=>t.destroy()});
        const q={x:W/2,y:170};
        this.burst?.(q.x,q.y,chain>=4?0xff79d6:0xffdd63,12+chain*3);
      }
      return oldClear.call(this,initial,chain);
    };

    // --- Stronger real crack feeling for ice using a short noise transient + bright snap.
    const oldCreate=p.create;
    p.create=function createV08(){
      oldCreate.call(this);
      if(this.fx&&!this.fx.__crackV08){
        this.fx.__crackV08=true;
        const scene=this;
        this.fx.crack=function crackV08(){
          const ctx=scene.sound?.context;
          if(!ctx)return;
          if(ctx.state==='suspended')ctx.resume().catch(()=>{});
          const now=ctx.currentTime;
          const len=Math.max(1,Math.floor(ctx.sampleRate*.11));
          const buf=ctx.createBuffer(1,len,ctx.sampleRate);
          const d=buf.getChannelData(0);
          for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
          const src=ctx.createBufferSource();src.buffer=buf;
          const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1200;
          const g=ctx.createGain();g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.11,now+.004);g.gain.exponentialRampToValueAtTime(.0001,now+.11);
          src.connect(hp).connect(g).connect(ctx.destination);src.start(now);src.stop(now+.12);
          this.tone?.(1050,.055,.030,'square',-620,0);
          this.tone?.(520,.085,.018,'triangle',-260,.018);
        };
      }
    };

    // Existing scene may already be running when patch loads: upgrade its crack immediately.
    const scene=window.__berriesGame?.scene?.keys?.Play;
    if(scene?.fx&&!scene.fx.__crackV08){
      scene.fx.__crackV08=true;
      const original=scene.fx.crack?.bind(scene.fx);
      scene.fx.crack=function(){original?.();this.tone?.(1150,.05,.028,'square',-680);this.tone?.(480,.08,.016,'triangle',-220,.015)};
    }

    // Explain specials in a much more obvious floating plaque, near the board rather than at screen edge.
    p.showSpecialInfo=function showSpecialInfoV08(sp,autoHide=3100){
      const text=sp==='line_h'?'ПОЛОСАТАЯ  •  поменяй с соседней ягодой → очистит РЯД'
        :sp==='line_v'?'ПОЛОСАТАЯ  •  поменяй с соседней ягодой → очистит КОЛОНКУ'
        :sp==='bomb'?'БОМБА  •  поменяй с соседней ягодой → взрыв 3×3'
        :sp==='rainbow'?'РАДУГА  •  поменяй с любой ягодой → уберёт весь её цвет':'';
      if(!text)return;
      if(!this.specialInfoText){
        this.specialInfoText=this.add.text(W/2,955,'',{fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff7c8',stroke:'#512715',strokeThickness:6,backgroundColor:'#3a2117dd',padding:{x:22,y:12},align:'center'}).setOrigin(.5).setDepth(25);
      }
      clearTimeout(this.specialInfoTimer);
      this.specialInfoText.setText(text).setAlpha(1).setScale(.88);
      this.tweens.add({targets:this.specialInfoText,scale:1,duration:170,ease:'Back.out'});
      this.specialInfoTimer=setTimeout(()=>{if(this.specialInfoText?.scene)this.tweens.add({targets:this.specialInfoText,alpha:0,duration:220})},autoHide);
    };

    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;if(patch()||tries>250)clearInterval(timer)},20);
})();
