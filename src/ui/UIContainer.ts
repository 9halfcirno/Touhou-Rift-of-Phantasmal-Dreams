import * as PIXI from "pixi.js";
import { UIObject } from "./UIObject.js";

/**
 * UI 容器 —— 可包含子 UIObject 的响应式布局容器。
 *
 * 与 PIXI 场景图的区别：
 * - PIXI 场景图负责渲染遍历（children 列表在 PIXI.Container 内部）
 * - UIContainer 管理**逻辑子元素列表**，负责递归调用 onResize()
 * - 子元素的归一化坐标相对于本容器（而非顶层 stage）
 *
 * 使用方式：
 * ```ts
 * const panel = new UIContainer();
 * panel.normX = 0.5;  panel.normY = 0.5;
 * panel.anchorX = 0.5; panel.anchorY = 0.5;
 * panel.normWidth = 0.6; panel.normHeight = 0.4;
 *
 * const title = new UILabel("菜单");
 * title.normX = 0.5; title.anchorX = 0.5;
 * panel.addChild(title);
 *
 * // resize 时 panel.onResize() 会自动传播到 title
 * ```
 */
export class UIContainer extends UIObject {
	/** 逻辑子元素列表 */
	private _children: UIObject[] = [];

	constructor(pixiContainer?: PIXI.Container) {
		super(pixiContainer);
	}

	// ─── 子元素管理 ────────────────────────────────

	/**
	 * 添加子 UI 元素。
	 * 同时将子元素的 PIXI.Container 挂载到本容器的 PIXI 场景图中。
	 */
	addChild(child: UIObject): void {
		this._children.push(child);
		this.pixi.container.addChild(child.pixi.container);
	}

	/**
	 * 移除子 UI 元素。
	 * @returns 是否成功移除
	 */
	removeChild(child: UIObject): boolean {
		const idx = this._children.indexOf(child);
		if (idx === -1) return false;
		this._children.splice(idx, 1);
		child.pixi.container.removeFromParent();
		return true;
	}

	/** 获取子元素数量 */
	get childCount(): number {
		return this._children.length;
	}

	/** 按索引获取子元素 */
	getChildAt(index: number): UIObject | undefined {
		return this._children[index];
	}

	/** 迭代所有子元素 */
	forEachChild(fn: (child: UIObject, index: number) => void): void {
		this._children.forEach(fn);
	}

	// ─── 布局（覆写）────────────────────────────────

	/**
	 * 先计算自身布局，再将**本容器的实际像素尺寸**传递给子元素。
	 *
	 * 关键：子元素的归一化坐标是相对于本容器的像素尺寸，
	 * 所以传给子元素的是 computedWidth/computedHeight，而非原始 parentWidth。
	 */
	override onResize(parentWidth: number, parentHeight: number): void {
		// 先解析自身在父容器中的位置
		this.resolveLayout(parentWidth, parentHeight);

		// 以本容器的像素尺寸为参考，递归通知子元素
		const myW = this.computedWidth;
		const myH = this.computedHeight;

		for (const child of this._children) {
			child.onResize(myW, myH);
		}
	}

	override destroy(): void {
		// 先销毁子元素
		for (const child of this._children) {
			child.destroy();
		}
		this._children.length = 0;
		super.destroy();
	}
}
