import { System } from '../ecs/System.js';
import { SAT } from '../math/SAT.js';
import type { Shape } from '../math/SAT.js';
import type { SystemUpdateContext } from '../core/types.js';
import type { HitboxComponent } from '../components/HitboxComponent.js';

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
    const entityList = [...entities] as unknown as Array<{
      position: { x: number; y: number; z: number };
      rotation: { x: number };
      moveBy: (x: number, y: number, z: number) => void;
      emit?: (event: string, data: Record<string, unknown>) => void;
      getComponent: (type: string) => HitboxComponent | undefined;
    }>;

    for (let i = 0; i < entityList.length; i++) {
      const entityA = entityList[i]!;
      const hitboxA = entityA.getComponent('th:hitbox');
      if (!hitboxA) continue;

      const shapeA = buildShape(entityA, hitboxA);
      if (!shapeA) continue;

      for (let j = i + 1; j < entityList.length; j++) {
        const entityB = entityList[j]!;
        const hitboxB = entityB.getComponent('th:hitbox');
        if (!hitboxB) continue;

        const shapeB = buildShape(entityB, hitboxB);
        if (!shapeB) continue;

        // 同碰撞组（非零）的实体之间不进行碰撞检测
        if (hitboxA.group !== 0 && hitboxA.group === hitboxB.group) continue;

        const result = SAT(shapeA, shapeB);
        if (!result.intersects || !result.mtv) continue;

        const mtv = result.mtv;
        const ratio = 0.5;

        entityA.moveBy(-mtv.x * ratio, 0, -mtv.y * ratio);
        entityB.moveBy(mtv.x * ratio, 0, mtv.y * ratio);

        entityA.emit?.('collision', { other: entityB, result });
        entityB.emit?.('collision', {
          other: entityA,
          result: {
            ...result,
            normal: result.normal ? { x: -result.normal.x, y: -result.normal.y } : undefined,
            mtv: { x: -mtv.x, y: -mtv.y },
          },
        });
      }
    }
  }
}

// ─── 辅助：构建碰撞形状 ─────────────────────────

function buildShape(
  entity: { position: { x: number; y: number; z: number }; rotation: { x: number } },
  hitbox: HitboxComponent,
): Shape | null {
  const pos = entity.position;

  if (hitbox.shape === 'circle' && hitbox.r !== undefined) {
    return { shape: 'circle', x: pos.x, y: pos.z, r: hitbox.r };
  }

  if (hitbox.shape === 'box' && hitbox.width !== undefined && hitbox.height !== undefined) {
    const hw = hitbox.width * 0.5;
    const hh = hitbox.height * 0.5;
    return {
      shape: 'polygon',
      x: pos.x,
      y: pos.z,
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

System.register('th:system=collision_system', CollisionSystem);
