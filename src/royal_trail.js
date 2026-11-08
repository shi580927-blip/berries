/* Expandable Royal Trail story model; independent of the legacy 30-node map artwork. */
(function(root,factory){
 'use strict';
 const result=factory();
 if(typeof module==='object'&&module.exports)module.exports=result;
 else root.BerriesRoyalTrail=result;
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const ZONES=Object.freeze([
   {id:'royal_path',from:1,to:2,title:'Королевская тропа',accent:0xffd777,
    hero:'king',description:'Сначала познакомимся с Королём.'},
   {id:'frost_queen',from:3,to:8,title:'Ледяная западня',accent:0xa6e9ff,
    hero:'queen_cloudberry',description:'Освободить Королеву Морошку от морозных чар.'},
   {id:'alchemist',from:9,to:14,title:'Алхимические неожиданности',accent:0xb990ed,
    hero:'alchemist',description:'Придворный алхимик перестарался с колбами.'}
 ]);
 const STORIES=Object.freeze({
   1:'Король: На тропу! Только ягоды не пересчитывайте.',
   2:'Король: За поворотом холодно. Подозрительно холодно!',
   3:'Король: Королеву Морошку заколдовали. Разобьём лёд!',
   6:'Король: Ой! Ягоды забродили! Это вообще законно?',
   8:'Король: Королева свободна! Теперь бы растопить мой трон.',
   9:'Алхимик: Я всего лишь хотел сварить компот. Кажется, он живой.',
   12:'Алхимик: Колбы не трогать! И ягоды тоже… поздно.'
 });
 function zoneForLevel(n){
   if(!Number.isInteger(n)||n<1)return null;
   return ZONES.find(z=>n>=z.from&&n<=z.to)||
    {id:'future',from:15,to:Infinity,title:'Новые приключения',accent:0x8cc86d,hero:null};
 }
 function levelStory(n){return STORIES[n]||null}
 function stageForLevel(n){return n>0&&Number.isInteger(n)&&n%6===0?n/6:0}
 // Page numbers and content are computed from level count; adding levels needs no re-drawn atlas.
 function pages(maxLevel,pageSize=30){
   if(!Number.isInteger(maxLevel)||maxLevel<1)return [];
   const out=[];for(let from=1;from<=maxLevel;from+=pageSize){
     out.push({from,to:Math.min(maxLevel,from+pageSize-1),
       stops:Array.from({length:Math.min(pageSize,maxLevel-from+1)},(_,i)=>({
         n:from+i,zone:zoneForLevel(from+i).id,madness:stageForLevel(from+i)>0
       }))});
   }
   return out;
 }
 return Object.freeze({ZONES,STORIES,zoneForLevel,levelStory,stageForLevel,pages});
});
