import * as PIXI from "pixi.js";
import { UIObject } from "./UIObject.js";

/**
 * UI 文本组件 —— 基于 PIXI.Text 的响应式文本。
 *
 * 归一化尺寸行为：
 * - normWidth/normHeight = 0（默认）：由文本内容决定尺寸
 * - normWidth/normHeight > 0：按父容器比例缩放（可能导致文字被拉伸）
 *
 * 示例：
 * ```ts
 * const label = new UILabel("分数: 100", {
 *   fontSize: 24,
 *   fill: 0xffffff,
 * });
 * label.normX = 1; label.normY = 0;
 * label.anchorX = 1; label.anchorY = 0;  // 右上角
 * ```
 */
export class UILabel extends UIObject {
	declare readonly pixi: UIObject["pixi"] & {
		/** 直接引用，便捷访问 */
		text: PIXI.Text;
	};

	constructor(
		text: string,
		style?: Partial<PIXI.TextStyle> | PIXI.TextStyle,
	) {
		const pixiText = new PIXI.Text({ text, style: style as PIXI.TextStyle });
		super(pixiText);
		(this.pixi as Record<string, unknown>).text = pixiText;

		// 初始尺寸由文本内容决定
		this._setPixelSize(pixiText.width, pixiText.height);
	}

	/** 便捷访问底层 PIXI.Text */
	get textObj(): PIXI.Text {
		return (this.pixi as { text: PIXI.Text }).text;
	}

	/** 获取/设置文本内容，设置后自动更新尺寸 */
	get content(): string {
		return this.textObj.text;
	}
	set content(value: string) {
		this.textObj.text = value;
		this._refreshSize();
	}

	/** 获取/设置文本样式，设置后自动更新尺寸 */
	get textStyle(): PIXI.TextStyle {
		return this.textObj.style;
	}
	set textStyle(style: PIXI.TextStyle) {
		this.textObj.style = style;
		this._refreshSize();
	}

	private _refreshSize(): void {
		this._setPixelSize(this.textObj.width, this.textObj.height);
	}
}
