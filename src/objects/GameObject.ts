import * as THREE from 'three';
import { Position, Vector2 } from '../math/Position.js';
import { util } from '../utils/utils.js';
import { Config } from '../core/Config.js';

/**
 * 游戏对象基类
 *
 * 所有可显示对象的共同基类。维护游戏坐标（Position）、
 * Three.js 对象引用、以及帧间插值状态。
 *
 * 迁移自 code/game_object/game_object.js
 */
export class GameObject {
  // ─── Three.js ─────────────────────────────────

  readonly three: {
    object3d: THREE.Object3D | null;
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material;
    destory?: boolean;
  };

  // ─── 坐标 ─────────────────────────────────────

  /** 当前游戏坐标 */
  position: Position;

  /** 上一帧坐标（用于插值） */
  protected _orginPos: Position;

  /** 插值目标坐标（缓存，避免每帧 new） */
  private _tweenTargetPos: Position;

  /**
   * 游戏内旋转（x = yaw 水平, y = pitch 垂直）
   */
  rotation: THREE.Vector2;

  // ─── 标识 ─────────────────────────────────────

  /** 唯一标识 */
  readonly uuid: string;

  /** 所在 GameMap（由 GameMap.addObject 设置） */
  inMap: unknown = null;

  // ─── 静态共享资源 ─────────────────────────────

  static readonly SharedPlaneGeometry = new THREE.PlaneGeometry(1, 1);
  static readonly SharedBoxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );

  // ─── 构造函数 ─────────────────────────────────

  constructor(params: {
    object3d?: THREE.Object3D | null;
    mesh?: THREE.Mesh | null;
    position?: Position;
    rotation?: THREE.Vector2;
  } = {}) {
    this.three = {
      object3d: params.object3d ?? params.mesh ?? null,
    };

    this.position = params.position?.clone() ?? new Position();
    this._orginPos = new Position(this.position.x, this.position.y, this.position.z);
    this._tweenTargetPos = new Position(this.position.x, this.position.y, this.position.z);

    this.rotation = params.rotation?.clone() ?? new Vector2(0, 0);
    this.uuid = util.uuid();

    this.updateThreeData(1);

    // 设置 Three.js 元数据
    if (this.three.object3d) {
      this.three.object3d.name = this.uuid;
      this.three.object3d.castShadow = true;
      this.three.object3d.receiveShadow = true;
    }
  }

  // ─── 坐标操作 ─────────────────────────────────

  /**
   * 设置游戏坐标，自动保存上一帧位置用于插值
   */
  setPosition(x: number, y: number, z: number): void {
    this._orginPos.copy(this.position);
    this.position.set(x, y, z);
  }

  /**
   * 将游戏坐标同步到 Three.js（带插值）
   *
   * @param p 插值因子 0~1
   */
  updateThreeData(p = 1): void {
    p = Math.min(p, 1);
    const object3d = this.three.object3d;
    if (!object3d) return;

    object3d.position.copy(this.tweenPosition(p).toTHREE());
  }

  /** 渲染帧插值回调（供 GameMap.tweenThree 调用） */
  tweenThree(p: number): void {
    this.updateThreeData(p);
  }

  /**
   * 计算插值坐标（游戏坐标系）
   */
  tweenPosition(p: number): Position {
    const to = this.position;
    const org = this._orginPos;

    this._tweenTargetPos.set(
      org.x + (to.x - org.x) * p,
      org.y + (to.y - org.y) * p,
      org.z + (to.z - org.z) * p,
    );

    return this._tweenTargetPos;
  }

  // ─── 纹理更新（子类覆写）─────────────────────

  updateTexture(_tex: unknown, _opts?: unknown): void {
    // 由子类实现
  }

  // ─── 销毁 ─────────────────────────────────────

  protected _disposeThree(): void {
    if (this.three.geometry && this.three.geometry !== GameObject.SharedPlaneGeometry) {
      this.three.geometry.dispose();
    }

    // 从地图中移除
    if (this.inMap && typeof (this.inMap as { removeObject?: (obj: GameObject) => void }).removeObject === 'function') {
      (this.inMap as { removeObject: (obj: GameObject) => void }).removeObject(this);
    }

    this.three.object3d = null;
    this.three.destory = true;
  }
}
