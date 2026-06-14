import type { EntityQuery } from './EntityQuery.js';
import type { ComponentType, SystemUpdateContext } from '../core/types.js';
import { THID } from '@/resources/THID.js';

/**
 * ECS 系统基类
 *
 * 每个 System 声明依赖哪些组件（requireComponents），
 * SystemManager 会为其创建对应的 EntityQuery。
 * 按 priority 从小到大执行（数字越小越先执行）。
 *
 * 迁移自 code/entity_system/system.js
 */
export abstract class System {
  /** 系统名称 */
  readonly name: string;

  /** 依赖的组件类型列表 */
  readonly requireComponents: string[];

  /** 执行优先级（数字越小越先执行） */
  readonly priority: number;

  /**
   * 匹配的实体查询（由 SystemManager 注入）
   * 在 System 注册到 SystemManager 后自动设置
   */
  query: EntityQuery | null = null;

  constructor(opts: {
    name?: string;
    requireComponents?: Array<ComponentType>;
    priority?: number;
  } = {}) {
    this.name = opts.name || 'UnnamedSystem';
    this.requireComponents = opts.requireComponents || [];
    this.priority = opts.priority || 0;
  }

  /**
   * 每逻辑帧执行
   *
   * @param ctx 更新上下文（entities, frame, game, world）
   */
  abstract update(ctx: SystemUpdateContext): void;

  // ─── 静态注册表 ────────────────────────────────

  /** systemId → System 构造函数 */
  private static _registry = new Map<string, new () => System>();

  /**
   * 注册系统
   *
   * @example
   *   System.register('th:system=movement_system', MovementSystem);
   */
  static register(id: string, ctor: new () => System): void {
    let thid = THID.parse(id);
    if (thid.type !== null && thid.type !== "system") {
      throw new Error(`[System] 注册的系统的thid类型必须为"system"或自动推断!`);
    }
    System._registry.set(`${thid.namespace}:${thid.id}`, ctor); // 用thid的id字段注册
  }

  /**
   * 创建系统实例
   */
  static create(id: string): System {
    let thid = THID.parse(id);
    if (thid.type !== null && thid.type !== "system") {
      throw new Error(`[System] 创建系统时的thid类型必须为"system"或自动推断!`);
    }

    const Ctor = System._registry.get(`${thid.namespace}:${thid.id}`);
    if (!Ctor) {
      throw new Error(`未注册的system: "${thid.namespace}:${thid.id}"`);
    }
    return new Ctor();
  }
}
