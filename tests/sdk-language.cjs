const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

async function check(portalLanguage){
  let reads=0;
  let finishPlayer;
  const html={lang:'ru'};
  const ysdk={
    environment:{i18n:{get lang(){reads++;return portalLanguage}}},
    on(){},
    getPlayer:()=>new Promise(resolve=>{finishPlayer=resolve})
  };
  const window={YaGames:{init:async()=>ysdk},BerriesLifecycle:{set(){}},addEventListener(){}};
  const context={window,document:{documentElement:html,addEventListener(){}},console,setTimeout,clearTimeout,Promise};
  vm.runInNewContext(fs.readFileSync('src/sdk/yandex.js','utf8'),context);
  await window.BerriesYandex.languageReady();
  const language=window.BerriesYandex.language;
  assert.equal(reads,1,'SDK language must be read during initialization');
  assert.equal(language.detected,portalLanguage);
  assert.equal(language.current,'ru','only RU is available in this release');
  assert.equal(html.lang,'ru');
  assert.equal(typeof finishPlayer,'function','Player API may still be loading after language detection');
  finishPlayer(null);
  await window.BerriesYandex.init();
}

(async()=>{
  await check('ru');
  await check('en');
  const source=fs.readFileSync('src/vertical_slice.js','utf8');
  const boot=source.slice(source.indexOf('class Boot extends Phaser.Scene'),source.indexOf('class Title extends Phaser.Scene'));
  assert(boot.includes('window.__berriesSdkReadyPromise??=window.BerriesYandex.languageReady()'));
  assert(boot.indexOf('window.__berriesSdkReadyPromise.then(')<boot.indexOf("this.scene.start('Title')"),
    'Title must wait for launch-time SDK language detection');
  console.log('PASS SDK language is read before Title, with RU fallback');
})().catch(error=>{console.error(error);process.exitCode=1});
