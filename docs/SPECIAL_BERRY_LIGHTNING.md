# Молния для будущих спецягод «Безумных ягодок»

Дата: 15 октября 2026.
Статус: визуальный эффект понравился пользователю; сохранить для будущей отдельной работы. В текущую альфу не подключать.

## Решение пользователя
Экспериментальная бета отклонена. Вернуться к альфе 3b55807. Единственный выбранный для будущего элемент — молния. Брызги сока, занавесы, ауры и фонтан монет из беты не переносить.

## Как выглядит молния
Живая ломаная линия с 12 сегментами, небольшими случайными отклонениями и боковыми ответвлениями. Три слоя: широкий прозрачный ореол, цветной разряд, тонкая белая сердцевина. Зигзаг меняется 8 раз за короткую вспышку. Базовый оттенок — светлая мята; допускаются другие цвета будущих персонажных тем. Длительность 360 мс.

## Применение в будущем
- горизонтальная спецягода: разряд вдоль очищаемого ряда;
- вертикальная: вдоль столбца;
- бомба/радужная/комбинации: только после отдельного согласования;
- не менять силу, область поражения, экономику, SDK и сохранения;
- молния не перехватывает касания и не блокирует ход;
- использовать Phaser scene time/tweens: эффект должен останавливаться при общей паузе;
- уничтожать Graphics, таймеры и подписки при завершении и выходе из сцены;
- ограничивать одновременные эффекты; проверить длинный каскад и мобильное устройство.

## Сохранённый исходный метод
Источник: beta 9338436c46799677d65f069a7bfc83a70c169e6a, src/vfx/juice.js. Метод ниже независим от сока и может быть перенесён в отдельный VFX-модуль. Для работы нужны this.s (сцена), this.objects (Set) и помощники keep/animate ниже.

```js
  lightning(a,b,color=0x96ffe0){
    if(this.objects.size>=170)return;
    const g=this.keep(this.s.add.graphics().setDepth(16));if(!g)return;
    g.setBlendMode(Phaser.BlendModes.ADD);
    let last=-1;g.t=0;
    const draw=()=>{
      const frame=Math.floor(g.t*8);if(last===frame)return;last=frame;g.clear();
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,points=[a];
      for(let i=1;i<12;i++){const t=i/12,j=(Math.random()-.5)*42;points.push({x:a.x+dx*t-dy/len*j,y:a.y+dy*t+dx/len*j})}points.push(b);
      const path=(pts,w,c,alpha)=>{g.lineStyle(w,c,alpha);g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))g.lineTo(p.x,p.y);g.strokePath()};
      for(const [w,c,alpha] of [[24,color,.1],[10,color,.4],[3,0xffffff,1]])path(points,w,c,alpha);
      for(let i=2;i<11;i+=3){const p=points[i],sign=i%2?1:-1;const end={x:p.x+dx*.09-dy/len*sign*48,y:p.y+dy*.09+dx/len*sign*48};path([p,{x:(p.x+end.x)/2+12,y:(p.y+end.y)/2-9},end],2,color,.8)}
    };draw();this.animate(g,{t:1,alpha:0,duration:360,onUpdate:draw});
  }

// Хранение и очистка косметических объектов:
keep(object) {
  if (this.closed || this.objects.size >= 180) { object.destroy(); return null; }
  this.objects.add(object);
  object.once('destroy', () => this.objects.delete(object));
  return object;
}
animate(object, config) {
  if (!object) return;
  this.s.tweens.add({ targets: object, ...config, onComplete: () => object.destroy() });
}
// На shutdown: closed=true; killTweensOf + destroy для каждого object; objects.clear().
```

Перед возвратом в игру: проверить отрисовку на ПК/телефоне, плавность каскадов, паузу рекламы, выход во время вспышки и отсутствие влияния на основную кнопку/номер уровня. Наличие сохранённого кода не означает, что его уже включили в альфу.
