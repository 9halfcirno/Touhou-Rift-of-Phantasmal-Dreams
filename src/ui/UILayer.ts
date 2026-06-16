import { InputLayer } from "@/input";
import { uuid } from "@/utils/uuid";
import type { UIStack } from "./UIStack.js";
import * as PIXI from "pixi.js";
import { LayoutStyles } from "@pixi/layout";

export class UILayer {
	readonly name: string;
	readonly input: InputLayer;
	readonly container: PIXI.Container;
	
	readonly uuid = uuid();

	/** @internal 由 UIStack 注入的栈引用，用于 popFromStack() */
	_uiStack: UIStack | null = null;

	constructor(
		parent?: PIXI.Container,
		name?: string,
		opts: {
			/** InputLayer 构造选项（优先级高于顶层 modal/blockKey） */
			input?: {
				modal?: boolean;
				blockKey?: string[] | 'all';
			};
			layout?: LayoutStyles
		} = {},
	) {
		this.name = name ?? `ui-${this.uuid}`;
		this.container = new PIXI.Container({
			layout: opts.layout // as Omit<LayoutStyles, "target">
		});
		/**
		 * @deprecated 由于pixi独特的事件系统, 此属性在应用是无用
		 */
		this.input = new InputLayer(this.name, {
			// 默认 modal: true —— 每个 UILayer 默认阻断输入向下传播
			modal: opts.input?.modal ?? true,
			blockKey: opts.input?.blockKey ?? [],
		});
		this.container.visible = false;

		if (parent) {
			parent.addChild(this.container);
		}
	}

	add(child: PIXI.ContainerChild) {
		this.container.addChild(child);
	}

	remove(child: PIXI.ContainerChild) {
		this.container.removeChild(child);
	}

	clear() {
		this.container.removeChildren();
	}

	display(): void {
		this.container.visible = true;
	}

	hide(): void {
		this.container.visible = false;
	}

	attach(parent: PIXI.Container): void {
		if (this.container.parent !== parent) {
			this.container.removeFromParent(); // 从原parent移除
			parent.addChild(this.container);
		}
	}

	detach(): void {
		if (this.container.parent) {
			this.container.parent.removeChild(this.container);
		}
	}

	/**
	 * 从当前所属 UIStack 中弹出自身。
	 * 如果不在任何栈中（_uiStack 为 null），无操作。
	 */
	popFromStack(): void {
		this._uiStack?.remove(this);
	}


	destroy(): void {
		this._uiStack?.remove(this);

		this.detach();
		this.clear();
		this.input._reset();
		this.input.popFromStack();
	}
}
