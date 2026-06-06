import { KeyboardInput } from './KeyboardInput.js';
import { MouseInput, type WheelState } from './MouseInput.js';
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
  private bottomLayer = new InputLayer("bottom");

  constructor(canvas: HTMLCanvasElement) {
    MouseInput.bind(canvas);
    this.push(this.bottomLayer)
    this._bindEvents();
  }

  // ─── 层管理 ──────────────────────────────────

  /** 压入栈顶（自动从旧位置移除） */
  push(layer: InputLayer): void {
    this.remove(layer);
    this._layers.push(layer);
  }

  /** 弹出栈顶并返回 */
  pop(): InputLayer | undefined {
    if (this.bottomLayer.uuid === this._layers[0].uuid) return; // 保证最底层输入层不会被移出
    const layer = this._layers.pop();
    if (layer) layer._reset();
    return layer;
  }

  /** 从栈中任意位置移除 */
  remove(layer: InputLayer): void {
    const idx = this._layers.indexOf(layer);
    if (idx !== -1) {
      this._layers.splice(idx, 1);
      layer._reset();
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
      : null;
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
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('wheel', this._onWheel);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('blur', this._onBlur);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  private _unbindEvents(): void {
    if (!this._bound) return;
    this._bound = false;

    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('blur', this._onBlur);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  // ─── DOM 事件处理器（箭头函数保持引用稳定）────

  private _onKeyDown = (event: KeyboardEvent): void => {
    KeyboardInput._onKeyDown(event);
    this._propagateKeyDown(event.key.toLowerCase(), event.repeat);
    event.preventDefault();
  };

  private _onKeyUp = (event: KeyboardEvent): void => {
    KeyboardInput._onKeyUp(event);
    this._propagateKeyUp(event.key.toLowerCase());
    event.preventDefault();
  };

  private _onMouseDown = (event: MouseEvent): void => {
    MouseInput._onMouseDown(event);
    const button = this._buttonEventName(event.button, 'Down');
    this._propagateButton(button, event);
    event.preventDefault();
  };

  private _onMouseUp = (event: MouseEvent): void => {
    MouseInput._onMouseUp(event);
    const button = this._buttonEventName(event.button, 'Up');
    this._propagateButton(button, event);
    event.preventDefault();
  };

  private _onWheel = (event: WheelEvent): void => {
    MouseInput._onWheel(event);
    const wheel: WheelState = { x: event.deltaX, y: event.deltaY, z: event.deltaZ };
    this._propagateWheel(wheel);
    // event.preventDefault();
  };

  private _onMouseMove = (event: MouseEvent): void => {
    MouseInput._onMouseMove(event);
    this._propagateMouseMove();
  };

  private _onBlur = (): void => {
    KeyboardInput._resetAllKeys();
    for (const layer of this._layers) {
      layer._reset();
    }
  };

  private _onVisibilityChange = (): void => {
    if (document.hidden) {
      KeyboardInput._resetAllKeys();
      for (const layer of this._layers) {
        layer._reset();
      }
    }
  };

  // ─── 事件派发（栈顶→栈底，遇阻断停止）────────

  private _propagateKeyDown(key: string, repeat: boolean): void {
    for (let i = this._layers.length - 1; i >= 0; i--) {
      const layer = this._layers[i]!;
      layer._handleKeyDown(key, repeat);
      if (this._blocksPropagation(layer, key)) break;
    }
  }

  private _propagateKeyUp(key: string): void {
    for (let i = this._layers.length - 1; i >= 0; i--) {
      const layer = this._layers[i]!;
      layer._handleKeyUp(key);
      if (this._blocksPropagation(layer, key)) break;
    }
  }

  private _propagateWheel(wheel: WheelState): void {
    for (let i = this._layers.length - 1; i >= 0; i--) {
      const layer = this._layers[i]!;
      layer._handleWheel(wheel);
      if (layer.modal) break;
    }
  }

  private _propagateButton(button: string, event: MouseEvent): void {
    for (let i = this._layers.length - 1; i >= 0; i--) {
      const layer = this._layers[i]!;
      layer._handleButton(button, event);
      if (layer.modal) break;
    }
  }

  /**
   * 鼠标移动：坐标和按钮状态始终同步到所有层。
   * 坐标是「环境信息」而非「可消费输入」。
   */
  private _propagateMouseMove(): void {
    for (const layer of this._layers) {
      layer._handleMouseMove(
        MouseInput.x,
        MouseInput.y,
        MouseInput.movement.x,
        MouseInput.movement.y,
      );
      layer._setButtonState(
        MouseInput.left,
        MouseInput.right,
        MouseInput.middle,
      );
    }
  }

  // ─── 传播判断 ────────────────────────────────

  /**
   * 判断当前层是否阻断 key 向更低层传播。
   * modal 层阻断全部；blockKey='all' 阻断全部；
   * blockKey 数组匹配到当前 key 则阻断。
   */
  private _blocksPropagation(layer: InputLayer, key: string): boolean {
    if (layer.modal) return true;
    if (layer.blockKey === 'all') return true;
    if (Array.isArray(layer.blockKey) && layer.blockKey.includes(key)) return true;
    return false;
  }

  /** 鼠标按钮号 → 事件名映射 */
  private _buttonEventName(button: number, suffix: 'Down' | 'Up'): string {
    switch (button) {
      case 0: return `left${suffix}`;
      case 1: return `middle${suffix}`;
      case 2: return `right${suffix}`;
      default: return `button${button}${suffix}`;
    }
  }
}
