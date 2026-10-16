// Verify prepared WebP geometry and transparency against the exact old Canvas path.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.BERRIES_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/localization_assets_ready.json')));
 const server=http.createServer((q,r)=>{try{r.setHeader('Content-Type','text/plain');r.end(fs.readFileSync(path.join(root,new URL(q.url,'http://local').pathname)))}catch{r.statusCode=404;r.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BERRIES_BROWSER_EXECUTABLE,args:JSON.parse(process.env.BERRIES_BROWSER_ARGS||'[]')});
 const records=[],seen=new Set();
 try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/README.md');
 for(const asset of manifest.assets)for(const candidate of Object.values(asset.candidates)){
  if(seen.has(candidate.path))continue;seen.add(candidate.path);
  const record=await page.evaluate(async({candidate,size})=>{
   const load=async url=>{const im=new Image();im.src=url;await im.decode();return im};
   const [source,ready]=await Promise.all([load(candidate.preparedFrom),load(candidate.path)]);
   if(ready.width!==size[0]||ready.height!==size[1])throw Error('Dimensions changed');
   const canvas=document.createElement('canvas');[canvas.width,canvas.height]=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const scale=Math.min(canvas.width/source.width,canvas.height/source.height),w=source.width*scale,h=source.height*scale;
   ctx.drawImage(source,(canvas.width-w)/2,(canvas.height-h)/2,w,h);const before=ctx.getImageData(0,0,...size).data;
   ctx.clearRect(0,0,...size);ctx.drawImage(ready,0,0);const after=ctx.getImageData(0,0,...size).data;
   let alphaDifferences=0,totalRgbError=0,samples=0;
   for(let i=0;i<before.length;i+=4){if(before[i+3]!==after[i+3])alphaDifferences++;if(before[i+3]===255){for(let j=0;j<3;j++)totalRgbError+=Math.abs(before[i+j]-after[i+j]);samples+=3}}
   return {path:candidate.path,size,alphaDifferences,opaqueMeanRgbError:totalRgbError/Math.max(1,samples)};
  },{candidate,size:asset.sourceSize});
  if(record.alphaDifferences||record.opaqueMeanRgbError>5)throw Error(JSON.stringify(record));records.push(record);
 }
 }finally{await browser.close();server.close()}
 if(process.env.BERRIES_QA_OUTPUT)fs.writeFileSync(process.env.BERRIES_QA_OUTPUT,JSON.stringify(records,null,2)+'\n');console.log('PASS exact normalized dimensions/alpha and bounded WebP colour error for '+records.length+' images');
})().catch(e=>{console.error(e);process.exit(1)});
