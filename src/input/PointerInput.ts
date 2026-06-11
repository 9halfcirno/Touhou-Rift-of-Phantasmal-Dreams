/**
 * 指针输入状态容器（纯状态，无 DOM 副作用）
 *
 * 由 InputStack 驱动更新，业务层不应直接使用。
 * 业务层应使用 InputLayer API。
 *
 * 结构参照 KeyboardInput：Map 存储状态 + 查询方法 + _on* 内部更新方法
 */
export interface PointerState {
  pointerId: number;
  /** 'mouse' | 'touch' | 'pen' */
  pointerType: string;
  isPrimary: boolean;
  down: boolean;
  /** canvas 内 X 坐标 */
  x: number;
  /** canvas 内 Y 坐标 */
  y: number;
  /** 本帧移动增量 X */
  movementX: number;
  /** 本帧移动增量 Y */
  movementY: number;
  /** 压力 0~1 */
  pressure: number;
  /** 接触宽度 */
  width: number;
  /** 接触高度 */
  height: number;
  /** 笔倾角 X (-90~90) */
  tiltX: number;
  /** 笔倾角 Y (-90~90) */
  tiltY: number;
}

export const PointerInput = {
  /** 所有活跃 pointer 的状态表（pointerId → PointerState） */
  _pointers: new Map<number, PointerState>(),

  /** 主 pointer 的 id（isPrimary === true 的那个，无则为 -1） */
  _primaryId: -1 as number,

  /**
   * 查询指定 pointer 的状态。
   * - 不传参：返回主 pointer
   * - 传入 pointerId：返回对应 pointer
   * - 未找到返回 null（pointer 是短暂的，不存在就是不存在）
   */
  pointer(pointerId?: number): PointerState | null {
    if (pointerId === undefined) {
      return this._pointers.get(this._primaryId) ?? null;
    }
    return this._pointers.get(pointerId) ?? null;
  },

  // ─── 便捷属性（主 pointer）──────────────────

  /** 主 pointer 的 canvas X */
  get x(): number {
    return this.pointer()?.x ?? 0;
  },

  /** 主 pointer 的 canvas Y */
  get y(): number {
    return this.pointer()?.y ?? 0;
  },

  /** 主 pointer 是否按下 */
  get isDown(): boolean {
    return this.pointer()?.down ?? false;
  },

  /** 主 pointer 的类型 */
  get pointerType(): string {
    return this.pointer()?.pointerType ?? '';
  },

  /** 所有活跃 pointer 的 id 列表 */
  get activePointers(): number[] {
    return Array.from(this._pointers.keys());
  },

  // ─── 由 InputStack 调用的内部方法 ──────────

  /** pointerdown 事件处理 */
  _onPointerDown(event: PointerEvent): void {
    const state: PointerState = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      isPrimary: event.isPrimary,
      down: true,
      x: event.offsetX,
      y: event.offsetY,
      movementX: 0,
      movementY: 0,
      pressure: event.pressure,
      width: event.width,
      height: event.height,
      tiltX: event.tiltX,
      tiltY: event.tiltY,
    };
    this._pointers.set(event.pointerId, state);
    if (event.isPrimary) {
      this._primaryId = event.pointerId;
    }
  },

  /** pointerup 事件处理 */
  _onPointerUp(event: PointerEvent): void {
    // 更新坐标后移除（让回调能读到最后的坐标）
    const state = this._pointers.get(event.pointerId);
    if (state) {
      state.down = false;
      state.x = event.offsetX;
      state.y = event.offsetY;
    }
    this._pointers.delete(event.pointerId);

    if (event.pointerId === this._primaryId) {
      this._primaryId = this._findNextPrimary();
    }
  },

  /** pointermove 事件处理 */
  _onPointerMove(event: PointerEvent): void {
    const state = this._pointers.get(event.pointerId);
    if (state) {
      state.movementX = event.offsetX - state.x;
      state.movementY = event.offsetY - state.y;
      state.x = event.offsetX;
      state.y = event.offsetY;
      state.pressure = event.pressure;
      state.tiltX = event.tiltX;
      state.tiltY = event.tiltY;
    }
  },

  /** pointercancel 事件处理 */
  _onPointerCancel(event: PointerEvent): void {
    this._pointers.delete(event.pointerId);
    if (event.pointerId === this._primaryId) {
      this._primaryId = this._findNextPrimary();
    }
  },

  /** 焦点丢失时清空所有 pointer 状态 */
  _resetAllPointers(): void {
    this._pointers.clear();
    this._primaryId = -1;
  },

  // ─── 内部辅助 ────────────────────────────────

  /** 在活跃 pointer 中寻找下一个 isPrimary 的 */
  _findNextPrimary(): number {
    for (const [id, s] of this._pointers) {
      if (s.isPrimary) return id;
    }
    return -1;
  },
};
