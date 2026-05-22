import * as THREE from "three"
import { ID } from "../parser_thid.js"
import { GameObject } from "../game_object/game_object.js"
import { GameCamera } from "../game_object/game_camera.js"
import { THREEManager } from "../managers/three_manager.js"
import { Config } from "../config.js"
import { System } from "../entity_system/system.js"
import { EntityManager } from "../managers/entity_manager.js"
import { SystemManager } from "../managers/system_manager.js"
import { Entity } from "../game_object/game_entity.js"

class GameMap {
	#frame = 0;
	constructor(id) { // 传入thid
		this.three = {
			group: new THREE.Group(),
		};
		this.three.group.name = `GameMap_${id}`
		this.three.group.rotation.x = Config["tile_tilt"]
		this.three.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
		this.id = id;
		this.isInScene = true;

		// 摄像机
		this.camera = new GameCamera();

		// 自己内部的three实例管理
		this._threeManager = new THREEManager();
		this.three.group.add(this._threeManager.three.group)

		this.entityManager = new EntityManager();

		this.systemManager = new SystemManager(this);

		this.objects = new Map();

	}

	async init() {
		await this._loadData();
		await this._createSystems();
	}

	$debug() {
		let axe = new THREE.AxesHelper(5);
		this.three.group.add(axe);
	}

	update({ game }) {
		this.frame++;
		this.systemManager.updateAll({ frame: this.frame, game, world: this });
	}

	get frame() {
		return this.#frame;
	}
	set frame(v) {
		if (v <= this.#frame) throw new RangeError(`GameMap.#frame 仅允许更大值,至少为${this.#frame + 1}而目标值为${v}`)
		this.#frame = v;
	}

	addObject(obj) {
		// 拒绝非GameObject实例
		if (!(obj instanceof GameObject)) throw new Error(`传入的参数必须是GameObject实例`);
		if (obj.three.destory) return; // 防止dispose后被添加但没法回收
		
		if (obj.inMap && obj.inMap !== this) {
			obj.inMap.removeObject(obj);
		}

		this._threeManager.add(obj.three.object3d)

		obj.inMap = this; // 在对象中保存Map引用

		this.objects.set(obj.uuid, obj)

	}

	removeObject(obj) {
		// 拒绝非GameObject实例
		if (!(obj instanceof GameObject)) throw new Error(`传入的参数必须是GameObject实例`);
		this._threeManager.remove(obj.three.object3d)
		this.objects.delete(obj.uuid)
		obj.inMap = null; // 移除引用
		if (obj instanceof Entity) {
			this.entityManager.removeEntity(obj)
		}
	}

	clearObjects() {
		this._threeManager.clear()
		this.objects.clear()
	}

	addEntity(ent) {
		// this.addObject(ent);
		if (ent.manager !== this.entityManager) { // 在不同map的em间流转
			ent.manager.removeEntity(ent);
			this.entityManager.addEntity(ent);
		}
		this.addObject(ent)
	}

	_exitScene() { // 离开场景
		this.three.group.visible = false;
		this.isInScene = false;
	}

	_enterScene() {
		this.three.group.visible = true;
		this.isInScene = true;
	}

	/**
	 * 渲染时进行THREE插值
	 * @param {Number} [p=1] 插值，从0到1
	 *
	 */
	tweenThree(p = 1) { // THREE插值		
		this.camera.tweenThree(p);
		this.objects.forEach(obj => {
			obj.tweenThree(p);
		})
	}

	// 加载地图数据
	async _loadData() {
		let id = ID.parse(this.id) // 这里使用短id
		let url = `${GAME_CONFIG.RUN_PATH}/definitions/game_maps/${id.id}.json`
		let map = await (await fetch(url)).json() // await import(url);
		this.definition = map;
		return map;
	}

	async _createSystems() {
		if (!this.definition) throw new Error(`加载system前需要先加载地图数据`);

		if (this.definition.systems) {
			for (const sId of this.definition.systems) {
				let sobj = ID.parse(sId);
				if (sobj.type !== "system") console.error(`[GameMap] ${sId} 不是一个system`);
				let inst = System.createSystem(sId);
				this.systemManager.add(inst);
			}
		}
	}

	destory() {
		this.entityManager.getAllEntities().forEach(e => {
			this.entityManager.removeEntity(e);
		})
		// this.three.group.traverse((obj) => {
		// 	if (obj.isMesh) {
		// 		if (obj.material) {
		// 			Array.isArray(obj.material) ? obj.material.forEach((m) => m.dispose()) : obj.material.dispose();
		// 		}
		// 		if (obj.geometry) {
		// 			obj.geometry.dispose();
		// 		}
		// 	}
		// })
		// this.three.group.removeFromParent();
		// this.three.group = null;

		// this.entityManager.getAllEntities().forEach(e => e.inMap = null)
	}
}


export { GameMap }