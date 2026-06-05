import type { ComponentType, ComponentTypeMap } from '../core/types.js';

/**
 * ECS 组件基类
 *
 * 泛型 T 为组件数据类型（从 ComponentTypeMap 推导）。
 * 子类在模块底部通过 Component.register() 注册。
 *
 * 迁移自 code/entity_components/component.js
 */
export abstract class Component<T = unknown> {
  /** 组件类型标识（如 "th:hp"） */
  readonly type: string;

  /** 组件数据 */
  data: T;

  constructor(type: string, data: T) {
    this.type = type;
    this.data = data;
  }

  /** 获取组件值（由子类实现） */
  abstract get value(): T;

  /** 设置组件值（由子类实现） */
  abstract set value(v: T);

  // ─── 静态注册表 ────────────────────────────────

  /** 组件类型 → 构造函数 */
  private static _registry = new Map<string, new (data: unknown) => Component<unknown>>();

  /**
   * 注册组件
   *
   * @example
   *   Component.register('th:speed', SpeedComponent);
   */
  static register(type: string, ctor: new (data: unknown) => Component<unknown>): void {
    Component._registry.set(type, ctor);
  }

  /**
   * 创建组件实例（工厂方法）
   *
   * 如果 type 未注册，返回一个退化的普通对象包装。
   */
  static create<K extends ComponentType>(
    type: K,
    data?: ComponentTypeMap[K],
  ): Component<ComponentTypeMap[K]> {
    const Ctor = Component._registry.get(type);

    if (!Ctor) {
      // 退化：未注册的组件返回基础实现
      // console.warn(`[Component] 未注册的组件类型: ${type}`);
      return new FallbackComponent(type, data) as unknown as Component<ComponentTypeMap[K]>;
    }

    return new Ctor(data) as Component<ComponentTypeMap[K]>;
  }

  /**
   * 检查组件类型是否已注册
   */
  static has(type: string): boolean {
    return Component._registry.has(type);
  }
}

// ─── 退化组件（用于未注册类型）──────────────────

class FallbackComponent<T> extends Component<T> {
  get value(): T {
    return this.data;
  }
  set value(v: T) {
    this.data = v;
  }
}
