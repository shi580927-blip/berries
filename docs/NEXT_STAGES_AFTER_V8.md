# Безумные ягодки — этапы после Yandex v8

Дата фиксации: 2026-09-22  
Статус: roadmap для следующего чата после результата модерации Yandex Games.

## Точка старта

Текущая отправочная база: **Yandex v8**.

До ответа модерации не разворачивать большой новый функционал в отправочной ветке. После результата модерации:
1. исправить только замечания модерации, если они будут;
2. подтвердить стабильную Yandex-версию;
3. поставить версионный tag/release;
4. от этой стабильной базы развивать международную и мультиплатформенную версию.

---

## ЭТАП 1. Архитектура локализации и платформ

Цель — сохранить одно игровое ядро Phaser и не плодить отдельные копии игры.

### 1.1. Локализация
Вынести все пользовательские тексты из кода в словари:
- `ru`
- `en`
- `tr`

Не оставлять hardcoded-тексты в сценах, попапах, магазине, подсказках, целях, настройках и сообщениях SDK.

Нужны:
- переключение языка;
- автоопределение языка платформой, где доступно;
- ручной fallback;
- корректные переносы строк;
- проверка длины английских и турецких строк;
- единая терминология специальных ягод, бустеров, препятствий, магазина и коллекций;
- отдельные локализованные metadata/описания/инструкции для витрин площадок.

### 1.2. Платформенный слой
Разделить:
- gameplay/core;
- UI/game content;
- platform adapters.

Планируемые адаптеры:
- Yandex Games;
- VK Mini Apps / OK;
- Telegram Mini App;
- MAX Mini App;
- local/web debug adapter.

Через общий интерфейс вынести:
- init/ready;
- pause/resume;
- user/player identity;
- cloud save/load;
- rewarded/interstitial ads;
- payments/IAP;
- language;
- platform events;
- safe-area/orientation;
- analytics/event hooks, если они будут использоваться.

---

## ЭТАП 2. Английская локализация

Сделать первой после подготовки i18n.

Проверить:
- весь UI;
- обучение;
- названия целей;
- бустеры;
- магазин;
- Королевскую лавку;
- Королевскую семью;
- сообщения победы/проигрыша;
- подсказки специальных ягод;
- рекламные награды;
- платежные товары;
- правила/How to play;
- описания для платформы;
- скриншоты и рекламные материалы.

Отдельный QA: ни одной русской строки в EN-режиме.

---

## ЭТАП 3. Турецкая локализация

После стабилизации английской.

Требования те же, плюс:
- проверить турецкие символы и выбранные локальные/системные шрифты;
- особенно проверить ширину кнопок и двухстрочные подписи;
- проверить формулировки магазина и наград носителем/качественной языковой проверкой перед публикацией.

---

## ЭТАП 4. Монетизация 2.0

Не ломать уже работающую честную модель рекламы и покупок.

### 4.1. «Королевская семья»
Уже утверждено:
- базовый Король — бесплатный default;
- Королева;
- Принц;
- Принцесса;
- Малыш;
- Королевский маг;
- дополнительные персонажи/версии.

### 4.2. Парадный Король
Отдельный premium character/card:
- мантия;
- парадная корона;
- жезл/скипетр;
- отдельные анимации/эффекты.

Возможный bundle:
- Парадный Король;
- бустеры;
- монеты;
- при необходимости тематический VFX/звук.

### 4.3. Дополнительные IAP
Проработать и протестировать продуктовую матрицу:
- небольшие пакеты монет;
- большие пакеты монет;
- наборы бустеров;
- восстановление жизней;
- character bundles;
- seasonal/cosmetic packs;
- возможные наборы «герой + VFX + музыка/звук + ресурсы».

Не продавать скрытое преимущество персонажа. Gameplay-бонусы в bundle должны быть отдельным явно указанным содержимым.

Обязательно:
- защита от повторного начисления;
- восстановление покупок/entitlements;
- cloud-safe permanent ownership;
- тест отмены/ошибки/повторного запуска;
- отдельная матрица product IDs по платформам.

---

## ЭТАП 5. Production-art и персонажи

Визуальная красота — обязательное требование проекта.

Нужно:
- финальный экран коллекции;
- карточки персонажей;
- выбранный/закрытый/купленный/новый состояния;
- production-версии всех героев;
- крупные level-screen версии;
- анимационные poses/states;
- дополнительные декоративные элементы;
- при необходимости новые фоны/карта/сезонное оформление.

Для каждого героя минимум:
- idle;
- blink;
- happy;
- point/hint;
- celebrate;
- sad/lose.

Позже:
- win;
- special reaction;
- think;
- appear;
- character-specific reactions.

Технические заглушки не считать финальным артом.

---

## ЭТАП 6. Звуки, VFX и музыка

### Звуки
Собрать финальный production-набор:
- ягоды;
- specials;
- blockers;
- boosters;
- UI;
- коллекция;
- покупки;
- персонажи;
- события/награды.

Для каждого внешнего SFX:
- автор;
- источник;
- URL/id;
- лицензия;
- дата;
- исходник;
- production crop;
- где используется.

### VFX
Развивать без перегруза:
- character reactions;
- special creation;
- combo finish;
- premium character effects;
- collection unlock;
- purchase/reward;
- seasonal VFX themes.

### Музыка
Отдельный музыкальный план:
- menu/map;
- levels 1–20;
- levels 21–30;
- будущие миры/сезоны;
- optional premium/character themes только если это действительно добавляет ценность.

Сохранять:
- мягкие loop points;
- единый loudness balance;
- отсутствие системного media player;
- lifecycle pause/resume.

---

## ЭТАП 7. Gameplay / retention после стабильного релиза

Отдельно оценить после первых реальных данных:
- баланс 30 уровней;
- сложность первых 10 уровней;
- refill luck;
- расход жизней;
- частота rewarded;
- расход/покупка бустеров;
- доход монет;
- «Чемпионат ягод»;
- daily/return rewards;
- events;
- новые уровни/миры.

Не добавлять retention-механики автоматически: сначала смотреть реальные метрики и отзывы.

---

## ЭТАП 8. Полный QA-чеклист перед каждой платформой

### Core gameplay
- старт новой игры;
- все 30 уровней;
- match-3;
- specials;
- special+special;
- blockers;
- boosters;
- цели;
- shuffle/no moves;
- win/lose;
- +moves;
- lives;
- timers;
- map progression.

### Saves
- local save;
- cloud save;
- clean profile;
- logged-in/anonymous state;
- offline → online;
- merge/conflict;
- reinstall/reload;
- purchased entitlements persist.

### Ads
- rewarded success;
- cancel;
- no-fill/error;
- repeated taps;
- cooldown;
- background during ad;
- return after ad;
- reward exactly once.

### Payments
- catalog;
- successful payment;
- cancel;
- error;
- network interruption;
- duplicate callbacks;
- reload after purchase;
- entitlement restore;
- products missing/misconfigured.

### Audio/lifecycle
Особенно обязательно:
- background/minimize → весь звук останавливается;
- ad → звук и gameplay останавливаются;
- возврат → один экземпляр музыки, без дубля;
- iOS Control Center — нет системной media-card игры;
- Android notification/media controls — нет game media-card;
- desktop media controls — игра не появляется как системный медиаплеер;
- SFX не продолжаются после визуального события;
- все loop points проверены на телефоне;
- audio rights registry полный.

### Devices
Минимальная матрица:
- Windows desktop Chrome/Yandex Browser;
- macOS Safari/Chrome при возможности;
- Android Chrome/Yandex Browser;
- iPhone Safari;
- iPad Safari;
- несколько размеров экранов;
- slow network;
- reload;
- orientation;
- background/foreground.

### Localization
Для каждого языка:
- нет строк другого языка;
- нет обрезанного текста;
- нет выхода текста за кнопку;
- корректные переносы;
- магазин и цены читаемы;
- screenshots соответствуют языку.

### Release package
- один `index.html` в корне;
- нет dev/test/screenshot-helper;
- нет source/archive_unused;
- нет неиспользуемых тяжёлых media;
- нет запрещённых/неподтверждённых лицензий;
- build manifest;
- SHA-256;
- размер;
- clean-profile smoke test.

---

## ЭТАП 9. VK + Одноклассники

Планировать как **один общий web-core**, а не две отдельные игры.

На момент фиксации roadmap новые игры для Одноклассников направляются через VK Mini Apps. Перед реализацией повторно проверить актуальную документацию площадок.

Нужно:
- VK platform adapter;
- init/user;
- сохранения;
- payments;
- ads;
- lifecycle;
- language;
- safe area / mobile webview;
- платформа-specific product IDs;
- витрина/обложки/screenshots;
- модерационный checklist.

Отдельно протестировать запуск из VK и доступность/поведение в Одноклассниках.

---

## ЭТАП 10. Telegram Mini App

Не делать отдельную игру — использовать общий web-core.

Нужны:
- Telegram bot;
- Mini App launch;
- Telegram WebApp adapter;
- initData validation там, где нужна серверная идентификация;
- fullscreen/safe areas/orientation;
- сохранение прогресса;
- platform payments/Stars по актуальным требованиям;
- deep links/start parameters;
- возврат из background;
- audio lifecycle;
- отдельный TG QA checklist.

Можно позже использовать:
- bot notifications;
- возврат игрока;
- события/промокоды;
- social/share mechanics, только если они не мешают casual loop.

---

## ЭТАП 11. MAX Mini App

Использовать общий web-core.

На момент фиксации:
- Mini App в MAX запускается через чат-бота;
- приложение размещается по HTTPS;
- используется MAX Bridge для взаимодействия с клиентом;
- требования к подключению/партнёрам и API перед реализацией перепроверить.

Нужно:
- MAX bot;
- Mini App URL;
- MAX adapter;
- init/identity;
- lifecycle;
- save;
- payments/monetization — только после проверки доступных механизмов;
- safe area/orientation;
- отдельный QA checklist;
- проверка всех актуальных требований публикации.

---

## ЭТАП 12. Материалы магазина и маркетинга по платформам

Для каждой площадки:
- иконка;
- обложка;
- горизонтальные screenshots;
- вертикальные screenshots, если требуются;
- RU/EN/TR варианты;
- короткое описание;
- полное описание;
- How to play;
- feature bullets;
- privacy/legal;
- support contact;
- promo video / trailer;
- platform-specific promo assets.

Вести единый master media register, чтобы не пересобирать материалы с нуля.

---

## ЭТАП 13. Юридический и лицензионный финальный проход

Перед каждой новой площадкой:
- права на всю графику;
- права на музыку;
- права на SFX;
- лицензии шрифтов;
- privacy policy;
- данные/SDK/analytics;
- платежные условия;
- требования к возрастному рейтингу;
- platform terms;
- документы разработчика/самозанятого/ИП/юрлица, если площадка требует.

---

## ПОРЯДОК РАБОТЫ В НОВОМ ЧАТЕ

После результата модерации идти строго по очереди:

1. Закрыть замечания Yandex и заморозить stable release.
2. Сделать architecture cleanup: i18n + platform adapters.
3. Английский.
4. Турецкий.
5. Королевская семья + дополнительные IAP.
6. Production art / character animation.
7. SFX / VFX / music expansion.
8. Полный Yandex regression checklist.
9. VK + OK build.
10. VK/OK checklist + moderation.
11. Telegram Mini App.
12. Telegram checklist.
13. MAX Mini App.
14. MAX checklist.
15. Общий cross-platform regression и единый release registry.

## Главное правило

**Одно игровое ядро — несколько платформенных адаптеров.**
Не форкать gameplay отдельно под Yandex/VK/TG/MAX без крайней необходимости.

