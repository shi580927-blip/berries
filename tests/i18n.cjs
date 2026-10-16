const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/i18n/manager.js', 'utf8');
const dictionaries = Object.fromEntries(['ru','en','tr'].map(l => [l, JSON.parse(fs.readFileSync(`src/i18n/drafts/${l}.json`, 'utf8'))]));
for (const d of Object.values(dictionaries)) {
  assert.deepEqual(Object.keys(d).sort(), Object.keys(dictionaries.ru).sort());
  for (const [id, value] of Object.entries(d)) {
    assert.ok(value.trim(), id);
    assert.deepEqual(value.match(/\{\w+\}/g)?.sort() || [], dictionaries.ru[id].match(/\{\w+\}/g)?.sort() || [], id);
  }
}
let saved='tr';
const window={navigator:{language:'en-US'},localStorage:{getItem:()=>saved,setItem:(_,v)=>saved=v}};
vm.runInNewContext(source,{window});
const i=window.BerriesI18n;
for(const [l,d] of Object.entries(dictionaries)) i.register(l,d);
assert.equal(i.init('tr-TR'),'ru'); // unfinished artwork must not expose mixed languages
assert.equal(i.setLanguage('en'),false);
assert.equal(i.setLanguage('ru-RU'),true);
assert.equal(saved,'ru');
assert.equal(i.t('game.title'),'Безумные ягодки');
assert.equal(i.t('hud.level',{level:7}),dictionaries.ru['hud.level'].replace('{level}','7'));
assert.equal(i.t('missing'),'missing');
window.localStorage.getItem=()=>{throw Error('blocked')};
assert.equal(i.init('de-DE'),'ru');
console.log('i18n checks passed: dictionaries, parameters, readiness gate, persistence, blocked storage');
// Runtime catalog must not drift from the reviewed RU source.
const runtimeWindow={};
vm.runInNewContext(source,{window:runtimeWindow});
vm.runInNewContext(fs.readFileSync('src/i18n/ru.js','utf8'),{window:runtimeWindow});
for(const [id,value] of Object.entries(dictionaries.ru)) assert.equal(runtimeWindow.BerriesI18n.t(id),value,id);
for(const name of ['vertical_slice.js','runtime_stable_v10.js']) {
 const code=fs.readFileSync('src/'+name,'utf8');
 for(const match of code.matchAll(/BerriesI18n\.t\('([^']+)'/g))
  assert.ok(Object.hasOwn(dictionaries.ru,match[1]),`${name}: ${match[1]}`);
}
const audit=JSON.parse(fs.readFileSync('docs/localization_migration_audit.json','utf8'));
for(const entry of audit) assert.equal(i.t(entry.key),entry.original,entry.file+': '+entry.key);
for(const [id,params,expected] of [
 ['hud.level',{level:30},'УРОВЕНЬ 30'],
 ['hud.moves',{moves:0},'ХОДЫ  0'],
 ['hud.score',{score:1250},'СЧЁТ 1250'],
 ['hud.coins',{count:0},'МОНЕТЫ\n0'],
 ['shop.inventory',{count:3},'В запасе: 3'],
 ['shop.bought',{item:'Молоток'},'Куплено:\nМолоток'],
 ['result.reward',{count:500},'Награда\n500 монет'],
 ['result.remaining',{goals:'Клубника: 4\nЛёд: 1'},'Осталось собрать\nКлубника: 4\nЛёд: 1']
]) assert.equal(i.t(id,params),expected,id);
console.log(`PASS: ${audit.length} migrated literals preserve RU copy; dynamic UI parameters and source keys validated`);
