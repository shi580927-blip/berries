/* Restore the local Phaser vendor bundle when working from a clean Git clone.
   Phaser 3.90.0 is used by the isolated Gameplay 3 CI preview. */
const https=require('node:https');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve(__dirname,'../vendor/phaser.min.js');
const url='https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
if(fs.existsSync(out)&&fs.statSync(out).size>100000){
  console.log('Phaser vendor already available:',out);
  process.exit(0);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
function download(address,hops=0){
  if(hops>4)throw Error('Too many redirects');
  https.get(address,response=>{
    if([301,302,303,307,308].includes(response.statusCode)){
      response.resume();
      return download(new URL(response.headers.location,address).toString(),hops+1);
    }
    if(response.statusCode!==200){
      response.resume();console.error('Phaser download HTTP',response.statusCode);
      process.exitCode=1;return;
    }
    const temp=out+'.partial',file=fs.createWriteStream(temp);
    response.pipe(file);
    file.on('finish',()=>{
      file.close(()=>{
        if(fs.statSync(temp).size<100000){
          fs.rmSync(temp,{force:true});console.error('Incomplete Phaser download');process.exitCode=1;return;
        }
        fs.renameSync(temp,out);console.log('Saved Phaser:',out);
      });
    });
    file.on('error',e=>{fs.rmSync(temp,{force:true});console.error(e);process.exitCode=1});
  }).on('error',e=>{console.error('Cannot download Phaser:',e.message);process.exitCode=1});
}
download(url);
