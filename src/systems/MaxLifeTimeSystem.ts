import { System } from '../ecs/System.js';
import type { SystemUpdateContext } from '../core/types.js';

/**
 * 最大存活时间系统 —— 超时死亡
 *
 * 迁移自 code/entity_system/max_life_time_system.js
 */
export class MaxLifeTimeSystem extends System {
  constructor() {
    super({
      name: 'MaxLifeTimeSystem',
      requireComponents: ['th:max_life_time'],
      priority: 1,
    });
  }

  override update({ entities, frame }: SystemUpdateContext): void {
    for (const entity of entities) {
      const time = (entity as { getComponentValue: (type: string) => number | null }).getComponentValue('th:max_life_time');
      const spawnTime = (entity as { spawnTime: number }).spawnTime;

      if (typeof time === 'number' && frame - spawnTime > time) {
        (entity as { die: () => void }).die();
      }
    }
  }
}

System.register('th:system=max_life_time_system', MaxLifeTimeSystem);
