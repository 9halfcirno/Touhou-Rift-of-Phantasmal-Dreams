import * as THREE from 'three';
import type { KeyState } from './KeyboardInput.js';
import type { WheelState } from './MouseInput.js';
import { MouseInput } from './MouseInput.js';
import { util } from '../utils/utils.js';

// ═══════════════════════════════════════════════════════════════
// 内部包装类（同文件，访问 InputLayer 的 _ 前缀内部成员）
// ═══════════════════════════════════════════════════════════════

/**
 * 键盘输入命名空间，挂载在 InputLayer.keyboard 上。
 * 提供按键状态查询和回调注册。
 */
class InputLayerKeyboard {
  constructor(private _layer: InputLayer) {}

  /** 获取本层的按键状态（被上层阻断的键返回 {down:false}） */
  key(k: string): KeyState {
    k = k.toLowerCase();
    if (!this._layer._key.has(k)) {
      this._layer._key.set(k, { down: false, repeat: false });
    }
    return this._layer._key.get(k)!;
  }

  /** 注册按键回调。每次 keydown/keyup 事件到达本层时触发 */
  onKey(k: string, cb: (state: KeyState) => void): void {
    if (typeof cb !== 'function') return;
    k = k.toLowerCase();
    if (!this._layer._keyCallbacks.has(k)) {
      this._layer._keyCallbacks.set(k, []);
    }
    this._layer._keyCallbacks.get(k)!.push(cb);
  }

  /** 移除按键回调 */
  offKey(k: string, cb: (state: KeyState) => void): void {
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
  constructor(private _layer: InputLayer) {}

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
  onWheel(cb: (wheel: WheelState) => void): void {
    this._layer._wheelCallbacks.push(cb);
  }

  /** 移除滚轮回调 */
  offWheel(cb: (wheel: WheelState) => void): void {
    const i = this._layer._wheelCallbacks.indexOf(cb);
    if (i !== -1) this._layer._wheelCallbacks.splice(i, 1);
  }

  /**
   * 注册鼠标按钮回调。
   * button: 'leftDown' | 'leftUp' | 'rightDown' | 'rightUp'
   */
  onButton(button: string, cb: (event: MouseEvent) => void): void {
    if (!this._layer._buttonCallbacks.has(button)) {
      this._layer._buttonCallbacks.set(button, []);
    }
    this._layer._buttonCallbacks.get(button)!.push(cb);
  }

  /** 移除鼠标按钮回调 */
  offButton(button: string, cb: (event: MouseEvent) => void): void {
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
    camera: THREE.PerspectiveCamera,
    plane: THREE.Plane | THREE.Mesh,
  ): THREE.Vector3 | null {
    return MouseInput.inMapPosition(camera, plane);
  }
}

// ═══════════════════════════════════════════════════════════════

/**
 * 输入层 —— 业务层与输入系统交互的唯一接口。
 *
 * 提供 `keyboard` 和 `mouse` 两个子命名空间，
 * InputStack 负责将事件按栈顺序派发到各层。
 *
 * 用法：
 *   const layer = new InputLayer('gameplay');
 *   layer.keyboard.onKey('w', (s) => { if (s.down) moveForward(); });
 *   const mx = layer.mouse.x;
 *   layer.mouse.onWheel((w) => zoom(w.y));
 *   inputStack.push(layer);
 */
export class InputLayer {
  readonly uuid = util.uuid();
  readonly name: string;
  readonly modal: boolean;
  readonly blockKey: ReadonlyArray<string> | 'all';

  /** 键盘输入命名空间 */
  readonly keyboard: InputLayerKeyboard;
  /** 鼠标输入命名空间 */
  readonly mouse: InputLayerMouse;

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
  _keyCallbacks = new Map<string, Array<(state: KeyState) => void>>();

  /** @internal 滚轮回调表 */
  _wheelCallbacks: Array<(wheel: WheelState) => void> = [];

  /** @internal 鼠标按钮回调表 */
  _buttonCallbacks = new Map<string, Array<(event: MouseEvent) => void>>();

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
  }

  // ─── 由 InputStack 调用的内部方法 ──────────────

  /** @internal 处理按键按下 */
  _handleKeyDown(key: string, repeat: boolean): void {
    const state = this._ensureKeyState(key);
    state.down = true;
    state.repeat = repeat;
    this._fireKeyCallbacks(key, state);
    this._fireKeyCallbacks('all_key', this._aggregateAllKey());
  }

  /** @internal 处理按键抬起 */
  _handleKeyUp(key: string): void {
    const state = this._ensureKeyState(key);
    state.down = false;
    state.repeat = false;
    this._fireKeyCallbacks(key, state);
    this._fireKeyCallbacks('all_key', this._aggregateAllKey());
  }

  /** @internal 处理滚轮 */
  _handleWheel(wheel: WheelState): void {
    this._wheel = wheel;
    for (const cb of this._wheelCallbacks) {
      try { cb(wheel); } catch { /* 吞掉回调异常 */ }
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
      try { cb(event); } catch { /* 吞掉回调异常 */ }
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

  /** @internal 层被弹出或焦点丢失时清空所有状态 */
  _reset(): void {
    for (const v of this._key.values()) {
      v.down = false;
      v.repeat = false;
    }
    this._leftButton = false;
    this._rightButton = false;
    this._middleButton = false;
  }

  // ─── 私有方法 ──────────────────────────────────

  private _ensureKeyState(k: string): KeyState {
    k = k.toLowerCase();
    if (!this._key.has(k)) {
      this._key.set(k, { down: false, repeat: false });
    }
    return this._key.get(k)!;
  }

  private _fireKeyCallbacks(key: string, state: KeyState): void {
    const arr = this._keyCallbacks.get(key);
    if (!arr) return;
    for (const cb of arr) {
      try { cb(state); } catch { /* 吞掉回调异常 */ }
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
