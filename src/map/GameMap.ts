import * as THREE from 'three';
import { EntityManager } from '../ecs/EntityManager.js';
import { SystemManager } from '../ecs/SystemManager.js';
import { THREEManager } from '../managers/THREEManager.js';
import { GameCamera } from '../objects/GameCamera.js';
import { GameObject } from '../objects/GameObject.js';
import { System } from '../ecs/System.js';
import { Entity } from '../ecs/Entity.js';
import { Config } from '../core/Config.js';
import { THID } from '../resources/THID.js';
import type { GameMapDefinition } from '../core/types.js';

/**
 * 游戏地图基类
 *
 * 地图是世界的容器：拥有 EntityManager、SystemManager、
 * THREEManager、GameCamera，以及 objects 池。
 *
 * 迁移自 code/game_map/game_map.js
 */
export class GameMap {
  /** 地图标识（thid） */
  readonly id: string;

  /** Three.js 渲染层次 */
  readonly three: {
    group: THREE.Group;
    ground: THREE.Plane;
  };

  /** 是否在场景中显示 */
  isInScene = true;

  /** 摄像机 */
  readonly camera: GameCamera;

  /** Three.js 对象管理器 */
  protected _threeManager: THREEManager;

  /** 实体管理器 */
  readonly entityManager: EntityManager;

  /** 系统管理器 */
  readonly systemManager: SystemManager;

  /** 对象池（uuid → GameObject） */
  readonly objects = new Map<string, GameObject>();

  /** 地图定义数据 */
  definition: GameMapDefinition | null = null;

  /** 当前逻辑帧号 */
  #frame = 0;

  get frame(): number {
    return this.#frame;
  }

  set frame(v: number) {
    if (v <= this.#frame) {
      throw new RangeError(
        `GameMap.#frame 仅允许更大值，至少为${this.#frame + 1}，而目标值为${v}`,
      );
    }
    this.#frame = v;
  }

  constructor(id: string) {
    this.id = id;
    this.three = {
      group: new THREE.Group(),
      ground: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    };
    this.three.group.name = `GameMap_${id}`;
    this.three.group.rotation.x = Config.tile_tilt;

    this.camera = new GameCamera();

    this._threeManager = new THREEManager();
    this.three.group.add(this._threeManager.three.group);

    this.entityManager = new EntityManager();
    this.systemManager = new SystemManager(this.entityManager);
  }

  // ─── 初始化 ───────────────────────────────────

  async init(): Promise<void> {
    await this._loadData();
    await this._createSystems();
  }

  /** Debug 辅助 */
  $debug(): void {
    const axe = new THREE.AxesHelper(5);
    this.three.group.add(axe);
  }

  // ─── 更新 ─────────────────────────────────────

  update(ctx: { game: unknown }): void {
    this.frame++;
    this.systemManager.updateAll({ frame: this.frame, game: ctx.game, world: this });
  }

  // ─── 对象管理 ─────────────────────────────────

  addObject(obj: GameObject): void {
    if (obj.three.destory) return;
    if (obj.inMap && obj.inMap !== this) {
      (obj.inMap as GameMap).removeObject(obj);
    }

    this._threeManager.add(obj.three.object3d!);
    obj.inMap = this;
    this.objects.set(obj.uuid, obj);
  }

  removeObject(obj: GameObject): void {
    this._threeManager.remove(obj.three.object3d!);
    this.objects.delete(obj.uuid);
    obj.inMap = null;

    if (obj instanceof Entity) {
      this.entityManager.removeEntity(obj);
    }
  }

  clearObjects(): void {
    this._threeManager.clear();
    this.objects.clear();
  }

  // ─── 实体管理 ─────────────────────────────────

  addEntity(ent: Entity): void {
    if (ent.manager !== this.entityManager) {
      ent.manager.removeEntity(ent);
      this.entityManager.addEntity(ent);
    }
    this.addObject(ent);
  }

  // ─── 场景切换 ─────────────────────────────────

  _exitScene(): void {
    this.three.group.visible = false;
    this.isInScene = false;
  }

  _enterScene(): void {
    this.three.group.visible = true;
    this.isInScene = true;
  }

  // ─── 插值 ─────────────────────────────────────

  tweenThree(p = 1): void {
    this.camera.tweenThree(p);
    this.objects.forEach((obj) => obj.tweenThree(p));
  }

  // ─── 数据加载 ─────────────────────────────────

  protected async _loadData(): Promise<GameMapDefinition> {
    const parsed = THID.parse(this.id);
    const runPath =
      (globalThis as Record<string, unknown>).GAME_CONFIG_RUN_PATH || '';
    const url = `${runPath}/definitions/game_maps/${parsed.id}.json`;
    const map = (await (await fetch(url)).json()) as GameMapDefinition;
    this.definition = map;
    return map;
  }

  protected async _createSystems(): Promise<void> {
    if (!this.definition) throw new Error('加载 system 前需要先加载地图数据');

    if (this.definition.systems) {
      for (const sId of this.definition.systems) {
        const sobj = THID.parse(sId);
        if (sobj.type !== 'system') {
          console.error(`[GameMap] ${sId} 不是一个 system`);
          continue;
        }
        const inst = System.create(sId);
        this.systemManager.add(inst);
      }
    }
  }

  // ─── 销毁 ─────────────────────────────────────

  destory(): void {
    this.entityManager.getAllEntities().forEach((e) => {
      this.entityManager.removeEntity(e);
    });
  }
}
