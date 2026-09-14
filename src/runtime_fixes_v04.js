(() => {
  'use strict';

  const W = 1920;
  const H = 1080;
  const R = 8;
  const C = 8;
  const CELL = 96;
  const BY = 150;
  const TYPES = ['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
  const TEST_LEVELS = [1,6,11,16,21,30];
  const SAVE_KEY = 'berries_vs_04';
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

  function fit(img, maxW, maxH) {
    const s = Math.min(maxW / img.width, maxH / img.height);
    img.setScale(s);
    return img;
  }

  function rewardForLevel(n) {
    return n <= 5 ? 80 : n <= 10 ? 100 : n <= 15 ? 120 : n <= 20 ? 140 : n <= 25 ? 160 : 180;
  }

  function loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveData(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    window.BerriesYandex?.saveCloudData?.(data, false);
  }

  function getPlayPrototype() {
    const game = window.__berriesGame;
    const scene = game?.scene?.keys?.Play;
    return scene ? Object.getPrototypeOf(scene) : null;
  }

  function patch() {
    const proto = getPlayPrototype();
    if (!proto || proto.__berriesFixV04) return;
    proto.__berriesFixV04 = true;

    // True gravity: keep surviving sprites alive and move them downward.
    // Only newly created berries enter from above. Ice and blockers split a column
    // into independent gravity segments and never travel with the falling berries.
    proto.fallRefill = async function fallRefillV04() {
      const animations = [];
      const availableTypes = TYPES.slice(0, this.cfg.n);

      const rebind = (sprite, r, c) => {
        if (!sprite) return;
        sprite.setData('r', r);
        sprite.setData('c', c);
        sprite.removeAllListeners('pointerdown');
        sprite.setInteractive({ useHandCursor: true });
        sprite.on('pointerdown', () => this.tap(r, c));
      };

      for (let c = 0; c < C; c++) {
        let r = R - 1;
        while (r >= 0) {
          // Frozen berries and blockers are anchors: gravity does not pass through them.
          if (this.cell[r][c].block || this.cell[r][c].ice) {
            r--;
            continue;
          }

          const bottom = r;
          while (r >= 0 && !this.cell[r][c].block && !this.cell[r][c].ice) r--;
          const top = r + 1;

          const existing = [];
          for (let rr = bottom; rr >= top; rr--) {
            if (this.board[rr][c]) {
              existing.push({
                item: this.board[rr][c],
                sprite: this.spr[rr][c],
                from: rr,
              });
            }
          }

          // Clear logical references only. Existing sprites stay alive for tweening.
          for (let rr = top; rr <= bottom; rr++) {
            this.board[rr][c] = null;
            this.spr[rr][c] = null;
          }

          let target = bottom;
          for (const entry of existing) {
            const tr = target--;
            this.board[tr][c] = entry.item;
            this.spr[tr][c] = entry.sprite;
            const s = entry.sprite;
            if (!s) continue;
            rebind(s, tr, c);
            const p = this.pos(tr, c);
            const distance = Math.max(0, tr - entry.from);
            const baseAngle = s.getData('ang') ?? s.angle ?? 0;
            s.setData('ang', baseAngle);
            if (distance > 0) {
              animations.push(new Promise(resolve => {
                this.tweens.add({
                  targets: s,
                  x: p.x,
                  y: p.y,
                  angle: baseAngle,
                  duration: 190 + distance * 90,
                  ease: 'Cubic.in',
                  onComplete: () => {
                    const sx = s.getData('sx') || s.scaleX;
                    const sy = s.getData('sy') || s.scaleY;
                    this.tweens.add({
                      targets: s,
                      scaleX: sx * 1.04,
                      scaleY: sy * 0.94,
                      duration: 70,
                      yoyo: true,
                      ease: 'Sine.inOut',
                    });
                    resolve();
                  },
                });
              }));
            }
          }

          // Fill only empty cells at the TOP of the segment with new berries.
          let spawnIndex = 0;
          while (target >= top) {
            const tr = target--;
            this.board[tr][c] = {
              id: Phaser.Utils.Array.GetRandom(availableTypes),
              sp: null,
            };
            this.render(tr, c, false, false);
            const s = this.spr[tr][c];
            if (!s) continue;
            rebind(s, tr, c);
            const p = this.pos(tr, c);
            const finalAngle = s.getData('ang') ?? s.angle ?? 0;
            const startY = BY - CELL * (spawnIndex + 1) - 35;
            spawnIndex++;
            s.y = startY;
            s.x = p.x;
            s.angle = finalAngle + (Math.random() - 0.5) * 12;
            s.alpha = 0.98;
            animations.push(new Promise(resolve => {
              this.tweens.add({
                targets: s,
                y: p.y,
                angle: finalAngle,
                alpha: 1,
                duration: 390 + spawnIndex * 55 + (tr - top) * 20,
                ease: 'Bounce.out',
                onComplete: resolve,
              });
            }));
          }
        }
      }

      if (animations.length) await Promise.all(animations);
      await pause(70);
    };

    proto.resultPopup = function resultPopupV04(win) {
      const shade = this.add.rectangle(W/2, H/2, W, H, 0x061008, .76).setDepth(30);
      const box = this.add.container(W/2, H/2).setDepth(31);
      const art = fit(this.add.image(0, 0, win ? 'popup_win' : 'popup_lose'), 860, 700);
      box.add(art);

      const addButton = (x, y, label, cb, blue = false, w = 330) => {
        const group = this.add.container(x, y);
        const im = fit(this.add.image(0, 0, blue ? 'btnblue' : 'btn'), w, 112)
          .setInteractive({ useHandCursor: true });
        const tx = this.add.text(0, 0, label, {
          fontSize: label.length > 15 ? '25px' : '29px',
          fontStyle: 'bold',
          color: '#fff1bb',
          stroke: '#632e17',
          strokeThickness: 6,
          align: 'center',
        }).setOrigin(.5);
        group.add([im, tx]);
        box.add(group);
        im.on('pointerdown', () => {
          this.fx.click();
          this.tweens.add({
            targets: group,
            scaleX: .96,
            scaleY: .96,
            duration: 70,
            yoyo: true,
            onComplete: cb,
          });
        });
        return { group, im, tx };
      };

      if (win) {
        this.winRewardDoubled = false;
        const baseReward = rewardForLevel(this.no);
        const ad = addButton(-185, 190, '▶ МОНЕТЫ ×2', async () => {
          if (this.winRewardDoubled) return;
          ad.im.disableInteractive().setAlpha(.55);
          ad.tx.setText('ЗАГРУЗКА…');
          const ok = await window.BerriesYandex?.showRewardedVideo?.();
          if (ok) {
            const sv = loadSave();
            sv.coins = (sv.coins || 0) + baseReward;
            saveData(sv);
            this.winRewardDoubled = true;
            this.fx.reward();
            ad.tx.setText('✓ МОНЕТЫ ×2');
            ad.im.setAlpha(.7);
          } else {
            ad.tx.setText('РЕКЛАМА НЕДОСТУПНА');
            ad.im.setInteractive({ useHandCursor: true }).setAlpha(1);
          }
        }, true, 350);

        const idx = TEST_LEVELS.indexOf(this.no);
        const next = idx >= 0 ? TEST_LEVELS[idx + 1] : null;
        addButton(185, 190, next ? 'ДАЛЕЕ' : 'КАРТА', () => {
          if (next) this.scene.start('Play', { n: next });
          else this.scene.start('Map');
        }, false, 330);
      } else {
        const ad = addButton(0, 75, '▶ +5 ХОДОВ', async () => {
          if (this.continueUsed) return;
          ad.im.disableInteractive().setAlpha(.55);
          ad.tx.setText('ЗАГРУЗКА…');
          const ok = await window.BerriesYandex?.showRewardedVideo?.();
          if (ok) {
            this.continueUsed = true;
            this.moves += 5;
            this.fx.reward();
            shade.destroy();
            box.destroy();
            this.busy = false;
            window.__berriesGameplayShouldRun = true;
            window.BerriesYandex?.gameplayStart?.();
            this.kingAnim('idle');
            this.updateHud();
            this.scheduleHint();
          } else {
            ad.tx.setText('РЕКЛАМА НЕДОСТУПНА');
            ad.im.setInteractive({ useHandCursor: true }).setAlpha(1);
          }
        }, true, 350);
        addButton(-185, 215, 'КАРТА', () => this.scene.start('Map'), false, 320);
        addButton(185, 215, 'ЗАНОВО', () => this.scene.restart({ n: this.no }), false, 320);
      }

      box.setScale(.84).setAlpha(0);
      this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 250, ease: 'Back.out' });
    };
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => setTimeout(patch, 0), { once: true });
  } else {
    setTimeout(patch, 0);
  }
})();