// Shared Canvas/Phaser title style, deliberately kept out of production for now.
(() => {
  'use strict';
  window.BerriesHeadingPainter = Object.freeze({
    draw(ctx, text, {cx, cy, w, h}) {
      ctx.save();
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
      let size=h*1.02;
      const font=()=>{ctx.font=`800 ${size}px BerriesHeading`;};font();
      // Reserve space for outlines and the lower extrusion, not just glyph width.
      size*=Math.min(1,w*.85/Math.max(1,ctx.measureText(text).width));font();
      const y=cy-size*.05,stroke=size*.16;
      ctx.strokeStyle='#3e170c';ctx.lineWidth=stroke;
      ctx.strokeText(text,cx,y+size*.075);
      ctx.fillStyle='#873216';ctx.fillText(text,cx,y+size*.075);
      ctx.strokeText(text,cx,y);
      ctx.strokeStyle='#bf550b';ctx.lineWidth=stroke*.56;ctx.strokeText(text,cx,y);
      const gold=ctx.createLinearGradient(0,y-size*.40,0,y+size*.40);
      gold.addColorStop(0,'#ffffd2');gold.addColorStop(.25,'#fff69c');
      gold.addColorStop(.60,'#ffdf30');gold.addColorStop(1,'#ff9f08');
      ctx.fillStyle=gold;ctx.fillText(text,cx,y);ctx.restore();
    }
  });
})();
