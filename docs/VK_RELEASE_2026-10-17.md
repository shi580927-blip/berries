# VK release candidate, 2026-10-17

- Branch: platform/vk-ok from base f33bc1890129ae09b0242bd88c354de9010064bc.
- Target: https://berries.kingdom1.ru/vk/ ; claimed VK App ID 54798320 (developer cabinet NOT verified).
- Untouched: main, base, reference/sdk-free-2026-10-16, web/kingdom1.
- Engine/UI: original RU 1920x1080 Phaser FIT, current art/music/FX unchanged; EN/TR remain preview-only.
- Local saves are prefixed berries_vk_<viewerID|guest>_; no migration from same-origin /play/. Viewer ID from launch parameters is only for local fallback and not trusted server authentication.
- Cloud via VKWebAppStorageGet/Set; read-before-write, local fallback, fail rather than silently truncate a >3800 character snapshot. Real reload/cross-device QA still required.
- Bridge pinned at @vkontakte/vk-bridge@2.14.2 and bundled in GitHub Action.
- Ads: VKWebAppShowNativeAds ad_format reward, reward only on {result:true}; existing platform facade provides dedup/cooldown and BerriesLifecycle pauses audio. Test completed/canceled on live VK to confirm delivery semantics.
- IAP: intentionally disabled: Yandex IDs coins_1000, lives_5, boosters_3 are game-side meanings, not verified VK SKUs. Requires VK catalog, signed payment provider/backend, durable idempotence and reconciliation before enabling.
- Standalone /vk/ can be used as a local-only playable preview, not as VK SDK acceptance test.
- OK: shared VK Bridge is useful but requires actual OK publication toggle, account linking and platform tests; see https://apiok.ru/apps/vk .
- ZIP: GitHub Actions 'Build VK Mini Apps' artifact berries-vk-20261017. Extract archive contents directly to /vk/, not an inner folder.
- Manual acceptance: live VK iOS/Android/desktop, rotation, WebView/iframe, landscape, shop views, life+daily, cloud save/reload, ad completed/canceled, music pause/restore, payment truly unavailable, app IDs and cabinet settings, response headers & HTTPS. Test OK separately.
- No SprintHost deployment or VK console publication is performed by GitHub workflow.
STATUS: engineering candidate, not published or approved by moderation.

## 17.10.2026 — critical SDK ordering correction
- Original VK ZIP unsafe: BerriesPlatformConfig was inserted AFTER platform.js; platform ID defaulted to local, without local adapter. Never deploy first ZIP.
- Fixed VK config BEFORE platform facade, and added archive regression test.
- Rewarded ad now checks VKWebAppCheckNativeAds before VKWebAppShowNativeAds, grants only on explicit result=true.
- Official games overview https://dev.vk.ru/ru/games/overview inaccessible via automated browser; cross-check official VK Bridge library and available monetization docs, but games cabinet still unverified.
- Payments remain disabled until real platform catalog + signed notifications and idempotent server ledger are configured.

## 18.10.2026 — desktop VK display enhancement
- The VK host embeds desktop game as an iframe; canvas FIT alone cannot make it fullscreen.
- Added desktop-only overlay button ⛶, button action uses standard requestFullscreen on game-shell (user gesture), if refused it requests VKWebAppResizeWindow from VK Bridge and shows a limitation notice. Never promises forced fullscreen.
- Only included in platform/vk-ok ZIP. No changes to base, /play, or the game scenes. Phaser resize handled by existing ResizeObserver.
- Real browser test required: fullscreen iframe Permissions-Policy depends on VK host; VKWebAppResizeWindow may be capped or ignored. Button may not obtain a true fullscreen experience.
- Payments: VKWebAppShowOrderBox requires HTTPS server callback handlers get_item and order_status_change; store purchases remain disabled until verified paid event and idempotent grant. Developer linked stats/payments is a payment STATISTICS doc, not an activation control. See official https://github.com/VKCOM/vk-direct-games-example .
