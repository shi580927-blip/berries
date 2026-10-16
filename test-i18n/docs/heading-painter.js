// Shared Canvas/Phaser title style, deliberately kept out of production for now.
(() => {
  'use strict';
  window.BerriesHeadingPainter = Object.freeze({
    draw(ctx, text, {cx, cy, w, h}) {
      ctx.save();
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
      let size=h*1.02;
      const font=()=>{ctx.font=`800 ${size}px BerriesHeading`;};font();
      // Reserve room for outlines, extrusion and the small end-letter rotation.
      size*=Math.min(1,w*.82/Math.max(1,ctx.measureText(text).width));font();
      const letters=Array.from(text),width=ctx.measureText(text).width;
      const half=Math.max(1,width/2),rise=Math.min(size*.24,width*.06);
      const y=cy-size*.05,stroke=size*.16;
      // Prefix measurements retain the font's natural spacing, including spaces.
      let prefix='';
      const glyphs=letters.map(letter=>{
        const before=ctx.measureText(prefix).width;
        prefix+=letter;
        const after=ctx.measureText(prefix).width;
        const x=(before+after)/2-width/2;
        const t=x/half;
        return {letter,x,y:rise*(t*t-.5),angle:Math.atan(2*rise*x/(half*half))};
      });
      // Paint each complete layer before the next to keep neighbouring outlines clean.
      const paint=(method,offset=0,goldFill=false)=>{
        for(const glyph of glyphs) {
          ctx.save();ctx.translate(cx+glyph.x,y+glyph.y+offset);
          ctx.rotate(glyph.angle);
          if(goldFill) {
            // Build the gradient in the same local coordinates as this glyph.
            const gold=ctx.createLinearGradient(0,-size*.40,0,size*.40);
            gold.addColorStop(0,'#ffffd2');gold.addColorStop(.25,'#fff69c');
            gold.addColorStop(.60,'#ffdf30');gold.addColorStop(1,'#ff9f08');
            ctx.fillStyle=gold;
          }
          ctx[method](glyph.letter,0,0);ctx.restore();
        }
      };
      ctx.strokeStyle='#3e170c';ctx.lineWidth=stroke;
      paint('strokeText',size*.075);
      ctx.fillStyle='#873216';paint('fillText',size*.075);
      paint('strokeText');
      ctx.strokeStyle='#bf550b';ctx.lineWidth=stroke*.56;paint('strokeText');
      paint('fillText',0,true);ctx.restore();
    }
  });
})();
