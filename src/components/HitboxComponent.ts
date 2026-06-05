import { Component } from '../ecs/Component.js';
import type { HitboxData } from '../core/types.js';

const SHAPES = {
  CIRCLE: 'circle' as const,
  BOX: 'box' as const,
} as const;

/**
 * 碰撞盒组件
 *
 * 支持圆形（circle）和矩形（box）两种碰撞形状。
 * 迁移自 code/entity_components/hitbox_component.js
 */
export class HitboxComponent extends Component<HitboxData> {
  shape: 'circle' | 'box';
  r?: number;
  width?: number;
  height?: number;
  rotation?: number;

  constructor(data: HitboxData) {
    super('th:hitbox', data);

    this.shape = data.shape;

    if (data.shape === SHAPES.CIRCLE) {
      this.r = data.r;
    } else if (data.shape === SHAPES.BOX) {
      this.width = data.width;
      this.height = data.height;
      this.rotation = data.rotation;
    }
  }

  get value(): HitboxData {
    return { ...this.data };
  }

  set value(v: HitboxData) {
    Object.assign(this, v);
  }
}

Component.register('th:hitbox', HitboxComponent as unknown as new (data: unknown) => Component<unknown>);
