import { Component } from '../ecs/Component.js';

// ─── 命中框数据类型 ──────────────────────────────

/** 命中框 —— 圆形 */
export interface HitboxCircle {
  shape: 'circle';
  r: number;
}

/** 命中框 —— 矩形 */
export interface HitboxBox {
  shape: 'box';
  width: number;
  height: number;
  /** 可选旋转（弧度） */
  rotation?: number;
}

export interface HitboxBase {
  /** 碰撞组：相同非零 group 的实体之间不会碰撞。默认 0（不分组） */
  group?: number;
  /** 是否可被推动 */
  pushable?: boolean;
}

export type HitboxData = (HitboxCircle | HitboxBox) & HitboxBase;

const SHAPES = {
  CIRCLE: 'circle' as const,
  BOX: 'box' as const,
} as const;

/**
 * 碰撞盒组件
 *
 * 支持圆形（circle）和矩形（box）两种碰撞形状。
 * `group` 字段用于碰撞分组：同组（非零）实体之间不进行碰撞检测。
 * 迁移自 code/entity_components/hitbox_component.js
 */
export class HitboxComponent extends Component<HitboxData> {
  shape: 'circle' | 'box';
  r?: number;
  width?: number;
  height?: number;
  rotation?: number;
  pushable: boolean;

  /** 碰撞组：相同非零 group 的实体之间不会碰撞 */
  group: number;

  constructor(data: HitboxData) {
    super('th:hitbox', data);
    
    this.shape = data.shape;
    this.group = data.group ?? 0;
    this.pushable = data.pushable ?? true;

    if (data.shape === SHAPES.CIRCLE) {
      this.r = data.r;
    } else if (data.shape === SHAPES.BOX) {
      this.width = data.width;
      this.height = data.height;
      this.rotation = data.rotation;
    }
  }
}

Component.register('th:hitbox', HitboxComponent);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
  interface ComponentTypeMap {
    'th:hitbox': HitboxData;
  }
}
