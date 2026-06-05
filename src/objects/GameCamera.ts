import { GameObject } from './GameObject.js';
import { Position } from '../math/Position.js';
import * as THREE from 'three';
import type { RuntimeConfig } from '../core/types.js';

/**
 * 游戏摄像机
 *
 * 作为 GameObject 存在，可被插值、跟随。
 * 迁移自 code/game_object/game_camera.js
 */
export class GameCamera extends GameObject {
  /** 实际的 Three.js PerspectiveCamera */
  declare readonly three: GameObject['three'] & {
    camera: THREE.PerspectiveCamera;
  };

  constructor(opts: {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
  } = {}) {
    const cam = new THREE.PerspectiveCamera(
      opts.fov ?? 64,
      opts.aspect ?? (globalThis as Record<string, unknown>).GAME_CONFIG_STAGE_ASPECT as number ?? 16 / 9,
      opts.near ?? 0.1,
      opts.far ?? 1000,
    );

    super({ object3d: cam });
    (this.three as Record<string, unknown>).camera = cam;
  }

  /**
   * GameCamera 的 position 直接存储 THREE 世界坐标（不走坐标变换）。
   * 与 GameObject 不同：不调用 .toTHREE()。
   */
  override updateThreeData(p = 1): void {
    p = Math.min(p, 1);
    const object3d = this.three.object3d;
    if (!object3d) return;

    object3d.position.copy(this.tweenPosition(p));
  }
}
