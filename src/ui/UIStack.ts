import { UILayer } from "./UILayer";
import { InputStack } from "@/input/InputStack";
import * as PIXI from "pixi.js";

/**
 * UI 层叠栈 —— 管理 UILayer 的生命周期、渲染顺序和输入协同。
 *
 * 与 InputStack 镜像设计：
 * - push 时自动挂载 PIXI group 到 root、push 关联的 InputLayer
 * - pop/remove 时自动 detach、从 InputStack 移除
 * - UILayer 默认 InputLayer 为 modal，阻断输入穿透但**不影响渲染可见性**
 *
 * 用法：
 *   const uiStack = new UIStack(game.ui.pixi.app.stage, game.InputStack);
 *   const menuLayer = new UILayer(undefined, 'pause_menu', { input: { modal: true } });
 *   uiStack.push(menuLayer);
 */
export class UIStack {
	private _layers: UILayer[] = [];
	readonly root: PIXI.Container;
	private _inputStack: InputStack;

	constructor(root: PIXI.Container, inputStack: InputStack) {
		this.root = root;
		this._inputStack = inputStack;
	}

	// ─── 层管理 ──────────────────────────────

	/** 压入栈顶。自动从旧位置移除 → 挂载到 root → display → push InputLayer → 注入 _uiStack */
	push(layer: UILayer): void {
		this._removeFromArray(layer);
		this._layers.push(layer);
		layer.attach(this.root);
		layer.display();
		// this._inputStack.push(layer.input);
		layer._uiStack = this;
	}

	/** 弹出栈顶。detach → 从 InputStack 移除 → hide → 清除 _uiStack → 返回 */
	pop(): UILayer | undefined {
		if (this._layers.length === 0) return;
		const layer = this._layers.pop()!;
		layer.detach();
		// this._inputStack.remove(layer.input);
		layer.hide();
		layer._uiStack = null;
		return layer;
	}

	/** 从栈中任意位置移除（自动清除 _uiStack） */
	remove(layer: UILayer): void {
		const idx = this._layers.indexOf(layer);
		if (idx === -1) return;
		this._layers.splice(idx, 1);
		layer.detach();
		this._inputStack.remove(layer.input);
		layer.hide();
		layer._uiStack = null;
	}

	/** 替换栈顶层 */
	replaceTop(layer: UILayer): void {
		this.pop();
		this.push(layer);
	}

	/** 当前栈顶层 */
	get activeLayer(): UILayer | null {
		return this._layers.length > 0
			? this._layers[this._layers.length - 1]!
			: null;
	}

	/** activeLayer 别名 */
	get top(): UILayer | null {
		return this.activeLayer;
	}

	/** 栈中层数量 */
	get layerCount(): number {
		return this._layers.length;
	}

	/** 销毁：逐层 pop，清空栈 */
	destroy(): void {
		while (this._layers.length > 0) {
			this.pop();
		}
	}

	// ─── 内部 ────────────────────────────────

	private _removeFromArray(layer: UILayer): void {
		const idx = this._layers.indexOf(layer);
		if (idx !== -1) {
			this._layers.splice(idx, 1);
		}
	}
}
