# LICENSES_AUDIO — «Безумные ягодки: Лесное королевство»

Дата: 2026-09-14

Этот файл хранит источники, лицензии и обязательные кредиты для музыки и звуков игры. Перед релизом сверять его с фактическими файлами в `audio/music` и `audio/sfx`.

## 1. Pixabay

Лицензия: Pixabay Content License.

Официальные условия:
- https://pixabay.com/service/license-summary/
- https://pixabay.com/service/terms/
- https://pixabay.com/service/faq/

Разрешено бесплатно использовать контент в коммерческих и некоммерческих проектах, модифицировать и встраивать в игру; обязательная атрибуция не требуется. Нельзя распространять исходный аудиофайл как самостоятельный продукт. Для музыки/звуков сохранять страницу источника, имя автора, дату скачивания и при наличии сертификат/скрин лицензии.

### Музыка — кандидаты пользователя

1. `Wonders of the Earth`
   - Источник: https://pixabay.com/music/adventure-wonders-of-the-earth-550792/
   - Лицензия: Pixabay Content License.
   - Возможная роль: заставка / карта / открытие главы.
   - Статус: кандидат, не финально выбран.

2. `Moment of Peace — Mickeyscat`
   - Источник: https://pixabay.com/music/solo-piano-moment-of-peace-mickeyscat-554494/
   - Лицензия: Pixabay Content License.
   - Возможная роль: меню / спокойная карта / пауза.
   - Статус: кандидат, не финально выбран.

### SFX — отобранные безопасные кандидаты

1. `Soft UI Click` — Universfield
   - Источник: https://pixabay.com/sound-effects/film-special-effects-soft-ui-click-147352/
   - Лицензия: Pixabay Content License.
   - Роль: обычные UI-кнопки.

2. `Magic Button Click` — humordome
   - Источник: https://pixabay.com/sound-effects/technology-magic-button-click-453255/
   - Лицензия: Pixabay Content License.
   - Роль: магическая/важная кнопка, магазин, premium.

3. `Shattering Ice` — DRAGON-STUDIO
   - Источник: https://pixabay.com/sound-effects/shattering-ice-454251/
   - Лицензия: Pixabay Content License.
   - Роль: разрушение льда.

4. `Game Bonus 03` — Universfield
   - Источник: https://pixabay.com/sound-effects/technology-game-bonus-03-487857/
   - Лицензия: Pixabay Content License.
   - Роль: монета, награда, маленький бонус.

5. `Success Videogame SFX @MRSTOKES302` — Mrstokes302
   - Источник: https://pixabay.com/sound-effects/success-videogame-sfx-mrstokes302-423626/
   - Лицензия: Pixabay Content License.
   - Роль: победа / завершение уровня.

Дополнительные SFX (swap, invalid swap, match variants, bomb, line, rainbow, acorn, roots, lose) подбираются только с отдельной страницей источника и после прослушивания в игровом контексте.

## 2. Incompetech / Kevin MacLeod

Официальная страница лицензирования:
- https://music.kevin.macleod.incompetech.com/music/royalty-free/licenses/
- FAQ: https://music.kevin.macleod.incompetech.com/music/royalty-free/faq.html

Бесплатный вариант: Creative Commons Attribution 4.0 (CC BY 4.0). Коммерческое использование разрешено при обязательном указании авторства. Для игры кредиты размещаются на доступном экране `Credits` / `О музыке` в настройках. Если не хотим показывать кредиты, у Incompetech есть отдельная платная Standard License.

Обязательный шаблон атрибуции для каждого использованного трека:

`"TRACK TITLE" Kevin MacLeod (incompetech.com)`  
`Licensed under Creative Commons: By Attribution 4.0`  
`https://creativecommons.org/licenses/by/4.0/`

### Музыка — текущие кандидаты

1. `Adventures in Adventureland` — Kevin MacLeod
   - Страница каталога Incompetech, CC BY 4.0.
   - Характер: bright / grooving / cartoony adventure, оркестровые деревянные духовые, marimba, bells.
   - Возможная роль: основной gameplay или более активные уровни.
   - Статус: сильный кандидат.

2. `Almost Bliss` — Kevin MacLeod
   - Страница каталога Incompetech, CC BY 4.0.
   - Характер: bright / calm / relaxed.
   - Возможная роль: карта / меню.
   - Статус: кандидат.

3. `Equatorial Complex` — Kevin MacLeod
   - Страница каталога Incompetech, CC BY 4.0.
   - Характер: bright / mystical / relaxed.
   - Возможная роль: спокойный gameplay / лесная магия.
   - Статус: кандидат.

## 3. Content ID и доказательства лицензии

Для Pixabay и Incompetech возможны автоматические Content ID claims на YouTube/других видеоплатформах, даже при законном использовании. Поэтому для каждого финального трека храним:
- точный URL страницы;
- название и автора;
- лицензию;
- дату скачивания;
- локальную копию license/certificate или скрин страницы;
- ISRC, если указан;
- имя локального файла в проекте.

Claim не равен copyright strike. Оспариваем только если уверены, что используем файл в соответствии с лицензией.

## 4. Кредиты в игре

В `Settings` добавить кнопку `Credits / Лицензии`.

Там выводить:
- Kevin MacLeod и полные CC BY 4.0 кредиты для каждого использованного Incompetech-трека;
- Pixabay-кредиты не обязательны, но можно добровольно указать `Sound effects via Pixabay` и авторов выбранных файлов.

## 5. Правило проекта

Ни один внешний аудиофайл не попадает в production build без записи в этот документ и проверки лицензии на дату скачивания.
