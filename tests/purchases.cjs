const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {create,ROYAL_PRODUCTS}=require('../src/campaign.js');

function harness({readFails=false}={}){
  const memory={};
  const storage={getItem:key=>memory[key]??null,setItem:(key,value)=>{memory[key]=value}};
  const events=[],pending=[];
  let failSave=false,failConsume=false,cancel=false;
  const campaign=create(storage,()=>1000,state=>sdk?.saveCloudData(state));
  const payments={
    async getCatalog(){return Object.keys(ROYAL_PRODUCTS).map(id=>({id,price:'10 TST'}))},
    async purchase({id}){events.push('purchase:'+id);if(cancel)throw Error('cancelled');return {productID:id,purchaseToken:'token-'+id}},
    async getPurchases(){events.push('getPurchases');return pending},
    async consumePurchase(token){events.push('consume:'+token);if(failConsume)throw Error('confirmation failed');const index=pending.findIndex(p=>p.purchaseToken===token);if(index>=0)pending.splice(index,1)}
  };
  const player={
    async getData(){if(readFails)throw Error('cloud read failed');return {}},
    async setData(data,flush){events.push('save:'+data.berries.purchaseTokens.join(','));assert.equal(flush,true);if(failSave)throw Error('offline')}
  };
  const window={
    YaGames:{init:async()=>({environment:{i18n:{lang:'ru'}},getPlayer:async()=>player,getPayments:async()=>payments,on(){}})},
    BerriesCampaign:{...campaign,ROYAL_PRODUCTS},
    BerriesLifecycle:{set(key,on){events.push(key+':'+on)}},
    addEventListener(){},__berriesGameplayShouldRun:false
  };
  const context={window,document:{documentElement:{},addEventListener(){}},console:{warn(){}},setTimeout:()=>1,clearTimeout(){},Promise};
  vm.runInNewContext(fs.readFileSync('src/sdk/yandex.js','utf8'),context);
  const sdk=window.BerriesYandex;
  return {sdk,campaign,events,pending,payments,set failSave(value){failSave=value},set failConsume(value){failConsume=value},set cancel(value){cancel=value}};
}

(async()=>{
  const h=harness();
  assert.equal(await h.sdk.restoreCampaign(),true);
  assert.deepEqual((await h.sdk.getPurchaseCatalog()).map(p=>p.id),Object.keys(ROYAL_PRODUCTS));
  for(let i=0;i<2;i++){const token=h.campaign.begin(1);h.campaign.lose(token);h.campaign.abandon(token)}
  const initial=h.campaign.read();
  assert.equal(initial.lives,3);
  for(const id of Object.keys(ROYAL_PRODUCTS)){
    const result=await h.sdk.purchaseProduct(id);
    assert.equal(result.ok,true,id);
    const save=h.events.findLastIndex(event=>event.startsWith('save:')&&event.split(':')[1].split(',').includes('token-'+id));
    const consume=h.events.lastIndexOf('consume:token-'+id);
    assert(save>=0&&save<consume,'cloud save must finish before consumption: '+id);
  }
  const awarded=h.campaign.read();
  assert.equal(awarded.coins,initial.coins+1000);
  assert.equal(awarded.lives,5);
  for(const id of Object.keys(awarded.inventory))assert.equal(awarded.inventory[id],initial.inventory[id]+3);
  assert.equal((await h.sdk.purchaseProduct('invalid')).reason,'unknown_product');
  h.cancel=true;
  assert.equal((await h.sdk.purchaseProduct('coins_1000')).reason,'cancelled');
  assert.equal(h.campaign.read().coins,awarded.coins,'cancelled purchase gives no reward');

  const offline=harness();await offline.sdk.restoreCampaign();offline.failSave=true;
  assert.equal((await offline.sdk.purchaseProduct('coins_1000')).reason,'save_pending');
  assert(!offline.events.some(e=>e.startsWith('consume:')),'failed save must leave token unconsumed');
  offline.pending.push({productID:'coins_1000',purchaseToken:'token-coins_1000'});
  offline.failSave=false;
  assert.deepEqual(Array.from(await offline.sdk.restorePurchases()),['coins_1000']);
  assert.equal(offline.campaign.read().coins,1000,'retry must not grant twice');

  const confirmation=harness();await confirmation.sdk.restoreCampaign();confirmation.failConsume=true;
  assert.equal((await confirmation.sdk.purchaseProduct('boosters_3')).reason,'confirm_pending');
  confirmation.pending.push({productID:'boosters_3',purchaseToken:'token-boosters_3'});
  confirmation.failConsume=false;
  assert.deepEqual(Array.from(await confirmation.sdk.restorePurchases()),['boosters_3']);
  assert.equal(confirmation.campaign.read().inventory.hammer,5,'confirmation retry must not grant twice');

  const blocked=harness({readFails:true});
  assert.equal(await blocked.sdk.restoreCampaign(),false);
  assert.equal((await blocked.sdk.purchaseProduct('coins_1000')).reason,'unavailable');
  assert(!blocked.events.some(e=>e.startsWith('purchase:')),'payment must wait for cloud restore');
  console.log('PASS purchases: catalog, all rewards, save/consume order, cancellation, restore, cloud guard');
})().catch(error=>{console.error(error);process.exitCode=1});
