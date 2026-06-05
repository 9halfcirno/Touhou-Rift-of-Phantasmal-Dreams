import { util } from '../utils/utils.js';

/**
 * 通用回调注册器（轻量级事件循环）
 *
 * 迁移自 code/ticker.js
 */
export class Ticker {
  private ticks: Array<() => void> = [];
  private _isActive = true;
  readonly name: string;

  static tickers = new Map<string, Ticker>();
  static animationFrameId: number | null = null;

  constructor(name?: string) {
    this.name = name || util.uuid();
    if (name && Ticker.tickers.has(name)) {
      console.warn(`[Ticker] Ticker "${name}" 已存在`);
    }
    Ticker.tickers.set(this.name, this);
  }

  get isActive(): boolean {
    return this._isActive;
  }

  add(f: () => void): this {
    if (typeof f !== 'function') throw new Error('[Ticker] 期望一个函数');
    this.ticks.push(f);
    return this;
  }

  remove(f: () => void): this {
    const index = this.ticks.indexOf(f);
    if (index !== -1) this.ticks.splice(index, 1);
    return this;
  }

  clear(): this {
    this.ticks = [];
    return this;
  }

  destroy(): this {
    this.clear();
    this._isActive = false;
    Ticker.tickers.delete(this.name);
    return this;
  }

  tick(): void {
    if (!this._isActive || this.ticks.length === 0) return;
    for (let i = 0; i < this.ticks.length; i++) {
      try {
        this.ticks[i]!();
      } catch (error) {
        console.error('[Ticker] Error:', error);
      }
    }
  }

  get size(): number {
    return this.ticks.length;
  }

  static tickAll(): void {
    let hasActive = false;
    for (const t of Ticker.tickers.values()) {
      if (t.isActive && t.size > 0) {
        t.tick();
        hasActive = true;
      }
    }
    if (hasActive) {
      Ticker.animationFrameId = requestAnimationFrame(Ticker.tickAll);
    } else {
      Ticker.animationFrameId = null;
    }
  }

  static start(): void {
    if (Ticker.animationFrameId) return;
    Ticker.animationFrameId = requestAnimationFrame(() => Ticker.tickAll());
  }

  static stop(): void {
    if (Ticker.animationFrameId !== null) {
      cancelAnimationFrame(Ticker.animationFrameId);
      Ticker.animationFrameId = null;
    }
  }

  static get(name: string): Ticker | undefined {
    return Ticker.tickers.get(name);
  }

  static destroyAll(): void {
    for (const t of Ticker.tickers.values()) t.destroy();
    Ticker.stop();
  }
}
