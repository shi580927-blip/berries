const assert=require('node:assert/strict');
const campaign=require('../src/campaign.js');
assert.equal(campaign.LEVELS_PER_LOCATION,20);
for(const [level,id,localLevel] of [[1,'location_001',1],[20,'location_001',20],[21,'location_002',1],[40,'location_002',20],[41,'location_003',1]]){
 const location=campaign.locationForLevel(level);assert.equal(location.id,id);assert.equal(location.localLevel,localLevel);
 assert.equal(location.lastLevel-location.firstLevel+1,20);
}
for(const value of [0,-1,1.5,NaN,'21'])assert.equal(campaign.locationForLevel(value),null);
assert.equal(campaign.MAX_LEVEL,Math.max(...Object.keys(campaign.LEVELS).map(Number)));
for(const [level,config] of Object.entries(campaign.LEVELS))assert.equal(config.locationId,campaign.locationForLevel(Number(level)).id);
const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
const api=campaign.create(storage);const save=api.read();
save.done=Array.from({length:30},(_,i)=>i+1);save.coins=1234;save.inventory.hammer=9;
storage.setItem(campaign.KEY,JSON.stringify(save));const after=api.read();
assert.deepEqual(after.done,save.done);assert.equal(after.coins,1234);assert.equal(after.inventory.hammer,9);
assert.equal(api.begin(campaign.MAX_LEVEL+1),null);
console.log('PASS content structure: 20-level locations, stable IDs, current save and missing levels');
