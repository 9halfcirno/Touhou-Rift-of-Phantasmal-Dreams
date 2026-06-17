import { KeyboardInput } from './KeyboardInput.js';
import { MouseInput, type WheelState } from './MouseInput.js';
import { PointerInput } from './PointerInput.js';
import { InputLayer } from './InputLayer.js';

/**
 * 输入层堆栈 —— 管理 InputLayer 的生命周期和事件派发。
 *
 * 拥有全局 DOM 事件监听，按栈顺序（顶→底）派发到各 InputLayer。
 * modal 层阻断所有事件向下传播；blockKey 阻断指定键向下传播。
 *
 * 用法：
 *   const stack = new InputStack(canvas);
 *   const gameplayLayer = new InputLayer('gameplay');
 *   stack.push(gameplayLayer);
 *   // ... 后续通过 gameplayLayer.key() / gameplayLayer.onKey() 访问输入
 *   stack.pop(); // 不需要时弹出
 *
 * 注：每应用只应创建一个 InputStack 实例。
 */
export class InputStack {
	private _layers: InputLayer[] = [];
	private bottomLayer: InputLayer;
	domElement: HTMLElement;

	constructor(element: HTMLElement) {
		this.domElement = element;
		MouseInput.bind(element);
		let bottom = new InputLayer("bottom")
		this.push(bottom);
		this.bottomLayer = bottom; // 以便躲过push中的检测
		this._bindEvents();
	}

	// ─── 层管理 ──────────────────────────────────

	/** 压入栈顶（自动从旧位置移除，并注入 _stack 引用） */
	push(layer: InputLayer): void {
		if (layer === this.bottomLayer) return;
		this.remove(layer);
		this.bottom?._reset();
		this._layers.push(layer);
		layer.mouse.bind(this.domElement);
		layer._stack = this;
	}

	/** 弹出栈顶并返回（自动清除 _stack 引用） */
	pop(): InputLayer | undefined {
		if (this.bottomLayer.uuid === this._layers[this._layers.length - 1].uuid) return; // 保证最底层输入层不会被移出
		const layer = this._layers.pop();
		if (layer) {
			layer._reset();
			layer._stack = null;
		}
		return layer;
	}

	/** 从栈中任意位置移除（自动清除 _stack 引用） */
	remove(layer: InputLayer): void {
		if (layer === this.bottomLayer) return;
		const idx = this._layers.indexOf(layer);
		if (idx !== -1) {
			this._layers.splice(idx, 1);
			layer._reset();
			layer._stack = null;
		}
	}

	/** 替换栈顶层 */
	replaceTop(layer: InputLayer): void {
		this.pop();
		this.push(layer);
	}

	/** 当前栈顶层（接收输入的最优先层） */
	get activeLayer(): InputLayer | null {
		return this._layers.length > 0
			? this._layers[this._layers.length - 1]!
			: this.bottom;
	}

	get top() {
		return this.activeLayer;
	}

	get bottom() {
		return this.bottomLayer;
	}

	/** 层数量 */
	get layerCount(): number {
		return this._layers.length;
	}

	/** 销毁：解绑所有 DOM 事件，清空层栈 */
	destroy(): void {
		this._unbindEvents();
		this._layers = [];
	}

	// ─── DOM 事件绑定 ────────────────────────────

	private _bound = false;

	private _bindEvents(): void {
		if (this._bound) return;
		this._bound = true;

		window.addEventListener('keydown', this._onKeyDown);
		window.addEventListener('keyup', this._onKeyUp);
		this.domElement.addEventListener('mousedown', this._onMouseDown);
		window.addEventListener('mouseup', this._onMouseUp);
		this.domElement.addEventListener('wheel', this._onWheel);
		this.domElement.addEventListener('mousemove', this._onMouseMove);
		// this.domElement.addEventListener('pointerdown', this._onPointerDown);
		// window.addEventListener('pointerup', this._onPointerUp);
		// this.domElement.addEventListener('pointermove', this._onPointerMove);
		// window.addEventListener('pointercancel', this._onPointerCancel);
		// window.addEventListener('blur', this._onBlur);
		// document.addEventListener('visibilitychange', this._onVisibilityChange);
	}

	private _unbindEvents(): void {
		if (!this._bound) return;
		this._bound = false;

		window.removeEventListener('keydown', this._onKeyDown);
		window.removeEventListener('keyup', this._onKeyUp);
		this.domElement.removeEventListener('mousedown', this._onMouseDown);
		window.removeEventListener('mouseup', this._onMouseUp);
		this.domElement.removeEventListener('wheel', this._onWheel);
		this.domElement.removeEventListener('mousemove', this._onMouseMove);
		// this.domElement.removeEventListener('pointerdown', this._onPointerDown);
		// window.removeEventListener('pointerup', this._onPointerUp);
		// this.domElement.removeEventListener('pointermove', this._onPointerMove);
		// window.removeEventListener('pointercancel', this._onPointerCancel);
		// window.removeEventListener('blur', this._onBlur);
		// document.removeEventListener('visibilitychange', this._onVisibilityChange);
	}

	_onKeyDown = (e: KeyboardEvent) => {
		let key = e.key.toLowerCase();
		let blocked = false;
		for (let i = this._layers.length - 1; i >= 0; i--) {
			const layer = this._layers[i];

			if (!blocked) layer._handleKeyUpdate(key, true)
			else layer._handleKeyUpdate(key, false);				
			
			
			if (layer.keyboard.blocks === "all" || layer.keyboard.blocks.includes(key)) {
				blocked = true;
			}
		}
		e.preventDefault();
	}

	_onKeyUp = (e: KeyboardEvent) => {
		let key = e.key.toLowerCase();
		for (let i = this._layers.length - 1; i >= 0; i--) {
			const layer = this._layers[i];
			layer._handleKeyUpdate(key, false);
		}
	}

	_onMouseDown = (e: MouseEvent) => {
		let blocked = false;
		for (let i = this._layers.length - 1; i >= 0; i--) {
			const layer = this._layers[i];

			if (!blocked) layer._handleMouseBtnUpdate(e.button, true, e);
			else layer._handleMouseBtnUpdate(e.button, false, e);

			if (layer.mouse.modal) {
				blocked = true;
			}
		}
	}

	_onMouseUp = (e: MouseEvent) => {
		for (let i = this._layers.length - 1; i >= 0; i--) {
			const layer = this._layers[i];
			layer._handleMouseBtnUpdate(e.button, false, e);
		}
	}

	_onMouseMove = (e: MouseEvent) => {
		for (let i = this._layers.length - 1; i >= 0; i--) {
			const layer = this._layers[i];
			layer._handleMousePosUpdate(e);
			if (layer.mouse.modal) return; // stop bottom update
		}
	} 

	_onWheel = (e: WheelEvent) => {
		for (let i = this._layers.length - 1; i >= 0; i--) {
			const layer = this._layers[i];
			layer._handleWheel(e);
			if (layer.mouse.modal) return; // stop bottom update
		}
	}
}
