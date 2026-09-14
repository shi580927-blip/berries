# Безумные ягодки: Лесное королевство

Playable vertical slice на Phaser 3.

## Что уже работает
- landscape 16:9, FIT + CENTER_BOTH;
- заставка и тестовая карта;
- уровни 1 / 6 / 11 / 16 / 21 / 30;
- базовый swap/match-3;
- каскады и refill;
- 4-match → line special;
- 5-match → rainbow special;
- лёд, жёлуди и корни;
- цели, ходы и счёт;
- win/lose;
- локальное сохранение пройденных test-levels;
- программные tween-анимации;
- временный procedural ASMR-SFX слой через WebAudio.

## Запуск
Это статический проект. Нужен HTTP-сервер (не открывать `index.html` напрямую через `file://`).

Например:
```bash
python -m http.server 8080
```
После этого открыть `http://localhost:8080`.

Для GitHub Pages можно публиковать корень ветки `main`.

## Следующий проход
- Yandex Games SDK: loading/gameplay/rewarded/save;
- внешний лицензированный SFX-пак из `docs/LICENSES_AUDIO.md`;
- музыка Kevin MacLeod / Pixabay после помещения файлов в `audio/music`;
- bomb/T-L и комбинации specials;
- boosters;
- production popups и адаптивный HUD;
- проверка mobile landscape.

Документация: `PROJECT_STATE.md`, `docs/GAME_DESIGN.md`, `docs/AUDIO_ANIMATION_SPEC.md`, `docs/LICENSES_AUDIO.md`.
