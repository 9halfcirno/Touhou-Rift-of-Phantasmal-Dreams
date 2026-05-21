import {
	EntityController
} from "./entity_controller.js";
import {
	KeyboardInput as Key
} from "../inputs/keyboard.js";
import {
	Config
} from "../config.js"
import {
	Entity
} from "../game_object/game_entity.js";
import {
	util
} from "../utils.js";

class PlayerController extends EntityController {
	constructor(entity, camera) {
		super(entity);
		this.camera = camera;

		if (this.camera) {
			// 核心：记录两个逻辑状态，用于渲染插值
			this.prevCameraLogicPos = camera.position.clone(); // 上一帧逻辑位置
			this.currCameraLogicPos = camera.position.clone(); // 当前帧逻辑位置
		}
	}

	update(delta) {
		if (this.camera) {

			// 3. 计算相机【瞬时理想目标】
			
			const pos = this.target.position.toTHREE().toArray();
			let tilt = Config["object2d_tilt"];
			let dis = Config["camera_distance"];
			const toPos = [
				pos[0],
				pos[2] + Math.cos(tilt) * dis,
				-pos[1] + Math.sin(tilt) * dis
			];

			// 4. 执行你喜欢的缓动逻辑，更新【当前逻辑位置】
			// 这里的计算基于固定逻辑频率，手感恒定
			const lerpFactor = Config["camera_follow_speed"] / 16;
			const current = this.currCameraLogicPos.toArray();

			this.currCameraLogicPos.set(...current.map((p, i) => {
				return p + (toPos[i] - p) * lerpFactor;
			}));
		}
	}

	onRender(opts = { progress: 1 }) {		
		if (this.camera) {

			// 在上一个逻辑位置和当前逻辑位置之间连起来
			this.camera.position.lerpVectors(
				this.prevCameraLogicPos,
				this.currCameraLogicPos,
				opts.progress
			);

			// 旋转通常直接同步即可
			this.camera.rotation.set(Config["object2d_tilt"] - Math.PI / 2, 0, 0);
		}
	}
}


export {
	PlayerController
}