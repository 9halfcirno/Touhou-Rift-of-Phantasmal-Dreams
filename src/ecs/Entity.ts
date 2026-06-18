import * as THREE from 'three';
import { GameObject2D } from '../objects/GameObject2D.js';
import { Texture } from '../graphics/Texture.js';
import { TextureLoader } from '../graphics/TextureLoader.js';
import { Component } from './Component.js';
import { EntityManager } from './EntityManager.js';
import { THID } from '../resources/THID.js';
import { Position, Vector2, Vector3 } from '../math/Position.js';
import type { EntityDefinition } from '../core/types.js';
import { GameObject } from '@/objects/GameObject.js';

/**
 * 游戏实体（ECS 中的 Entity）
 *
 * 继承 GameObject2D，附加以组件系统和移动向量为基础的行为。
 * 支持 faceTo（朝向目标）、step（按朝向移动）、moveTo/moveBy（位移）。
 *
 * 迁移自 code/game_object/game_entity.js
 */
export class Entity extends GameObject2D {
  /** 实体定义标识（thid） */
  readonly thid: string;

  /** 所属实体管理器 */
  manager: EntityManager | null;

  /** 是否存活 */
  isAlive = true;

  /** 生成帧号 */
  spawnTime: number;

  /** 组件映射（type → Component） */
  components: null | Map<string, Component> = new Map();

  /** 注册实体定义 */
  static async register(thid: string): Promise<EntityDefinition> {
    const parsed = THID.parse(thid);
    if (parsed.type !== 'entity') {
      throw new Error(`[Entity] 错误的thid类型: ${thid}`);
    }

    const runPath = (globalThis as Record<string, unknown>).GAME_CONFIG_RUN_PATH || '';
    const url = `${runPath}/definitions/entities/${parsed.id}.json`;

    const entity = (await (await fetch(url)).json()) as EntityDefinition;
    EntityManager.entityDefinitions.set(entity.id, entity);

    return entity;
  }

  /** 移动向量（由移动系统消费后清零） */
  readonly movementVector = new Vector3(0, 0, 0);

  /** 初始化锁（避免初始化期间触发 Query 刷新） */
  private _initializing = true;

  constructor(
    thid: string,
    manager: EntityManager,
    params: Record<string, unknown> = {},
  ) {
    const def = EntityManager.entityDefinitions.get(thid);
    if (!def) throw new Error(`[Entity] 未注册的实体: ${thid}`);

    const mat =
      (params['material'] as THREE.MeshLambertMaterial) ||
      new THREE.MeshLambertMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.5,
      });

    super({
      material: mat,
      rotation: new Vector2(),
      position: params['position'] as Position | undefined,
    });

    this.thid = thid;
    this.manager = manager;

    // spawnTime: 从 params 取 frame 字段
    const frameVal = params['frame'];
    this.spawnTime = typeof frameVal === 'number' ? frameVal : 0;

    // 加载纹理
    const tex = mat.map || TextureLoader.get(def.texture, { shared: true });
    if (tex instanceof Texture) {
      this.texture = tex;
    }

    // 加载组件
    this.loadAllComponents(def);
    this._initializing = false;
  }

  // ─── 移动 ─────────────────────────────────────

  /** 移动到指定坐标（设置移动向量） */
  moveTo(x: number, y: number, z: number): this {
    this.movementVector.set(
      x - this.position.x,
      y - this.position.y,
      z - this.position.z,
    );
    return this;
  }

  /** 相对移动 */
  moveBy(x: number, y: number, z: number): this {
    this.movementVector.add(new Vector3(x, y, z));
    return this;
  }

  /**
   * 按朝向移动指定距离
   *
   * @param dis 移动距离（默认取 speed 组件值）
   */
  step(dis?: number): void {
    const speedComp = this.getComponentValue('th:speed');
    const speed = dis ?? (typeof speedComp === 'number' ? speedComp : 0);

    if (!speed) return;

    const yaw = this.rotation.x;
    const pitch = this.rotation.y;

    const cosPitch = Math.cos(pitch);

    const vx = Math.sin(yaw) * cosPitch;
    const vy = Math.sin(pitch);
    const vz = Math.cos(yaw) * cosPitch;

    this.moveBy(vx * speed, vy * speed, vz * speed);
  }

  /**
   * 朝向目标位置
   */
  faceTo(
    target: number | Position | { x: number; y: number; z: number } | GameObject,
    y?: number,
    z?: number,
  ): void {
    if (!target && target !== 0) return;

    let tx: number;
    let ty: number;
    let tz: number;

    if (target instanceof Position) {
      tx = target.x;
      ty = target.y;
      tz = target.z;
    } else if (target instanceof GameObject) {
      tx = target.position.x;
      ty = target.position.y;
      tz = target.position.z;
    } else if (typeof target === 'object') {
      tx = target.x;
      ty = target.y;
      tz = target.z;
    } else {
      tx = target;
      ty = y!;
      tz = z!;
    }

    const dx = tx - this.position.x;
    const dy = ty - this.position.y;
    const dz = tz - this.position.z;

    const hor = Math.sqrt(dx * dx + dz * dz);

    this.rotation.x = Math.atan2(dx, dz);
    this.rotation.y = Math.atan2(dy, hor);

    this.updateThreeData();
  }

  // ─── 生命周期 ─────────────────────────────────

  /** 实体死亡 */
  die(): void {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.manager!.removeEntity(this.uuid);
    this.inMap?.removeEntity(this);
    this._disposeThree();
    // 销毁其他数据
    this.manager = null;
    this.components = null;
  }

  // ─── 组件操作 ─────────────────────────────────

  /** 获取组件 */
  getComponent(type: string): Component | undefined {
    return this.components?.get(type);
  }

  /** 获取组件值 */
  getComponentValue(type: string): any {
    const component = this.components?.get(type);
    if (!component) return null;
    return component.data;
  }

  /** 设置组件（接受任意 type/data 以兼容 JSON 加载） */
  setComponent(type: string, data: unknown): Component {
    const component = Component.create(type, data);
    
    this.components?.set(type, component);

    if (!this._initializing) {
      this.manager?.onComponentAdded(this, type);
    }

    return component;
  }

  /** 设置组件值（存在则更新，不存在则创建） */
  setComponentValue(type: string, value: unknown): void {
    const component = this.components!.get(type);

    if (component) {
      component.data = value;
    } else {
      const com = Component.create(type, value);
      this.components?.set(type, com);

      if (!this._initializing) {
        this.manager?.onComponentAdded(this, type);
      }
    }
  }

  /** 是否存在某组件 */
  hasComponent(type: string): boolean {
    return this.components?.has(type) || false;
  }

  addComponent(c: Component) {
    if (this.hasComponent(c.type)) console.warn(`[Entity] 已有 ${c.type} 组件, 将覆盖原组件`);
    
    this.components!.set(c.type, c);

    if (!this._initializing) {
      this.manager?.onComponentAdded(this, c.type);
    }
  }

  /** 移除组件 */
  removeComponent(type: string): boolean {
    if (!this.isAlive) {
      console.error(`[Enttiy] 实体已被销毁, 无法调用该方法`);
      return false;
    }
    

    const existed = this.components!.delete(type);

    if (existed) {
      this.manager?.onComponentRemoved(this, type);
    }

    return existed;
  }

  // ─── 内部 ─────────────────────────────────────

  /** 从定义加载所有组件 */
  private loadAllComponents(def: EntityDefinition): void {
    if (!def.components) return;

    for (const [type, data] of Object.entries(def.components)) {
      let cloneData = structuredClone(data);
      this.setComponent(type, cloneData);
    }
  }
}
