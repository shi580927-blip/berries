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
