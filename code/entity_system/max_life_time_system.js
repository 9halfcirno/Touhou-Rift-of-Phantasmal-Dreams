import { System } from "./system.js";

class MaxLifeTimeSystem extends System {
    constructor() {
        super({
            name: "MaxLifeTimeSystem",
            requireComponents: ["th:max_life_time"],
            priority: 1
        });
    }

    update({ entities, frame }) {        
        for (const entity of entities) { // 检查生命值
            
            const time = entity.getComponent("th:max_life_time").value;
            if (frame - entity.spawnTime > time) entity.die();

        }
    }
}

System.registerSystem("th:system=max_life_time_system", MaxLifeTimeSystem)

export { MaxLifeTimeSystem };