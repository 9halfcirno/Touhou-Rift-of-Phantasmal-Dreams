import { System } from '../ecs/System.js';
import type { SystemUpdateContext } from '../core/types.js';

/**
 * 子弹移动系统 —— 按朝向移动（调用 entity.step()）
 *
 * 迁移自 code/entity_system/bullet_movement_system.js
 */
export class BulletMovementSystem extends System {
  constructor() {
    super({
      name: 'BulletMovementSystem',
      priority: 2,
      requireComponents: ['th:bullet'],
    });
  }

  override update({ entities }: SystemUpdateContext): void {
    for (const entity of entities) {
      (entity as { step: () => void }).step();
    }
  }
}

System.register('th:system=bullet_movement_system', BulletMovementSystem);
