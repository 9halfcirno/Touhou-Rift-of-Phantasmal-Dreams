import * as THREE from "three"
import {
	Position,
	Vector3,
	Vector2
} from "../position.js"
import {
	util
} from "../utils.js"
import {
	Config
} from "../config.js"


//=== 显示一个

class GameObject {
	/**
	 * 创建一个GameObject对象
	 * @param {Object} params 这个对象应该包含THREE.Mesh
	 */
	constructor(params = {}) {
		this.three = {
			object3d: params.object3d || params.mesh || null,
		};

		this.position = params.position?.clone?.() || new Position();
		this._orginPos = new Position(...this.position); // 用于Threee缓动的坐标
		this._tweenTargetPos = new Position(...this.position); // 目标坐标
		// x => yaw (水平旋转)
		// y => pitch (垂直旋转)
		this.rotation = params.rotation?.clone?.() || new Vector2(0, 0);
		this.uuid = util.uuid(); // 获取uuid
		this.updateThreeData(1);


		if (this.three.object3d) {
			this.three.object3d.name = this.uuid;
			this.three.object3d.castShadow = true;
			this.three.object3d.receiveShadow = true;
		}
		this.inMap = null;
		// GameObject.objectsMap.set(this.uuid, this); // 把自己扔对象池
	}

	/**
	 * 设置GmaeObject的游戏坐标，并自动处理THREE坐标
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} z 
	 */
	setPosition(x, y, z) {
		this._orginPos.copy(this.position);
		this.position.set(x, y, z);
		// this.updateThreeData();
	}
	/**
	 * 
	 * @param {Number} [p=1] 插值，0~1
	 */
	updateThreeData(p = 1) {
		p = p > 1 ? 1 : p;
		let object3d = this.three.object3d;
		if (!object3d) return;
		object3d.position.set(...this.tweenPosition(p).toTHREE())
	}

	tweenThree(p) {
		this.updateThreeData(p)
	}

	/**
	 * 获取插值坐标，基于TH坐标系
	 * @param {number} p 
	 * @returns 
	 */
	tweenPosition(p) {
		const toPos = this.position.toArray();
		const orgPos = this._orginPos.toArray();

		this._tweenTargetPos.set(...orgPos.map((pos, i) => pos + (toPos[i] - pos) * p))

		return this._tweenTargetPos;
	}



	updateTexture(tex, opts) {

	}

	_disposeThree() {
		if (!this.three.geometry === GameObject.SharedPlaneGeometry) this.three.geometry.dispose();

		this.inMap?.removeObject?.(this);

		this.three.object3d = null; // 移除引用
		this.three.destory = true;
	}
}

GameObject.SharedBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())

export {
	GameObject
}