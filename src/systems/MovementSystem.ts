import { System } from '../ecs/System.js';
import type { SystemUpdateContext } from '../core/types.js';

/**
 * 移动系统 —— 每帧消费 movementVector 并更新实体位置
 *
 * 迁移自 code/entity_system/movement_system.js
 */
export class MovementSystem extends System {
  constructor() {
    super({
      name: 'MovementSystem',
      requireComponents: [],
      priority: 4,
    });
  }

  override update({ entities }: SystemUpdateContext): void {
    for (const entity of entities) {
      const movement = entity.movementVector;

      if (movement.x === 0 && movement.y === 0 && movement.z === 0) {
        entity.clearTweenPos();
        continue;
      }

      entity.setPosition(
        entity.position.x + movement.x,
        entity.position.y + movement.y,
        entity.position.z + movement.z,
      );

      movement.set(0, 0, 0);
    }
  }
}

System.register('th:system=movement_system', MovementSystem);
