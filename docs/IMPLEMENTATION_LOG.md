# IMPLEMENTATION LOG — «Безумные ягодки: Лесное королевство»

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
- `LoadingAPI.ready()` после загрузки ресурсов;
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
