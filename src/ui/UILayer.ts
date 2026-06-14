import { InputLayer } from "@/input";
import { uuid } from "@/utils/uuid";
import type { UIStack } from "./UIStack.js";
import { UIObject } from "./UIObject.js";
import { UIContainer } from "./UIContainer.js";
import * as PIXI from "pixi.js";

export class UILayer {
	readonly name: string;
	readonly input: InputLayer;
	readonly pixi = {
		group: new PIXI.Container(),
	};
	readonly uuid = uuid();

	/** @internal 由 UIStack 注入的栈引用，用于 popFromStack() */
	_uiStack: UIStack | null = null;

	/**
	 * 被添加到此层的 UIObject 集合。
	 * UILayer 作为顶层容器时，resize 通知此集合中的每个元素。
	 */
	private _uiObjects = new Set<UIObject>();

	/**
	 * 便利根容器 —— 使用本层 pixi.group 作为 PIXI 容器的 UIContainer。
	 * 当需要嵌套布局时可使用此容器，子元素的归一化坐标将相对于层尺寸。
	 * 懒初始化。
	 */
	private _rootContainer: UIContainer | null = null;

	constructor(
		parent?: PIXI.Container,
		name?: string,
		opts: {
			/** InputLayer 构造选项（优先级高于顶层 modal/blockKey） */
			input?: {
				modal?: boolean;
				blockKey?: string[] | 'all';
			};
			/** @deprecated 使用 input.modal 代替 */
			modal?: boolean;
			/** @deprecated 使用 input.blockKey 代替 */
			blockKey?: string[] | 'all';
		} = {},
	) {
		this.name = name ?? `ui-${this.uuid}`;
		this.input = new InputLayer(this.name, {
			// 默认 modal: true —— 每个 UILayer 默认阻断输入向下传播
			modal: opts.input?.modal ?? opts.modal ?? true,
			blockKey: opts.input?.blockKey ?? opts.blockKey ?? [],
		});
		this.pixi.group.visible = false;

		if (parent) {
			parent.addChild(this.pixi.group);

			// default pixi.group.width & height = parent.width & height
			this.pixi.group.width = parent.width;
			this.pixi.group.height = parent.height;
		}
	}

	// ─── 根容器（便利）──────────────────────────────

	/**
	 * 获取本层的根 UIContainer，用于构建嵌套 UI 布局。
	 * 懒初始化：首次调用时以 pixi.group 为底层 PIXI 容器创建。
	 */
	get rootContainer(): UIContainer {
		if (!this._rootContainer) {
			this._rootContainer = new UIContainer(this.pixi.group);
			// 初始尺寸同步
			this._rootContainer.resolveLayout(this.pixi.group.width, this.pixi.group.height);
		}
		return this._rootContainer;
	}

	// ─── 添加/移除 ──────────────────────────────────

	/**
	 * 添加 UI 元素到此层。
	 * - 如果参数是 UIObject，自动追踪并支持 resize（等效于 addUIObject）
	 * - 如果参数是 PIXI.Container，直接挂载到 PIXI 场景图（无 resize 支持）
	 */
	add(ui: unknown): void {
		if (ui instanceof UIObject) {
			this.addUIObject(ui);
		} else if (ui instanceof PIXI.Container) {
			this.pixi.group.addChild(ui);
		}
	}

	/**
	 * 添加 UIObject 到此层并注册 resize 追踪。
	 * 等效于 add() + 自动注册，语义更明确。
	 */
	addUIObject(obj: UIObject): void {
		this._uiObjects.add(obj);
		this.pixi.group.addChild(obj.pixi.container);
		obj._parentLayer = this;
	}

	remove(ui: unknown): void {
		if (ui instanceof PIXI.Container) {
			this.pixi.group.removeChild(ui);
		}
	}

	/**
	 * 移除此层中的 UIObject。
	 */
	removeUIObject(obj: UIObject): void {
		this._uiObjects.delete(obj);
		obj.pixi.container.removeFromParent();
		obj._parentLayer = null;
	}

	display(): void {
		this.pixi.group.visible = true;
	}

	hide(): void {
		this.pixi.group.visible = false;
	}

	attach(parent: PIXI.Container): void {
		if (this.pixi.group.parent !== parent) {
			parent.addChild(this.pixi.group);
		}
	}

	detach(): void {
		if (this.pixi.group.parent) {
			this.pixi.group.parent.removeChild(this.pixi.group);
		}
	}

	/**
	 * 从当前所属 UIStack 中弹出自身。
	 * 如果不在任何栈中（_uiStack 为 null），无操作。
	 */
	popFromStack(): void {
		this._uiStack?.remove(this);
	}

	// ─── 响应式布局 ────────────────────────────────

	/**
	 * 通知本层所有已注册的 UIObject 进行 resize。
	 *
	 * 传播路径：
	 * 1. 遍历 _uiObjects，调用各元素的 onResize(layerWidth, layerHeight)
	 * 2. 若 _rootContainer 已初始化，也通知其 resize
	 *
	 * @param width  本层的像素宽度（通常为 pixi.group.width 或 stage 尺寸）
	 * @param height 本层的像素高度
	 */
	onResize(width: number, height: number): void {
		// 通知扁平 UIObject
		for (const obj of this._uiObjects) {
			obj.onResize(width, height);
		}

		// 通知根容器（若已初始化）
		if (this._rootContainer) {
			this._rootContainer.onResize(width, height);
		}
	}

	destroy(): void {
		// 先从 UIStack 中移除（自动处理 PIXI detach + InputStack pop）
		this._uiStack?.remove(this);

		// 清理 UIObject 引用
		this._uiObjects.clear();
		if (this._rootContainer) {
			this._rootContainer.destroy();
			this._rootContainer = null;
		}

		this.detach();
		this.input._reset();
		this.input.popFromStack();
	}
}
