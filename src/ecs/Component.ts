import { THID } from "@/resources/THID";

export class Component<D = any> {
  type: string;
  data: D;

  private static _component = new Map<string, new (...args: any[]) => Component>()

  constructor(type: string, data: D) {
    this.type = type;
    this.data = data;
  }

  static register<C extends new (...args: any[]) => Component, D>(id: string, com: C, data?: D) {
    let thid = THID.parse(id);
    if (thid.type !== null && thid.type !== "component") {
      throw new Error(`[Component] 注册的组件的thid类型必须为"component"或自动推断!`)
    }

    this._component.set(`${thid.namespace}:${thid.id}`, com); // 存放类构造器
  }

  static create(id: string, data: unknown): Component {
    let thid = THID.parse(id);

    if (thid.type !== null && thid.type !== "component") {
      throw new Error(`[Component] 注册的组件的thid类型必须为"component"或自动推断!`)
    }
    // get component class object
    let Com = this._component.get(`${thid.namespace}:${thid.id}`);

    if (Com) {
      return new Com(data)
    } else {
      return new FallComponent(`${thid.namespace}:${thid.id}`, data);
    }
  }

  destory(): void { }
}

class FallComponent extends Component<any> {
  constructor(type: string, data: any) {
    super(`th:!fall_match=${type}`, data);
    if (this.data.type) debugger;
  }
}
