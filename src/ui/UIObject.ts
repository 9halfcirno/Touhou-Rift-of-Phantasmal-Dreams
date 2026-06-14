import * as PIXI from "pixi.js";
import { uuid } from "@/utils/uuid.ts";

/**
 * UI 元素基类 —— 归一化坐标 + 响应式布局。
 *
 * 与 GameObject 体系镜像设计：
 * - 组合 PIXI.Container（类似 GameObject 组合 THREE.Object3D）
 * - 归一化坐标 (0-1) 存储布局意图
 * - resolveLayout() 将归一化坐标转为 PIXI 像素坐标（类似 updateThreeData）
 * - onResize() 作为 resize 事件的入口（类似 tweenThree）
 *
 * ## 锚点系统
 *
 * (anchorX, anchorY) 决定元素自身哪个参考点对齐到归一化目标位置。
 * - (0, 0) = 左上角
 * - (0.5, 0.5) = 中心
 * - (1, 1) = 右下角
 *
 * ## 示例
 *
 * ```ts
 * // 元素右下角对齐到父容器 80% 位置，再加 10px 左边距
 * obj.normX = 0.8;
 * obj.normY = 0.8;
 * obj.anchorX = 1;
 * obj.anchorY = 1;
 * obj.offsetX = -10;
 * ```
 */
export abstract class UIObject {
	// ─── PIXI ─────────────────────────────────────

	readonly pixi: {
		container: PIXI.Container;
	};

	// ─── 归一化坐标 (0-1) ─────────────────────────

	/** 锚点在父容器中的归一化 X 位置（0 = 左侧，1 = 右侧） */
	x = 0;
	/** 锚点在父容器中的归一化 Y 位置（0 = 顶部，1 = 底部） */
	y = 0;

	/**
	 * 归一化宽度。0 表示自动（由内容/纹理决定），>0 时为父容器宽度的比例。
	 * 例如 0.5 表示父容器宽度的 50%。
	 */
	normWidth = 0;
	/**
	 * 归一化高度。0 表示自动（由内容/纹理决定），>0 时为父容器高度的比例。
	 */
	normHeight = 0;

	// ─── 锚点 (0-1) ───────────────────────────────

	/**
	 * 元素自身水平锚点。
	 * 0 = 左边缘对齐目标，0.5 = 中心对齐，1 = 右边缘对齐。
	 */
	anchorX = 0;
	/**
	 * 元素自身垂直锚点。
	 * 0 = 上边缘对齐目标，0.5 = 中心对齐，1 = 下边缘对齐。
	 */
	anchorY = 0;

	// ─── 像素偏移 ──────────────────────────────────

	/** 锚点对齐后的水平像素偏移（向右为正） */
	offsetX = 0;
	/** 锚点对齐后的垂直像素偏移（向下为正） */
	offsetY = 0;

	// ─── 计算后的像素值（resolveLayout 后更新）─────

	/** 计算后的实际像素 X 坐标 */
	computedX = 0;
	/** 计算后的实际像素 Y 坐标 */
	computedY = 0;
	/** 计算后的实际像素宽度 */
	computedWidth = 0;
	/** 计算后的实际像素高度 */
	computedHeight = 0;

	// ─── 标识 ──────────────────────────────────────

	readonly uuid = uuid();

	// ─── 父级引用 ──────────────────────────────────

	/**
	 * 所属 UILayer（由 UILayer._registerUIObject 设置）。
	 * 类型为 unknown 以避免循环引用；实际类型为 UILayer。
	 */
	_parentLayer: unknown = null;

	// ─── 构造函数 ──────────────────────────────────

	constructor(pixiContainer?: PIXI.Container) {
		this.pixi = {
			container: pixiContainer ?? new PIXI.Container(),
		};
		this.pixi.container.label = `ui:${this.uuid.slice(0, 8)}`;
	}

	// ─── 布局解析 ──────────────────────────────────

	/**
	 * 将归一化坐标解析为 PIXI 像素坐标。
	 *
	 * 内部公式：
	 * ```
	 * elemW = normWidth  > 0 ? normWidth  * parentW : container.width
	 * elemH = normHeight > 0 ? normHeight * parentH : container.height
	 * targetX = normX * parentW
	 * targetY = normY * parentH
	 * container.x = targetX - anchorX * elemW + offsetX
	 * container.y = targetY - anchorY * elemH + offsetY
	 * ```
	 */
	resolveLayout(parentWidth: number, parentHeight: number): void {
		const c = this.pixi.container;

		const elemW = this.normWidth > 0
			? this.normWidth * parentWidth
			: c.width;
		const elemH = this.normHeight > 0
			? this.normHeight * parentHeight
			: c.height;

		const targetX = this.x * parentWidth;
		const targetY = this.y * parentHeight;

		c.x = targetX - this.anchorX * elemW + this.offsetX;
		c.y = targetY - this.anchorY * elemH + this.offsetY;

		this.computedX = c.x;
		this.computedY = c.y;
		this.computedWidth = elemW;
		this.computedHeight = elemH;
	}

	/**
	 * Resize 事件回调。
	 * 默认直接调用 resolveLayout。子类（如 UIContainer）覆写以递归传播。
	 */
	onResize(parentWidth: number, parentHeight: number): void {
		this.resolveLayout(parentWidth, parentHeight);
	}

	// ─── 尺寸辅助 ──────────────────────────────────

	/**
	 * 将元素宽度设置为固定像素值，同时清除 normWidth。
	 * 用于初始化时设定内容尺寸。
	 */
	protected _setPixelSize(width: number, height: number): void {
		this.pixi.container.width = width;
		this.pixi.container.height = height;
		this.normWidth = 0;
		this.normHeight = 0;
	}

	// ─── 生命周期 ──────────────────────────────────

	destroy(): void {
		this.pixi.container.removeFromParent();
		this.pixi.container.destroy({ children: true });
	}
}
