// VK-only display enhancement; never changes game resolution or platform payments.
(() => {
'use strict';
const shell=document.getElementById('game-shell');
if(!shell||!window.matchMedia?.('(pointer: fine)').matches)return;

const style=document.createElement('style');
style.textContent=`
#berries-vk-fullscreen {position:absolute;top:13px;right:13px;z-index:40;
 width:43px;height:43px;display:flex;align-items:center;justify-content:center;
 border:1px solid rgba(255,226,146,.68);border-radius:11px;
 background:rgba(35,30,17,.68);color:#fff6d9;font:700 26px/1 Arial,sans-serif;
 cursor:pointer;opacity:.76;transition:opacity .14s,transform .14s;
 box-shadow:0 2px 12px rgba(0,0,0,.25);touch-action:manipulation}
#berries-vk-fullscreen:hover,#berries-vk-fullscreen:focus-visible{opacity:1;transform:scale(1.05)}
#berries-vk-view-hint{position:absolute;z-index:40;right:12px;top:66px;max-width:min(380px,80%);
 padding:9px 12px;border-radius:8px;background:rgba(20,38,26,.94);
 color:#fff5d5;font:14px/1.35 Arial,sans-serif;text-align:right;display:none;pointer-events:none}
#game-shell:fullscreen{width:100vw!important;height:100vh!important;background:#10261a}
@media(max-width:700px),(pointer:coarse){#berries-vk-fullscreen,#berries-vk-view-hint{display:none!important}}
`;
document.head.appendChild(style);

const button=document.createElement('button');
button.type='button';button.id='berries-vk-fullscreen';button.textContent='⛶';
button.title='На весь экран';button.setAttribute('aria-label','На весь экран');
const hint=document.createElement('div');hint.id='berries-vk-view-hint';hint.setAttribute('role','status');
shell.appendChild(button);shell.appendChild(hint);
let timer;
const notify=message=>{
  hint.textContent=message;hint.style.display='block';
  clearTimeout(timer);timer=setTimeout(()=>{hint.style.display='none'},4200);
};
const update=()=>{
  const full=!!document.fullscreenElement;
  button.textContent=full?'⤡':'⛶';
  button.title=full?'Выйти из полного экрана':'На весь экран';
  button.setAttribute('aria-label',button.title);
  try{window.__berriesGame?.scale?.refresh?.()}catch{}
};
document.addEventListener('fullscreenchange',update,{passive:true});
button.addEventListener('pointerdown',event=>event.stopPropagation());
button.addEventListener('click',async event=>{
  event.preventDefault();event.stopPropagation();
  if(document.fullscreenElement){
    try{await document.exitFullscreen?.()}catch{notify('Не удалось выйти из полного экрана')}
    update();return;
  }
  // Must be requested synchronously during user gesture, before any SDK await.
  if(shell.requestFullscreen&&document.fullscreenEnabled!==false){
    try{
      await shell.requestFullscreen({navigationUI:'hide'});
      update();return;
    }catch(error){console.warn('[Berries VK] Fullscreen rejected by VK frame',error)}
  }
  // Fallback only within a VK launch: ask host to enlarge the iframe.
  const params=new URLSearchParams(window.location.search);
  const bridge=window.vkBridge;
  if((params.has('vk_platform')||params.has('vk_app_id'))&&bridge?.send){
    const sw=window.screen?.availWidth||1280,sh=window.screen?.availHeight||800;
    const width=Math.round(Math.max(760,Math.min(1920,sw-36,(sh-118)*16/9)));
    const height=Math.round(width*9/16);
    try{
      await bridge.send('VKWebAppResizeWindow',{width,height});
      notify('Запрошено увеличение окна. Полный экран зависит от настроек ВКонтакте.');
      try{window.__berriesGame?.scale?.refresh?.()}catch{}
      return;
    }catch(error){console.warn('[Berries VK] ResizeWindow unsupported by host',error)}
  }
  notify('ВКонтакте ограничивает полный экран. Попробуйте F11 в браузере.');
});
})();
