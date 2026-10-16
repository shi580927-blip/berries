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
      read('docs/localization_assets_ready.json'), read('docs/localization_popup_layers.json')
    ]);
    const fontReady=document.fonts.load('800 64px BerriesHeading',dictionary['result.win']+' '+dictionary['result.lose']).then(fonts=>{if(!fonts.length)throw Error('BerriesHeading font failed to load')});
    fontReady.catch(fail);
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
    const paths=new Map(manifest.assets.map(asset=>[asset.source,asset.candidates[language].path]));
    window.BerriesLocalizedUI.configure({language,manifest,layers,paths,fontReady});
    const loadScript = src => new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = src; script.async=false;
      script.onload = resolve; script.onerror = () => reject(Error('Script load failed: ' + src));
      document.body.append(script);
    });
    await Promise.all([
      loadScript('src/optimized-images.js?v=web-images-1'),
      loadScript('src/vertical_slice.js?v=localized-ready-1'),
      loadScript('src/runtime_stable_v10.js?v=localized-ready-1')
    ]);
    status.textContent='PLAY → карта → уровень. Попапы — кнопками сверху.';
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
    window.__berriesLocalizationPreview=Object.freeze({language,prepared:true});
  } catch(error) {fail(error);}
})();
