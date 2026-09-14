# AUDIO_ANIMATION_SPEC — «Безумные ягодки: Лесное королевство»

Дата: 2026-09-14
Статус: утверждённое направление для MVP.

## 1. Музыка MVP

Для первого рабочего варианта используем несколько музыкальных состояний, а не один трек на всю игру:
- `music_menu` — главное меню / спокойная карта;
- `music_gameplay_calm` — обычные уровни;
- `music_gameplay_magic` — более магические / сложные / поздние уровни;
- `music_event` — короткий музыкальный акцент для победы, открытия главы или особого уровня при необходимости.

### Текущая рабочая раскладка
- `music_menu` → **Morning — Kevin MacLeod**.
- `music_gameplay_calm` → **Devonshire Waltz Moderato — Kevin MacLeod** как первый тест. Если темп покажется слишком быстрым/медленным, сравнить с Allegretto и Andante.
- `music_gameplay_magic` → **Magic Escape Room — Kevin MacLeod**, но не весь 14-минутный трек: выбрать спокойный подходящий фрагмент и сделать аккуратный loop/edit.
- `music_event` / более активный уровень → **Adventures in Adventureland** или `Wonders of the Earth` после теста внутри игры.

Требования:
- без вокала;
- не слишком плотная аранжировка, чтобы не спорила с SFX;
- бесшовный или легко монтируемый loop;
- настроение: whimsical / fantasy / magical forest / playful / light adventure;
- музыку приглушать во время важных victory/lose stings;
- отдельные sliders/toggles Music и SFX в Settings;
- переключение между музыкальными состояниями делать плавным fade/crossfade, без резких обрывов.

Точные источники, лицензии, ISRC и обязательные кредиты хранятся в `docs/LICENSES_AUDIO.md`.

## 2. SFX MVP

Обязательный набор:
- `ui_click` — обычная кнопка;
- `ui_magic_click` — premium / special / важное действие;
- `swap` — успешный swap;
- `invalid_swap` — короткий мягкий отказ;
- `match_pop_01`, `match_pop_02`, `match_pop_03` — вариативность обычных матчей;
- `cascade_chime` — акцент для длинной цепочки;
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
- `goal_complete`;
- `level_win`;
- `level_lose`;
- `life_gain`;
- `popup_open` / `popup_close` при необходимости.

Точный внешний источник каждого файла хранится в `docs/LICENSES_AUDIO.md`.

## 3. ASMR / juicy sound design

Это важная часть game-feel. Мы не делаем игру громкой; мы делаем её приятно «трогаемой» на слух.

### Обычный match
- короткий мягкий pop;
- 3 варианта, чередуются случайно;
- random pitch примерно ±3–5%;
- лёгкий random volume ±3%;
- без резкого верха и длинного хвоста.

### Каскады
- cascade 1: только pop;
- cascade 2: pop чуть выше по pitch;
- cascade 3: pop + очень тихий sparkle/chime;
- cascade 4+: усиление не громкостью, а дополнительным микро-слоем и pitch progression;
- voice limit, чтобы 15 ягод не дали 15 одинаковых громких ударов.

### Лёд
- hit: короткий brittle crack;
- break: crack + shatter layer;
- звук должен ощущаться как тонкий холодный хруст, а не разбитое окно.

### Корни
- сухой маленький wood crack;
- можно добавить очень тихий leaf rustle процедурно/отдельным слоем позже;
- не использовать тяжёлое дерево/удар топора.

### Жёлудь
- маленький woody/plop + короткий sparkle;
- ощущение «освободили и поймали», а не монета казино.

### Specials
- line: короткий airy sweep + tiny impact на концах;
- bomb: мягкий low pop/poof + короткий shake, без реалистичного взрыва;
- rainbow: magical whoosh + sparkle, максимум около 0.7–1.2 сек полезной части после trimming.

### UI
- обычные кнопки — лёгкий click/pop;
- важные premium/magic кнопки — click + tiny sparkle;
- invalid action — короткий приглушённый pop, без buzzer.

### Награды
- coin: короткий bright tick/chime;
- goal complete: отдельный чистый chime;
- win: позитивный короткий sting;
- lose: мягкая descending фраза, без наказующего звука.

## 4. Mix / уровни громкости

Стартовые ориентиры, уточняются на устройстве:
- music bus: примерно 35–45% perceived level;
- match/swap bus: 50–60%;
- ASMR sparkle layer: 30–45%;
- specials: 65–75%, очень коротко;
- win sting: до 75–80%, затем сразу возврат;
- UI: 40–50%;
- blocker cracks: 50–65%;
- никакого клиппинга при каскаде.

Технически предусмотреть:
- `musicVolume`;
- `sfxVolume`;
- mute music;
- mute sfx;
- global SFX voice limit;
- per-sound cooldown;
- slight pitch randomization;
- ducking музыки на 2–4 dB во время win/special stings;
- crossfade при смене `menu/calm/magic` музыки.

## 5. Анимация поля

Основной принцип: анимация программная (Phaser tweens/particles), без тяжёлых sprite sheets, если это не требуется.

### Ягоды
- selected: scale 1.00 → 1.06 → 1.00 + лёгкое свечение;
- swap: 120–180 ms;
- invalid swap: туда-обратно, суммарно ~220–300 ms;
- fall: easing + мягкий squash при посадке;
- match: короткий pop/squash + fade/scale out;
- spawn/refill: лёгкий bounce;
- в момент match scale и SFX синхронизируются, чтобы pop ощущался физически.

### Cascades
- задержки минимальные, игра не должна казаться медленной;
- каждый следующий cascade слегка усиливает particles/SFX;
- при больших цепочках можно показывать короткие текстовые акценты кодом;
- камера не трясётся на обычных match; shake только на bomb/очень сильной цепочке.

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

## 6. Анимация UI

- кнопка hover desktop: scale ~1.03;
- press: scale ~0.94–0.97 с возвратом;
- popup: scale/fade in 180–260 ms;
- counters: короткий bump при изменении;
- rewarded CTA не должен агрессивно мигать;
- panel transitions мягкие и быстрые;
- звук на press лучше запускать в момент нажатия, а не после окончания tween.

## 7. Маскоты

Используем 4 PNG-состояния на персонажа, а жизнь создаём tween-анимациями:
- idle: очень лёгкое дыхание/покачивание;
- point: небольшой вход сбоку + gesture bounce;
- celebrate: bounce + sparkle;
- king_sad / queen_puzzled: мягкое опускание/покачивание, без длинной драматической анимации.

Персонаж не должен отвлекать от активной доски.

## 8. Производительность

- particles ограничивать по количеству;
- не держать тяжёлые emitter’ы активными вне эффекта;
- повторяющиеся FX создавать программно;
- отключать/упрощать декоративные FX на слабых mobile при необходимости;
- при рекламе / потере focus ставить gameplay и audio на паузу;
- короткие SFX предварительно декодировать/держать готовыми, чтобы не было задержки между match и звуком.

## 9. Audio implementation order

Для vertical slice подключаем в таком порядке:
1. `ui_click`, `invalid_swap`;
2. `swap`;
3. `match_pop_01..03`;
4. `ice_crack`, `ice_break`;
5. `roots_break`, `acorn_collect`;
6. `special_line`, `special_bomb`, `special_rainbow`;
7. `coin_reward`, `goal_complete`, `level_win`, `level_lose`;
8. boosters;
9. `Morning` + `Devonshire Waltz` как первые music integration tests;
10. `Magic Escape Room` и event-track после базового mix.

На первом рабочем проходе допустимо временно собирать `acorn_collect`, cascade и rainbow из уже лицензированных слоёв; перед релизом каждому композиционному звуку дать отдельный итоговый filename.

## 10. Что отложено

До vertical slice не нужны:
- покадровая анимация маскотов;
- сложные intro/outro ролики;
- озвученные реплики;
- большой набор ambient loops;
- сезонные музыкальные пакеты.

## 11. Audio acceptance test

Перед фиксацией каждого звука проверить:
- приятно ли слушается 20–30 раз подряд;
- нет ли раздражающего верхнего пика в наушниках;
- слышно ли на мобильном динамике;
- не маскирует ли музыку;
- не становится ли громче каскад из-за наложения голосов;
- совпадает ли начало transient с анимацией;
- сохраняется ли приятный ASMR feel на 50% и 100% громкости устройства.
