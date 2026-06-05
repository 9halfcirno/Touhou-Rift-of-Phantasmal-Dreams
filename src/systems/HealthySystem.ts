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
      const hpComp = (entity as { getComponent: (type: string) => { value: number } | undefined }).getComponent('th:hp');
      if (hpComp && hpComp.value <= 0) {
        (entity as { die: () => void }).die();
        continue;
      }

      // 检查最大存活时间（MaxLifeTimeSystem 也做了，此处作为冗余保护）
      if ((entity as { hasComponent: (t: string) => boolean }).hasComponent('th:max_life_time')) {
        const time = (entity as { getComponent: (type: string) => { value: number } | undefined }).getComponent('th:max_life_time')?.value;
        const spawnTime = (entity as { spawnTime: number }).spawnTime;
        if (typeof time === 'number' && frame - spawnTime > time) {
          (entity as { die: () => void }).die();
        }
      }
    }
  }
}

System.register('th:system=healthy_system', HealthySystem);
