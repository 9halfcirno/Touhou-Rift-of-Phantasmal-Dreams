import {
	GameObject
} from "./game_object.js"
import {
	TextureManager
} from "./manager_texture.js";
import {
	ID
} from "./parser_thid.js"
import {
	Config
} from "./_config.js";
import { Vector3 } from "./position.js";
import * as THREE from "../libs/three.module.js"

class Entity extends GameObject {
	constructor(thid = "th:entity=null", params) {

		let def = Entity.entityDefinitions.get(thid);
		if (!def) throw new Error(`[Entity] 未注册的实体: ${thid}`);
		let tex = TextureManager.get(def.texture);
		let geo = new THREE.PlaneGeometry(1, 1);
		let mat = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			transparent: true, // 使纹理透明
			alphaTest: true // 防止透明像素遮挡后方
		});
		mat.map = tex;

		super({
			geometry: geo,
			material: mat,
			rotation: Config["object2d_tilt"],
			...params
		})
		
		Entity._entityPool.set(this.uuid, this);

		this.atts = new Map(); // atts => 属性
		this.atts.set("th:speed", def.att?.["th:speed"])
			.set("th:hp", def.att?.["th:hp"])
	}
	/**
	 * 设置坐标
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} z 
	 * @returns 
	 */
	moveTo(x, y, z) {
		return this.setPosition(x, y, z);
	}
	/**
	 * 设置坐标
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} z 
	 * @returns 
	 */
	moveBy(x, y, z) {
		return this.moveTo(this.position.x + x, this.position.y + y, this.position.z + z);
	}
	/**
	 * 设置坐标
	 * @param {Vector3} vec 
	 * @returns 
	 */
	moveByVec(vec) { // 通过向量偏移
		return this.moveBy(...vec)
	}

	step(rot) {
		let speed = this.atts.get("th:speed");
		
	}

	die(opts) {
		this.atts.set("th:hp", -1);
		Entity.removeEntity(this.uuid);
		this._disposeThree();
	}

	static async registerEntity(thid) {
		let url = Entity._parseEntityUrl(thid);
		let entity = (await import(url)).default;
		Entity.entityDefinitions.set(entity.thid, entity);
		return entity;
	}

	static _parseEntityUrl(thid) {
		let a = ID.parse(thid);
		if (a.type !== "entity") throw new Error(`[Entity] 错误的thid类型: ${thid}`);
		// 解析url
		let url = `${GAME_CONFIG.RUN_PATH}/definitions/entities`;
		url += "/" + a.id;
		url += ".js";
		return url;
	}
	
	static getEntity(uuid) {
		return this._entityPool.get(uuid);
	}
	
	static removeEntity(uuid) {
		return this._entityPool.delete(uuid);
	}
}

Entity.entityDefinitions = new Map()

Entity._entityPool = new Map();

Entity.entityDefinitions.set("th:entity=null", {});


export {
	Entity
}