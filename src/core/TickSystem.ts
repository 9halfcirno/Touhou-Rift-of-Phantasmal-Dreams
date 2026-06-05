import { Config } from './Config.js';

/**
 * 固定步长逻辑循环（25Hz）
 *
 * 使用 requestAnimationFrame 驱动，内部保持固定 tick 间隔。
 * 支持帧追赶（最多 5 帧）。
 *
 * 迁移自 code/tick_system.js
 */
export class TickSystem {
  frame = 0;
  tickP = 0;
  tickDelta = 0;

  private _lastTickTime = 0;
  private _maxTickNum = 5;
  private _tickId = 0;

  /** 由 Game 注入的更新回调 */
  update: (() => void) | null = null;

  private needTick(): boolean {
    return Date.now() - this._lastTickTime > Config.game_tick_interval;
  }

  tick(): void {
    const now = Date.now();
    let tickCount = 0;
    this.tickDelta = (now - this._lastTickTime) / Config.game_tick_interval;

    while (this.needTick() && tickCount < this._maxTickNum) {
      this.update?.();
      this._lastTickTime += Config.game_tick_interval;
      this.frame++;
      tickCount++;

      if (now - this._lastTickTime > Config.game_tick_interval * this._maxTickNum) {
        this._lastTickTime = now - Config.game_tick_interval;
      }
    }
  }

  startTick(): void {
    if (this._tickId) {
      console.warn(`已在 tick 中，id: ${this._tickId}`);
      return;
    }

    this._lastTickTime = Date.now();

    const keepTick = () => {
      this.tick();
      this.tickP = (Date.now() - this._lastTickTime) / Config.game_tick_interval;
      this._tickId = requestAnimationFrame(keepTick);
    };

    this._tickId = requestAnimationFrame(keepTick);
  }

  stopTick(): void {
    cancelAnimationFrame(this._tickId);
    this._tickId = 0;
  }
}
