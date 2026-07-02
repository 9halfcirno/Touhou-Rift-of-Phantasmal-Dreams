import * as THREE from 'three';
import type { WheelState } from './MouseInput.ts';
import { MouseInput } from './MouseInput.ts';
import type { PointerState } from './PointerInput.ts';
import { PointerInput } from './PointerInput.ts';
import { GameCamera } from '@/objects/GameCamera.ts';
import { GameMap } from '@/map/index.ts';
import { uuid } from '@/utils/uuid.ts';
import type { InputStack } from './InputStack.js';
import { NodeMaterial } from 'three/webgpu';

export interface KeyState {
	down: boolean;
	repeat: boolean;
	name: string;
}

export type ButtonType = "left" | "right" | "middle";
export interface ButtonStatue {
	down: boolean;
}

export class InputLayer {
	readonly uuid = uuid();
	readonly name: string;

	keyboard: Keyboard;
	mouse: Mouse;

	/** @internal 由 InputStack 注入的栈引用，用于 popFromStack() */
	_stack: InputStack | null = null;

	constructor(
		name: string,
		opts: {
			modal?: boolean;
			blockKey?: string[] | 'all';
		} = {},
	) {
		this.name = name;

		this.keyboard = new Keyboard(this, { blocks: opts.blockKey });
		this.mouse = new Mouse(this, { modal: opts.modal })
	}

	/**
	 * 从当前所属 InputStack 中弹出自身。
	 * 如果不在任何栈中（_stack 为 null），无操作。
	 */
	popFromStack(): void {
		this._stack?.remove(this);
	}

	_handleKeyUpdate(k: string, down: boolean) {
		let key = k.toLowerCase();
		this.keyboard.updateKey(key, down);
	}

	_handleMouseBtnUpdate(b: number, down: boolean, e: MouseEvent) {
		this.mouse.updateBtn(b, down, e);
	}

	_handleMousePosUpdate(e: MouseEvent) {
		this.mouse.updatePos(e);
	}

	_handleWheel(e: WheelEvent) {
		this.mouse.handleWheel(e);
	}

	_reset() {
		this.keyboard.reset();
		this.mouse.reset();
	}
}

// 下方的均为InputLayer的东西, 是封装, 没监听

class Keyboard {
	/** layer */
	layer: InputLayer;
	/** 键状态 */
	_key = new Map<string, KeyState>

	/** 阻断传播到下层的键, 此处只存放数据 */
	blocks: Array<string> | 'all' = [];

	private _onKeyCB: Map<string, Array<(key: KeyState) => void>> = new Map();

	constructor(layer: InputLayer, { blocks }: { blocks?: string[] | 'all' } = {}) {
		this.layer = layer;

		if (blocks === "all") this.blocks = "all";
		else blocks && Array.isArray(blocks) && (this.blocks as Array<string>).push(...blocks)
	}

	key(k: string): KeyState {
		k = k.toLowerCase();
		if (!this._key.has(k)) {
			let key = {
				down: false,
				repeat: false,
				name: k
			}
			this._key.set(k, key);
		}
		return this._key.get(k)!;

	}

	onKey(k: string, cb: (key: KeyState) => void) {
		if (!this._onKeyCB.has(k)) {
			this._onKeyCB.set(k, []);
		}
		let arr = this._onKeyCB.get(k)!;
		if (arr.includes(cb)) return;
		arr.push(cb);
	}

	offKey(k: string, cb: (key: KeyState) => void) {
		let arr = this._onKeyCB.get(k);
		if (!arr) return;
		const index = arr.indexOf(cb);
		if (index !== -1) {
			arr.splice(index, 1);
		}
	}

	private _handleOnKey(k: string) {
		let arr = [
			...this._onKeyCB.get(k) || [],
			...this._onKeyCB.get("all") || []
		];
		if (!arr) return;
		for (const cb of arr) {
			cb(this.key(k));
		}
	}

	reset(k?: string) {
		if (k) {
			this.updateKey(k, false);
		} else {
			for (let k of this._key.keys()) {
				this.updateKey(k, false); // 松开所有按键
			}
		}
	}

	/** 不推荐在业务层乱调用这个方法, 除非你知道你在干什么 */
	updateKey(k: string, d: boolean) {
		let key = this.key(k);
		if (key.down && d) { // 键一直按下
			key.repeat = true; // 不用更新down, 只更新repeat
			// 这里不调用_handleOnKey, 因为浏览器自己的事件分发就挺玄学的, 而且这玩意还让我判断repeat
		} else if (!key.down && d) { // 键原本没按下
			key.down = true;
			key.repeat = false; // 此时为按下第一次事件分发, 不repeat
			this._handleOnKey(k);
		} else if (key.down && !d) { // 键原本按下, 现在没有
			key.down = false;
			key.repeat = false;
		} else { // 最后一种情况, 即一直都没按下
			// 感觉都没必要改键的状态了...
		}

	}
}

class Mouse {
	modal: boolean = false;

	private domElement: HTMLElement | null = null;

	private _x: number = 0;
	private _y: number = 0;

	private _btns: Map<number, ButtonStatue> = new Map();
	private _onBtnCB: Map<number, Array<(btn: ButtonStatue, e?: MouseEvent) => void>> = new Map();

	private _onWheelCB: Array<(event: WheelEvent) => void> = [];

	constructor(layer: InputLayer, { modal }: { modal?: boolean } = {}) {
		this.modal = modal || false;
	}

	bind(ele: HTMLElement) {
		this.domElement = ele;
	}


	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}

	movement = {
		x: 0,
		y: 0
	}

	/**
	 * 
	 * @param btn 按钮的名字/编号
	 * @returns 
	 */
	button(btn: ButtonType | number): ButtonStatue {
		if (typeof btn === "string") btn = BtnId[btn];
		if (!this._btns.has(btn)) {
			let state = {
				down: false,
			}
			this._btns.set(btn, state);
		}
		return this._btns.get(btn)!;
	}

	onButton(btn: string | number, cb: (btn: ButtonStatue, event?: MouseEvent) => void) {
		if (typeof btn === "string") btn = BtnId[btn];
		if (!this._onBtnCB.has(btn)) {
			this._onBtnCB.set(btn, []);
		}
		let arr = this._onBtnCB.get(btn)!;
		if (arr.includes(cb)) return;
		arr.push(cb);
	}

	private _handleOnBtn(b: number, e?: MouseEvent) {
		let arr = this._onBtnCB.get(b);
		if (!arr) return;
		for (const cb of arr) {
			cb(this.button(b), e);
		}
	}

	onWheel(callback: (event: WheelEvent) => void) {
		if (this._onWheelCB.includes(callback)) return;
		this._onWheelCB.push(callback);
	}

	private _handleOnWheel(e: WheelEvent) {
		for (const cb of this._onWheelCB) {
			cb(e);
		}
	}

	reset(b?: ButtonType | number) {
		if (b) {
			if (typeof b === "string") {
				b = BtnId[b];
			};
			this.updateBtn(b, false);
		} else {
			for (const b of this._btns.keys()) {
				this.updateBtn(b, false);
			}
		}
	}

	updatePos(e: MouseEvent) {
		let { x: offsetX, y: offsetY, button } = e;
		let dx = offsetX - this._x;
		let dy = offsetY - this._y;

		this._x = offsetX || 0;
		this._y = offsetY || 0;

		this.movement.x = dx;
		this.movement.y = dy;
	}

	updateBtn(b: number, d: boolean, e?: MouseEvent) {
		let btn = this.button(b);
		if (!btn.down && d) { // 之前没按下, 但现在按下
			btn.down = true;
			this._handleOnBtn(b, e);
		} else if (btn.down && !d) {
			btn.down = false; // 之前按下, 现在没按下
		}
	}

	handleWheel(e: WheelEvent) {
		this._handleOnWheel(e);
	}

	// 计算地图内坐标用, pim是position in map的缩写
	private _pim_raycaster = new THREE.Raycaster()
	private _pim_intersectionPoint = new THREE.Vector3()
	private _pim_mouse = new THREE.Vector2()
	/**
	 * 计算鼠标在地图平面上的投影位置
	 */
	positionInMap(
		camera: GameCamera,
		map: GameMap,
	): THREE.Vector3 | null {
		const rect = this.domElement?.getBoundingClientRect() || {
			x: 0,
			y: 0,
			width: window.innerWidth,
			height: window.innerHeight,
		};

		this._pim_mouse.x = (this.x / rect.width) * 2 - 1;
		this._pim_mouse.y = -(this.y / rect.height) * 2 + 1;

		this._pim_raycaster.setFromCamera(this._pim_mouse, camera.three.camera);

		// Mesh 检测
		if (map.three.ground instanceof THREE.Mesh) {
			const intersects = this._pim_raycaster.intersectObject(map.three.ground);
			return intersects.length > 0 ? intersects[0]!.point : null;
		}

		// Plane 检测
		const pos = this._pim_raycaster.ray.intersectPlane(map.three.ground, this._pim_intersectionPoint);
		if (pos) {
			this._pim_intersectionPoint.set(pos.x, pos.y, pos.z);
			return this._pim_intersectionPoint;
		}
		return null;
	}
}

const BtnId: Record<string, number> = {
	"left": 0,
	"middle": 1,
	"right": 2,
	// 3, 4等我搞懂再说
}