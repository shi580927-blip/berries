// Bake the former browser-time contain normalization with the same Canvas renderer.
// Run deliberately when approved source artwork changes; originals are never replaced.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BERRIES_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/localization_assets_web.json')));
 const server=http.createServer((q,r)=>{try{r.setHeader('Content-Type','text/plain');r.end(fs.readFileSync(path.join(root,new URL(q.url,'http://local').pathname)))}catch{r.statusCode=404;r.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BERRIES_BROWSER_EXECUTABLE,args:JSON.parse(process.env.BERRIES_BROWSER_ARGS||'[]')});
 try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/README.md');
 const generated=new Map(),audit=[];
 for(const asset of manifest.assets)for(const [language,candidate] of Object.entries(asset.candidates)){
  const output=candidate.path.replace('/web/','/ready/').replace(/\.webp$/,'.png');
  if(!generated.has(output)){
   const data=await page.evaluate(async({src,size})=>{
    const image=new Image();image.src=src;await image.decode();
    const canvas=document.createElement('canvas');[canvas.width,canvas.height]=size;
    const scale=Math.min(canvas.width/image.width,canvas.height/image.height),w=image.width*scale,h=image.height*scale;
    canvas.getContext('2d').drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
    return canvas.toDataURL('image/png').split(',')[1];
   },{src:candidate.path,size:asset.sourceSize});
   fs.mkdirSync(path.dirname(path.join(root,output)),{recursive:true});fs.writeFileSync(path.join(root,output),Buffer.from(data,'base64'));
   require('node:child_process').execFileSync('python',['-c',"from PIL import Image; import sys; p=sys.argv[1]; im=Image.open(p).convert('RGBA'); out=p.replace('.png','.webp'); tmp=out+'.tmp'; im.save(tmp,format='WEBP',quality=90,method=4,exact=True); assert Image.open(tmp).convert('RGBA').getchannel('A').tobytes()==im.getchannel('A').tobytes(); import os; os.replace(tmp,out)",path.join(root,output)]);
   fs.unlinkSync(path.join(root,output));generated.set(output,true);
  }
  candidate.preparedFrom=candidate.path;candidate.path=output.replace(/\.png$/,'.webp');candidate.size=asset.sourceSize;
  const bytes=fs.readFileSync(path.join(root,candidate.path));
  if(!bytes.length)throw Error('Empty prepared image: '+candidate.path);
  candidate.sha256=require('node:crypto').createHash('sha256').update(bytes).digest('hex');
  candidate.bytes=bytes.length;candidate.geometryChecked=true;candidate.status='prepared_preview_only';
  audit.push({id:asset.id,language,path:candidate.path,size:asset.sourceSize});
 }
 manifest.status='prepared_preview_only';
 fs.writeFileSync(path.join(root,'docs/localization_assets_ready.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(audit));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
