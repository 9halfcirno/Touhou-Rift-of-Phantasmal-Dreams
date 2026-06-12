import { System } from '../ecs/System.js';
import type { SystemUpdateContext } from '../core/types.js';

/**
 * 生命值系统 —— 检测实体是否死亡 + 检查最大存活时间
 *
 * 迁移自 code/entity_system/healthy_system.js
 */
export class HealthySystem extends System {
  constructor() {
    super({
      name: 'HealthySystem',
      requireComponents: ['th:hp'],
      priority: 1,
    });
  }

  override update({ entities, frame }: SystemUpdateContext): void {
    for (const entity of entities) {
      const hpComp = entity.getComponent('th:hp');
      if (hpComp && hpComp.data.hp <= 0) {
        entity.die();
        continue;
      }
    }
  }
}

System.register('th:system=healthy_system', HealthySystem);
