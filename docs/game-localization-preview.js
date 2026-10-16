// Development entry only. Not loaded by index.html or included in release ZIP.
(async () => {
  'use strict';
  const status = document.querySelector('#preview-status');
  const fail = error => {
    status.textContent = 'Ошибка стенда';
    const node = document.querySelector('#preview-error');
    node.style.display = 'block'; node.textContent = String(error.stack || error);
  };
  try {
    const language = new URLSearchParams(location.search).get('lang') === 'tr' ? 'tr' : 'en';
    document.querySelector('#preview-language').value = language;
    document.querySelector('#preview-language').onchange = e => { location.search = '?lang=' + e.target.value; };
    const read = async path => {
      const response = await fetch(path);
      if (!response.ok) throw Error(path + ': HTTP ' + response.status);
      return response.json();
    };
    const [dictionary, manifest, layers] = await Promise.all([
      read('src/i18n/drafts/' + language + '.json'),
      read('docs/localization_assets.json'), read('docs/localization_popup_layers.json')
    ]);
    const originalI18n = window.BerriesI18n;
    window.BerriesI18n = Object.freeze({
      language, availableLanguages: [language], init: () => language,
      setLanguage: () => false,
      t(id, params = {}) {
        const template = dictionary[id];
        if (typeof template !== 'string') return originalI18n.t(id, params);
        return template.replace(/\{(\w+)\}/g, (token, key) => Object.hasOwn(params, key) ? String(params[key]) : token);
      }
    });
    document.documentElement.lang = language;
    document.title = dictionary['game.title'] + ' — PREVIEW ' + language.toUpperCase();
    document.querySelector('#rotate-hint').textContent = language === 'tr' ? 'Cihazını yatay çevir 🌿' : 'Rotate your device to landscape 🌿';
    // Same economy, isolated storage. Preview never reads/writes the real campaign.
    const campaign = window.BerriesCampaign;
    const prefix = 'berries_localization_preview_' + language + ':';
    const memory = new Map();
    const storage = {
      getItem(key) { try { return localStorage.getItem(prefix + key); } catch { return memory.get(key) || null; } },
      setItem(key, value) { memory.set(key, String(value)); try { localStorage.setItem(prefix + key, value); } catch {} }
    };
    window.BerriesCampaign = { ...campaign, ...campaign.create(storage), KEY: prefix + campaign.KEY };
    const bySource = new Map(manifest.assets.map(a => [a.source, a]));
    const image = Phaser.Loader.LoaderPlugin.prototype.image;
    const normalized = new Set();
    Phaser.Loader.LoaderPlugin.prototype.image = function(key, url, ...args) {
      const asset = typeof url === 'string' ? bySource.get(url.split('?')[0]) : null;
      if (!asset) return image.call(this, key, url, ...args);
      const candidate = asset.candidates[language];
      this.once('filecomplete-image-' + key, () => {
        const textures = this.scene.sys.textures;
        const source = textures.get(key).getSourceImage();
        const canvas = document.createElement('canvas');
        [canvas.width, canvas.height] = asset.sourceSize;
        const context = canvas.getContext('2d');
        // Preserve full source-canvas coordinates; never stretch one axis.
        const scale = Math.min(canvas.width / source.width, canvas.height / source.height);
        const width = source.width * scale, height = source.height * scale;
        context.drawImage(source, (canvas.width-width)/2, (canvas.height-height)/2, width, height);
        textures.remove(key); textures.addCanvas(key, canvas);
        normalized.add(asset.id);
      });
      return image.call(this, key, candidate.path, ...args);
    };
    const loadScript = src => new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = src;
      script.onload = resolve; script.onerror = () => reject(Error('Script load failed: ' + src));
      document.body.append(script);
    });
    await loadScript('src/vertical_slice.js');
    await loadScript('src/runtime_stable_v10.js');
    const addLabel = (scene, box, art, spec) => {
      const x = art.x + (spec.x-.5)*art.displayWidth;
      const y = art.y + (spec.y-.5)*art.displayHeight;
      let size = Math.round(art.displayWidth*spec.size);
      const node = scene.add.text(x,y,window.BerriesI18n.t(spec.key),{
        fontFamily:'Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif',fontStyle:'bold',
        fontSize:size+'px',color:spec.color||'#59331d',align:'center',
        stroke:spec.stroke||undefined,strokeThickness:spec.stroke?Math.max(2,size*.12):0
      }).setOrigin(.5);
      const ratio = Math.min(1,art.displayWidth*spec.w/Math.max(node.width,1),art.displayHeight*spec.h/Math.max(node.height,1));
      if(ratio<1) node.setFontSize(Math.max(8,Math.floor(size*ratio)));
      box.add(node); return node;
    };
    // Install after the stable runtime has patched Play. No changes to game sources.
    const install = () => {
      const game = window.__berriesGame, play = game?.scene?.keys?.Play;
      const proto = play && Object.getPrototypeOf(play);
      if(!proto?.__berriesStableV10) return false;
      const result = proto.resultPopup;
      proto.resultPopup = function(win) {
        result.call(this,win);
        const box = [...this.children.list].reverse().find(n=>n.type==='Container'&&n.depth===31);
        const art = box?.list?.find(n=>n.texture?.key===(win?'popup_win':'popup_lose'));
        if(!art) throw Error('Preview: result popup artwork not found');
        const skip = new Set(['result.reward','result.remaining','berry.strawberry','obstacle.ice']);
        for(const spec of layers[win?'levelWin':'levelLose']) if(!skip.has(spec.key)) addLabel(this,box,art,spec);
      };
      const paid = proto.openPaidShop;
      proto.openPaidShop = function() {
        const existed = this._paidShopModal?.active;
        paid.call(this);
        if(existed) return;
        const box=this._paidShopModal,art=box?.list?.find(n=>n.texture?.key==='popup_royal_shop');
        if(art) addLabel(this,box,art,layers.paidRoyalShop[0]);
      };
      status.textContent='Стенд готов. PLAY → карта → уровень. Попапы — кнопками сверху.';
      return true;
    };
    let attempts=0;
    const timer=setInterval(()=>{try{if(install()||++attempts>500){clearInterval(timer);if(attempts>500)fail(Error('Phaser preview initialization timed out'));}}catch(e){clearInterval(timer);fail(e);}},20);
    for(const button of document.querySelectorAll('[data-preview]')) button.onclick=()=>{
      try {
        const play=window.__berriesGame?.scene?.keys?.Play;
        if(!play?.scene?.isActive()||!play.cfg){status.textContent='Сначала открой уровень через PLAY и карту.';return;}
        if(play._shopModal?.active||play._paidShopModal?.active||play.children.list.some(n=>n.type==='Container'&&n.depth===31)){status.textContent='Сначала закрой открытый попап.';return;}
        const kind=button.dataset.preview;
        if(kind==='shop')play.openShop();else if(kind==='paid')play.openPaidShop();
        else {if(play.busy){status.textContent='Дождись завершения хода.';return;}play.busy=true;play.resultPopup(kind==='win');}
        status.textContent='Черновик: '+kind+' / '+language.toUpperCase()+'. Награда не начисляется кнопкой стенда.';
      } catch(e) {fail(e);}
    };
    const refresh=()=>window.__berriesGame?.scale?.refresh?.();
    new ResizeObserver(refresh).observe(document.querySelector('#game-shell'));
    window.addEventListener('orientationchange',refresh);
    window.__berriesLocalizationPreview=Object.freeze({language,normalized});
  } catch(error) {fail(error);}
})();
