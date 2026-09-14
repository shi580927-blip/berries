(() => {
  'use strict';

  const W = 1920;
  const H = 1080;
  const FONT = 'Trebuchet MS, Arial Rounded MT Bold, Arial, sans-serif';

  function fit(img, maxW, maxH) {
    const s = Math.min(maxW / img.width, maxH / img.height);
    img.setScale(s);
    return img;
  }

  function getPlayPrototype() {
    const scene = window.__berriesGame?.scene?.keys?.Play;
    return scene ? Object.getPrototypeOf(scene) : null;
  }

  function patch() {
    const proto = getPlayPrototype();
    if (!proto || proto.__berriesFixV06) return false;
    proto.__berriesFixV06 = true;

    // Clean HUD: do not duplicate baked headings from the art.
    proto.hud = function hudV06() {
      fit(this.add.image(W/2,64,'plevel'),560,125);
      this.add.text(W/2,64,`УРОВЕНЬ ${this.no}`,{
        fontFamily: FONT,fontSize:'42px',fontStyle:'bold',color:'#fff0b7',
        stroke:'#6a3219',strokeThickness:7
      }).setOrigin(.5);

      this.add.text(115,64,'←',{
        fontFamily:FONT,fontSize:'56px',fontStyle:'bold',color:'#fff5c7',
        stroke:'#4f2a15',strokeThickness:6
      }).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
        this.fx.click();window.BerriesYandex?.gameplayStop?.();this.scene.start('Map');
      });

      this.mt=this.add.text(1510,64,'',{
        fontFamily:FONT,fontSize:'32px',fontStyle:'bold',color:'#fff0b7',
        stroke:'#5b2d18',strokeThickness:5
      }).setOrigin(.5);
      this.st=this.add.text(1720,64,'',{
        fontFamily:FONT,fontSize:'25px',fontStyle:'bold',color:'#fff0b7',
        stroke:'#5b2d18',strokeThickness:4
      }).setOrigin(.5);

      // The words ЦЕЛИ / БУСТЕРЫ are already painted into these assets.
      fit(this.add.image(285,410,'pgoals'),430,570);
      this.gt=this.goals.map((g,i)=>this.add.text(285,290+i*102,'',{
        fontFamily:FONT,fontSize:'25px',fontStyle:'bold',align:'center',
        color:'#49331f',stroke:'#fff0cf',strokeThickness:1,
        wordWrap:{width:300}
      }).setOrigin(.5));

      fit(this.add.image(1640,365,'pboost'),375,445);
      this.boosterButtons={};
      const rows=[
        ['hammer',1640,292],
        ['shuffle',1640,382],
        ['fan',1640,472],
      ];
      rows.forEach(([id,x,y])=>{
        const im=fit(this.add.image(x,y,id),68,68).setInteractive({useHandCursor:true});
        const tx=this.add.text(x+82,y, '',{
          fontFamily:FONT,fontSize:'22px',fontStyle:'bold',color:'#fff4ca',
          stroke:'#4b2915',strokeThickness:4
        }).setOrigin(.5);
        im.on('pointerdown',()=>this.pickBooster(id));
        this.boosterButtons[id]={im,tx};
      });

      this.boosterHint=this.add.text(1640,555,'',{
        fontFamily:FONT,fontSize:'18px',fontStyle:'bold',align:'center',
        color:'#fff1c9',stroke:'#4b2915',strokeThickness:4,
        wordWrap:{width:320}
      }).setOrigin(.5);

      this.king=fit(this.add.image(1650,760,'king_idle'),330,330);
      this.kingBaseY=760;
      this.kingBaseScale=this.king.scaleX;

      const q=this.add.graphics();
      q.fillStyle(0x302014,.72);
      q.fillRoundedRect(576-25,150-25,8*96+50,8*96+50,32);
      q.lineStyle(6,0xd2a45c,.85);
      q.strokeRoundedRect(576-25,150-25,8*96+50,8*96+50,32);
      for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        q.fillStyle((r+c)%2?0x4a6d3c:0x557b43,.68);
        q.fillRoundedRect(576+c*96+4,150+r*96+4,88,88,16);
      }
    };

    // Production popup art already contains its own beautiful buttons and text.
    // We only add correctly aligned transparent hit areas, nothing visual on top.
    proto.resultPopup = function resultPopupV06(win) {
      const shade=this.add.rectangle(W/2,H/2,W,H,0x061008,.76).setDepth(30);
      const box=this.add.container(W/2,H/2).setDepth(31);
      const art=fit(this.add.image(0,0,win?'popup_win':'popup_lose'),860,700);
      box.add(art);

      const hit=(x,y,w,h,cb)=>{
        const z=this.add.rectangle(x,y,w,h,0xffffff,.001).setInteractive({useHandCursor:true});
        box.add(z);z.on('pointerdown',()=>{this.fx.click();cb(z)});return z;
      };

      // Red X in the upper right of both popup arts.
      hit(292,-226,78,78,()=>this.scene.start('Map'));

      if(win){
        // Green x2-reward button painted into popup.
        hit(0,112,455,96,async z=>{
          if(this.winRewardDoubled)return;
          z.disableInteractive();
          const ok=await window.BerriesYandex?.showRewardedVideo?.();
          if(ok){
            const reward=this.no<=5?80:this.no<=10?100:this.no<=15?120:this.no<=20?140:this.no<=25?160:180;
            const sv=loadSave();sv.coins=(sv.coins||0)+reward;saveLocal(sv);
            this.winRewardDoubled=true;this.fx.reward();
          }else z.setInteractive({useHandCursor:true});
        });

        // Blue ДАЛЕЕ button painted into popup.
        hit(0,235,350,92,()=>{
          const levels=[1,6,11,16,21,30];
          const i=levels.indexOf(this.no),next=i>=0?levels[i+1]:null;
          if(next)this.scene.start('Play',{n:next});else this.scene.start('Map');
        });
      }else{
        // Green +5 moves / ad button painted into popup.
        hit(0,90,465,104,async z=>{
          if(this.continueUsed)return;
          z.disableInteractive();
          const ok=await window.BerriesYandex?.showRewardedVideo?.();
          if(ok){
            this.continueUsed=true;this.moves+=5;this.fx.reward();
            shade.destroy();box.destroy();this.busy=false;
            window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();
            this.kingAnim('idle');this.updateHud();this.scheduleHint();
          }else z.setInteractive({useHandCursor:true});
        });
        // Bottom buttons are already painted into popup: left replay, right map.
        hit(-150,223,260,82,()=>this.scene.restart({n:this.no}));
        hit(150,223,260,82,()=>this.scene.start('Map'));
      }

      box.setScale(.84).setAlpha(0);
      this.tweens.add({targets:box,scale:1,alpha:1,duration:250,ease:'Back.out'});
    };

    // Make selected booster explanation explicit and readable.
    const oldPick=proto.pickBooster;
    proto.pickBooster=function pickBoosterV06(id){
      oldPick.call(this,id);
      if(!this.boosterMode)return;
      const t=this.boosterMode==='hammer'
        ? 'МОЛОТОК — выбери одну клетку'
        : this.boosterMode==='fan'
          ? 'ВЕЕР — выбери ряд'
          : '';
      if(t)this.boosterHint.setText(t);
    };

    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(patch()||tries>200)clearInterval(timer);
  },20);
})();
