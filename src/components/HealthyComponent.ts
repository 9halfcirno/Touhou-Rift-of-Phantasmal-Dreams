import { Component } from '../ecs/Component.js';

/** 生命值数据 */
export interface HealthData {
  hp: number;
  maxHp: number;
}

/**
 * 生命值组件
 *
 * value 返回当前 hp（number），与原 JS 行为一致。
 * 构造时可接受 { hp, maxHp } 或直接传数字。
 *
 * 迁移自 code/entity_components/healthy_component.js
 */
export class HealthyComponent extends Component<HealthData> {
  constructor(data: HealthData) {
    super('th:hp', data);
  }
}

Component.register('th:hp', HealthyComponent);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:hp': HealthData;
  }
}
