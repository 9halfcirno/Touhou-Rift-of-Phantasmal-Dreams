import { Config } from './Config.js';

/**
 * 可变帧率渲染循环
 *
 * 使用 requestAnimationFrame 驱动，支持 max_fps 限制。
 *
 * 迁移自 code/render_system.js
 */
export class RenderSystem {
  frame = 0;
  renderDelta = 0;

  private _renderId = 0;
  private _lastFrameTime = 0;
  private _lastRenderTime = 0;

  /** 由 Game 注入的渲染回调 */
  update: (() => void) | null = null;

  render(): void {
    this.update?.();
    this.frame++;
  }

  startRender(): void {
    if (this._renderId) {
      console.warn(`已在 render 中，id: ${this._renderId}`);
      return;
    }

    const maxFPS = Config.max_fps === 0 ? 10000 : (Config.max_fps || 60);
    const minFrameTime = 1000 / maxFPS;

    this._lastFrameTime = performance.now();
    this._lastRenderTime = this._lastFrameTime;

    const keepRender = (now: number) => {
      this.renderDelta = (now - this._lastFrameTime) / 1000;
      this._lastFrameTime = now;

      if (now - this._lastRenderTime >= minFrameTime) {
        this._lastRenderTime += minFrameTime;

        if (now - this._lastRenderTime > 1000) {
          this._lastRenderTime = now;
        }

        this.render();
      }

      this._renderId = requestAnimationFrame(keepRender);
    };

    this._renderId = requestAnimationFrame(keepRender);
  }

  stopRender(): void {
    cancelAnimationFrame(this._renderId);
    this._renderId = 0;
  }
}
