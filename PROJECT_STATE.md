# PROJECT_STATE — «Безумные ягодки: Лесное королевство»

**Версия:** 0.3  
**Дата:** 2026-09-14  
**Статус:** разработка начата; первый playable vertical slice создан  
**Репозиторий:** `shi580927-blip/berries`

Главный источник состояния проекта — этот файл. Подробности разнесены по специализированным документам:
- `docs/GAME_DESIGN.md` — механика, экономика, уровни 1–30;
- `docs/ASSET_SPEC.md` — требования к ассетам;
- `docs/ASSET_AUDIT_2026-09-14.md` — фактический аудит загруженных ассетов;
- `docs/AUDIO_ANIMATION_SPEC.md` — звук, ASMR-feel, анимации;
- `docs/LICENSES_AUDIO.md` — источники и лицензии музыки/SFX.

---

## 1. ПРОДУКТ

- Название: **«Безумные ягодки»**.
- Подзаголовок: **«Лесное королевство»**.
- Жанр: 2D casual match-3.
- Первая платформа: **Яндекс Игры**.
- ПК + mobile landscape.
- Виртуальная сцена: **1920×1080, 16:9**.
- Phaser 3 / HTML5 / JavaScript.
- Основной принцип монетизации: добровольная rewarded-реклама + покупки, без forced ads на старте.

Core loop: карта → уровень → цели/бустеры → match-3 → победа/поражение → награда/rewarded → карта.

---

## 2. ВИЗУАЛ И АССЕТЫ

Основной MVP asset-pack закрыт.

Готово:
- 6 базовых ягод;
- 4 special-элемента;
- лёд, жёлудь, корни;
- hammer / shuffle / fan;
- кнопки уровней;
- основные UI-иконки;
- панели уровня/целей/прогресса/монет/жизней/бустеров;
- фон заставки, игровые лесные фоны, фон карты;
- `logo_main.png` с подзаголовком;
- popups win/lose/exit/shop;
- Король: idle / celebrate / sad / point;
- Королева: idle / celebrate / puzzled / point.

Правила:
- FX специальных ягод не запекаются в PNG, а делаются кодом;
- тексты и номера reusable UI по возможности выводятся кодом;
- дополнительные деревянные панели пока не рисуем;
- персонажей расширяем только после проверки vertical slice.

---

## 3. MATCH-3

- Поле: **8×8**.
- 3 — обычное удаление.
- 4 — line special.
- 5 — rainbow special.
- T/L → bomb по дизайну MVP; полная реализация ещё впереди.
- Невалидный swap откатывается без списания хода.
- Каскады автоматические.
- При отсутствии ходов — shuffle без списания хода.
- Новые ягоды падают сверху.

Препятствия:
- `ice_1` — 1 HP;
- `ice_2` — 2 HP;
- лёд — overlay поверх содержимого клетки;
- acorn — объект цели;
- roots — блокируют клетку и снимаются соседним воздействием/special/hammer.

---

## 4. БУСТЕРЫ

- Hammer — точечное удаление / 1 слой препятствия.
- Shuffle — перемешивание подвижных ягод.
- Fan — выбранный ряд целиком.

В vertical slice бустеры ещё не подключены к UI/экономике.

---

## 5. УРОВНИ И БАЛАНС

Первый релиз: **30 уровней**, data-driven архитектура.

Подробная таблица 1–30 находится в `docs/GAME_DESIGN.md`.

Для vertical slice выбраны контрольные уровни:
- 1 — базовый match-3;
- 6 — score / specials;
- 11 — лёд;
- 16 — жёлуди;
- 21 — roots;
- 30 — смешанный финальный тест.

Стартовая экономика:
- жизни: максимум 5;
- восстановление: тестово 30 минут;
- rewarded continue: +5 ходов, максимум 1 раз за попытку;
- rewarded win: ×2 монеты;
- zero lives: rewarded +1 жизнь;
- hammer 250 coins;
- shuffle 300 coins;
- fan 400 coins.

Три звезды/короны пока не вводим; используем статусы locked/open/current/completed.

---

## 6. МОНЕТИЗАЦИЯ

Rewarded MVP:
- проигрыш → +5 ходов;
- победа → ×2 монеты;
- 0 жизней → +1 жизнь.

Premium:
- разовая покупка «Королевский набор»;
- первое мягкое предложение после уровня 3;
- Королева;
- выбор Король/Королева;
- premium theme «Королевская оранжерея»;
- немного монет и бустеров.

Цена/SKU позже.

---

## 7. МУЗЫКА, ЗВУК, ASMR

Лицензии и точные источники: `docs/LICENSES_AUDIO.md`.

Музыкальные фавориты пользователя — Kevin MacLeod / Incompetech, CC BY 4.0:
- `Morning` — меню / карта;
- `Devonshire Waltz Moderato` — первый кандидат на обычный gameplay;
- `Magic Escape Room` — магические/сложные уровни, loop из подходящего фрагмента;
- `Adventures in Adventureland` — активные уровни / событие.

Дополнительные кандидаты Pixabay сохранены в license-файле.

Sound direction:
- juicy + tactile + мягкий ASMR;
- pop / tiny chime / crack / swish;
- без громких buzzer и агрессивных взрывов;
- voice limit и cooldown на повторяющиеся SFX;
- pitch variation для match/cascade.

В первом runtime уже есть **временный procedural WebAudio SFX слой** для click/pop/crack/sparkle/win/lose. Он нужен для проверки feel до подключения финальных лицензированных файлов.

---

## 8. АНИМАЦИЯ

Основной принцип: Phaser tweens/particles, без тяжёлых sprite sheets.

- selected berry: лёгкое увеличение/подсветка;
- swap: ~145 ms;
- invalid swap: возврат;
- match: squash/pop/fade;
- refill: bounce;
- cascade: постепенное усиление звукового акцента;
- ice: crack/shatter;
- blockers: shake/fade;
- маскот: idle breathing / celebrate bounce / sad sway;
- popup transitions быстрые и мягкие.

---

## 9. PLAYABLE VERTICAL SLICE — 2026-09-14

Созданы:
- `index.html`;
- `styles.css`;
- `src/vertical_slice.js`.

Также существует ранний `src/main.js`, но **активным runtime является `src/vertical_slice.js`**, подключённый из `index.html`.

Уже работает в коде:
- Boot/Loading;
- Title screen;
- тестовая Map;
- уровни 1 / 6 / 11 / 16 / 21 / 30;
- 8×8 board;
- swap / invalid swap;
- match-3;
- cascades;
- refill;
- простое создание 4/5 special;
- лёд;
- acorn;
- roots;
- цели / moves / score;
- win / lose;
- localStorage для тестового прогресса;
- landscape rotate hint;
- базовые tween-анимации;
- временные procedural ASMR-SFX.

---

## 10. НЕ ПОДКЛЮЧЕНО ПОКА

- Yandex Games SDK;
- `LoadingAPI.ready()` / Gameplay API;
- Player API/cloud save;
- rewarded ads;
- Payments API;
- lives timer в runtime;
- economy/shop runtime;
- boosters runtime;
- финальные внешние SFX-файлы;
- финальные музыкальные файлы;
- T/L bomb и расширенные special-комбинации;
- RU/EN runtime localization;
- production popups;
- полноценная mobile QA.

---

## 11. СЛЕДУЮЩИЙ ПРОХОД

Приоритет:
1. проверить vertical slice в браузере и исправить runtime-баги;
2. подключить boosters и T/L bomb;
3. подключить финальные SFX + ASMR mix;
4. положить выбранную музыку в `audio/music` и подключить music bus;
5. интегрировать Яндекс SDK: loading/gameplay/save/rewarded;
6. проверить mobile landscape safe-area;
7. после рабочего core перейти к полным 30 уровням.

---

## 12. ИСТОРИЯ

### 2026-09-14 — v0.3
- пользователь дал явное разрешение начать разработку;
- создан первый playable vertical slice;
- активный runtime: `src/vertical_slice.js`;
- добавлены Title / Map / test-levels;
- добавлена базовая match-3 логика и blockers;
- добавлены программные анимации;
- добавлен временный procedural ASMR-SFX слой;
- дальнейшая работа переведена из design-stage в implementation-stage.

### 2026-09-14 — v0.2
- закрыт основной asset-pack;
- утверждены game design, 30-level curve, экономика и rewarded cadence;
- зафиксированы звук/анимация/лицензии.

### 2026-09-13 — v0.1
- создан начальный мастер-файл и утверждён концепт.
