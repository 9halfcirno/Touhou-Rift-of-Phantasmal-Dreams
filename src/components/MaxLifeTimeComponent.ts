import { Component } from '../ecs/Component.js';

/**
 * 最大存活时间组件
 *
 * 单位：逻辑帧（25Hz）
 * 迁移自 code/entity_components/max_life_time_component.js
 */
export class MaxLifeTimeComponent extends Component<number> {
  constructor(data: number) {
    super('th:max_life_time', data);
  }

  get value(): number {
    return this.data;
  }

  set value(v: number) {
    this.data = v;
  }
}

Component.register(
  'th:max_life_time',
  MaxLifeTimeComponent,
);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:max_life_time': number;
  }
}
