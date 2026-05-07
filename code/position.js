import * as THREE from "../libs/three.module.js"
import {
	Config
} from "./config.js"

export let Vector2 = THREE.Vector2;
export let Vector3 = THREE.Vector3;

// 该坐标为游戏内坐标，非THREE场景坐标
export class Position extends Vector3 {
	constructor(x = 0, y = 0, z = 0) {
		super(x, y, z);
	}
	// 获取相对坐标
	getRelativePos(obj) {
		let {
			x: px,
			y: py,
			z: pz
		} = obj;
		return new Position(this.x - px, this.y - py, this.z - pz);
	}

	// /**
	//  * 
	//  * @param {Position} pos 要复制的坐标
	//  * @returns 
	//  */

	// clone() {
	// 	return new Position(...this);
	// }
	// /**
	//  * 
	//  * @param {Position} pos 
	//  * @returns 
	//  */
	// copy(pos) {
	// 	this.x = pos.x;
	// 	this.y = pos.y;
	// 	this.z = pos.z;
	// 	return this;
	// }

	// 游戏坐标到THREE坐标
	toTHREE() {
		const a = Config["y_tilt"];
		return new THREE.Vector3(
			// 算了编不动了，我也不清楚怎么转换的，试着试着就好了
			// 好了，我这下知道怎么写了，主要是因为地图整体倾斜了，所以y轴的分量要分成垂直和水平两部分，水平部分会影响z轴的值
			this.x, // 游戏X -> THREE.X（水平）
			// 由于地图整个转了90度，所以three的z轴是游戏的y轴
			this.z + this.y * Math.cos(a), // 由于地图倾斜，游戏Y的垂直分量会增加THREE的Z值
			this.y * Math.sin(a) // 游戏Y的水平分量会增加THREE的Y值
		);
	}

	static fromTHREE(v) {
		const a = Config["y_tilt"] || Math.PI / 4;

		// 1. 先从 Three.z 还原出游戏高度 y
		// 因为 toTHREE 中：Three.z = Game.y * sin(a)
		const gameY = v.z / Math.sin(a);

		// 2. 游戏 x 依然直接对应
		const gameX = v.x;

		// 3. 从 Three.y 中还原出游戏深度 z
		// 因为 toTHREE 中：Three.y = Game.z + Game.y * cos(a)
		// 所以 Game.z = Three.y - Game.y * cos(a)
		const gameZ = v.y - gameY * Math.cos(a);

		return new Position(gameX, gameY, gameZ);
	}
}