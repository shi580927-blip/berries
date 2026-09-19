# PROJECT_STATE — «Безумные ягодки: Лесное королевство»
Дата: 2026-09-15. Текущий этап: обычная кампания 1–30; требуется игровой баланс-тест.

## Сборка MVP 2026-09-16

Готовится первый черновик Яндекс Игр: см. docs/RELEASE_2026-09-16.md. Платная лавка скрыта и находится в разработке. Общая пауза, загрузка облачной копии, реальные данные попапов, отключение отладки и локальный Phaser включены. Поддержан только RU с чтением языка SDK. Автотесты пройдены; проверка реальной рекламы, двух устройств и мобильных браузеров ещё не выполнена.

## Текущее поведение
- src/campaign.js содержит 30 конфигураций, сохранения кампании, монеты, общий запас бустеров и жизни.
- После победы следующий уровень строго n+1, после 30 — карта. Открытие только по непрерывной цепочке пройденных уровней.
- Новая кампания использует berries_campaign_v1. Старое berries_vs_04 не удаляется; монеты переносятся, тестовые отметки прохождения не переносятся. Старт с уровня 1 и 2/2/2 бустерами один раз.
- Покупки за монеты: молоток 250, перемешивание 300, вентилятор 400. Запас сохраняется после применения и покупки, не обновляется при входе в уровень.
- Жизни: максимум 5, одна восстанавливается за 30 минут, включая отсутствие в игре. Поражение списывает одну; успешное рекламное +5 ходов возвращает её. Выход из незавершённой попытки и перезагрузка не списывают жизнь; списание только при поражении, один раз. Старые сохранения однократно пополняются до 5 жизней (lifePolicy:2), прогресс/монеты/бустеры сохраняются. При нуле старт заблокирован, на карте доступна rewarded +1 жизнь.
- Оба слоя льда звучат одинаково и дают осколки. В цели считается полностью освобождённая клетка, не каждый слой. Лёд на желудях снимается соседними матчами и прямыми попаданиями.
- Новые картинки уровней используются из assets/map; загрузка изображений имеет обновлённую версию URL.
- Внешний вид win/lose попапов оставлен. Действия «Далее»/replay/+5 исправлены под обычную кампанию.
- Магазин за монеты доступен с карты и из уровня. Арт магазина с ценами в рублях сохранён, платёжный SDK не подключён.

## Проверка и ограничения
Автоматические проверки: 30 конфигураций и цели; последовательное открытие; сохранение бустеров; покупки и недостаток средств; жизнь списывается один раз, возвращается за rewarded, восстанавливается по времени; оба слоя льда и замороженный жёлудь.
Полный проход и баланс всех 30 уровней в браузерах ещё не выполнен. Поздняя геометрия реализована текущими разрушаемыми корнями, отдельная постоянная маска не добавлена.
Активные runtime: src/campaign.js, src/vertical_slice.js, src/runtime_stable_v10.js, src/sdk/yandex.js. Старые runtime_fixes не подключаются.

## Следующая встреча — напомнить
**Обсудить попапы с пользователем:** победа/поражение/магазин, надписи, области кнопок, цены и предложение рекламы. Визуальный редизайн пока отложен по просьбе пользователя.

## Ранее зафиксированное состояние (историческое, может отличаться от текущего)
# PROJECT_STATE — «Безумные ягодки: Лесное королевство»

**Версия:** 1.0  
**Дата:** 2026-09-14  
**Статус:** stable vertical slice v1.0 собран; начат системный browser QA  
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
- `src/sdk/yandex.js`;
- `src/runtime_stable_v10.js` — единый стабилизирующий runtime; старые `runtime_fixes_v04–v09` больше не загружаются.

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

1. browser QA stable vertical slice v1.0 на уровнях 1 / 6 / 11 / 16 / 21 / 30;
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


### 2026-09-14 — v1.0 stable runtime
- цепочка runtime_fixes_v04–v09 исключена из index.html;
- активен один src/runtime_stable_v10.js;
- gravity/refill ждёт завершения всех обязательных tween-анимаций;
- удалён ранний выход Promise.race и принудительная разблокировка busy посреди каскада;
- после refill/resolve проверяется целостность board/spr;
- при исключении выполняется безопасный restart уровня, а не продолжение повреждённого состояния;
- direct activation line/bomb стабилизирована;
- добавлена координатная QA-сетка: ?debugGrid=1, переключение клавишей G.



## 2026-09-18 — release size / audio cleanup policy

- Current production build path is canonical: `scripts/build_release.py` + `.github/workflows/build-yandex.yml`.
- Old versioned build workflows v3/v4/v5 are removed so future archives cannot accidentally copy the whole source tree.
- Production archive uses an explicit allowlist. `archive_unused/` is never shipped.
- Unused/legacy files were moved out of active `assets/` and `audio/` into `archive_unused/`; future assets (Queen) are kept under `archive_unused/future/`.
- Release images are resized conservatively at build time and PNG/JPG are recompressed without changing gameplay.
- Menu/map music is built as a short circular loop at 96 kbps; calm gameplay music is also shortened to a loop at 96 kbps. The full source files remain in the repository for future editing.
- `music_gameplay_magic_escape_room.mp3` remains the late-game track and is re-encoded at 96 kbps with metadata/artwork stripped.
- `music_event_adventureland.mp3` and alternate `berry_pop.mp3` are not shipped.
- Berry pop SFX keeps the current sample, but playback is softer (volume 0.18) and is now called once per destroyed berry, instead of one loud three-pop phrase for an entire match/cascade.
- Release-size guardrail: production ZIP must stay below 20 MB unless the build policy is intentionally revised.
- First optimized archive: `berries_yandex_v6.zip`, 11,071,081 bytes, SHA256 `35d941d9f3e6879ee0f0f8827a3fafd7c0c51340c05f4a284f351dd80aafb9d5`.


---

## 2026-09-19 — FINAL RELEASE v7 / МОДЕРАЦИЯ

Текущая версия для отправки на модерацию Яндекс Игр заморожена как:

`berries_yandex_v7_final.zip`

Контроль:
- дата фиксации: 2026-09-19;
- размер ZIP: 11,445,865 bytes;
- файлов в архиве: 72;
- SHA-256: `074cfa6d4f70613ab32ccf0d562c9a0567ae565b3bc3ef7e71108ab15d666859`;
- один `index.html` лежит в корне;
- dev/test pages и инструменты сборки в release не входят;
- production archive собран canonical builder через GitHub Actions;
- последняя проверенная сборка перед фиксацией прошла успешно.

### Аудио v7
Уровни 1–20:
- финальный пользовательский loop;
- длительность production-файла: ~23.30 s;
- MP3 CBR 128 kbps;
- 44.1 kHz stereo;
- без дополнительной обрезки и без повторного crossfade в builder.

Уровни 21–30:
- текущая magic-тема остаётся без изменения.

Активные SFX:
- special create → Clear Bell Chime / Universfield;
- rainbow → Magic Spell 02 / Universfield;
- horizontal special → Magical Sparkle Whoosh / DJARTMUSIC;
- vertical special → Sparkle / KoiRoylers;
- combo cascade → прежний `combo.mp3`;
- конец каскадного combo → Glitter Chime / humordome;
- acorn → средний сухой crunch-фрагмент из Superfast Crunch / saboteurcomics;
- bomb → текущий procedural SFX;
- berry pop и ice break → текущие production samples.
Старые voice-derived `special_*_hybrid.mp3` отключены и не входят в release.

### Статус
**v7 заморожен до ответа модерации.**
До результата модерации не менять runtime, баланс, аудио, интерфейс или release builder без отдельного решения. Все последующие правки вести уже как следующую версию после ответа модерации.
