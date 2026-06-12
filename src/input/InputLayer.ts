import * as THREE from 'three';
import type { KeyState } from './KeyboardInput.js';
import type { WheelState } from './MouseInput.js';
import { MouseInput } from './MouseInput.js';
import type { PointerState } from './PointerInput.js';
import { PointerInput } from './PointerInput.js';
import { util } from '../utils/utils.js';
import { GameCamera } from '@/objects/GameCamera.js';
import { GameMap } from '@/map/index.js';
import { uuid } from '@/utils/uuid.js';

// ═══════════════════════════════════════════════════════════════
// 内部包装类（同文件，访问 InputLayer 的 _ 前缀内部成员）
// ═══════════════════════════════════════════════════════════════

/**
 * 键盘输入命名空间，挂载在 InputLayer.keyboard 上。
 * 提供按键状态查询和回调注册。
 */
class InputLayerKeyboard {
	constructor(private _layer: InputLayer) { }

	/** 获取本层的按键状态（被上层阻断的键返回 {down:false}） */
	key(k: string): KeyState {
		k = k.toLowerCase();
		if (!this._layer._key.has(k)) {
			this._layer._key.set(k, { down: false, repeat: false });
		}
		return this._layer._key.get(k)!;
	}

	/** 注册按键回调。每次 keydown/keyup 事件到达本层时触发 */
	onKey(k: string, cb: (state: KeyState, event?: KeyboardEvent) => void): void {
		if (typeof cb !== 'function') return;
		k = k.toLowerCase();
		if (!this._layer._keyCallbacks.has(k)) {
			this._layer._keyCallbacks.set(k, []);
		}
		this._layer._keyCallbacks.get(k)!.push(cb);
	}

	/** 移除按键回调 */
	offKey(k: string, cb: (state: KeyState, event?: KeyboardEvent) => void): void {
		const arr = this._layer._keyCallbacks.get(k.toLowerCase());
		if (!arr) return;
		const i = arr.indexOf(cb);
		if (i !== -1) arr.splice(i, 1);
	}
}

/**
 * 鼠标输入命名空间，挂载在 InputLayer.mouse 上。
 * 提供鼠标坐标、按钮状态、滚轮和按钮回调。
 */
class InputLayerMouse {
	constructor(private _layer: InputLayer) { }

	/** 鼠标在 canvas 内的 X 坐标 */
	get x(): number { return this._layer._mouseX; }
	/** 鼠标在 canvas 内的 Y 坐标 */
	get y(): number { return this._layer._mouseY; }
	/** 上一帧到当前帧的鼠标移动增量 X */
	get movementX(): number { return this._layer._movementX; }
	/** 上一帧到当前帧的鼠标移动增量 Y */
	get movementY(): number { return this._layer._movementY; }

	/** 鼠标左键是否按下 */
	get leftButton(): boolean { return this._layer._leftButton; }
	/** 鼠标右键是否按下 */
	get rightButton(): boolean { return this._layer._rightButton; }
	/** 鼠标中键是否按下 */
	get middleButton(): boolean { return this._layer._middleButton; }

	/** 当前滚轮状态 */
	get wheel(): WheelState { return this._layer._wheel; }

	/** 注册滚轮回调 */
	onWheel(cb: (wheel: WheelState, event?: WheelEvent) => void): void {
		this._layer._wheelCallbacks.push(cb);
	}

	/** 移除滚轮回调 */
	offWheel(cb: (wheel: WheelState, event?: WheelEvent) => void): void {
		const i = this._layer._wheelCallbacks.indexOf(cb);
		if (i !== -1) this._layer._wheelCallbacks.splice(i, 1);
	}

	/**
	 * 注册鼠标按钮回调。
	 * button: 'leftDown' | 'leftUp' | 'rightDown' | 'rightUp'
	 */
	onButton(button: string, cb: (event: MouseEvent, originalEvent?: MouseEvent) => void): void {
		if (!this._layer._buttonCallbacks.has(button)) {
			this._layer._buttonCallbacks.set(button, []);
		}
		this._layer._buttonCallbacks.get(button)!.push(cb);
	}

	/** 移除鼠标按钮回调 */
	offButton(button: string, cb: (event: MouseEvent, originalEvent?: MouseEvent) => void): void {
		const arr = this._layer._buttonCallbacks.get(button);
		if (!arr) return;
		const i = arr.indexOf(cb);
		if (i !== -1) arr.splice(i, 1);
	}

	/**
	 * 计算鼠标在地图平面上的投影位置（射线检测）。
	 * 委托给 MouseInput.inMapPosition。
	 *
	 * @param camera 当前摄像机
	 * @param plane 目标平面（THREE.Plane 或 THREE.Mesh）
	 * @returns 交点坐标，无交点时返回 null
	 */
	positionInMap(
		camera: GameCamera,
		plane: GameMap,
	): THREE.Vector3 | null {
		return MouseInput.inMapPosition(camera, plane);
	}
}

/**
 * 指针输入命名空间，挂载在 InputLayer.pointer 上。
 * 提供 pointer 状态查询和回调注册。
 *
 * 支持多点触控：通过 get(pointerId) 查询任意活跃 pointer。
 * 便捷属性（x/y/isDown 等）指向主 pointer。
 */
class InputLayerPointer {
	constructor(private _layer: InputLayer) { }

	// ─── 主 pointer 便捷属性 ────────────────────

	/** 主 pointer 的 canvas X */
	get x(): number { return this._layer._pointerX; }
	/** 主 pointer 的 canvas Y */
	get y(): number { return this._layer._pointerY; }
	/** 主 pointer 的移动增量 X */
	get movementX(): number { return this._layer._pointerMovementX; }
	/** 主 pointer 的移动增量 Y */
	get movementY(): number { return this._layer._pointerMovementY; }
	/** 主 pointer 是否按下 */
	get isDown(): boolean { return this._layer._pointerDown; }
	/** 主 pointer 的类型 */
	get pointerType(): string { return this._layer._pointerType; }
	/** 所有活跃 pointerId */
	get activePointers(): number[] { return this._layer._pointerIds; }

	// ─── 查询 ──────────────────────────────────

	/**
	 * 获取指定 pointerId 的完整状态（委托给全局 PointerInput）。
	 * 不传参返回主 pointer，传入 pointerId 返回对应 pointer。
	 * 未找到返回 null。
	 */
	get(pointerId?: number): PointerState | null {
		return PointerInput.pointer(pointerId);
	}

	// ─── 回调 ──────────────────────────────────

	/**
	 * 注册 pointer 事件回调。
	 * type: 'pointerdown' | 'pointerup' | 'pointermove' | 'pointercancel'
	 */
	on(type: string, cb: (event: PointerEvent) => void): void {
		if (!this._layer._pointerCallbacks.has(type)) {
			this._layer._pointerCallbacks.set(type, []);
		}
		this._layer._pointerCallbacks.get(type)!.push(cb);
	}

	/** 移除 pointer 事件回调 */
	off(type: string, cb: (event: PointerEvent) => void): void {
		const arr = this._layer._pointerCallbacks.get(type);
		if (!arr) return;
		const i = arr.indexOf(cb);
		if (i !== -1) arr.splice(i, 1);
	}
}

// ═══════════════════════════════════════════════════════════════

/**
 * 输入层 —— 业务层与输入系统交互的唯一接口。
 *
 * 提供 `keyboard`、`mouse` 和 `pointer` 三个子命名空间，
 * InputStack 负责将事件按栈顺序派发到各层。
 *
 * @example
 *   const layer = new InputLayer('gameplay');
 *   layer.keyboard.onKey('w', (s) => { if (s.down) moveForward(); });
 *   const mx = layer.mouse.x;
 *   layer.mouse.onWheel((w) => zoom(w.y));
 *   layer.pointer.on('pointerdown', (e) => onTouch(e));
 *   inputStack.push(layer);
 */
export class InputLayer {
	readonly uuid = uuid();
	readonly name: string;
	readonly modal: boolean;
	readonly blockKey: ReadonlyArray<string> | 'all';

	/** 键盘输入命名空间 */
	readonly keyboard: InputLayerKeyboard;
	/** 鼠标输入命名空间 */
	readonly mouse: InputLayerMouse;
	/** 指针输入命名空间 */
	readonly pointer: InputLayerPointer;

	// ─── 内部状态（_ 前缀：由 InputStack 和子对象访问，业务代码请勿直接使用）───

	/** @internal 按键状态镜像 */
	_key = new Map<string, KeyState>();

	/** @internal 鼠标坐标 */
	_mouseX = 0;
	_mouseY = 0;
	_movementX = 0;
	_movementY = 0;

	/** @internal 鼠标按钮状态 */
	_leftButton = false;
	_rightButton = false;
	_middleButton = false;

	/** @internal 滚轮状态 */
	_wheel: WheelState = { x: 0, y: 0, z: 0 };

	/** @internal 按键回调表 */
	_keyCallbacks = new Map<string, Array<(state: KeyState, event?: KeyboardEvent) => void>>();

	/** @internal 滚轮回调表 */
	_wheelCallbacks: Array<(wheel: WheelState, event?: WheelEvent) => void> = [];

	/** @internal 鼠标按钮回调表 */
	_buttonCallbacks = new Map<string, Array<(event: MouseEvent, originalEvent?: MouseEvent) => void>>();

	/** @internal 主 pointer 坐标 */
	_pointerX = 0;
	_pointerY = 0;
	_pointerMovementX = 0;
	_pointerMovementY = 0;

	/** @internal 主 pointer 状态 */
	_pointerDown = false;
	_pointerType = '';

	/** @internal 活跃 pointerId 列表 */
	_pointerIds: number[] = [];

	/** @internal pointer 事件回调表 */
	_pointerCallbacks = new Map<string, Array<(event: PointerEvent) => void>>();

	constructor(
		name: string,
		opts: {
			modal?: boolean;
			blockKey?: string[] | 'all';
		} = {},
	) {
		this.name = name;
		this.modal = opts.modal ?? false;
		this.blockKey = opts.blockKey ?? [];

		this.keyboard = new InputLayerKeyboard(this);
		this.mouse = new InputLayerMouse(this);
		this.pointer = new InputLayerPointer(this);
	}

	// ─── 由 InputStack 调用的内部方法 ──────────────

	/** @internal 处理按键按下 */
	_handleKeyDown(key: string, repeat: boolean, event?: KeyboardEvent): void {
		const state = this._ensureKeyState(key);
		state.down = true;
		state.repeat = repeat;
		this._fireKeyCallbacks(key, state, event);
		this._fireKeyCallbacks('all_key', this._aggregateAllKey(), event);
	}

	/** @internal 处理按键抬起 */
	_handleKeyUp(key: string, event?: KeyboardEvent): void {
		const state = this._ensureKeyState(key);
		state.down = false;
		state.repeat = false;
		this._fireKeyCallbacks(key, state, event);
		this._fireKeyCallbacks('all_key', this._aggregateAllKey(), event);
	}

	/** @internal 处理滚轮 */
	_handleWheel(wheel: WheelState, event?: WheelEvent): void {
		this._wheel = wheel;
		for (const cb of this._wheelCallbacks) {
			try { cb(wheel, event); } catch (e) { console.error(e) }
		}
	}

	/**
	 * @internal 处理鼠标按钮事件。
	 * 同时更新按钮状态镜像并触发回调。
	 */
	_handleButton(button: string, event: MouseEvent): void {
		switch (button) {
			case 'leftDown': this._leftButton = true; break;
			case 'leftUp': this._leftButton = false; break;
			case 'rightDown': this._rightButton = true; break;
			case 'rightUp': this._rightButton = false; break;
			case 'middleDown': this._middleButton = true; break;
			case 'middleUp': this._middleButton = false; break;
		}
		const arr = this._buttonCallbacks.get(button);
		if (!arr) return;
		for (const cb of arr) {
			try { cb(event, event); } catch (e) { console.error(e) }
		}
	}

	/** @internal 更新鼠标坐标（不受阻断影响） */
	_handleMouseMove(x: number, y: number, dx: number, dy: number): void {
		this._mouseX = x;
		this._mouseY = y;
		this._movementX = dx;
		this._movementY = dy;
	}

	/** @internal 更新鼠标按钮状态（不受阻断影响） */
	_setButtonState(left: boolean, right: boolean, middle: boolean): void {
		this._leftButton = left;
		this._rightButton = right;
		this._middleButton = middle;
	}

	// ─── pointer 内部方法 ─────────────────────────

	/** @internal 处理 pointerdown */
	_handlePointerDown(event: PointerEvent): void {
		this._pointerX = event.offsetX;
		this._pointerY = event.offsetY;
		this._pointerMovementX = 0;
		this._pointerMovementY = 0;
		this._pointerDown = true;
		this._pointerType = event.pointerType;
		if (!this._pointerIds.includes(event.pointerId)) {
			this._pointerIds.push(event.pointerId);
		}
		this._firePointerCallbacks('pointerdown', event);
	}

	/** @internal 处理 pointerup */
	_handlePointerUp(event: PointerEvent): void {
		this._pointerX = event.offsetX;
		this._pointerY = event.offsetY;
		this._pointerDown = false;
		this._pointerIds = this._pointerIds.filter(id => id !== event.pointerId);
		this._firePointerCallbacks('pointerup', event);
	}

	/** @internal 处理 pointermove */
	_handlePointerMove(event: PointerEvent): void {
		this._pointerMovementX = event.offsetX - this._pointerX;
		this._pointerMovementY = event.offsetY - this._pointerY;
		this._pointerX = event.offsetX;
		this._pointerY = event.offsetY;
		this._pointerType = event.pointerType;
		this._firePointerCallbacks('pointermove', event);
	}

	/** @internal 处理 pointercancel */
	_handlePointerCancel(event: PointerEvent): void {
		this._pointerDown = false;
		this._pointerIds = this._pointerIds.filter(id => id !== event.pointerId);
		this._firePointerCallbacks('pointercancel', event);
	}

	/** @internal 层被弹出或焦点丢失时清空所有状态 */
	_reset(): void {
		for (const v of this._key.values()) {
			v.down = false;
			v.repeat = false;
		}
		this._leftButton = false;
		this._rightButton = false;
		this._middleButton = false;
		this._pointerDown = false;
		this._pointerIds = [];
	}

	// ─── 私有方法 ──────────────────────────────────

	private _ensureKeyState(k: string): KeyState {
		k = k.toLowerCase();
		if (!this._key.has(k)) {
			this._key.set(k, { down: false, repeat: false });
		}
		return this._key.get(k)!;
	}

	private _fireKeyCallbacks(key: string, state: KeyState, event?: KeyboardEvent): void {
		const arr = this._keyCallbacks.get(key);
		if (!arr) return;
		for (const cb of arr) {
			try { cb(state, event); } catch (e) { console.error(e) }
		}
	}

	private _firePointerCallbacks(type: string, event: PointerEvent): void {
		const arr = this._pointerCallbacks.get(type);
		if (!arr) return;
		for (const cb of arr) {
			try { cb(event); } catch (e) { console.error(e) }
		}
	}

	private _aggregateAllKey(): KeyState {
		let down = false;
		let repeat = false;
		for (const v of this._key.values()) {
			if (v.down) down = true;
			if (v.repeat) repeat = true;
			if (down && repeat) break;
		}
		return { down, repeat };
	}
}
