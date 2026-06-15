import { Entity } from '@/ecs/index.js';
import { Component } from '../ecs/Component.js';
import { Damage } from './DamageComponent.js';

type BulletData = {
  from: Entity | null;
  damage: Damage
}

/**
 * 子弹组件
 *
 * 标记实体为子弹类型，value 为子弹速度。
 * BulletMovementSystem 通过此组件筛选子弹实体并调用 step() 移动。
 */
export class BulletComponent extends Component<BulletData> {
  constructor(data: BulletData) {
    super('th:bullet', data ?? {
      from: null,
      damage: {
        value: 1,
        from: null,
        type: null
      }
    });
  }
}

Component.register('th:bullet', BulletComponent);
