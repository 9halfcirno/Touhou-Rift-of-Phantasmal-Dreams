import { Config } from "./config.js";

export class RenderSystem {
    constructor() {
        this.frame = 0;
        this._lastRenderTime = 0;
        this.renderDelta = 0;

        this._renderId = 0;
    }

    render() {
        const now = Date.now();

        this.renderDelta = (now - this._lastRenderTime);

        this.update?.()
        // 帧数增加
        this.frame++;
    }

    startRender() {
        if (this._renderId) {
            console.warn(`已在render中，id: ${this._renderId}`);
            return;
        }

        // 初始化时间戳
        this._lastRenderTime = Date.now();

        // 开始tick循环
        const keepRender = () => {
            this.update();
            this.renderDelta = (Date.now() - this._lastTickTime) / 1000; // 计算渲染差时，单位为秒
            this._renderId = requestAnimationFrame(keepRender);
        };

        this._renderId = requestAnimationFrame(keepRender);
    }

    stopRender() {
        cancelAnimationFrame(this._renderId);
        this._rednerId = 0;
    }

    // 重置系统状态
    reset() {
        this.stopRender();
        this.frame = 0;
        this._lastRenderTime = 0;
    }
};