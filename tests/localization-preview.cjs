const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const campaign=require('../src/campaign.js');
const code=fs.readFileSync('docs/game-localization-preview.js','utf8');
async function check(language){
 const values=new Map([[campaign.KEY,JSON.stringify({coins:98765})]]),reads=[],requests=[],nodes=new Map();
 const storage={getItem:k=>{reads.push(k);return values.get(k)||null},setItem:(k,v)=>values.set(k,v)};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:'',value:'',append(){}});return nodes.get(id)};
 const document={fonts:{load:async()=>[{}]},querySelector:node,querySelectorAll:()=>[],documentElement:{},createElement:tag=>({tag})};
 document.body={append(script){queueMicrotask(()=>script.onload())}};
 const loaded=[];
 class Loader{addFile(files){loaded.push(...(Array.isArray(files)?files:[files]));return this}once(name,fn){this.event=name;this.complete=fn}}
 const window={BerriesI18n:{t:id=>id},BerriesCampaign:{...campaign,...campaign.create(storage)},addEventListener(){}};
 const timers=[];
 vm.runInNewContext(code,{window,document,localStorage:storage,location:{search:'?lang='+language},URLSearchParams,
  Phaser:{Loader:{LoaderPlugin:Loader}},ResizeObserver:class{observe(){}},setInterval:fn=>{timers.push(fn);return 1},clearInterval(){},
  fetch:async path=>{requests.push(path);return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}}});
 // Wait for JSON and script bootstrap promises to settle.
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(node('#preview-error').textContent,'');
 assert.equal(window.BerriesI18n.language,language);
 assert.equal(window.BerriesI18n.init('ru'),language);
 assert.equal(window.BerriesI18n.t('shop.inventory',{count:17}),language==='tr'?'Stok: 17':'Owned: 17');
 assert.ok(requests.includes('src/i18n/drafts/'+language+'.json'));
 assert.ok(!requests.includes('src/i18n/drafts/'+(language==='en'?'tr':'en')+'.json'));
 const state=window.BerriesCampaign.read();assert.notEqual(state.coins,98765);
 assert.ok(reads.every(k=>k.startsWith('berries_localization_preview_'+language+':')));
 assert.equal(JSON.parse(values.get(campaign.KEY)).coins,98765);
 assert.ok(window.BerriesCampaign.KEY.startsWith('berries_localization_preview_'+language+':'));
 const loader=new Loader();loader.addFile({type:'image',key:'coin_shop_new',url:'assets/ui/panels/popup33.png?v=old'});
 assert.equal(loaded.at(-1).url,'assets/i18n/drafts/'+language+'/popup_booster_shop.png');
 assert.equal(loader.event,'filecomplete-image-coin_shop_new');
 loader.addFile({type:'image',key:'gamebg',url:'assets/backgrounds/background_game_forest.jpg'});assert.equal(loaded.at(-1).url,'assets/backgrounds/background_game_forest.jpg');
}
(async()=>{await check('en');await check('tr');
 const index=fs.readFileSync('index.html','utf8');assert.ok(!index.includes('game-localization-preview'));
 const build=fs.readFileSync('scripts/build_release.py','utf8');assert.ok(!build.includes('docs/game-localization-preview'));
 console.log('PASS preview: EN/TR parameters, selected catalog/art, isolated campaign, unchanged production entry');
})().catch(e=>{console.error(e);process.exitCode=1});
