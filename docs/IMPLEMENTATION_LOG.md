# IMPLEMENTATION LOG — «Безумные ягодки: Лесное королевство»

## 2026-09-14 — Vertical Slice v0.3 / first browser QA fixes

После первого ручного прогона в VS Code/Live Server пользователь отметил:
- часть UI была деформирована;
- лёд выглядел слишком прозрачным;
- ягода подо льдом могла свободно swap-аться;
- при матче лёд исчезал вместе с ягодой;
- обычные SFX были слишком тихими;
- не было hint-подсказки после паузы;
- использовались не production popup win/lose;
- спецэффекты почти не читались;
- refill/падение ягод было недостаточно заметным;
- клубника визуально сближалась с малиной;
- Король выглядел мило, но был слишком статичным.

### Исправлено в runtime
- декоративные панели/кнопки/level markers теперь масштабируются с сохранением пропорций через `fit()`, без принудительного растяжения по двум осям;
- игровое поле поднято выше: `BY=150`;
- клубника программно наклонена примерно на `-13°`, чтобы сильнее отличаться от малины;
- лёд временно усилен до полной непрозрачности + тонкая голубая обводка до замены пользователем финального ice-art;
- замороженную ягоду нельзя выбрать или swap-нуть, пока на клетке есть лёд;
- match по замороженной ягоде теперь сначала снимает один слой льда, а сама ягода остаётся в клетке;
- Hammer по льду также снимает только один слой;
- SFX master level и громкости основных pop/swap/crack/sparkle повышены;
- WebAudio context принудительно resume-ится после пользовательского взаимодействия;
- добавлен idle hint примерно через 5.2 сек: две ягоды валидного хода подсвечиваются/пульсируют;
- hint сбрасывается после любого взаимодействия и не предлагает ход через лёд;
- win/lose теперь используют реальные `popup_level_win.png` / `popup_level_lose.png`;
- добавлены видимые code-FX: частицы на match, кольцо при создании special, line beam, bomb ring/burst, rainbow wave;
- падение/refill замедлено и визуально идёт сверху вниз с bounce и небольшим вращением;
- swap замедлен до ~210 ms;
- Король получил постоянное idle breathing/sway и реакции `point/celebrate` на specials/cascades;
- при сильных каскадах Король кратко празднует и возвращается в idle.

### Открыто после этого прохода
- пользователь перерисует лёд и заменит ice-assets после проверки остального;
- production popup hit-zones надо ещё проверить на фактическом PNG в браузере;
- реальные лицензированные SFX/mp3 ещё не загружены, procedural ASMR остаётся временным;
- нужно повторно проверить desktop при разных масштабах браузера и mobile landscape.

---

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
- booster panel и тестовый инвентарь `2/2/2` на вертикальный срез;
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
