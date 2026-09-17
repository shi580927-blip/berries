const fs=require('fs');
const vm=require('vm');

const storage=new Map();
const localStorage={
  getItem:key=>storage.has(key)?storage.get(key):null,
  setItem:(key,value)=>storage.set(key,String(value))
};
let adCalls=0;
const ysdk={
  on(){},
  getPlayer:async()=>({getData:async()=>({}),setData:async()=>{}}),
  features:{LoadingAPI:{ready(){}},GameplayAPI:{start(){},stop(){}}},
  adv:{showRewardedVideo({callbacks}){adCalls++;callbacks.onOpen();callbacks.onRewarded();callbacks.onClose()}},
  getPayments:async()=>({getCatalog:async()=>[],getPurchases:async()=>[]})
};
const campaign={lastWin:{id:7,doubled:false},active:null,lives:5};
const play={attemptId:7,winRewardDoubled:false,continueUsed:false,scene:{isActive:()=>true}};
const map={scene:{isActive:()=>false}};
const document={addEventListener(){},hidden:false};
const window={
  YaGames:{init:async()=>ysdk},
  BerriesLifecycle:{paused:false,set(){}},
  BerriesCampaign:{read:()=>campaign,restore(){}},
  addEventListener(){},
  __berriesGameplayShouldRun:true,
  __berriesGame:{scene:{keys:{Play:play,Map:map}}}
};
const context={window,document,localStorage,navigator:{language:'ru'},console,setTimeout,clearTimeout,Date,Promise};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/sdk/yandex.js','utf8'),context);

(async()=>{
  const api=window.BerriesYandex;
  const first=await api.showRewardedVideo();
  if(first!==true||adCalls!==1)throw new Error('first eligible rewarded ad did not play');
  if(api.rewardedCooldownRemaining()<=0)throw new Error('cooldown was not started');

  campaign.lastWin.doubled=true;
  play.winRewardDoubled=true;
  storage.set('berries_rewarded_last_at',String(Date.now()-121000));
  const repeated=await api.showRewardedVideo();
  if(repeated!==false||adCalls!==1||api.rewardedOfferEligible()!==false)throw new Error('same reward opportunity can be viewed twice');

  campaign.lastWin={id:8,doubled:false};
  play.attemptId=8;
  play.winRewardDoubled=false;
  storage.set('berries_rewarded_last_at',String(Date.now()));
  const cooldown=await api.showRewardedVideo();
  if(cooldown!==false||adCalls!==1||api.rewardedBlock.reason!=='cooldown')throw new Error('two-minute rewarded cooldown not enforced');

  console.log('PASS rewarded: one reward per opportunity + 2-minute successful-view cooldown');
})().catch(error=>{console.error(error);process.exit(1)});
