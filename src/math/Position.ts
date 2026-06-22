import * as THREE from 'three';
import { Config } from '../configs/Config.js';

/**
 * 游戏坐标系位置
 *
 * 游戏使用 Y-up 右手坐标系。Position 扩展 THREE.Vector3，
 * 通过 toTHREE() 将游戏坐标转换为 Three.js 场景坐标（带倾斜变换和脏标记缓存）。
 *
 * 坐标变换：
 *   THREE.x = game.x
 *   THREE.y = game.z + game.y * cos(y_tilt)
 *   THREE.z = game.y * sin(y_tilt)
 *
 * 注意：Three.js 的 x/y/z 是底层存储属性，TypeScript 不允许子类将其覆盖为
 * getter/setter。脏标记通过覆写 set()/copy() 方法维护。
 * 直接属性赋值（pos.x = 5）不会触发脏标记，请使用 set() 或 setPosition()。
 *
 * 迁移自 code/position.js
 */
export class Position extends THREE.Vector3 {
  /** Three.js 坐标缓存 */
  private _threeCache = new THREE.Vector3();

  /** 缓存脏标记 */
  private _threeDirty = true;

  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z);
  }

  // ─── 方法覆写（保持脏标记 + 链式调用）───────────

  override set(x: number, y: number, z: number): this {
    super.set(x, y, z);
    this._threeDirty = true;
    return this;
  }

  override copy(v: THREE.Vector3): this {
    super.copy(v);
    this._threeDirty = true;
    return this;
  }

  override clone(): this {
    return new Position(this.x, this.y, this.z) as this;
  }

  /** 获取相对坐标 */
  getRelativePos(obj: { x: number; y: number; z: number }): Position {
    return new Position(
      this.x - obj.x,
      this.y - obj.y,
      this.z - obj.z,
    );
  }

  // ─── 坐标变换 ───────────────────────────────────

  /**
   * 游戏坐标 → Three.js 场景坐标（带缓存）
   */
  toTHREE(): THREE.Vector3 {
    if (!this._threeDirty) {
      return this._threeCache;
    }

    const a = Config.y_tilt;

    this._threeCache.set(
      this.x,
      this.z + this.y * Math.cos(a),
      this.y * Math.sin(a),
    );

    this._threeDirty = false;
    return this._threeCache;
  }

  /**
   * Three.js 坐标 → 游戏坐标（静态方法）
   */
  static fromTHREE(v: THREE.Vector3): Position {
    const a = Config.y_tilt || Math.PI / 4;

    const gameY = v.z / Math.sin(a);
    const gameX = v.x;
    const gameZ = v.y - gameY * Math.cos(a);

    return new Position(gameX, gameY, gameZ);
  }
}

/** 重新导出 THREE 的 Vector2 / Vector3 以保持兼容 */
export { Vector2, Vector3 } from 'three';
