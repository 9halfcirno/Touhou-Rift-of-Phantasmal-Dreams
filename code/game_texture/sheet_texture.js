import * as THREE from "three";
import { Texture } from "./texture.js";

/**
 * 精灵图纹理
 * 
 * 支持：
 * - 单元格大小
 * - 间隔 spacing
 * - 边框 margin
 * - 行列切换
 * - 自动计算 uv
 */
class SheetTexture extends Texture {
    /**
     * @param {THREE.Texture} tex
     * @param {Object} options
     * 
     * frameWidth   单帧宽度
     * frameHeight  单帧高度
     * spacingX     横向间隔
     * spacingY     纵向间隔
     * marginX      左右边框
     * marginY      上下边框
     */
    constructor(tex, options = {}) {
        super(tex);

        this.frameWidth = options.frameWidth || 32;
        this.frameHeight = options.frameHeight || 32;

        this.spacingX = options.spacingX || 0;
        this.spacingY = options.spacingY || 0;

        this.marginX = options.marginX || 0;
        this.marginY = options.marginY || 0;

        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;

        // 防止别的地方覆盖
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);

        this.updateFrameSize();
    }

    /**
     * 更新 repeat
     */
    updateFrameSize() {
        let tex = this.three.texture;

        tex.repeat.set(
            this.frameWidth / this.width,
            this.frameHeight / this.height
        );
    }

    /**
     * 获取总列数
     */
    get columns() {
        return Math.floor(
            (
                this.width -
                this.marginX * 2 +
                this.spacingX
            ) /
            (
                this.frameWidth +
                this.spacingX
            )
        );
    }

    /**
     * 获取总行数
     */
    get rows() {
        return Math.floor(
            (
                this.height -
                this.marginY * 2 +
                this.spacingY
            ) /
            (
                this.frameHeight +
                this.spacingY
            )
        );
    }

    /**
     * 设置帧
     * 
     * @param {number} x 列
     * @param {number} y 行
     */
    setFrame(x, y) {
        let tex = this.three.texture;

        // 像素坐标
        let px =
            this.marginX +
            x * (this.frameWidth + this.spacingX);

        let py =
            this.marginY +
            y * (this.frameHeight + this.spacingY);

        // UV
        let u = px / this.width;

        // three.js UV 原点在左下
        let v =
            1 -
            (py + this.frameHeight) / this.height;

        tex.offset.set(u, v);

        return this;
    }

    /**
     * 通过索引设置帧
     */
    setFrameIndex(index) {
        let cols = this.columns;

        let x = index % cols;
        let y = Math.floor(index / cols);

        return this.setFrame(x, y);
    }

    /**
     * 获取总帧数, 不一定是 rows * columns，因为可能最后一行不满
     */
    get frameCount() {
        return this.columns * this.rows;
    }

    /**
     * 克隆
     */
    clone() {
        return new SheetTexture(
            this.three.texture.clone(),
            {
                frameWidth: this.frameWidth,
                frameHeight: this.frameHeight,
                spacingX: this.spacingX,
                spacingY: this.spacingY,
                marginX: this.marginX,
                marginY: this.marginY
            }
        );
    }
}

export { SheetTexture };