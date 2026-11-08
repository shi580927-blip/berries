'use strict';
// Run: node tests/royal-trail-assets.cjs (from repo root)
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'assets/characters/royal_trail');
const data=JSON.parse(fs.readFileSync(path.join(dir,'royal_characters_atlas.json'),'utf8'));
const man=JSON.parse(fs.readFileSync(path.join(dir,'royal_characters_manifest.json'),'utf8'));
const webp=fs.readFileSync(path.join(dir,'royal_characters_atlas.webp'));
assert.equal(webp.toString('ascii',0,4),'RIFF');assert.equal(webp.toString('ascii',8,12),'WEBP');
assert.equal(Object.keys(data.frames).length,64);
assert.equal(Object.keys(man.characters).length,8);
for(const [name,info] of Object.entries(man.characters)){
 assert.equal(info.frames,8);
 assert.equal(info.durations_ms.length,8);
 assert.ok(info.durations_ms.every(v=>v>=50&&v<=1000));
 for(let i=0;i<8;i++){
  const key=`${name}_${String(i).padStart(3,'0')}`;
  const f=data.frames[key]?.frame;assert.ok(f,`missing ${key}`);
  assert.equal(f.w,256);assert.equal(f.h,256);
  assert.ok(f.x+f.w<=data.meta.size.w&&f.y+f.h<=data.meta.size.h);
 }
}
console.log('Royal Trail 8×8 animated texture atlas: OK');
