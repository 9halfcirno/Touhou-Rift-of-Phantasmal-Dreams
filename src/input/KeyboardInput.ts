/**
 * 键盘输入管理器（单例）
 *
 * 维护按键状态 Map，支持 onKey 事件注册。
 * ALL 为所有按键聚合。
 *
 * 迁移自 code/inputs/keyboard.js
 */

interface KeyState {
  down: boolean;
  repeat: boolean;
}

type KeyCallback = (state: KeyState) => void;

export const KeyboardInput = {
  ALL: 'all_key' as const,

  _key: new Map<string, KeyState>(),
  _keyHandler: new Map<string, KeyCallback[]>(),

  /**
   * 获取按键状态
   */
  key(k: string): KeyState {
    k = String(k).toLowerCase();

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

  /**
   * 注册按键回调
   */
  onKey(k: string, cb: KeyCallback): void {
    if (typeof cb !== 'function') return;
    if (!this._keyHandler.has(k)) {
      this._keyHandler.set(k, []);
    }
    this._keyHandler.get(k)!.push(cb);
  },

  /**
   * 移除按键回调
   */
  offKey(k: string, cb: KeyCallback): void {
    const arr = this._keyHandler.get(k);
    if (!arr) return;
    const i = arr.indexOf(cb);
    if (i !== -1) arr.splice(i, 1);
  },

  _triggerKey(k: string): void {
    const arr = this._keyHandler.get(k);
    if (!arr) return;
    const state = this.key(k);
    for (const c of arr) c(state);
  },

  /** 清空所有按键状态（焦点丢失时调用） */
  _resetAllKeys(): void {
    for (const v of this._key.values()) {
      v.down = false;
      v.repeat = false;
    }
    this._triggerKey(this.ALL);
  },
};

// ─── 全局事件绑定 ────────────────────────────────

window.addEventListener('keydown', (event) => {
  const { key, repeat } = event;
  const keyObj = KeyboardInput.key(key);
  keyObj.down = true;
  keyObj.repeat = repeat;
  KeyboardInput._triggerKey(key);
  KeyboardInput._triggerKey(KeyboardInput.ALL);
  event.preventDefault();
});

window.addEventListener('keyup', (event) => {
  const { key } = event;
  const keyObj = KeyboardInput.key(key);
  keyObj.down = false;
  keyObj.repeat = false;
  event.preventDefault();
});

window.addEventListener('blur', () => {
  KeyboardInput._resetAllKeys();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    KeyboardInput._resetAllKeys();
  }
});
