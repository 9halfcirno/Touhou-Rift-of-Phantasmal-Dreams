import { EntityManager } from "../managers/entity_manager.js"

class System {
    constructor(opts = {}) {
        this.name = opts.name || "UnnamedSystem"; // system的名字
        const requires = opts.requireComponents || [];
        this.requireComponents = requires;

        this.query = [];

        this.priority = opts.priority || 0;
    }

    setQuery(que) {
        this.query = que;
    }

    update() {
        throw new Error(`[${this.name}] 必须实现update方法`)
    }

    static createSystem(id) {
        let sclass = System.systems.get(id);
        if (!sclass) throw new Error(`未注册的system: "${id}"`);
        return new sclass();
    }

    static registerSystem(name, sysclass) {
        System.systems.set(name, sysclass);
    }
}

System.systems = new Map();

export { System };