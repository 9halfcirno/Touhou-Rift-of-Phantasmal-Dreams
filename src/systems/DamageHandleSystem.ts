import { System } from '../ecs/System.js';
import type { SystemUpdateContext } from '../core/types.js';
import { type DamageComponent } from '@/components/DamageComponent.js';
import { HealthyComponent } from '@/components/HealthyComponent.js';

/**
 * 子弹移动系统 —— 按朝向移动（调用 entity.step()）
 *
 * 迁移自 code/entity_system/bullet_movement_system.js
 */
export class DamageHandleSystem extends System {
	constructor() {
		super({
			name: 'DamageHandleSystem',
			priority: 4,
			requireComponents: ['th:damage', "th:hp"],
		});
	}

	override update({ entities }: SystemUpdateContext): void {
		for (const entity of entities) {
			let damage = entity.getComponent("th:damage") as DamageComponent;
			if (damage.data.value !== 0) {
				let hp = entity.getComponent("th:hp") as HealthyComponent;
				if (hp) {
					hp.data.hp = hp.data.hp - damage.data.value;

					// 移除实体的damage
					// 
				}
			}
			entity.removeComponent("th:damage");
		}
	}
}

System.register('th:system=damage_handle_system', DamageHandleSystem);
