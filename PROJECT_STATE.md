# PROJECT_STATE — «Безумные ягодки: Лесное королевство»

**Версия:** 0.4  
**Дата:** 2026-09-14  
**Статус:** разработка идёт; vertical slice v0.2 собран  
**Репозиторий:** `shi580927-blip/berries`

Главный источник состояния проекта — этот файл. Подробности:
- `docs/GAME_DESIGN.md` — механика, экономика, уровни 1–30;
- `docs/ASSET_SPEC.md` — требования к ассетам;
- `docs/ASSET_AUDIT_2026-09-14.md` — фактический аудит ассетов;
- `docs/AUDIO_ANIMATION_SPEC.md` — звук, ASMR-feel, анимации;
- `docs/LICENSES_AUDIO.md` — источники и лицензии;
- `docs/IMPLEMENTATION_LOG.md` — история реализации.

---

## 1. ПРОДУКТ

- Название: **«Безумные ягодки»**.
- Подзаголовок: **«Лесное королевство»**.
- Жанр: 2D casual match-3.
- Первая платформа: Яндекс Игры.
- ПК + mobile landscape.
- Виртуальная сцена: 1920×1080, 16:9.
- Phaser 3 / HTML5 / JavaScript.
- Монетизация: добровольная rewarded-реклама + покупки, без forced ads на старте.

Core loop: карта → уровень → цели/бустеры → match-3 → победа/поражение → reward/rewarded → карта.

---

## 2. АССЕТЫ

Основной MVP asset-pack закрыт.

Готово:
- 6 базовых ягод;
- line H/V, bomb, rainbow;
- ice 1/2 + запасные варианты прозрачности;
- acorn, roots;
- hammer, shuffle, fan;
- buttons / UI icons / panels;
- title / game / map backgrounds;
- logo;
- win/lose/exit/shop popups;
- King: idle / celebrate / sad / point;
- Queen: idle / celebrate / puzzled / point.

FX specials делаются кодом, не запекаются в PNG.

---

## 3. MATCH-3 — ТЕКУЩИЙ RUNTIME

Работает:
- поле 8×8;
- swap соседних клеток;
- invalid swap возвращается без списания хода;
- match-3;
- каскады;
- refill;
- автоматический shuffle при отсутствии ходов;
- 4 в ряд → line special;
- 5 в ряд → rainbow;
- T/L пересечение → bomb;
- line activation;
- bomb 3×3;
- rainbow + обычная ягода;
- лёд как overlay;
- acorn;
- roots;
- score / moves / goals;
- win / lose.

Расширенные special+special combinations пока не приоритет.

---

## 4. БУСТЕРЫ — ПОДКЛЮЧЕНЫ

В vertical slice работают:
- Hammer — выбранная клетка / 1 слой препятствия;
- Shuffle — перемешивание подвижных ягод с гарантией валидного хода;
- Fan — очистка выбранного ряда.

На этапе QA используется тестовый инвентарь 2/2/2. Экономика магазина подключается позже.

---

## 5. УРОВНИ

Первый релиз: 30 уровней, data-driven.

Подробная кривая 1–30: `docs/GAME_DESIGN.md`.

Контрольные уровни runtime:
- 1 — base match-3;
- 6 — score/specials;
- 11 — ice;
- 16 — acorn;
- 21 — roots;
- 30 — mixed finale.

Стартовая экономика:
- 5 жизней;
- 30 минут тестовое восстановление;
- rewarded continue +5 moves, максимум 1 раз за попытку;
- rewarded win ×2 coins — ещё не подключено runtime;
- zero lives rewarded +1 life — ещё не подключено runtime;
- hammer 250;
- shuffle 300;
- fan 400.

---

## 6. YANDEX GAMES SDK — БАЗОВАЯ ИНТЕГРАЦИЯ ДОБАВЛЕНА

Файл: `src/sdk/yandex.js`.

Подключено:
- безопасный `YaGames.init()`;
- standalone fallback вне Яндекс Игр;
- `LoadingAPI.ready()` после загрузки;
- `GameplayAPI.start()` при старте уровня;
- `GameplayAPI.stop()` при завершении уровня, уходе в меню, потере focus и перед rewarded;
- `ysdk.adv.showRewardedVideo()`;
- rewarded callback выдаёт награду только через `onRewarded`;
- тестовый standalone режим рекламы: `?mockAds=1`;
- Player API cloud-save hooks + localStorage fallback.

Rewarded continue уже работает в логике: проигрыш → +5 ходов, один раз за попытку.

Официальные точки документации зафиксированы в `docs/IMPLEMENTATION_LOG.md`.

---

## 7. ЗВУК / ASMR

Направление: juicy + tactile + мягкий ASMR.

Runtime procedural слой сейчас включает:
- click;
- invalid;
- swap;
- match pop;
- cascade sparkle;
- ice crack;
- wood/root crack;
- whoosh;
- bomb low-pop;
- reward;
- win/lose.

Есть cooldown/voice limiting, чтобы каскады не превращались в звуковую кашу.

Финальные лицензированные SFX ещё не загружены как файлы; источники уже записаны в `docs/LICENSES_AUDIO.md`.

---

## 8. МУЗЫКА

Фавориты пользователя — Kevin MacLeod / Incompetech, CC BY 4.0:
- Morning — меню/карта;
- Devonshire Waltz Moderato — спокойный gameplay;
- Magic Escape Room — магические/сложные уровни;
- Adventures in Adventureland — активный gameplay/event.

`MusicBus` в runtime добавлен, но mp3 пока физически не лежат в репозитории, поэтому загрузка отсутствующих файлов не вызывается.

Перед production каждый музыкальный файл:
1. скачать с официальной страницы;
2. сохранить лицензию/атрибуцию;
3. записать дату скачивания;
4. положить в `audio/music`;
5. внести точное имя файла в `docs/LICENSES_AUDIO.md`.

---

## 9. АНИМАЦИЯ

Работает программно через Phaser tweens:
- selected berry pulse;
- swap;
- invalid return;
- match squash/fade;
- refill bounce;
- special FX;
- bomb camera shake;
- ice/root feedback;
- mascot idle/celebrate/sad;
- popup scale/fade.

Тяжёлые sprite sheets пока не нужны.

---

## 10. ФАЙЛЫ RUNTIME

Активные:
- `index.html`;
- `styles.css`;
- `src/vertical_slice.js`;
- `src/sdk/yandex.js`.

Ранний `src/main.js` не является активным runtime.

---

## 11. ЧТО ЕЩЁ НЕ ПОДКЛЮЧЕНО

- финальные mp3/SFX файлы;
- rewarded ×2 coins после победы;
- rewarded +1 life;
- lives timer runtime;
- shop/economy runtime;
- Payments API;
- premium pack;
- полные 30 runtime levels JSON;
- RU/EN runtime localization;
- production split popups background/text;
- полноценная mobile QA;
- расширенные special combinations;
- финальный HUD после теста.

---

## 12. БЛИЖАЙШИЙ ПОРЯДОК

1. browser QA vertical slice v0.2;
2. исправить runtime-баги;
3. подключить реальные аудиофайлы и финальный mix;
4. lives + coins + runtime economy;
5. rewarded ×2 coins / +1 life;
6. Player API cloud-save test внутри Яндекс Игр;
7. Payments/premium;
8. 30 уровней JSON;
9. localization;
10. production optimization.

---

## 13. ИСТОРИЯ

### 2026-09-14 — v0.4
- добавлены boosters runtime;
- добавлен T/L bomb;
- расширены specials;
- расширен procedural ASMR;
- добавлен Yandex SDK adapter;
- добавлены LoadingAPI / GameplayAPI hooks;
- добавлен rewarded continue +5;
- добавлены cloud save hooks;
- добавлен `docs/IMPLEMENTATION_LOG.md`.

### 2026-09-14 — v0.3
- создан первый playable vertical slice;
- Title / Map / test levels;
- базовая match-3 логика;
- blockers;
- анимации;
- procedural SFX.

### 2026-09-14 — v0.2
- закрыт основной asset-pack;
- утверждены game design, экономика, audio/animation.

### 2026-09-13 — v0.1
- создан мастер-файл и утверждён концепт.
