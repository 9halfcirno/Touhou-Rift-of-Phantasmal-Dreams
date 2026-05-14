import * as THREE from "three"
import {
	Config
} from "./config.js"

export let Vector2 = THREE.Vector2;
export let Vector3 = THREE.Vector3;

// 该坐标为游戏内坐标，非THREE场景坐标
export class Position extends Vector3 {

	// THREE坐标缓存
	_threeCache = new THREE.Vector3();

	// 缓存脏标记
	_threeDirty = true;

	constructor(x = 0, y = 0, z = 0) {
		super(x, y, z);
	}

	// ========= 坐标修改监听 =========

	set x(v) {
		this._x = v;
		this._threeDirty = true;
	}

	get x() {
		return this._x;
	}

	set y(v) {
		this._y = v;
		this._threeDirty = true;
	}

	get y() {
		return this._y;
	}

	set z(v) {
		this._z = v;
		this._threeDirty = true;
	}

	get z() {
		return this._z;
	}

	set(x, y, z) {
		this._x = x;
		this._y = y;
		this._z = z;
		this._threeDirty = true;
		return this;
	}

	copy(v) {
		this._x = v.x;
		this._y = v.y;
		this._z = v.z;
		this._threeDirty = true;
		return this;
	}

	clone() {
		return new Position(this.x, this.y, this.z);
	}

	// 获取相对坐标
	getRelativePos(obj) {
		let {
			x: px,
			y: py,
			z: pz
		} = obj;

		return new Position(
			this.x - px,
			this.y - py,
			this.z - pz
		);
	}

	// 游戏坐标到THREE坐标（带缓存）
	toTHREE() {

		// 没变化直接返回缓存
		if (!this._threeDirty) {
			return this._threeCache;
		}

		const a = Config["y_tilt"];

		this._threeCache.set(
			this.x,
			this.z + this.y * Math.cos(a),
			this.y * Math.sin(a)
		);

		this._threeDirty = false;

		return this._threeCache;
	}

	static fromTHREE(v) {
		const a = Config["y_tilt"] || Math.PI / 4;

		const gameY = v.z / Math.sin(a);
		const gameX = v.x;
		const gameZ = v.y - gameY * Math.cos(a);

		return new Position(gameX, gameY, gameZ);
	}
}