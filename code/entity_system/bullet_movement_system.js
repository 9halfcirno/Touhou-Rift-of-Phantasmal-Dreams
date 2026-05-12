import { EntityManager } from "../managers/entity_manager.js";
import { System } from "./system.js";

class BulletMovementSystem extends System {
    constructor() {
        super({
            name: "BulletMovementSystem",
            priority: 2,
            requireComponents: ["th:bullet"]
        });
    }

    update() {
        for (const entity of this.query.entities) {
            entity.step(entity.rotation)

        }
    }
}

new BulletMovementSystem();

export { BulletMovementSystem }