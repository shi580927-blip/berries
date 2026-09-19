## 2026-09-16 — First Yandex draft package

See RELEASE_2026-09-16.md for implemented release changes, cloud snapshot conflict policy, test evidence and remaining live validation. Paid shop deferred and hidden. No match/gravity rules changed. Browser localhost blocked by client; no live browser pass claimed.

## 2026-09-15 — Readable hints, bomb mist, separate life countdown

- Replaced pale rings with warm amber/gold rays behind each suggested berry. Rays remain inside the cell, pulse and rotate on their own objects until the next action.
- Hint candidates require a live sprite and a non-frozen, non-blocked cell on both ends. Swaps are restored in finally. Normal hints require a match involving a swapped endpoint; direct special swaps supported.
- Bomb adds eight translucent coloured cloud shapes, drifting and fading for about one second through the existing bounded FX lifecycle.
- Level life counter shows only the number again. A bottom-centre wooden plaque shows time to +1 life only below the cap of five.
- Map footer unchanged, redesign deferred for discussion. Score remains per-level; coin balance persists.
- Checks: syntax, legal hints, board restoration, ice HP 1/2 exclusion, destroyed sprite exclusion, special hints. No browser visual validation performed.
- Gravity was inspected: column segments split at ice/blockers. No gravity logic was changed; the earlier report of sprites passing through ice has not been reproduced here.

## 2026-09-15 — Normal 30-level campaign, coins, boosters and lives

Replaced six test configurations/fallbacks with all 30 introductory/mixed levels from GAME_DESIGN. Level 6's unspecified berry target uses blackberry. Late masks use current destructible roots; balance and full-device playthrough remain outstanding.
Added src/campaign.js as a data/economy module, not another runtime patch. New campaign save keeps old test save intact and carries over coins, starts sequential completion from 1 and grants 2/2/2 boosters only once. Legacy map editor positions remain intact.
Next advances n+1, locking uses consecutive wins, inventory consumption/purchases persist. Coin shop uses documented 250/300/400 prices. Paid shop art retained, no real-money transactions.
Lives now persist, debit once per loss or abandonment, refund after rewarded continue, regenerate every 30 minutes, block starts at zero; zero-life rewarded action is available on map. Stale rewarded callbacks cannot modify a later attempt.
Ice sample/shards on both layers, goals count fully cleared cells; direct and adjacent damage supports frozen acorns without double-hitting a layer in one clear pass.
Updated image URLs to load user-replaced art.
Validation: tests/campaign.cjs covers configurations, persistence, progression, rewards, coins, life debit/refund/regeneration/gate, both ice layers and frozen acorns. Syntax checked. No complete browser playthrough performed.
Follow-up requested by user: discuss popup design later; recorded prominently in PROJECT_STATE.

## 2026-09-15 — Special label lifecycle and softer berry sound

- Root defect: Phaser reuses the Play instance after shutdown, but specialInfoText referred to a destroyed Text. A later special creation called setText on that object after clearCells and before fallRefill, interrupting resolve with holes remaining.
- Recreate the label when it has no scene; clear its reference on create/shutdown. No timer unlock, restart, or rule change.
- Added tests/special-label-lifecycle.cjs: isolated actual resolve/showSpecialInfo methods with scene/render stubs. Before fix: Text context destroyed, zero refills, three holes. After fix: four refills, no holes. This is not a full browser reproduction.
- Browser verification limitation: local QA URL was blocked by the browser client in the previous session.
- Berry sample gain reduced from 0.50 to 0.35 (-30%); derivative MP3 uses 4500 Hz low-pass for a slightly duller tone. New asset path avoids reuse of the cached original. Original MP3 retained.
- JavaScript syntax and derivative MP3 decoding checked.

## 2026-09-14 — Musical accents and stronger cosmetic FX

- Added two MP3 excerpts from uploaded Adventures in Adventureland (Kevin MacLeod): combo 0.4568–2.2346 s; victory 7.5679–11.1235 s. Boundaries based on 135 BPM file metadata after intro silence; fade-in/out applied, encoded 128 kbps. Musical fit still needs listening in the actual game.
- Strong cascade (chain >= 3) and rainbow request combo accent; 6.5-second cooldown and one voice prevent stacking. Victory takes priority. Background music ducks to 26% of its normal volume and restores on completion; music mute, visibility, ads and scene shutdown handle accents.
- Replaced thin line effects with layered beams aligned to board centre; bomb shockwave, rainbow sparks, special-creation starburst, bigger combo titles and victory confetti.
- Cosmetic effects target only their own objects, with 160-object cap and repeated-special debounce. No new runtime patch file, no game-rule, gravity, move-lock or popup-hitbox change.
- Checks: JS syntax; isolated music lifecycle/priority/ducking tests; effect budget, debounce and cleanup tests; both MP3s decode successfully.
- Limitation: no visual browser run or listening test of the final mix in this session.

## 2026-09-14 — Music files and animation ownership fix

- Uploaded MP3s connected through lazy scene loading: Morning for Title/Map, Devonshire Waltz Moderato for levels below 21, Magic Escape Room for levels 21+. Adventures in Adventureland is registered as music_event for future events; no event trigger added.
- Music preference persists; scene shutdown destroys owned music. Visibility and rewarded pause control music. Settings includes attribution.
- Hint cleanup now only destroys hint-owned objects, never berry tweens awaited by swap/clear/refill. Hint timers are cancelled on scene shutdown; hints cannot start while busy.
- Rainbow swaps now update sprite ownership before clearing cells, matching board data.
- No new runtime patch layer, watchdog unlock, or automatic restart added. Layout and game rules unchanged.
- Validation: JavaScript syntax and isolated mocked regression checks passed for hint ownership, rainbow swap completion, music selection, mute, duplicate prevention and shutdown.
- Limitation: the reported high-level freeze has not been reproduced in a real browser in this session. These fixes remove concrete defects, but do not establish that every freeze is resolved.
- Audio decoding, browser autoplay/unlock and long device play sessions still need browser validation.

## 2026-09-14 — Map and juice pass v1.2

- системный заголовок карты заменён на production `logo_main.png`;
- карта показывает 30 точек уровней вдоль извилистой траектории тропы;
- каждый пятый уровень визуально крупнее;
- сохранены состояния completed/current/locked и пульсация текущего уровня;
- бустеры выровнены по трём вертикальным слотам, счётчики собраны в одну колонку;
- исправлено накопительное увеличение иконки при повторном hover;
- обычный match получил процедурный juicy berry-pop: мягкий пузырьковый тон + короткий приглушённый влажный слой;
- на каскадах 3+ добавляется тихий приятный верхний акцент без casino-sound.

## 2026-09-14 — Visual polish pass v1.1

- HUD полностью пересобран из production-панелей без генерации новых изображений;
- подключены board frame, lives, coins, progress и championship assets;
- выстроена ясная иерархия: уровень и прогресс сверху, цели слева, бустеры и Король справа;
- добавлены hover/press реакции бустеров и bump выполненных целей;
- усилены программные match, cascade, line, bomb и rainbow FX;
- добавлены лёгкие ambient fireflies вне игрового поля;
- зафиксированы четыре точных имени музыкальных файлов для последующего подключения.

## 2026-09-14 — Stable Runtime v1.0.1

Исправлен финал последнего хода, особенно заметный на уровне 30 при активации line/bomb:
- `endCheck()` больше не вызывается при `busy=true`;
- сначала завершается ход и снимается блокировка, затем открывается win/lose popup;
- удалён автоматический `scene.restart()` из обработчиков внутренних ошибок;
- ошибка больше не может незаметно начать уровень заново;
- единственный оставшийся restart — явная кнопка «Заново» в lose popup.

## 2026-09-14 — Stable Runtime v1.0

### Причина зависаний
- в v07 `fallRefill()` использовал `Promise.race` с таймером 1800 мс;
- cascade мог продолжиться до окончания tween-анимаций gravity;
- прежний watchdog снимал `busy` во время изменения поля;
- v09 убрал watchdog из `resolve()`, но унаследовал ранний выход из refill.

### Исправлено
- добавлен единый `src/runtime_stable_v10.js`;
- старые `runtime_fixes_v04–v09` больше не подключаются в `index.html`;
- refill завершается только после всех обязательных анимаций;
- сохранены нижние ягоды и их sprite-объекты; новые создаются только в пустых верхних позициях каждого сегмента;
- лёд, корни и жёлуди разделяют колонку на независимые сегменты;
- добавлены проверки соответствия `board` и `spr` после refill/resolve;
- при исключении уровень безопасно перезапускается без искусственного снятия `busy`;
- стабилизирован swap для line/bomb specials;
- сохранены production HUD и hit-area попапов;
- добавлен debug-overlay 1920×1080: `?debugGrid=1` или клавиша `G`.

### Следующий ручной QA
1. 20–30 обычных ходов и длинные каскады на уровне 1/6.
2. Создание и активация line H, line V, bomb, rainbow.
3. Refill вокруг одно- и двухслойного льда на уровне 11/30.
4. Hammer/Fan/Shuffle во время спокойного поля.
5. Win/lose, rewarded +5 и ×2 с `?mockAds=1`.
6. Desktop Chrome/Firefox и mobile landscape.

# IMPLEMENTATION LOG — «Безумные ягодки: Лесное королевство»

## 2026-09-14 — Vertical Slice v0.8

QA-проход по спецягодам, льду, подсказкам и зрелищности после длинного ручного теста.

### Исправлено / изменено
- тусклая ягода после подсказки больше не должна оставаться с пониженной alpha: при завершении hint все berry-sprite принудительно возвращаются к полной непрозрачности;
- двухслойный лёд снова получил явный дополнительный визуальный признак: светлое внутреннее ледяное кольцо с мягким pulse;
- generic line/bomb special больше не требует угадывать скрытый «цвет» special-ассета: line и bomb теперь активируются при обмене с любой соседней ягодой;
- при таком обмене line очищает ряд/колонку, bomb срабатывает 3×3 и ход списывается один раз;
- подсказка special переписана под новую механику и показывается ближе к игровому полю;
- добавлены более заметные combo-события `КОМБО! / СОЧНО! / ЕЩЁ! / ВАУ!` на каскадах;
- усилены burst-частицы при длинных цепочках;
- звук льда усилен: добавлен короткий шумовой crack + высокий snap/хруст поверх procedural SFX.

### Причина изменения special-механики
Текущие `special_line_h/v.png` и `special_bomb.png` являются общими декоративными ассетами и визуально не кодируют исходный цвет ягоды. Поэтому требование собирать такой special только с ягодами его внутреннего `id` воспринималось как случайное «не сработало». Для MVP special становится самостоятельным power-piece и активируется простым swap с соседней ягодой.

### Следующий приоритет по feel
После стабилизации этих багов перейти от «голой механики» к удержанию: реальная фоновая музыка из выбранных Kevin MacLeod треков, более насыщенные special FX, короткие микро-события/реакции Короля и более живой темп уровня.

## 2026-09-14 — Vertical Slice v0.7

QA-фикс после проверки уровней 6/30.

### Исправлено
- убраны круглые маркеры подсказки: теперь подсказка хода только мягко пульсирует двумя ягодами;
- refill переписан ещё раз: нижние ягоды не перерисовываются и не мигают, а сохраняют sprite и физически опускаются;
- лёд / корни / жёлуди остаются жёсткими якорями и не пересоздаются при каждом refill;
- новые ягоды появляются сверху каждого свободного сегмента, не проходят визуально через лёд/блокеры;
- добавлена страховка от зависания длинной цепочки tween/cascade;
- после refill дополнительно проверяются и закрываются случайно оставшиеся пустые клетки;
- бустеры сдвинуты немного выше;
- возвращены верхние UI-элементы из готовых ассетов: back, life, coin, settings;
- добавлена панель `panel_championat.png` в свободную нижнюю левую область;
- runtime-шрифты переключены на более округлый приоритет `Arial Rounded MT Bold`.

### Технически
Добавлен `src/runtime_fixes_v07.js`, загружается последним после v04/v05/v06.

## 2026-09-14 — Vertical Slice v0.6

QA-проход по компоновке интерфейса и production popup art после ручного теста на ПК.

### Исправлено
- бустеры больше не стоят горизонтально поверх декоративной панели;
- Hammer / Shuffle / Fan расставлены вертикально по трём штатным слотам панели;
- счётчики бустеров вынесены вправо от иконок;
- удалены кодовые дубли заголовков `ЦЕЛИ` и `БУСТЕРЫ`, потому что эти слова уже нарисованы в UI-ассетах;
- кодовые заголовки и счётчики переведены на более мягкую округлую системную гарнитуру `Trebuchet MS / Arial Rounded`;
- production win/lose popup больше не получает поверх себя дополнительные нарисованные кодом кнопки;
- используются только кнопки, уже нарисованные внутри popup-ассета, а код добавляет аккуратные hit-area поверх них;
- удаляется лишняя служебная подпись под popup;
- на win: зелёная кнопка ×2 запускает rewarded и остаётся на popup, синяя `ДАЛЕЕ` ведёт дальше;
- на lose: штатная кнопка +5 ходов запускает rewarded, нижние кнопки работают как переиграть / карта;
- красный X закрывает popup на карту;
- при выборе Hammer/Fan показывается короткая понятная инструкция.

### Технически
Добавлен `src/runtime_fixes_v06.js`, который ждёт появления Play scene и только после этого патчит HUD/popup. Это устраняет гонку и ситуацию, когда старый `resultPopup()` из основного runtime продолжал оставлять служебный текст.

## 2026-09-14 — Vertical Slice v0.5

QA-фикс по льду и объяснению special-ягод.

### Исправлено
- ягоды больше не пролетают визуально через сохранённый лёд/блокер при refill;
- frozen-cell остаётся жёстким якорем: ягода под льдом сохраняется в своей клетке;
- если под intact-льдом/блокером есть отдельный открытый сегмент колонки, новые ягоды появляются в верхней части этого локального сегмента, а не падают через лёд;
- surviving berries по-прежнему сохраняют sprite-объекты и физически опускаются вниз;
- добавлены понятные текстовые подсказки для specials.

### Как теперь объясняется special
- horizontal striped berry: собрать её в комбинацию → очистит весь ряд;
- vertical striped berry: собрать её в комбинацию → очистит всю колонку;
- bomb: собрать её в комбинацию → взрыв 3×3;
- rainbow: поменять с любой обычной ягодой → убрать все ягоды этого цвета.

Подсказка показывается при создании special и при выборе special-ягоды. При создании special получает дополнительный pulse-акцент.

### Технически
Добавлен `src/runtime_fixes_v05.js`, загружается после `runtime_fixes_v04.js`.

## 2026-09-14 — Vertical Slice v0.4

QA-фикс после первого ручного прогона в VS Code / Live Server.

### Исправлено
- refill больше не перерисовывает всё поле заново;
- выжившие ягоды сохраняют свои sprite-объекты и физически опускаются вниз;
- новые ягоды появляются только сверху и досыпаются в освободившиеся места;
- лёд и blockers теперь являются якорями для gravity: ягоды не проходят сквозь них;
- после падения заново привязывается интерактивность к фактической новой клетке;
- popup win/lose больше не использует неочевидные невидимые hitbox-кнопки;
- добавлены явные кликабельные кнопки поверх production popup art;
- на победе: `▶ МОНЕТЫ ×2` и `ДАЛЕЕ`;
- `ДАЛЕЕ` ведёт к следующему контрольному уровню vertical slice, а после последнего — на карту;
- rewarded ×2 на победе не закрывает popup и не перебрасывает на карту;
- на поражении: `▶ +5 ХОДОВ`, `КАРТА`, `ЗАНОВО`;
- удалены служебные подсказочные надписи под popup.

### Технически
Изменения вынесены в `src/runtime_fixes_v04.js`, который патчит текущий Play runtime после `src/vertical_slice.js`. Это временный безопасный QA-слой; после стабилизации механик код будет слит обратно в основной runtime.

## 2026-09-14 — Vertical Slice v0.3

QA-правки по первому визуальному прогону:
- клубника наклонена примерно на 13° влево, чтобы визуально меньше сливаться с малиной;
- исправлено непропорциональное растяжение UI-ассетов через fit-scale;
- поле немного поднято;
- усилена громкость procedural SFX;
- добавлена подсказка возможного хода после паузы бездействия;
- лёд сделан логически фиксирующим ягоду: ягода подо льдом не участвует в swap;
- при совпадении по клетке со льдом сначала повреждается лёд, ягода остаётся;
- добавлены более заметные программные FX для line / bomb / rainbow / создания special;
- refill замедлен и получил более заметный falling/bounce feel;
- Король получил idle breathing/sway и реакции point/celebrate;
- подключены production popup art `popup_level_win.png` / `popup_level_lose.png`.

## 2026-09-14 — Vertical Slice v0.2

Начат второй проход рабочего прототипа.

### Добавлено в runtime
- Yandex Games SDK adapter: `src/sdk/yandex.js`;
- безопасный standalone fallback вне Яндекс Игр;
- `LoadingAPI.ready()` после загрузки;
- `GameplayAPI.start()` при старте уровня;
- `GameplayAPI.stop()` при завершении уровня, уходе в меню, скрытии вкладки и показе рекламы;
- rewarded-video adapter через `ysdk.adv.showRewardedVideo()`;
- тестовый режим rewarded вне Яндекс Игр: `?mockAds=1`;
- rewarded continue: +5 ходов, максимум один раз за попытку;
- cloud save hooks через Player API + localStorage fallback;
- Hammer runtime;
- Shuffle runtime;
- Fan runtime: очистка выбранного ряда;
- T/L пересечение создаёт bomb special;
- line / bomb / rainbow activation;
- программные FX для specials;
- procedural ASMR runtime расширен: swap, pop, crack, wood, sparkle, whoosh, bomb, reward, win/lose;
- voice cooldown для часто повторяемых SFX;
- booster panel и тестовый инвентарь `2/2/2` на vertical slice;
- mobile/desktop landscape остаётся 1920×1080 FIT.

### Музыка
Архитектура `MusicBus` добавлена. Финальные лицензированные mp3 ещё не помещены в репозиторий, поэтому runtime не пытается грузить отсутствующие файлы.

Фавориты для будущего подключения:
- `Morning` — menu/map;
- `Devonshire Waltz Moderato` — calm gameplay;
- `Magic Escape Room` — magic/hard gameplay;
- `Adventures in Adventureland` — active/event.

Источники и обязательные кредиты: `docs/LICENSES_AUDIO.md`.

### Яндекс Игры — официальные точки интеграции
- SDK connection: `https://yandex.com/dev/games/doc/en/sdk/sdk-about`
- Game Ready / Gameplay API: `https://yandex.com/dev/games/doc/en/sdk/sdk-game-events`
- Rewarded ads: `https://yandex.com/dev/games/doc/en/sdk/sdk-adv`

### Что проверить вручную следующим тестом
1. заставка → карта → уровень;
2. обычные swap/cascade;
3. создание line / rainbow / T-L bomb;
4. Hammer на ягоде, льду, жёлуде, roots;
5. Fan по ряду;
6. Shuffle;
7. проигрыш → `+5 ходов` с `?mockAds=1` вне Яндекса;
8. завершение контрольных уровней 1 / 6 / 11 / 16 / 21 / 30;
9. landscape на телефоне;
10. отсутствие клиппинга/звуковой каши при каскадах.

### Известные временные ограничения
- финальные внешние mp3/SFX ещё не загружены;
- экономический инвентарь бустеров пока тестовый, без магазина;
- Player API cloud save подключён как hook, но требует теста внутри среды Яндекс Игр;
- payments и premium pack ещё не интегрированы;
- полные 30 уровней ещё не перенесены в runtime JSON;
- production RU/EN popups ещё не разделены на фон + динамический текст;
- special+special combinations будут расширены после QA базового ядра.



## 2026-09-19 — Аудио-лицензии и назначения specials

Зафиксирован новый внешний SFX-пул Pixabay и его роли:
- Magic Spell 02 → rainbow;
- Clear Bell Chime → создание special;
- Fairy Sparkle → vertical special;
- Magical Sparkle Whoosh → horizontal special;
- magical whoosh → резерв для Королевы;
- Power Up Sparkle 1 → резерв для strong special+special;
- Magic Burst отклонён.

Лицензии и страницы источников проверены на дату 2026-09-19 и записаны в docs/LICENSES_AUDIO.md. Pixabay-контент допускает коммерческое использование и адаптацию без обязательной атрибуции при соблюдении запрета на Standalone-распространение исходника и остальных условий лицензии.

Новые файлы ещё не считаются production-подключёнными, пока пользователь не скачает/передаст финальные исходники и не будет выполнена фиксация фактических имён файлов и обработки.


## 2026-09-19 — Временные голосовые hybrid SFX отключены

После проверки последнего архива подтверждено, что в production build ещё попадали временные файлы special_create_hybrid.mp3, special_line_hybrid.mp3, special_rainbow_hybrid.mp3 и special_combo_hybrid.mp3, собранные из пользовательской голосовой записи.

Решение:
- эти четыре voice-derived hybrid SFX отключены из runtime;
- исключены из canonical release builder;
- обычный berry pop, текущая procedural bomb и старый combo.mp3 не изменены;
- до подключения новых утверждённых Pixabay SFX создание special, line и rainbow используют чистые procedural fallback-эффекты без пользовательского голоса.


## 2026-09-19 — Финальный фон уровней 1–20

Пользователь передал финально отредактированный мастер `Фон уровня 1-20.mp3`.
Параметры исходника:
- длительность: 23.301 s;
- 44.1 kHz;
- stereo;
- 320 kbps;
- SHA-256 master: b11ec762c6c9f23fb7ba4fb5182b4aa427b38ace290ca0a656fd5f3eacc2fbba.

Решение:
- заменить `audio/music/music_gameplay_calm_devonshire_moderato.mp3` этим master;
- уровни 1–20 используют этот трек целиком как loop;
- не делать дополнительную обрезку и не делать circular crossfade в release builder;
- не нормализовать громкость: текущий уровень хорошо балансируется с игровыми SFX;
- release encode: MP3, CBR 128 kbps, 44.1 kHz, stereo, metadata stripped, Xing header enabled;
- ориентировочный release size: 373 KB;
- локально проверенный release SHA-256: 60a262db4d3482299a1567b40961d191a948d2c47b217fde6a3c33377005be2a.

Master также сохранён на Google Drive:
`music_gameplay_levels_01_20_master_320k_2026-09-19.mp3`
Drive ID: `1vtXGT9gjl1shHncLPsk89xSo5EQQHbiN`.


## 2026-09-19 — v7 frozen for Yandex moderation

Final moderation package:
- file: `berries_yandex_v7_final.zip`
- size: 11,445,865 bytes
- entries: 72
- SHA-256: `074cfa6d4f70613ab32ccf0d562c9a0567ae565b3bc3ef7e71108ab15d666859`
- Drive copy ID: `1BGTP05MMKOZFK-qhT4QuPFweuRni5M_4`

Included state:
- final levels 1–20 authored loop, release encoded 128 kbps / 44.1 kHz / stereo;
- current levels 21–30 magic music;
- selected Pixabay special SFX;
- glitter combo finisher;
- middle Superfast Crunch accent for acorn;
- no voice-derived temporary hybrid special SFX;
- current combo visual celebration and repeating classic combo accent;
- current rewarded cooldown/lifecycle/audio pause logic.

Status: **frozen pending Yandex moderation**. Any new change after this point belongs to a post-v7 build unless explicitly approved as a v7 replacement.
