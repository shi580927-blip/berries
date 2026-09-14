# AUDIO_ANIMATION_SPEC — «Безумные ягодки: Лесное королевство»

Дата: 2026-09-14
Статус: утверждённое направление для MVP, без начала кодирования.

## 1. Музыка MVP

Минимальная схема:
- `music_menu` — главное меню / спокойная карта;
- `music_gameplay` — основной loop уровня;
- `music_event` — короткий музыкальный акцент для победы/открытия главы, если потребуется.

Требования:
- без вокала;
- не слишком плотная аранжировка, чтобы не спорила с SFX;
- бесшовный или легко монтируемый loop;
- настроение: whimsical / fantasy / magical forest / playful / light adventure;
- музыку приглушать во время важных victory/lose stings;
- отдельные sliders/toggles Music и SFX в Settings.

Текущие музыкальные кандидаты и лицензии хранятся в `docs/LICENSES_AUDIO.md`.

## 2. SFX MVP

Обязательный набор:
- `ui_click` — обычная кнопка;
- `ui_magic_click` — premium / special / важное действие;
- `swap` — успешный swap;
- `invalid_swap` — короткий мягкий отказ;
- `match_1`, `match_2`, `match_3` — небольшая вариативность обычных матчей;
- `cascade` — усиливающийся акцент для цепочки;
- `special_line` — линейная спец-ягода;
- `special_bomb` — area bomb;
- `special_rainbow` — rainbow activation;
- `ice_crack` — повреждение льда;
- `ice_break` — полное разрушение;
- `acorn_collect` — освобождение/сбор жёлудя;
- `roots_break` — разрушение корней;
- `booster_hammer`;
- `booster_shuffle`;
- `booster_fan`;
- `coin_reward`;
- `level_win`;
- `level_lose`;
- `life_gain`;
- `popup_open` / `popup_close` при необходимости.

### Уже отобранные кандидаты Pixabay
- Soft UI Click — UI;
- Magic Button Click — магическая UI-кнопка;
- Shattering Ice — лёд;
- Game Bonus 03 — монета/малый бонус;
- Success Videogame SFX — победа.

Перед финальной интеграцией каждый звук прослушать на фоне музыки и при необходимости подрезать/нормализовать локально.

## 3. Mix / уровни громкости

Стартовые ориентиры, уточняются на устройстве:
- music: 35–45% общего perceived level;
- обычные match/swap SFX: 55–65%;
- specials/win: 70–85%, но очень коротко;
- UI: 45–55%;
- никакого клиппинга при каскаде нескольких звуков.

Использовать лимит одновременных одинаковых SFX и лёгкий pitch randomization для match, чтобы звук не раздражал.

## 4. Анимация поля

Основной принцип: анимация программная (Phaser tweens/particles), без тяжёлых sprite sheets, если это не требуется.

### Ягоды
- selected: scale 1.00 → 1.06 → 1.00 + лёгкое свечение;
- swap: 120–180 ms;
- invalid swap: туда-обратно, суммарно ~220–300 ms;
- fall: easing + мягкий squash при посадке;
- match: короткий pop/squash + fade/scale out;
- spawn/refill: лёгкий bounce.

### Cascades
- задержки минимальные, игра не должна казаться медленной;
- каждый следующий cascade слегка усиливает particles/SFX;
- при больших цепочках можно показывать короткие текстовые акценты кодом.

### Specials
- line H/V: луч/след рисуется кодом; в PNG эффект не запекается;
- bomb: radial burst + лёгкий camera shake;
- rainbow: цветовое кольцо/волна + частицы;
- эффекты быстрые и читаемые, не закрывают поле надолго.

### Blockers
- ice hit: короткая трещина/flash/shake;
- ice break: shatter particles;
- roots hit/break: shake + маленькие древесные/листовые частицы;
- acorn collect: hop вверх + sparkle/fade.

## 5. Анимация UI

- кнопка hover desktop: scale ~1.03;
- press: scale ~0.94–0.97 с возвратом;
- popup: scale/fade in 180–260 ms;
- counters: короткий bump при изменении;
- rewarded CTA не должен агрессивно мигать;
- panel transitions мягкие и быстрые.

## 6. Маскоты

Используем 4 PNG-состояния на персонажа, а жизнь создаём tween-анимациями:
- idle: очень лёгкое дыхание/покачивание;
- point: небольшой вход сбоку + gesture bounce;
- celebrate: bounce + sparkle;
- king_sad / queen_puzzled: мягкое опускание/покачивание, без длинной драматической анимации.

Персонаж не должен отвлекать от активной доски.

## 7. Производительность

- particles ограничивать по количеству;
- не держать тяжёлые emitter’ы активными вне эффекта;
- повторяющиеся FX создавать программно;
- отключать/упрощать декоративные FX на слабых mobile при необходимости;
- при рекламе / потере focus ставить gameplay и audio на паузу.

## 8. Что отложено

До vertical slice не нужны:
- покадровая анимация маскотов;
- сложные intro/outro ролики;
- озвученные реплики;
- большой набор ambient loops;
- сезонные музыкальные пакеты.

## 9. Следующий audio-step

После выбора финальной пары музыкальных треков:
1. скачать только с официального источника;
2. сохранить доказательства лицензии;
3. переименовать локально латиницей;
4. положить в `audio/music`;
5. внести точные filenames и download date в `docs/LICENSES_AUDIO.md`.

То же правило применяется ко всем SFX.
