import { Component } from '../ecs/Component.js';

/**
 * 玩家操控组件
 *
 * 标记实体为玩家可操控（无特殊数据，仅作为标记和 Query 匹配）。
 * 迁移自 code/entity_components/player_controls_component.js
 */
export class PlayerControlsComponent extends Component<Record<string, unknown>> {
  constructor(data: Record<string, unknown> = {}) {
    super('th:player_controls', data);
  }

  get value(): Record<string, unknown> {
    return this.data;
  }

  set value(v: Record<string, unknown>) {
    this.data = v;
  }
}

Component.register(
  'th:player_controls',
  PlayerControlsComponent as unknown as new (data: unknown) => Component<unknown>,
);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:player_controls': Record<string, unknown>;
  }
}
