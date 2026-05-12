import { ID } from "../parser_thid.js";
import { Entity } from "../game_object/game_entity.js";

class EntityQuery {
    constructor(components) {

        this.components = [...components].sort();

        this.key = this.components.join("|");

        /**
         * @type {Set<Entity>}
         */
        this.entities = new Set();
    }
}

const EntityManager = {

    /**
     * thid => definition
     */
    entityDefinitions: new Map(),

    /**
     * uuid => entity
     */
    _entityPool: new Map(),

    /**
     * queryKey => EntityQuery
     */
    _queries: new Map(),

    createEntity(thid, params) {

        const ent = new Entity(
            thid,
            this,
            params
        );

        // 修复原bug
        this._entityPool.set(ent.uuid, ent);

        // 初始化完成后统一刷新一次Query
        this.refreshEntityQueries(ent);

        return ent;
    },

    async registerEntity(thid) {

        let url = this._parseEntityUrl(thid);

        let entity =
            await (await fetch(url)).json();

        this.entityDefinitions.set(
            entity.thid,
            entity
        );

        return entity;
    },

    _parseEntityUrl(thid) {

        let a = ID.parse(thid);

        if (a.type !== "entity") {
            throw new Error(
                `[Entity] 错误的thid类型: ${thid}`
            );
        }

        let url =
            `${GAME_CONFIG.RUN_PATH}/definitions/entities`;

        url += "/" + a.id;

        url += ".json";

        return url;
    },

    /**
     * System创建查询
     * 
     * entityManager.createQuery([
     *   "th:position",
     *   "th:velocity"
     * ])
     */
    createQuery(components = []) {

        const sorted =
            [...components].sort();

        const key =
            sorted.join("|");

        // 已存在
        if (this._queries.has(key)) {
            return this._queries.get(key);
        }

        const query =
            new EntityQuery(sorted);

        // 初始化已有Entity
        for (const entity of this._entityPool.values()) {

            if (
                this._entityMatchesQuery(
                    entity,
                    query
                )
            ) {
                query.entities.add(entity);
            }
        }

        this._queries.set(key, query);

        return query;
    },

    /**
     * Entity是否匹配Query
     */
    _entityMatchesQuery(entity, query) {

        for (const component of query.components) {

            if (
                !entity.components.has(component)
            ) {
                return false;
            }
        }

        return true;
    },

    /**
     * 刷新Entity所属Query
     */
    refreshEntityQueries(entity) {

        for (const query of this._queries.values()) {

            if (
                this._entityMatchesQuery(
                    entity,
                    query
                )
            ) {

                query.entities.add(entity);

            } else {

                query.entities.delete(entity);
            }
        }
    },

    /**
     * Component添加后调用
     */
    onComponentAdded(entity, componentName) {

        this.refreshEntityQueries(entity);
    },

    /**
     * Component删除后调用
     */
    onComponentRemoved(entity, componentName) {

        this.refreshEntityQueries(entity);
    },

    getEntity(uuid) {

        return this._entityPool.get(uuid);
    },

    removeEntity(uuid) {

        const entity =
            this._entityPool.get(uuid);

        if (!entity) {
            return false;
        }

        // 从所有Query移除
        for (const query of this._queries.values()) {

            query.entities.delete(entity);
        }

        return this._entityPool.delete(uuid);
    },

    getAllEntities() {

        return Array.from(
            this._entityPool.values()
        );
    }
};

EntityManager.entityDefinitions.set(
    "th:entity=null",
    {}
);

export { EntityManager };