import { System } from "./system.js";

/* 依赖：
 * - Entity
 * - System
 * - GameObject . position, movementVector
 */
class MovementSystem extends System {
    constructor() {
        super({
            name: "MovementSystem",
            requireComponents: [],
            priority: 2
        });
    }

    /**
     * 
     * @param {Entity} entity 
     * @returns 
     */
    updateEntity(entity) {
        let movement = entity.movementVector;
        
        // 无移动向量则跳过, 保持原位置用于缓动
        // 这是为了防止在没有移动时，缓动位置不更新导致抖动
        // 这是一个性能优化，在20000+实体时效果明显
        if (movement.x === 0 && movement.y === 0 && movement.z === 0) {
            entity._orginPos.copy(entity.position);
            return;
        };
        
        // 更新位置  
        
        entity.setPosition(
            entity.position.x + movement.x,
            entity.position.y + movement.y,
            entity.position.z + movement.z
        );
        
        // 清空移动向量
        movement.set(0, 0, 0);
    }

    update({ entities }) {
        for (const entity of entities) {
            
            this.updateEntity(entity)
        }
    }
}

System.registerSystem("th:system=movement_system", MovementSystem)

export { MovementSystem };