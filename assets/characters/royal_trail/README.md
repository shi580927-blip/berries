# Королевская тропа — анимации героев (Gameplay Cycle 3.0)

Вспомогательный набор **для тестовой ветки** `feature/gameplay-cycle-3`; опубликованные сборки, SDK, экономика и сохранения не меняются.

## Содержимое

- `royal_characters_atlas.webp` — оптимизированный прозрачный 2048×2048 WebP, восемь персонажей по восемь кадров (1.04 МБ).
- `royal_characters_atlas.json` — Texture Atlas JSON Hash, совместимый с Phaser 3, ключи `<animation>_000` ... `_007`.
- `royal_characters_manifest.json` — длительность и размеры кадров, исходные имена GIF и назначение.
- `CHARACTER_PREVIEW.jpg` — статичный обзор.
- `royal_characters_original_gifs.zip` — исходные восемь GIF без изменения качества (в папке `art/source_animations/royal_trail/` в GitHub, **не включать в игру**).
- `preview_royal_animations.html` — тестовый просмотр всех восьми движений через Live Server, **не включать в игровой релиз**.

## Персонажи

| ID | Сцена | Кадры | Рекомендуемое использование |
| --- | --- | --- | --- |
| `princess_greeting` | Розовая принцесса в длинном платье | 8 | Приветствие и знакомство |
| `princess_victory` | Розовая принцесса в коротком платье | 8 | Победа, праздник |
| `prince_celebrate` | Синий принц с мечом | 8 | Победа, открытие зоны |
| `fairy_cast` | Зелёная лесная фея | 8 | Магия, звёзды |
| `wizard_cast` | Фиолетовый волшебник | 8 | Спецягода, волшебная сцена |
| `alchemist_celebrate` | Оранжевый алхимик с колбой | 8 | Зона 9+ |
| `cloudberry_queen` | Оранжевая королева Морошка в мантии | 8 | Освобождение от льда, зона 3–8 |
| `king_wave` | Красный король | 8 | Знакомство, советы, история |

Это исходные пользовательские рисунки/анимации, не заменять старые варианты автоматически, пока не согласовано участие персонажей в интерфейсе.

## Пример Phaser 3

```js
this.load.atlas('royal3',
  'assets/characters/royal_trail/royal_characters_atlas.webp',
  'assets/characters/royal_trail/royal_characters_atlas.json');
// after load finishes:
const frames = this.anims.generateFrameNames('royal3', {
  prefix: 'king_wave_', start: 0, end: 7, zeroPad: 3
});
this.anims.create({key: 'royal3-king-wave', frames, frameRate: 5.88, repeat: 0});
this.add.sprite(600, 500, 'royal3', 'king_wave_000')
  .play('royal3-king-wave');
```

`royal_characters_manifest.json` хранит **исходную длительность каждого кадра** (обычно 140–180 мс). Если нужна точная скорость, задавайте per-frame `duration` при создании Phaser animation; не воспроизводите GIF через DOM поверх canvas.

## Качество и правила

- Фон у GIF прозрачный, но анимации сгенерированы и местами меняют форму частей костюма и лица. Просмотреть все восемь кадров перед встраиванием в ключевую сюжетную сцену.
- Оригиналы сохраняются для повторного экспорта. Компоновка использует **единый crop union по всем кадрам одного персонажа**, поэтому кадры не прыгают из-за разной обрезки.
- Атлас грузить **по необходимости**, не в первый экран. Для игры используйте WebP+JSON, не ZIP и не все GIF.
- Не смешивать эти герои с движущимися ягодами игрового поля; это декорации/кат-сцены/реакции.
