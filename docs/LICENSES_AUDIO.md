# LICENSES_AUDIO — «Безумные ягодки: Лесное королевство»

## 0. Имена файлов для подключения музыки

Загружать в `audio/music/` строго под этими именами:
- `music_menu_morning.mp3` — Morning;
- `music_gameplay_calm_devonshire_moderato.mp3` — Devonshire Waltz Moderato;
- `music_gameplay_magic_escape_room.mp3` — Magic Escape Room;
- `music_event_adventureland.mp3` — Adventures in Adventureland.

После загрузки проверить, что расширение действительно MP3, а не переименованный WAV/M4A. Для Magic Escape Room позднее подготовить укороченный бесшовный loop; исходный мастер можно сначала загрузить целиком.

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

### SFX — основной отобранный пул

Все позиции ниже имеют отдельную страницу Pixabay с пометкой `Free for use under the Pixabay Content License`. До production используем только после фактического скачивания с этой страницы и записи имени локального файла.

1. `Soft UI Click` — Universfield
   - Источник: https://pixabay.com/sound-effects/film-special-effects-soft-ui-click-147352/
   - Роль: обычные UI-кнопки.
   - Предлагаемый файл: `audio/sfx/ui_click.mp3`.

2. `Magic Button Click` — humordome
   - Источник: https://pixabay.com/sound-effects/technology-magic-button-click-453255/
   - Роль: special / premium / важная кнопка.
   - Предлагаемый файл: `audio/sfx/ui_magic_click.mp3`.

3. `Clean Minimal Pop` — DRAGON-STUDIO
   - Источник: https://pixabay.com/sound-effects/clean-minimal-pop-467466/
   - Роль: мягкий juicy/ASMR pop для match, выбора ягоды, лёгкого попадания.
   - Предлагаемый файл: `audio/sfx/match_pop_01.mp3`.

4. `soft subtle ui pop sfx` — abhicreates
   - Источник: https://pixabay.com/sound-effects/film-special-effects-soft-subtle-ui-pop-sfx-348820/
   - Роль: второй более тихий pop; вариация обычного match.
   - Предлагаемый файл: `audio/sfx/match_pop_02.mp3`.

5. `Fairy Sparkle` — humordome
   - Источник: https://pixabay.com/sound-effects/fairy-sparkle-451414/
   - Роль: верхний sparkle-слой для cascade, rainbow, acorn collect и магических наград.
   - Предлагаемый файл: `audio/sfx/fairy_sparkle.mp3`.

6. `Glitter Chime` — humordome
   - Источник: https://pixabay.com/sound-effects/glitter-chime-451420/
   - Роль: короткий блестящий accent для cascade x3+, награды или завершения цели.
   - Предлагаемый файл: `audio/sfx/glitter_chime.mp3`.

7. `Magical Sparkle Whoosh` — DJARTMUSIC
   - Источник: https://pixabay.com/sound-effects/film-special-effects-magical-sparkle-whoosh-298750/
   - Роль: rainbow activation / сильный magic sweep / переход.
   - Предлагаемый файл: `audio/sfx/rainbow_whoosh.mp3`.

8. `Glass Cracking` — DRAGON-STUDIO
   - Источник: https://pixabay.com/sound-effects/household-glass-cracking-511310/
   - Роль: короткий первый hit по льду.
   - Предлагаемый файл: `audio/sfx/ice_crack.mp3`.

9. `Shattering Ice` — DRAGON-STUDIO
   - Источник: https://pixabay.com/sound-effects/shattering-ice-454251/
   - Роль: полное разрушение льда.
   - Предлагаемый файл: `audio/sfx/ice_break.mp3`.

10. `Wood Crack 1` — utsuru / freesound_community
    - Источник: https://pixabay.com/sound-effects/film-special-effects-wood-crack-1-105890/
    - Роль: разрушение корней / веток.
    - Предлагаемый файл: `audio/sfx/roots_break.mp3`.

11. `UI Error Pop` — SoundShelfStudio
    - Источник: https://pixabay.com/sound-effects/film-special-effects-ui-error-pop-515668/
    - Роль: invalid swap / недоступное действие; использовать очень тихо и без раздражения.
    - Предлагаемый файл: `audio/sfx/invalid_swap.mp3`.

12. `UI Success Chime` — SoundShelfStudio
    - Источник: https://pixabay.com/sound-effects/technology-ui-success-chime-513565/
    - Роль: выполненная цель / мини-успех.
    - Предлагаемый файл: `audio/sfx/goal_complete.mp3`.

13. `UI Mission Complete Chime` — SoundShelfStudio
    - Источник: https://pixabay.com/sound-effects/film-special-effects-ui-mission-complete-chime-527522/
    - Роль: короткий pre-win accent или завершение сложной цели.
    - Предлагаемый файл: `audio/sfx/mission_complete.mp3`.

14. `UI Notification Bell` — SoundShelfStudio
    - Источник: https://pixabay.com/sound-effects/film-special-effects-ui-notification-bell-515080/
    - Роль: жизнь восстановлена / ненавязчивое уведомление.
    - Предлагаемый файл: `audio/sfx/life_gain.mp3`.

15. `Game Bonus 03` — Universfield
    - Источник: https://pixabay.com/sound-effects/technology-game-bonus-03-487857/
    - Роль: монета, маленький бонус, reward tick.
    - Предлагаемый файл: `audio/sfx/coin_reward.mp3`.

16. `Success Videogame SFX @MRSTOKES302` — Mrstokes302
    - Источник: https://pixabay.com/sound-effects/success-videogame-sfx-mrstokes302-423626/
    - Роль: победа / завершение уровня.
    - Предлагаемый файл: `audio/sfx/level_win.mp3`.

### SFX, которые ещё выбираются после прослушивания

Нужно подобрать финальные варианты для:
- `swap` — мягкое скольжение/короткий whoosh, без резкого свиста;
- `match_pop_03` — третья вариация сочного pop;
- `special_line` — быстрый airy/slicing sweep;
- `special_bomb` — короткий мягкий low-pop/impact без агрессивного взрыва;
- `acorn_collect` — маленький woody/plop + sparkle;
- `booster_hammer` — приятный cartoon tap/wood hit;
- `booster_shuffle` — несколько тихих swish/card-like движений;
- `booster_fan` — мягкий воздушный sweep;
- `level_lose` — короткий мягкий descending cue, без наказующего buzzer.

Если один внешний SFX получается слишком резким, разрешено собирать итоговый игровой звук из 2–3 лицензированных слоёв: например `soft pop + sparkle`, с нормализацией и fade. Исходные лицензии всех слоёв всё равно фиксируются здесь.

## 2. Incompetech / Kevin MacLeod

Официальная страница лицензирования:
- https://music.kevin.macleod.incompetech.com/music/royalty-free/licenses/
- FAQ: https://music.kevin.macleod.incompetech.com/music/royalty-free/faq.html

Бесплатный вариант: Creative Commons Attribution 4.0 (CC BY 4.0). Коммерческое использование разрешено при обязательном указании авторства. Для игры кредиты размещаются на доступном экране `Credits` / `О музыке` в настройках. Если не хотим показывать кредиты, у Incompetech есть отдельная платная Standard License.

Обязательный шаблон атрибуции для каждого использованного трека:

`"TRACK TITLE" Kevin MacLeod (incompetech.com)`  
`Licensed under Creative Commons: By Attribution 4.0`  
`https://creativecommons.org/licenses/by/4.0/`

### Музыка — фавориты пользователя

1. `Morning` — Kevin MacLeod
   - Источник: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2300003
   - Лицензия: CC BY 4.0.
   - Длительность: 2:33.
   - Feel: Bright, Calm, Relaxed.
   - Инструменты: Classical Guitar, Harp, Flutes.
   - ISRC: USUAN2300003.
   - Возможная роль: главный экран / карта / спокойная часть игры.
   - Статус: **фаворит пользователя**.

2. `Devonshire Waltz` — Kevin MacLeod
   - Пользователь отметил серию `Devonshire Waltz`; конкретный темп выбираем после теста в игре.
   - `Devonshire Waltz Moderato`: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100016 — 5:50, 93 bpm, ISRC USUAN2100016.
   - `Devonshire Waltz Allegretto`: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100017 — 5:13, 104 bpm, ISRC USUAN2100017.
   - `Devonshire Waltz Andante`: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100015 — 6:28, 84 bpm, ISRC USUAN2100015.
   - Feel для серии: Relaxed, Calm, Grooving.
   - Лицензия: CC BY 4.0.
   - Возможная роль: основной спокойный gameplay / карта.
   - Статус: **фаворит пользователя; стартовый тест — Moderato**.

3. `Magic Escape Room` — Kevin MacLeod
   - Источник: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2200005
   - Лицензия: CC BY 4.0.
   - Длительность: 14:23.
   - Feel: Driving, Grooving, Bouncy.
   - ISRC: USUAN2200005.
   - В треке есть Celesta, Xylophone, Glockenspiel, Chimes, bells и оркестр; композиция постепенно наращивает напряжение и имеет естественные точки монтажа.
   - Возможная роль: магические / сложные / поздние уровни; использовать отредактированный фрагмент или loop, а не весь трек целиком.
   - Статус: **фаворит пользователя**.

4. `Adventures in Adventureland` — Kevin MacLeod
   - Источник: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100029
   - Лицензия: CC BY 4.0.
   - Длительность: 4:21.
   - Feel: Action, Bright, Grooving.
   - ISRC: USUAN2100029.
   - Возможная роль: более активный gameplay / специальные уровни / открытие главы.
   - Статус: резервный сильный кандидат.

### Текущая музыкальная гипотеза MVP

- `music_menu`: **Morning**.
- `music_gameplay_calm`: **Devonshire Waltz Moderato** как первый тест; при необходимости сравнить с Allegretto/Andante.
- `music_gameplay_magic`: **Magic Escape Room**, отредактированный мягкий фрагмент/loop.
- `music_event` / активный уровень: **Adventures in Adventureland** либо `Wonders of the Earth` после сравнения внутри игры.

Эта схема фиксирует предпочтения и роли, но не финализирует конкретные аудиофайлы до прослушивания внутри игры.

## 3. ASMR / tactile sound rule

Для «Безумных ягодок» звук является частью game-feel, а не просто уведомлением.

Цель:
- juicy, мягкий, «сочный» feedback;
- небольшое ASMR-ощущение от pops, crackles, tiny chimes и мягких swishes;
- без громких ударов, пищалок, резких buzzer и частого high-frequency звона.

Правило слоя:
- обычный match: 1 короткий pop, иногда + очень тихий sparkle;
- каскады: тот же pop с небольшим pitch variation; на 3+ каскаде добавлять короткий chime;
- лёд: сначала хруст/трещина, только на полном разрушении shatter;
- корни: сухой маленький crack, не «ломаем дерево» на полной громкости;
- rainbow/specials: whoosh + sparkle, но длительность эффекта должна оставаться короткой;
- награды: chime/coin layer без казино-подобного звона.

Запрещено запускать много одинаковых SFX одновременно. Для каскада применяется throttling/voice limit и небольшой random pitch, чтобы звуковая каша не разрушала ASMR-эффект.

## 4. Content ID и доказательства лицензии

Для Pixabay и Incompetech возможны автоматические Content ID claims на YouTube/других видеоплатформах, даже при законном использовании. Поэтому для каждого финального трека храним:
- точный URL страницы;
- название и автора;
- лицензию;
- дату скачивания;
- локальную копию license/certificate или скрин страницы;
- ISRC, если указан;
- имя локального файла в проекте.

Claim не равен copyright strike. Оспариваем только если уверены, что используем файл в соответствии с лицензией.

## 5. Кредиты в игре

В `Settings` добавить кнопку `Credits / Лицензии`.

Там выводить:
- Kevin MacLeod и полные CC BY 4.0 кредиты для каждого использованного Incompetech-трека;
- Pixabay-кредиты не обязательны, но можно добровольно указать `Sound effects via Pixabay` и авторов выбранных файлов.

## 6. Правило проекта

Ни один внешний аудиофайл не попадает в production build без записи в этот документ и проверки лицензии на дату скачивания.


## 2026-09-14 — Подключённые звуковые файлы Pixabay
Файлы предоставлены пользователем; дата исходного скачивания не сообщена. Условия и страницы проверены 2026-09-14: Pixabay Content License, коммерческое использование и обработка разрешены, атрибуция необязательна; отдельное распространение исходных звуков не разрешено.
- `audio/sfx/berry_pop.mp3` — Wet Splat Impact, Universfield. Источник: https://pixabay.com/sound-effects/film-special-effects-wet-splat-impact-567197/ . Исходный файл: universfield-wet-splat-impact-567197.mp3. Один звук на проход очистки ягод; без наложения одинаковых голосов.
- `audio/sfx/ice_break.mp3` — Ice, 03Thib (Freesound), аккаунт freesound_community. Источник: https://pixabay.com/sound-effects/ice-43072/ . Исходный файл: freesound_community-ice-43072.mp3. Звучит при снятии последнего слоя льда, включая молоток; частичное повреждение сохраняет тихий procedural crack.
- Условия: https://pixabay.com/service/terms/ ; краткая лицензия: https://pixabay.com/service/license-summary/ .
Проверка: синтаксис JS; изолированный тест трёх ягод и льда с одним/двумя слоями: один хлопок, одно разрушение льда, один частичный треск. Прослушивание игрового микса в браузере не выполнялось.


## 2026-09-14 — Музыкальные акценты
- Автор: Kevin MacLeod (incompetech.com), “Adventures in Adventureland”.
- Источник исходного трека: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN2100029
- Лицензия согласно записи исходного трека выше: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/ .
- Производные файлы: `audio/music/accents/combo.mp3` (0.4568–2.2346 секунды исходника), `audio/music/accents/victory.mp3` (7.5679–11.1235).
- Изменения: вырезаны фрагменты, добавлены fade-in/fade-out, перекодированы в MP3 128 kbps. Полный исходник не изменён.
- Атрибуция исходного трека уже доступна в настройках «О музыке».

## 2026-09-15 — Смягчённый звук ягод
`audio/sfx/berry_pop_soft.mp3` — производная от Wet Splat Impact, Universfield, указанного выше. Применён low-pass 4500 Hz, перекодирование MP3 192 kbps. Громкость в runtime: 0.35 вместо 0.50. Источник и Pixabay Content License сохранены; оригинальный файл не изменён.


## 2026-09-19 — Утверждённые / зарезервированные SFX Pixabay

Проверка выполнена 2026-09-19 по страницам самих звуков и текущей Pixabay Content License.

Условия, применимые ко всем позициям ниже:
- лицензия: **Pixabay Content License**;
- допускается бесплатное коммерческое использование и модификация/адаптация;
- обязательная атрибуция не требуется, хотя добровольный кредит допустим;
- нельзя продавать или распространять исходный звук как самостоятельный (Standalone) файл;
- полный текст лицензии и Terms имеют приоритет над кратким summary;
- Pixabay отдельно предупреждает, что на конкретный контент могут распространяться дополнительные права третьих лиц, поэтому перед финальным релизом сохраняем доказательство страницы и дату скачивания.

Официальные страницы условий:
- https://pixabay.com/service/license-summary/
- https://pixabay.com/service/terms/

### Финальные / почти финальные назначения

1. **Magic Spell 02 — Universfield**
   - Источник: https://pixabay.com/sound-effects/film-special-effects-magic-spell-02-250240/
   - Страница помечена Free for use under the Pixabay Content License.
   - Длительность на странице: около 3 с.
   - Роль: **радуга / активация rainbow special**.
   - Статус: **утверждённое направление, практически финальный кандидат**.
   - Предлагаемый production-файл: audio/sfx/special_rainbow_magic_spell_02.mp3.

2. **Clear Bell Chime — Universfield**
   - Источник: https://pixabay.com/sound-effects/film-special-effects-clear-bell-chime-487898/
   - Страница помечена Free for use under the Pixabay Content License.
   - Длительность на странице: около 2 с.
   - Роль: **создание спец-ягоды**.
   - Статус: **утверждённое направление, практически финальный кандидат**.
   - Предлагаемый production-файл: audio/sfx/special_create_clear_bell_chime.mp3.

3. **Fairy Sparkle — humordome**
   - Источник: https://pixabay.com/sound-effects/fairy-sparkle-451414/
   - Страница помечена Free for use under the Pixabay Content License.
   - Длительность на странице: около 2 с.
   - Роль: **вертикальная спец-ягода** вместо текущего резкого временного эффекта.
   - Статус: **утверждённое направление**.
   - Предлагаемый production-файл: audio/sfx/special_vertical_fairy_sparkle.mp3.

4. **Magical Sparkle Whoosh — DJARTMUSIC**
   - Источник: https://pixabay.com/sound-effects/film-special-effects-magical-sparkle-whoosh-298750/
   - Страница помечена Free for use under the Pixabay Content License.
   - На странице также указано, что аудио AI generated / AI modified or generated.
   - Длительность на странице: около 10 с; в игре использовать только короткий подходящий фрагмент после монтажа.
   - Роль: **горизонтальная спец-ягода**.
   - Статус: **утверждено пользователем 2026-09-19**.
   - Предлагаемый production-файл: audio/sfx/special_horizontal_magical_sparkle_whoosh.mp3.

### Зарезервированные

5. **magical whoosh — KoiRoylers**
   - Источник: https://pixabay.com/sound-effects/film-special-effects-magical-whoosh-355988/
   - Страница помечена Free for use under the Pixabay Content License.
   - На странице указано AI generated.
   - Роль: **зарезервировать для будущей Королевы / её магического действия**.
   - Статус: не подключать к текущим базовым specials.
   - Предлагаемый future-файл: audio/sfx/queen_magic_whoosh.mp3.

6. **Power Up Sparkle 1 — floraphonic**
   - Источник: https://pixabay.com/sound-effects/film-special-effects-power-up-sparkle-1-177983/
   - Страница помечена Free for use under the Pixabay Content License.
   - Роль: резерв для **special+special / мощного усиления / редкого крупного события**.
   - Статус: нравится пользователю, конкретное применение ещё не финализировано.
   - Предлагаемый future-файл: audio/sfx/special_powerup_sparkle_01.mp3.

### Отклонено
- **Magic Burst** — не использовать в текущем проекте по результату прослушивания 2026-09-19.

### Важное уточнение к более раннему списку
Ранние роли для Fairy Sparkle и Magical Sparkle Whoosh выше в документе были кандидатными. **Актуальные назначения на 2026-09-19**:
- Fairy Sparkle → вертикальная спец-ягода;
- Magical Sparkle Whoosh → горизонтальная спец-ягода;
- Magic Spell 02 → радуга;
- Clear Bell Chime → создание спец-ягоды.

Перед помещением любого из этих файлов в production build:
1. скачать его с указанной страницы;
2. сохранить исходное имя файла;
3. зафиксировать дату скачивания;
4. сохранить скрин/копию страницы с названием, автором и пометкой лицензии;
5. после монтажа записать в этот документ производное имя и характер обработки.


## 2026-09-19 — Большая библиотека Pixabay SFX сохранена для будущих вариантов

Пользователь передал дополнительный набор SFX, скачанных с Pixabay. Все исходники сохранены отдельно от production-архива на Google Drive:
- папка: `SFX_library_pixabay_2026-09-19`
- Drive ID: `1_o8nZ1BCGvSZ4gm1MA5pSrjS_3fiqliY`
- URL: https://drive.google.com/drive/folders/1_o8nZ1BCGvSZ4gm1MA5pSrjS_3fiqliY

Эта папка является библиотекой исходников/кандидатов. Файлы из неё не считаются подключёнными к production автоматически.

Сохранённые варианты:
- `koiroylers-sparkle-355937.mp3`
- `emand_edroff-fairy-dust-magical-chime-576279.mp3`
- `humordome-glitter-chime-451420.mp3`
- `freesound_community-sfx-accent-eye-glitter-tinkle-1-6342.mp3`
- `humordome-magic-burst-452852.mp3`
- `djartmusic-magical-sparkle-whoosh-298750.mp3`
- `koiroylers-magical-whoosh-355988.mp3`
- `yodguard-fire-magic-3-378640.mp3`
- `yodguard-healing-magic-5-378667.mp3`
- `yodguard-dark-magic-6-378652.mp3`
- `universfield-magic-spell-278824.mp3`
- `yodguard-wind-magic-5-378630.mp3`
- `yodguard-fire-magic-5-378639.mp3`
- `universfield-magic-spell-03-242245.mp3`
- `freesound_community-magic-wand-6214.mp3`
- `universfield-magic-twinkle-244951.mp3`
- `universfield-clear-bell-chime-487898.mp3`
- `floraphonic-power-up-sparkle-1-177983.mp3`
- `universfield-magic-spell-02-250240.mp3`
- второй файл `universfield-magic-spell-03-242245` сохранён как duplicate; локальная проверка показала, что два экземпляра идентичны по SHA-256.

### Текущие подключённые назначения после нового отбора
- **Создание спец-ягоды** → `Clear Bell Chime — Universfield`, source ID 487898.
  Production: `audio/sfx/special_create_clear_bell.mp3`.
- **Радуга** → `Magic Spell 02 — Universfield`, source ID 250240.
  Production: `audio/sfx/special_rainbow_magic_spell.mp3`.
- **Горизонтальная спец-ягода** → `Magical Sparkle Whoosh — DJARTMUSIC`, source ID 298750.
  Production: `audio/sfx/special_horizontal_sparkle_whoosh.mp3`.
  В runtime старт воспроизведения сдвинут примерно на 0.68 с, чтобы не проигрывать начальную тишину.
- **Вертикальная спец-ягода** → `Sparkle — KoiRoylers`, source ID 355937.
  Production: `audio/sfx/special_vertical_sparkle.mp3`.
- **Финальная «рассыпушка» после каскадного комбо** → `Glitter Chime — humordome`, source ID 451420.
  Production: `audio/sfx/combo_glitter_chime.mp3`.
  Звук запускается один раз после завершения каскадной цепочки, а не на каждом звене.

На странице поиска Pixabay по glitter среди результатов подтверждаются `Glitter Chime — humordome`, `SFX-Accent-Eye Glitter-Tinkle 1 — freesound_community`, `Magic Spell 02 — Universfield` и другие glitter/sparkle-кандидаты. Для каждого реально используемого production-файла перед финальным релизом сохраняем его индивидуальную страницу и доказательство лицензии.

### Жёлудь
- **Superfast Crunch — saboteurcomics**, Pixabay source ID 405118.
- Источник: https://pixabay.com/sound-effects/film-special-effects-superfast-crunch-405118/
- Pixabay search page identifies the asset as `Superfast crunch — saboteurcomics`, duration about 0:02, Film & special effects.
- Лицензия: Pixabay Content License; индивидуальный файл использовать только в составе игры, не распространять как standalone asset.
- Исходник получен 2026-09-19 и сохранён:
  - Google Drive library: `saboteurcomics-superfast-crunch-405118.mp3`, Drive ID `1hW-yAjhtO5Np0esvZkLjdweBah4-9ZSm`;
  - repo source: `audio/sfx/acorn_superfast_crunch_source.mp3`.
- В исходнике несколько crunch-акцентов. Для жёлудя используется **средний сухой хруст**: runtime начинает примерно с `0.98 s` и останавливает примерно через `780 ms`, чтобы не захватить соседние акценты.
- Назначение: **сбор / разрушение жёлудя**, включая разрушение молотком.
- Статус: **подключено в runtime 2026-09-19**.

### Будущие варианты
Остальные сохранённые magic / fire / wind / healing / dark / wand / twinkle / fairy-dust / power-up / tinkle-файлы не удалять. Рассматривать как библиотеку для:
- Королевы и других персонажей;
- special+special;
- усилителей;
- редких наград;
- событий / магических миров;
- вариаций combo-finisher;
- будущих VFX/SFX cosmetic themes.

Для будущего применения каждого кандидата сначала проверить индивидуальную страницу Pixabay и актуальные условия лицензии на дату включения в production.
