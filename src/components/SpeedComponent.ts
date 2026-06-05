import { Component } from '../ecs/Component.js';

/**
 * 速度组件
 *
 * 迁移自 code/entity_components/speed_component.js
 */
export class SpeedComponent extends Component<number> {
  constructor(data: number) {
    super('th:speed', data ?? 0);
  }

  get value(): number {
    return this.data;
  }

  set value(v: number) {
    this.data = v;
  }
}

Component.register('th:speed', SpeedComponent as unknown as new (data: unknown) => Component<unknown>);
