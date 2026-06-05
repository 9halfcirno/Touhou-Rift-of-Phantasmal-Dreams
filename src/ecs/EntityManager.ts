import { Entity } from './Entity.js';
import { THID } from '../resources/THID.js';
import { EntityQuery } from './EntityQuery.js';
import type { EntityDefinition } from '../core/types.js';

/**
 * 实体管理器
 *
 * 与 Entity 存在循环引用。在 ES modules 中安全：
 * - EntityManager 的静态初始化在模块加载时完成
 * - Entity 构造函数在运行时调用，此时双方均已就绪
 *
 * 迁移自 code/managers/entity_manager.js
 */
export class EntityManager {
  /** uuid → Entity */
  private _entityPool = new Map<string, Entity>();

  /** queryKey → EntityQuery */
  private _queries = new Map<string, EntityQuery>();

  // ─── 静态：实体定义注册表 ─────────────────────

  /** thid → EntityDefinition */
  static entityDefinitions = new Map<string, EntityDefinition>();

  static {
    EntityManager.entityDefinitions.set('th:entity=null', {
      id: 'th:entity=null',
      texture: '',
      components: {},
    });
  }

  // ─── 实体 CRUD ───────────────────────────────

  createEntity(thid: string, params?: Record<string, unknown>): Entity {
    const ent = new Entity(thid, this, params);
    this.addEntity(ent);
    return ent;
  }

  addEntity(ent: Entity): void {
    this._entityPool.set(ent.uuid, ent);
    this.refreshEntityQueries(ent);
  }

  getEntity(uuid: string): Entity | undefined {
    return this._entityPool.get(uuid);
  }

  removeEntity(ent: Entity | string): boolean {
    const entity = typeof ent === 'string' ? this._entityPool.get(ent) : ent;
    if (!entity) return false;

    for (const query of this._queries.values()) {
      query.entities.delete(entity);
    }

    return this._entityPool.delete(entity.uuid);
  }

  getAllEntities(): Entity[] {
    return Array.from(this._entityPool.values());
  }

  // ─── 查询系统 ────────────────────────────────

  createQuery(components: string[] = []): EntityQuery {
    const sorted = [...components].sort();
    const key = sorted.join('|');

    const existing = this._queries.get(key);
    if (existing) return existing;

    const query = new EntityQuery(sorted);

    for (const entity of this._entityPool.values()) {
      if (this._entityMatchesQuery(entity, query)) {
        query.entities.add(entity);
      }
    }

    this._queries.set(key, query);
    return query;
  }

  refreshEntityQueries(entity: Entity): void {
    for (const query of this._queries.values()) {
      if (this._entityMatchesQuery(entity, query)) {
        query.entities.add(entity);
      } else {
        query.entities.delete(entity);
      }
    }
  }

  onComponentAdded(entity: Entity, _componentName: string): void {
    this.refreshEntityQueries(entity);
  }

  onComponentRemoved(entity: Entity, _componentName: string): void {
    this.refreshEntityQueries(entity);
  }

  // ─── 内部 ────────────────────────────────────

  private _entityMatchesQuery(entity: Entity, query: EntityQuery): boolean {
    for (const component of query.components) {
      if (!entity.hasComponent(component)) {
        return false;
      }
    }
    return true;
  }
}
