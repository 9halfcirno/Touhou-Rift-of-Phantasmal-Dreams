import { Component } from '../ecs/Component.js';

/**
 * 子弹组件
 *
 * 标记实体为子弹类型，value 为子弹速度。
 * BulletMovementSystem 通过此组件筛选子弹实体并调用 step() 移动。
 */
export class BulletComponent extends Component<number> {
  constructor(data: number) {
    super('th:bullet', data ?? 0);
  }

  get value(): number {
    return this.data;
  }

  set value(v: number) {
    this.data = v;
  }
}

Component.register('th:bullet', BulletComponent as unknown as new (data: unknown) => Component<unknown>);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:bullet': number;
  }
}
