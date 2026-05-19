import { Controller } from "./controller.js"
import { EntityManager } from "../managers/entity_manager.js";
import { Entity } from "../game_object/game_entity.js";


class EntityController extends Controller {
	/**
	 *
	 * @param {Entity} e 被控制的实体
	 */
	constructor(e) {
		if (typeof e === "string") {
			e = EntityManager.getEntity(e);
		}
		if (!(e instanceof Entity)) throw new Error("EntityController仅接收Entity实例");
		super(e);
	}

	update() {
		// 子类必须实现自己的逻辑
		throw new Error("EntityController子类必须实现自己的逻辑")
	}
}

export {
	EntityController
}