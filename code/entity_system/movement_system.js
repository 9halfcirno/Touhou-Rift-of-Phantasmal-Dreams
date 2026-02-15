import { System } from "./system";
import { Entity } from "../game_entity.js";

class MovementSystem extends System {
    constructor() {
        super({
            name: "MovementSystem",
            requireComponents: ["th:position", "th:speed"],
            priority: 2
        });
    }

    updateEntity(entity, speed) {
        const position = entity.position;

        const sx = speed * Math.cos(entity.rotation.z);
        const sz = speed * Math.sin(entity.rotation.z);

        entity.moveBy(sx, 0, sz);
    }

    update() {
        const entities = Entity.getAllEntities();
        for (const entity of entities) {
            const positionAtt = entity.getAtt("th:position");
            const speedAtt = entity.getAtt("th:speed");
            if (!positionAtt || !speedAtt) continue;
            this.updateEntity(entity, positionAtt.value, speedAtt.value);
        }
    }
}

export { MovementSystem };