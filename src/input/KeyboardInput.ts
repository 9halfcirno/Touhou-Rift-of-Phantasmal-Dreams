/**
 * 键盘输入状态容器（纯状态，无 DOM 副作用）
 *
 * 由 InputStack 驱动更新，业务层不应直接使用。
 * 业务层应使用 InputLayer API。
 */
export interface KeyState {
  down: boolean;
  repeat: boolean;
}

/** 
 * @deprecated 此对象创建于引擎早期, 现在已由InputLayer.keyboard代替
 * 该对象已无任何实际用途
 */
export const KeyboardInput = {
  /** 特殊键名：匹配任意键的状态汇总 */
  ALL: 'all_key' as const,

  /** 全键状态表 */
  _key: new Map<string, KeyState>(),

  /**
   * 获取按键状态。
   * k = 'all_key' 时返回「任意键被按住」的汇总状态。
   */
  key(k: string): KeyState {
    k = k.toLowerCase();

    if (k === this.ALL) {
      let down = false;
      let repeat = false;
      for (const v of this._key.values()) {
        if (v.down) down = true;
        if (v.repeat) repeat = true;
        if (down && repeat) break;
      }
      return { down, repeat };
    }

    if (!this._key.has(k)) {
      this._key.set(k, { down: false, repeat: false });
    }
    return this._key.get(k)!;
  },

  // ─── 由 InputStack 调用的内部方法 ──────────────

  /** keydown 事件处理（由 InputStack 委托） */
  _onKeyDown(event: KeyboardEvent): void {
    const keyObj = this.key(event.key);
    keyObj.down = true;
    keyObj.repeat = event.repeat;
  },

  /** keyup 事件处理（由 InputStack 委托） */
  _onKeyUp(event: KeyboardEvent): void {
    const keyObj = this.key(event.key);
    keyObj.down = false;
    keyObj.repeat = false;
  },

  /** 焦点丢失时清空所有按键状态 */
  _resetAllKeys(): void {
    for (const v of this._key.values()) {
      v.down = false;
      v.repeat = false;
    }
  },
};
