import type { Entity } from './Entity.js';

/**
 * 实体查询（原型系统）
 *
 * 根据组件组合匹配实体。内部使用排序后的组件 key 连接作为查询键。
 * System 通过 SystemManager 获取对应的 EntityQuery。
 *
 * 迁移自 code/managers/entity_manager.js 的 EntityQuery 内部类
 */
export class EntityQuery {
  /** 排序后的组件列表（已排序，用于快速比较） */
  readonly components: string[];

  /** 查询键（| 分隔的组件名） */
  readonly key: string;

  /** 匹配此查询的实体集合 */
  readonly entities = new Set<Entity>();

  constructor(components: string[]) {
    this.components = [...components].sort();
    this.key = this.components.join('|');
  }
}
