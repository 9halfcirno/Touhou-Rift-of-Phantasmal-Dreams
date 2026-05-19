import { Config } from "./config.js";

export class RenderSystem {
    constructor() {
        this.frame = 0;

        // 秒
        this.renderDelta = 0;

        this._renderId = 0;

        this._lastFrameTime = 0;
        this._lastRenderTime = 0;
    }

    render() {
        this.update?.();
        this.frame++;
    }

    startRender() {
        if (this._renderId) {
            console.warn(`已在render中，id: ${this._renderId}`);
            return;
        }

        const maxFPS = Config["max_fps"] === 0 ? 10000 : (Config["max_fps"] || 60);
        const minFrameTime = 1000 / maxFPS;

        this._lastFrameTime = performance.now();
        this._lastRenderTime = this._lastFrameTime;

        const keepRender = (now) => {
            // rAF真实delta
            this.renderDelta = (now - this._lastFrameTime) / 1000;
            this._lastFrameTime = now;

            // 限制渲染频率
            if ((now - this._lastRenderTime) >= minFrameTime) {

                // 关键：
                // 不要直接 = now
                // 会累积误差导致11fps问题

                this._lastRenderTime += minFrameTime;

                // 防止长时间卡顿后追帧爆炸
                if ((now - this._lastRenderTime) > 1000) {
                    this._lastRenderTime = now;
                }

                this.render();
            }

            this._renderId = requestAnimationFrame(keepRender);
        };

        this._renderId = requestAnimationFrame(keepRender);
    }

    stopRender() {
        cancelAnimationFrame(this._renderId);
        this._renderId = 0;
    }

    reset() {
        this.stopRender();

        this.frame = 0;
        this.renderDelta = 0;

        this._lastFrameTime = 0;
        this._lastRenderTime = 0;
    }
}