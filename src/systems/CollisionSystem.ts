import { System } from '../ecs/System.js';
import { SAT } from '../math/SAT.js';
import type { Shape } from '../math/SAT.js';
import type { SystemUpdateContext } from '../core/types.js';
import type { HitboxComponent } from '../components/HitboxComponent.js';
import { Entity } from '../ecs/Entity.ts';

/**
 * 碰撞系统 —— 使用 SAT 检测碰撞并分离
 *
 * 迁移自 code/entity_system/collision_system.js
 */
export class CollisionSystem extends System {
	constructor() {
		super({
			name: 'CollisionSystem',
			requireComponents: ['th:hitbox'],
			priority: 3,
		});
	}

	override update({ entities }: SystemUpdateContext): void {
		const entityList = [...entities];

		for (let i = 0; i < entityList.length; i++) {
			const entityA = entityList[i]!;
			const hitboxA = entityA.getComponent('th:hitbox') as HitboxComponent;
			if (!hitboxA) continue;

			const shapeA = buildShape(entityA, hitboxA);
			if (!shapeA) continue;

			for (let j = i + 1; j < entityList.length; j++) {
				const entityB = entityList[j]!;
				const hitboxB = entityB.getComponent('th:hitbox') as HitboxComponent;
				if (!hitboxB) continue;

				const shapeB = buildShape(entityB, hitboxB);
				if (!shapeB) continue;

				// 同碰撞组（非零）的实体之间不进行碰撞检测
				if (hitboxA.group !== 0 && hitboxA.group === hitboxB.group) continue;

				const result = SAT(shapeA, shapeB);
				if (!result.intersects || !result.mtv) continue;

				const mtv = result.mtv;
				let ratioA: number = 0.5;
				let ratioB: number = 0.5;

				if (hitboxA.pushable) {
					if (hitboxB.pushable) {
						ratioA = 0.5;
						ratioB = 0.5;
					} else {
						ratioA = 1;
						ratioB = 0;
					}
				} else {
					if (hitboxB.pushable) {
						ratioA = 0;
						ratioB = 1;
					} else {
						ratioA = 0;
						ratioB = 0;
					}
				}

				entityA.moveBy(-mtv.x * ratioA, 0, -mtv.y * ratioA);
				entityB.moveBy(mtv.x * ratioB, 0, mtv.y * ratioB);

				// entityA.emit?.('collision', { other: entityB, result });
				// entityB.emit?.('collision', {
				//   other: entityA,
				//   result: {
				//     ...result,
				//     normal: result.normal ? { x: -result.normal.x, y: -result.normal.y } : undefined,
				//     mtv: { x: -mtv.x, y: -mtv.y },
				//   },
				// });
			}
		}
	}
}

// ─── 辅助：构建碰撞形状 ─────────────────────────

function buildShape(
	entity: Entity,
	hitbox: HitboxComponent,
): Shape | null {
	const pos = entity.position;

	if (hitbox.shape === 'circle' && hitbox.r !== undefined) {
		return {
			shape: 'circle',
			x: pos.x + entity.movementVector.x,
			y: pos.z + entity.movementVector.z,
			r: hitbox.r
		};
	}

	if (hitbox.shape === 'box' && hitbox.width !== undefined && hitbox.height !== undefined) {
		const hw = hitbox.width * 0.5;
		const hh = hitbox.height * 0.5;
		return {
			shape: 'polygon',
			x: pos.x + entity.movementVector.x,
			y: pos.z + entity.movementVector.z,
			rotation: hitbox.rotation ?? entity.rotation.x ?? 0,
			verts: [
				{ x: -hw, y: -hh },
				{ x: hw, y: -hh },
				{ x: hw, y: hh },
				{ x: -hw, y: hh },
			],
		};
	}

	return null;
}

function fixPos(entity: Entity) {
	const movement = entity.movementVector;

	if (movement.x === 0 && movement.y === 0 && movement.z === 0) {
		entity.clearTweenPos();
	}

	entity.setPosition(
		entity.position.x + movement.x,
		entity.position.y + movement.y,
		entity.position.z + movement.z,
	);
	movement.set(0, 0, 0);
}

System.register('th:system=collision_system', CollisionSystem);
