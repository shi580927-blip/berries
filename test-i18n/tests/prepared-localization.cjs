const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const original=JSON.parse(fs.readFileSync('docs/localization_assets_web.json'));
const prepared=JSON.parse(fs.readFileSync('docs/localization_assets_ready.json'));
for(const asset of prepared.assets){
 const source=original.assets.find(a=>a.id===asset.id);
 assert.equal(asset.source,source.source);assert.deepEqual(asset.sourceSize,source.sourceSize);
 for(const language of ['en','tr']){
  const candidate=asset.candidates[language],bytes=fs.readFileSync(candidate.path);
  assert.equal(candidate.preparedFrom,source.candidates[language].path);
  assert.deepEqual(candidate.size,asset.sourceSize);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.length,candidate.bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),candidate.sha256);
 }
}
console.log('PASS prepared language artwork: every URL, original geometry, WebP payload, size and SHA-256');
