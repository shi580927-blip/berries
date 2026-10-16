// Shared localized UI contract. Image URLs are selected before Phaser queues them.
// Prepared artwork retains the exact approved source canvas and anchor geometry.
(() => {
 'use strict';
 let config;
 window.BerriesLocalizedUI={
  configure(value){config=value},
  imagePath(path){return config?.paths.get(path)||null},
  async prepare(textures){
   if(!config)return;
   await config.fontReady;
   const {manifest,layers}=config;
   for(const group of ['levelWin','levelLose']){
    const asset=manifest.assets.find(a=>a.id===group);
    const [width,height]=asset.sourceSize,scale=Math.min(860/width,820/height);
    for(const spec of layers[group])if(spec.decorative)headingTexture(textures,width*scale,height*scale,spec);
   }
   const asset=manifest.assets.find(a=>a.id==='paidRoyalShop');
   const [width,height]=asset.sourceSize,scale=Math.min(780/width,980/height);
   headingTexture(textures,width*scale,height*scale,shopSpec());
  },
  result(scene,box,art,win){
   if(!config)return;
   const skip=new Set(['result.reward','result.remaining','berry.strawberry','obstacle.ice']);
   for(const spec of config.layers[win?'levelWin':'levelLose'])if(!skip.has(spec.key))addLabel(scene,box,art,spec);
  },
  shop(scene,box,art){if(config)addLabel(scene,box,art,shopSpec())}
 };
 const shopSpec=()=>({...config.layers.paidRoyalShop[0],x:.5,y:config.language==='tr'?.208:.19,w:.62,h:config.language==='tr'?.135:.12,twoLines:config.language==='tr',decorative:true});
    const headingTexture = (textures,artWidth,artHeight,spec) => {
        const width=artWidth*spec.w,height=artHeight*spec.h;
        // Victory needs extra texture headroom for the raised centre of the arc.
        const victory=spec.key==='result.win';
        const textureHeight=height*((victory||spec.twoLines)?1.5:1);
        const canvasWidth=Math.ceil(width*2),canvasHeight=Math.ceil(textureHeight*2);
        const key='localized_heading_'+config.language+'_'+spec.key+'_'+canvasWidth+'_'+canvasHeight;
        if(textures.exists(key))return {key,width,textureHeight,victory};
        const canvas=document.createElement('canvas');canvas.width=canvasWidth;canvas.height=canvasHeight;
        const headingText=window.BerriesI18n.t(spec.key);
        const headingLines=spec.twoLines?headingText.split(' '):[headingText];
        headingLines.forEach((line,i)=>window.BerriesHeadingPainter.draw(canvas.getContext('2d'),line,{
          cx:canvas.width/2,cy:canvas.height/2+(i-(headingLines.length-1)/2)*height*2*.42,
          w:canvas.width,h:height*2*(spec.twoLines?.50:1)
        }));
        textures.addCanvas(key,canvas);
        return {key,width,textureHeight,victory};
    };
    const addLabel = (scene, box, art, spec) => {
      const x = art.x + (spec.x-.5)*art.displayWidth;
      const y = art.y + (spec.y-.5)*art.displayHeight;
      if(spec.decorative) {
        const {key,width,textureHeight,victory}=headingTexture(scene.textures,art.displayWidth,art.displayHeight,spec);
        const node=scene.add.image(x,y+(victory?art.displayHeight*.012:0),key).setDisplaySize(width,textureHeight);box.add(node);return node;
      }
      let size = Math.round(art.displayWidth*spec.size);
      const node = scene.add.text(x,y,window.BerriesI18n.t(spec.key),{
        fontFamily:'Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif',fontStyle:'bold',
        fontSize:size+'px',color:spec.color||'#59331d',align:'center',
        stroke:spec.stroke||undefined,strokeThickness:spec.stroke?Math.max(2,size*.12):0
      }).setOrigin(.5);
      const ratio = Math.min(1,art.displayWidth*spec.w/Math.max(node.width,1),art.displayHeight*spec.h/Math.max(node.height,1));
      if(ratio<1) node.setFontSize(Math.max(8,Math.floor(size*ratio)));
      box.add(node); return node;
    };

})();
