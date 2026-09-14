(() => {
  'use strict';

  const W = 1920;
  const H = 1080;
  const R = 8;
  const C = 8;
  const CELL = 96;
  const BY = 150;
  const TYPES = ['strawberry','raspberry','blueberry','gooseberry','blackberry','cloudberry'];
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

  function getPlayPrototype() {
    const scene = window.__berriesGame?.scene?.keys?.Play;
    return scene ? Object.getPrototypeOf(scene) : null;
  }

  function patch() {
    const proto = getPlayPrototype();
    if (!proto || proto.__berriesFixV05) return;
    proto.__berriesFixV05 = true;

    // --- Gravity / ice QA fix -------------------------------------------------
    // Frozen cells are hard anchors. Surviving berries keep their sprites.
    // New berries in the top segment fall from above the board.
    // New berries in a segment BELOW an intact ice/root/acorn anchor are born
    // at the top of that local open segment, so nothing visually falls through ice.
    proto.fallRefill = async function fallRefillV05() {
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
          if (this.cell[r][c].block || this.cell[r][c].ice) {
            // Re-render the anchor once to guarantee exactly one berry + overlay.
            // The berry under ice stays in the same logical cell.
            this.render(r, c, false, false);
            r--;
            continue;
          }

          const bottom = r;
          while (r >= 0 && !this.cell[r][c].block && !this.cell[r][c].ice) r--;
          const top = r + 1;
          const hasAnchorAbove = top > 0 && (this.cell[top - 1][c].block || this.cell[top - 1][c].ice);

          const existing = [];
          for (let rr = bottom; rr >= top; rr--) {
            if (this.board[rr][c]) {
              existing.push({ item: this.board[rr][c], sprite: this.spr[rr][c], from: rr });
            }
          }

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
                  duration: 210 + distance * 95,
                  ease: 'Cubic.in',
                  onComplete: () => {
                    this.tweens.add({
                      targets: s,
                      scaleX: (s.getData('sx') || s.scaleX) * 1.04,
                      scaleY: (s.getData('sy') || s.scaleY) * 0.94,
                      duration: 75,
                      yoyo: true,
                      ease: 'Sine.inOut',
                    });
                    resolve();
                  },
                });
              }));
            }
          }

          let spawnIndex = 0;
          while (target >= top) {
            const tr = target--;
            this.board[tr][c] = { id: Phaser.Utils.Array.GetRandom(availableTypes), sp: null };
            this.render(tr, c, false, false);
            const s = this.spr[tr][c];
            if (!s) continue;
            rebind(s, tr, c);
            const p = this.pos(tr, c);
            const finalAngle = s.getData('ang') ?? s.angle ?? 0;
            const finalSX = s.getData('sx') || s.scaleX;
            const finalSY = s.getData('sy') || s.scaleY;
            spawnIndex++;

            if (hasAnchorAbove) {
              // Do not cross the intact ice/blocker visually.
              const segmentTopY = this.pos(top, c).y;
              s.y = segmentTopY - 18 - (spawnIndex - 1) * 8;
              s.x = p.x;
              s.alpha = 0;
              s.setScale(finalSX * .66, finalSY * .66);
              animations.push(new Promise(resolve => {
                this.tweens.add({
                  targets: s,
                  y: p.y,
                  alpha: 1,
                  scaleX: finalSX,
                  scaleY: finalSY,
                  angle: finalAngle,
                  duration: 300 + spawnIndex * 45,
                  ease: 'Back.out',
                  onComplete: resolve,
                });
              }));
            } else {
              const startY = BY - CELL * spawnIndex - 35;
              s.y = startY;
              s.x = p.x;
              s.angle = finalAngle + (Math.random() - .5) * 12;
              s.alpha = .98;
              animations.push(new Promise(resolve => {
                this.tweens.add({
                  targets: s,
                  y: p.y,
                  angle: finalAngle,
                  alpha: 1,
                  duration: 410 + spawnIndex * 55 + (tr - top) * 20,
                  ease: 'Bounce.out',
                  onComplete: resolve,
                });
              }));
            }
          }
        }
      }

      if (animations.length) await Promise.all(animations);
      await pause(80);
    };

    // --- Explain specials clearly --------------------------------------------
    proto.showSpecialInfo = function showSpecialInfoV05(sp, autoHide = 2600) {
      const text = sp === 'line_h'
        ? 'ПОЛОСКАТАЯ ЯГОДА  •  собери её в комбинацию — очистит весь РЯД'
        : sp === 'line_v'
          ? 'ПОЛОСКАТАЯ ЯГОДА  •  собери её в комбинацию — очистит всю КОЛОНКУ'
          : sp === 'bomb'
            ? 'БОМБА  •  собери её в комбинацию — взрыв 3×3'
            : sp === 'rainbow'
              ? 'РАДУГА  •  поменяй с любой ягодой — уберёт все ягоды этого цвета'
              : '';
      if (!text) return;

      if (!this.specialInfoText) {
        this.specialInfoText = this.add.text(W / 2, 1015, '', {
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#fff6cf',
          stroke: '#4a2515',
          strokeThickness: 5,
          backgroundColor: '#2c1a10cc',
          padding: { x: 18, y: 10 },
          align: 'center',
        }).setOrigin(.5).setDepth(25).setAlpha(0);
      }
      clearTimeout(this.specialInfoTimer);
      this.specialInfoText.setText(text).setAlpha(1).setScale(.96);
      this.tweens.add({ targets: this.specialInfoText, scale: 1, duration: 130, ease: 'Back.out' });
      if (autoHide) {
        this.specialInfoTimer = setTimeout(() => {
          if (!this.specialInfoText?.scene) return;
          this.tweens.add({ targets: this.specialInfoText, alpha: 0, duration: 220 });
        }, autoHide);
      }
    };

    const oldSelect = proto.select;
    proto.select = function selectV05(r, c) {
      oldSelect.call(this, r, c);
      const sp = this.board?.[r]?.[c]?.sp;
      if (sp) this.showSpecialInfo(sp, 3200);
    };

    const oldSpecialCreateFx = proto.specialCreateFx;
    proto.specialCreateFx = function specialCreateFxV05(p) {
      oldSpecialCreateFx.call(this, p);
      const sp = this.board?.[p.r]?.[p.c]?.sp;
      if (sp) {
        this.showSpecialInfo(sp, 3000);
        const s = this.spr?.[p.r]?.[p.c];
        if (s) {
          const sx = s.getData('sx') || s.scaleX;
          const sy = s.getData('sy') || s.scaleY;
          this.tweens.add({
            targets: s,
            scaleX: sx * 1.10,
            scaleY: sy * 1.10,
            duration: 230,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.inOut',
          });
        }
      }
    };
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => setTimeout(patch, 0), { once: true });
  } else {
    setTimeout(patch, 0);
  }
})();
