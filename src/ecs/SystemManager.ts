import { System } from './System.js';
import type { EntityManager } from './EntityManager.js';
import type { SystemUpdateContext } from '../core/types.js';

/**
 * 系统管理器
 *
 * 维护 System 列表，按优先级排序执行。
 * 添加 System 时自动为其创建 EntityQuery。
 *
 * 迁移自 code/managers/system_manager.js
 */
export class SystemManager {
  /** 所属 EntityManager */
  private entityManager: EntityManager;

  /** 注册的系统列表（按优先级排序） */
  private systems: System[] = [];

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * 添加系统，自动获取 EntityQuery
   */
  add(sys: System): void {
    const components = sys.requireComponents || [];
    const query = this.entityManager.createQuery(components);

    sys.query = query;
    this.systems.push(sys);

    // 按优先级排序
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除系统
   */
  remove(sys: System): void {
    const index = this.systems.indexOf(sys);
    if (index > -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * 清空所有系统
   */
  clear(): void {
    this.systems.length = 0;
  }

  /**
   * 执行所有系统的 update
   */
  updateAll(ctx: Omit<SystemUpdateContext, 'entities'>): void {
    for (let i = 0; i < this.systems.length; i++) {
      const system = this.systems[i]!;

      if (system.query) {
        system.update({
          entities: system.query.entities,
          ...ctx,
        });
      }
    }
  }
}
