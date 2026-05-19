import { System } from "./system.js";

class BulletMovementSystem extends System {
    constructor() {
        super({
            name: "BulletMovementSystem",
            priority: 2,
            requireComponents: ["th:bullet"]
        });
    }

    update({ entities }) {
        for (const entity of entities) {
            entity.step()

        }
    }
}

System.registerSystem("th:system=bullet_movement_system", BulletMovementSystem)

export { BulletMovementSystem }