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
export class HealthyComponent extends Component<number> {
  /** 当前生命值 */
  hp: number;
  /** 最大生命值 */
  maxHp: number;

  constructor(data: HealthData | number) {
    super('th:hp', 0);

    if (typeof data === 'object') {
      this.maxHp = data.maxHp || Infinity;
      this.hp = data.hp ?? data.maxHp;
      this.data = this.hp;
    } else {
      this.hp = data ?? 0;
      this.maxHp = Infinity;
      this.data = this.hp;
    }
  }

  get value(): number {
    return this.hp;
  }

  set value(v: number) {
    this.hp = v > this.maxHp ? this.maxHp : v;
    this.data = this.hp;
  }
}

Component.register('th:hp', HealthyComponent as unknown as new (data: unknown) => Component<unknown>);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:hp': number;
  }
}
