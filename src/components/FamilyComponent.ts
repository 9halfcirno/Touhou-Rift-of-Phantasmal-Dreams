import { Component } from '../ecs/Component.js';

/**
 * 阵营/家族组件
 *
 * 用于区分敌我关系（如 "player"、"enemy"、"neutral"）。
 * 迁移自 code/entity_components/family_component.js
 */
export class FamilyComponent extends Component<string> {
  constructor(data: string) {
    super('th:family', data);
  }

  get value(): string {
    return this.data;
  }

  set value(v: string) {
    this.data = v;
  }
}

Component.register('th:family', FamilyComponent as unknown as new (data: unknown) => Component<unknown>);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:family': string;
  }
}
