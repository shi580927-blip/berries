# ASSET AUDIT — «Безумные ягодки: Лесное королевство»

Дата проверки: 2026-09-14
Статус: основной арт-пак MVP собран; рисование временно остановлено.
Источник проверки: текущие файлы репозитория `shi580927-blip/berries` + утверждённые решения проекта.

## 1. Общий вывод

Для начала сборки вертикального среза основной набор ассетов уже существует. Новые декоративные элементы сейчас не рисуем «про запас». Недостающие мелочи добавляются только если реальная сборка экрана покажет необходимость.

Отдельно зафиксировано:
- спецэффекты полосатых специальных ягод не запекаются в PNG; луч/свечение/след делаются кодом;
- `blocker_ice_11.png` и `blocker_ice_3.png` — экспериментальные варианты прозрачности льда, пока сохраняются;
- большие PNG-попапы 2–3 МБ допустимы как мастер-ассеты; оптимизация выполняется перед production build без ухудшения мастеров;
- фоны мастер-версии — 1920×1080, 16:9;
- текст и числа по возможности накладываются кодом, а не вшиваются в reusable UI.

## 2. Игровые ягоды — ГОТОВО

Папка `assets/berries/`:
- `berry_strawberry.png`
- `berry_raspberry.png`
- `berry_blueberry.png`
- `berry_gooseberry.png`
- `berry_blackberry.png`
- `berry_cloudberry.png`

Статус: P0 закрыт.

## 3. Препятствия и цели — ГОТОВО

Папка `assets/blockers/`:
- `blocker_ice_1.png` — основной лёд 1 слоя;
- `blocker_ice_2.png` — основной лёд 2 слоёв;
- `blocker_ice_11.png` — запасной вариант прозрачности;
- `blocker_ice_3.png` — запасной вариант прозрачности;
- `blocker_roots.png`;
- `goal_acorn.png`.

Статус: P0 закрыт. Финальный вариант прозрачности льда выбирается уже на реальном поле.

## 4. Specials — ГОТОВО

Папка `assets/specials/`:
- `special_line_h.png`
- `special_line_v.png`
- `special_bomb.png`
- `special_rainbow.png`

Правило: визуальные эффекты линии/взрыва/радуги выполняются программно. В PNG не добавлять лучи, искры и внешние эффекты.

## 5. Бустеры — ГОТОВО

Папка `assets/boosters/`:
- `booster_hammer.png`
- `booster_shuffle.png`
- `booster_fan.png`

Точная механика `fan` остаётся задачей геймдизайна.

## 6. Кнопки — ГОТОВО

Папка `assets/ui/buttons/`:
- `button_wood.png`
- `button_blue.png`
- `level_normal.png`
- `level_current.png`
- `level_completed.png`
- `level_locked.png`

Номер уровня поверх level-button выводится кодом.

## 7. UI icons — ГОТОВО

Папка `assets/ui/icons/`:
- `ui_coin.png`
- `ui_life.png`
- `ui_plus.png`
- `ui_pause.png`
- `ui_settings.png`
- `ui_shop.png`
- `ui_back.png`
- `ui_close.png`

Иконка rewarded-video может быть взята из попапа/добавлена при интеграции, если понадобится отдельным reusable-файлом.

## 8. UI panels — ОСНОВНОЙ НАБОР ГОТОВ

Папка `assets/ui/panels/` содержит в том числе:
- `board_frame_forest.png`
- `logo_main.png`
- `panel_boosters.png`
- `panel_coins.png`
- `panel_goals.png`
- `panel_level_title.png`
- `panel_progress.png`
- `panel_championat.png`
- `panel_lives.png`

Запасные элементы, не удалять:
- `panel_2.png`
- `panel_3.png`
- `panel_berries1.png`
- `panel_buttom1.png`
- `panel_buttom2.png`

Их не считаем обязательными для MVP; используем только если реально понадобятся при сборке.

## 9. Попапы — ГОТОВО К ИНТЕГРАЦИИ

Папка `assets/ui/popups/`:
- `popup_level_win.png`
- `popup_level_lose.png`
- `popup_level_exit_confirm.png`
- `popup_shop_main.png`

Важно: текущие попапы содержат часть встроенного RU-текста. Для RU-версии это допустимо как быстрый MVP, но для полноценной RU/EN локализации лучше позднее выделить reusable фон/рамку и выводить текст кодом. Это не блокирует вертикальный срез.

## 10. Фоны — ГОТОВО

Папка `assets/backgrounds/`:
- `background_title_forest.jpg`
- `background_menu_forest.jpg`
- `background_game_forest.jpg`
- `background_game_forest_01.jpg`
- `background_game_forest_02.jpg`
- `background_game_forest_03.jpg`

Стандарт: 1920×1080, 16:9.

Папка `assets/map/`:
- `map_forest_background.jpg`

Карта уровней уже есть; новую карту не рисуем.

## 11. Логотип — ГОТОВО

`assets/ui/panels/logo_main.png`

Канонический текст:
- «БЕЗУМНЫЕ ЯГОДКИ»
- подзаголовок «ЛЕСНОЕ КОРОЛЕВСТВО»

Используется поверх `background_title_forest.jpg` на главном экране.

## 12. Персонажи — MVP НАБОР ГОТОВ

Король, `assets/characters/king/`:
- `king_idle.png`
- `king_celebrate.png`
- `king_sad.png`
- `king_point.png`

Королева, `assets/characters/queen/`:
- `queen_idle.png`
- `queen_celebrate.png`
- `queen_puzzled.png`
- `queen_point.png`

Для MVP принимаем 4 состояния на персонажа. Дополнительные `surprised`/прочие эмоции не блокируют разработку и могут быть дорисованы после вертикального среза.

## 13. FX — РИСОВАТЬ СЕЙЧАС НЕ НУЖНО

`assets/fx/` можно оставить пустой.

В Phaser кодом/частицами делаем:
- selected glow;
- line blast;
- bomb burst;
- rainbow pulse;
- match particles;
- win sparkle;
- ambient fireflies;
- лёгкий squash/bounce.

Если конкретный эффект окажется неудобен программно, отдельный FX-ассет добавляется по факту.

## 14. Что не закрыто артами, но не блокирует следующий этап

1. Премиальная тема «Королевская оранжерея» пока не собрана как полный production-пак.
2. Дополнительные эмоции Короля/Королевы отложены.
3. Принц/принцесса/остальная семья сейчас не нужны для первого MVP-геймплея.
4. Оптимизированные WebP/runtime-копии создаются перед финальной сборкой.
5. EN-совместимые версии попапов лучше сделать после первичной интеграции UI.

## 15. Решение по этапу ассетов

**Основной набор ассетов для перехода к геймдизайну и вертикальному срезу считаем закрытым.**

Следующий проектный этап: окончательно утвердить gameplay/economy/30 levels, затем начать кодирование после явного подтверждения пользователя.
