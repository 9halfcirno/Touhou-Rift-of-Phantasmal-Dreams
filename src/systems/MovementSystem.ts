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
      const movement = (entity as { movementVector: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void } }).movementVector;

      if (movement.x === 0 && movement.y === 0 && movement.z === 0) {
        (entity as { _orginPos: { copy: (p: unknown) => void }; position: unknown })._orginPos.copy(
          (entity as { position: unknown }).position,
        );
        continue;
      }

      (entity as { setPosition: (x: number, y: number, z: number) => void }).setPosition(
        (entity as { position: { x: number; y: number; z: number } }).position.x + movement.x,
        (entity as { position: { x: number; y: number; z: number } }).position.y + movement.y,
        (entity as { position: { x: number; y: number; z: number } }).position.z + movement.z,
      );

      movement.set(0, 0, 0);
    }
  }
}

System.register('th:system=movement_system', MovementSystem);
