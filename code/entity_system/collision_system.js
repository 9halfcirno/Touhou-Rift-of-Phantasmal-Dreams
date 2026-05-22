import { System } from "./system.js";
import { SAT } from "../sat.js";

function buildShape(entity, hitbox) {
    const pos = entity.position;

    // ===== Circle =====

    if (hitbox.shape === "circle") {
        return {
            shape: "circle",

            x: pos.x,
            y: pos.z,

            r: hitbox.r
        };
    }

    // ===== Box -> Polygon =====

    if (hitbox.shape === "box") {
        const hw = hitbox.width * 0.5;
        const hh = hitbox.height * 0.5;

        return {
            shape: "polygon",

            x: pos.x,
            y: pos.z,

            rotation:
                hitbox.rotation ??
                entity.rotation.x ??
                0,

            verts: [
                { x: -hw, y: -hh },
                { x: hw, y: -hh },
                { x: hw, y: hh },
                { x: -hw, y: hh }
            ]
        };
    }

    return null;
}

export class CollisionSystem extends System {

    constructor() {
        super({
            name: "collision_system",
            requireComponents: ["th:hitbox"],
            priority: 3
        });
    }

    update({ entities }) {        
        entities = [...entities];
        for (let i = 0; i < entities.length; i++) {
            const entityA = entities[i];

            const hitboxA =
                entityA.getComponent("th:hitbox");

            if (!hitboxA)
                continue;

            const shapeA =
                buildShape(entityA, hitboxA);

            if (!shapeA)
                continue;

            for (let j = i + 1; j < entities.length; j++) {
                const entityB = entities[j];

                const hitboxB =
                    entityB.getComponent("th:hitbox");

                if (!hitboxB)
                    continue;

                const shapeB =
                    buildShape(entityB, hitboxB);

                if (!shapeB)
                    continue;

                // ===== SAT =====

                const result =
                    SAT(shapeA, shapeB);                

                if (!result.intersects)
                    continue;

                const mtv = result.mtv;

                const ratio = 0.5;

                entityA.moveBy(-mtv.x * ratio, 0, -mtv.y * ratio);
                entityB.moveBy(mtv.x * ratio, 0, mtv.y * ratio);

                // ===== 回调 =====

                entityA.emit?.("collision", {
                    other: entityB,
                    result
                });

                entityB.emit?.("collision", {
                    other: entityA,
                    result: {
                        ...result,

                        normal: {
                            x: -result.normal.x,
                            y: -result.normal.y
                        },

                        mtv: {
                            x: -result.mtv.x,
                            y: -result.mtv.y
                        }
                    }
                });
            }
        }
    }
}

System.registerSystem("th:system=collision_system", CollisionSystem)