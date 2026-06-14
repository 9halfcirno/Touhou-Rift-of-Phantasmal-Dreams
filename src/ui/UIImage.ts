import * as PIXI from "pixi.js";
import { UIObject } from "./UIObject.js";

/**
 * UI 图片组件 —— 基于 PIXI.Sprite 的响应式图片。
 *
 * 归一化尺寸行为：
 * - normWidth/normHeight = 0（默认）：使用纹理原始尺寸（自动）
 * - normWidth/normHeight > 0：按父容器比例缩放
 *
 * 示例：
 * ```ts
 * const icon = new UIImage(texture);
 * icon.normX = 0; icon.normY = 0;  // 左上角
 * icon.anchorX = 0; icon.anchorY = 0;
 * ```
 */
export class UIImage extends UIObject {
	declare readonly pixi: UIObject["pixi"] & {
		/** 直接引用，便捷访问 */
		sprite: PIXI.Sprite;
	};

	constructor(texture: PIXI.Texture) {
		const sprite = new PIXI.Sprite(texture);
		// 将 Sprite 作为根容器
		super(sprite);
		// 注入 sprite 引用
		(this.pixi as Record<string, unknown>).sprite = sprite;

		// 初始的 PIXI 尺寸由纹理决定
		this._setPixelSize(sprite.width, sprite.height);
	}

	/** 便捷访问底层 PIXI.Sprite */
	get sprite(): PIXI.Sprite {
		return (this.pixi as { sprite: PIXI.Sprite }).sprite;
	}

	/**
	 * 设置纹理并自动更新尺寸。
	 */
	setTexture(texture: PIXI.Texture): void {
		this.sprite.texture = texture;
		this._setPixelSize(texture.width, texture.height);
	}
}
