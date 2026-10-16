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
    const tools=document.querySelector('#preview-tools'),toggle=document.querySelector('#preview-toggle');
    toggle.onclick=()=>toggle.setAttribute('aria-expanded',String(tools.classList.toggle('expanded')));
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
      read(new URLSearchParams(location.search).get('assets')==='original'?'docs/localization_assets.json':'docs/localization_assets_optimized.json'), read('docs/localization_popup_layers.json')
    ]);
    const loadedFonts = await document.fonts.load('800 64px BerriesHeading', dictionary['result.win']+' '+dictionary['result.lose']);
    if (!loadedFonts.length) throw Error('BerriesHeading font failed to load');
    window.berriesDigitsReady = document.fonts.load('700 32px BerriesDigits','0123456789');
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
    const addFile = Phaser.Loader.LoaderPlugin.prototype.addFile;
    const normalized = new Set();
    // Image factories are installed as own methods by Phaser, so intercept the
    // underlying queue instead of shadowing LoaderPlugin.prototype.image.
    Phaser.Loader.LoaderPlugin.prototype.addFile = function(files) {
      for(const file of (Array.isArray(files)?files:[files])) {
        const asset=file.type==='image'&&typeof file.url==='string'?bySource.get(file.url.split('?')[0]):null;
        if(!asset)continue;
        const candidate=asset.candidates[language];
        file.url=candidate.path;
        const key=file.key;
        this.once('filecomplete-image-'+key,()=>{
          const textures=this.scene.sys.textures;
          const source=textures.get(key).getSourceImage();
          const canvas=document.createElement('canvas');
          [canvas.width,canvas.height]=asset.sourceSize;
          const context=canvas.getContext('2d');
          const scale=Math.min(canvas.width/source.width,canvas.height/source.height);
          const width=source.width*scale,height=source.height*scale;
          context.drawImage(source,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
          textures.remove(key);textures.addCanvas(key,canvas);normalized.add(asset.id);
        });
      }
      return addFile.call(this,files);
    };
    const loadScript = src => new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = src;
      script.onload = resolve; script.onerror = () => reject(Error('Script load failed: ' + src));
      document.body.append(script);
    });
    await loadScript('src/vertical_slice.js?v=popup-lazy-1');
    await loadScript('src/runtime_stable_v10.js?v=combo-spawn-1');
    const addLabel = (scene, box, art, spec) => {
      const x = art.x + (spec.x-.5)*art.displayWidth;
      const y = art.y + (spec.y-.5)*art.displayHeight;
      if(spec.decorative) {
        const width=art.displayWidth*spec.w,height=art.displayHeight*spec.h;
        // Victory needs extra texture headroom for the raised centre of the arc.
        const victory=spec.key==='result.win';
        const textureHeight=height*((victory||spec.twoLines)?1.5:1);
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*2);canvas.height=Math.ceil(textureHeight*2);
        const headingText=window.BerriesI18n.t(spec.key);
        const headingLines=spec.twoLines?headingText.split(' '):[headingText];
        headingLines.forEach((line,i)=>window.BerriesHeadingPainter.draw(canvas.getContext('2d'),line,{
          cx:canvas.width/2,cy:canvas.height/2+(i-(headingLines.length-1)/2)*height*2*.42,
          w:canvas.width,h:height*2*(spec.twoLines?.50:1)
        }));
        const key='preview_heading_'+language+'_'+spec.key;
        if(scene.textures.exists(key))scene.textures.remove(key);
        scene.textures.addCanvas(key,canvas);
        const node=scene.add.image(x,y+(victory?art.displayHeight*.012:0),key).setDisplaySize(width,textureHeight);box.add(node);return node;
      }
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
      proto.resultPopup = async function(win) {
        const shown=await result.call(this,win);
        if(shown===false||!this.scene.isActive())return;
        const box = [...this.children.list].reverse().find(n=>n.type==='Container'&&n.depth===31);
        const art = box?.list?.find(n=>n.texture?.key===(win?'popup_win':'popup_lose'));
        if(!art) throw Error('Preview: result popup artwork not found');
        const skip = new Set(['result.reward','result.remaining','berry.strawberry','obstacle.ice']);
        for(const spec of layers[win?'levelWin':'levelLose']) if(!skip.has(spec.key)) addLabel(this,box,art,spec);
      };
      // Map copies the shop method before this preview installs; wrap both scenes.
      const decorateShop=original=>async function() {
        const existed=this._paidShopModal?.active;
        await original.call(this);
        if(!this.scene.isActive())return;
        if(existed)return;
        const box=this._paidShopModal,art=box?.list?.find(n=>n.texture?.key==='popup_royal_shop');
        if(art)addLabel(this,box,art,{...layers.paidRoyalShop[0],x:.5,y:language==='tr'?.208:.19,w:.62,h:language==='tr'?.135:.12,twoLines:language==='tr',decorative:true});
      };
      proto.openPaidShop=decorateShop(proto.openPaidShop);
      const mapProto=Object.getPrototypeOf(game.scene.keys.Map);
      mapProto.openPaidShop=decorateShop(mapProto.openPaidShop);
      status.textContent='Стенд готов. PLAY → карта → уровень. Попапы — кнопками сверху.';
      return true;
    };
    let attempts=0;
    const timer=setInterval(()=>{try{if(install()||++attempts>500){clearInterval(timer);if(attempts>500)fail(Error('Phaser preview initialization timed out'));}}catch(e){clearInterval(timer);fail(e);}},20);
    for(const button of document.querySelectorAll('[data-preview]')) button.onclick=async()=>{
      try {
        const play=window.__berriesGame?.scene?.keys?.Play;
        if(!play?.scene?.isActive()||!play.cfg){status.textContent='Сначала открой уровень через PLAY и карту.';return;}
        if(play._shopModal?.active||play._paidShopModal?.active||play.children.list.some(n=>n.type==='Container'&&n.depth===31)){status.textContent='Сначала закрой открытый попап.';return;}
        const kind=button.dataset.preview;
        if(kind==='shop')await play.openShop();else if(kind==='paid')await play.openPaidShop();else if(kind==='combo')play.comboCelebration(4);
        else {if(play.busy){status.textContent='Дождись завершения хода.';return;}play.busy=true;await play.resultPopup(kind==='win');}
        if(window.matchMedia?.('(max-width:1000px)').matches){tools.classList.remove('expanded');toggle.setAttribute('aria-expanded','false');}
        status.textContent='Черновик: '+kind+' / '+language.toUpperCase()+'. Награда не начисляется кнопкой стенда.';
      } catch(e) {fail(e);}
    };
    const refresh=()=>window.__berriesGame?.scale?.refresh?.();
    new ResizeObserver(refresh).observe(document.querySelector('#game-shell'));
    window.addEventListener('orientationchange',refresh);
    window.__berriesLocalizationPreview=Object.freeze({language,normalized});
  } catch(error) {fail(error);}
})();
