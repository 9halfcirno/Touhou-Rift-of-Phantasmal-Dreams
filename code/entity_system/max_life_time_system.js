import { EntityManager } from "../managers/entity_manager.js";
import { System } from "./system.js";

class MaxLifeTimeSystem extends System {
    constructor() {
        super({
            name: "MaxLifeTimeSystem",
            requireComponents: ["th:max_life_time"],
            priority: 1
        });
    }

    update({ frame }) {
        const entities = this.query.entities;
        for (const entity of entities) { // 检查生命值
            const time = entity.getComponent("th:max_life_time").value;
            if (frame - entity.spawnTime > time) entity.die();

        }
    }
}

new MaxLifeTimeSystem();

export { MaxLifeTimeSystem };