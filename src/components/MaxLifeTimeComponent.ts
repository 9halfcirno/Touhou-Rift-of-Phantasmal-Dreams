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
  MaxLifeTimeComponent as unknown as new (data: unknown) => Component<unknown>,
);
