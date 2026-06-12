export class Component<D = any> {
  type: string;
  data: D;

  private static _component = new Map<string, new (...args: any[]) => Component>()

  private static _componentData = new Map<new (...args: any[]) => Component, unknown>()

  constructor(type: string, data: D) {
    this.type = type;
    this.data = data;
  }

  static register<C extends new (...args: any[]) => Component, D>(type: string, com: C, data?: D) {
    this._component.set(type, com); // 存放类构造器
    this._componentData.set(com, data); // 存放组件数据
  }

  static create(type: string, data: unknown): Component {
    // get component class object
    let Com = this._component.get(type);

    if (Com) {
      let componentData = this._componentData.get(Com);
      return new Com(componentData || data)
    } else {
      return new FallComponent(type, data);
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
