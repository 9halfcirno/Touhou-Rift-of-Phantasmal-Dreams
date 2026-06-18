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
  fps = 0;

  private _renderId = 0;
  private _lastFrameTime = 0;

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

    this._lastFrameTime = performance.now();

    const keepRender = () => {
      let now = performance.now();
      this.renderDelta = (now - this._lastFrameTime) / 1000;
      this.fps = Math.floor(1 / this.renderDelta);
      this._lastFrameTime = now;

      this.render();

      this._renderId = requestAnimationFrame(keepRender);
    };

    this._renderId = requestAnimationFrame(keepRender);
  }

  stopRender(): void {
    cancelAnimationFrame(this._renderId);
    this._renderId = 0;
  }
}
