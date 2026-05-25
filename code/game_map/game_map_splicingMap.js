import * as THREE from "three"
import {
	GameMap
} from "./game_map.js"
import {Position} from "../position.js"
import {TextureLoader} from "../loaders/texture_loader.js"

class GameSplicingMap extends GameMap {
	constructor(id) {
		super(id);
		let floor = new THREE.Group();
		floor.name = `GameMap_${id}_floor`
		this.three.floor = floor;
		this.three.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

		this.three.group.add(floor)
	}

	async init() {
		await super.init();
		await this._createMap();
	}

	async _createMap() {
		let data = await this._loadData();
		if (data.type !== "splicing") throw new Error("GameSplicingMap数据必须为\"splicing\"类型")
		let floor = new THREE.Group();
		let self = this;
		data.data.forEach(async block => { // 遍历所有块
			let geo = new THREE.PlaneGeometry(block.size[0], block.size[1]);
			let mat = new THREE.MeshLambertMaterial({
				side: THREE.DoubleSide,
				transparent: true, // 使纹理透明
				alphaTest: true // 防止透明像素遮挡后方
			});
			let tex = await TextureLoader.get(block.texture, {async: true})
			mat.map = tex.three.texture;
			let mesh = new THREE.Mesh(geo, mat);
			mesh.receiveShadow = true;
			let [x, y] = block.position;
			mesh.position.set(x + block.size[0] / 2, y + block.size[1] / 2, 0)
			self.three.floor.add(mesh);
		})
	}
	
	
/*let tex = this.texture;
		if (!tex || !tex.image) return;
		const img = tex.image;
		const unit = tex.pixelsPerUnit; // 16像素 = 1单位
		const width = img.width * tex.repeat.x / unit;
		const height = img.height * tex.repeat.y / unit;
		// 调整 mesh 的缩放
		this.three.scale.set(width, height, 1);
		
*/
}

export {GameSplicingMap}