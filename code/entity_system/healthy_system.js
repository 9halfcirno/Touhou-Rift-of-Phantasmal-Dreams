import { Entity } from "../game_entity.js";
import { System } from "../system.js";

class HealthySystem extends System {
    constructor() {
        super({
            name: "HealthySystem",
            requireComponents: ["th:hp"],
            priority: 1
        });
    }

    updateEntity(entity, hp) {
        if (hp <= 0) {
            entity.die();
        }
    }

    update() {
        const entities = Entity.getAllEntities();
        for (const entity of entities) {
            const hpAtt = entity.getAtt("th:hp");
            if (!hpAtt) continue;
            const hp = Number(hpAtt.value) || 0;
            this.updateEntity(entity, hp);
        }
    }
}

export { HealthySystem };