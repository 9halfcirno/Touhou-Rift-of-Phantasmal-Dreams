import { System } from "../entity_system/system.js"
import { GameMap } from "../game_map/game_map.js";

class SystemManager {
    /**
     * 
     * @param {GameMap} map 
     */
    constructor(map) {
        this.gameMap = map;
        this.systems = [];
    }

    /**
     * 
     * @param {System} sys 添加的系统
     */
    add(sys) {
        // 帮system获取query
        let rc = sys.requireComponents || [];
        let que = this.gameMap.entityManager.createQuery(rc);

        sys.setQuery(que);
        this.systems.push(sys);
        // 按优先级排序，数字越小优先级越高
        this.systems.sort((sys1, sys2) => sys1.priority - sys2.priority);
    }

    remove(sys) {
        let index = this.systems.indexOf(sys);
        if (index > -1) {
            this.systems.splice(index, 1);
        }
    }

    clear() {
        this.systems.splice(0);
    }

    updateAll({ frame }) {
        for (let i = 0, n = this.systems.length; i < n; i++) {
            const system = this.systems[i];

            system.update({ entities:  system.query.entities, frame });
        }
    }
}

export { SystemManager }