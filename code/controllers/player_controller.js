import {
	Controller
} from "./controller.js";
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
import { EntityManager } from "../managers/entity_manager.js";

class PlayerController extends Controller {
	constructor(entity, camera) {
		if (typeof entity === "string") {
			entity = EntityManager.getEntity(entity);
		}
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

			// 1. 在开始计算前，备份当前的逻辑位置
			this.prevCameraLogicPos.copy(this.currCameraLogicPos);

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

	onRender(opts = { progress: 0 }) {
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

		if (this.target && this.target.isAlive) {

			// 角色移动
			// 2. 处理角色移动
			let w = Key.key("w").down, a = Key.key("a").down;
			let s = Key.key("s").down, d = Key.key("d").down;
			let down = Key.key("Shift").down, fly = Key.key(" ").down;
			let speed = (this.target.getComponentValue("th:speed") || 0.5) * opts.progress;
			this.target.moveBy((d - a) * speed, (fly - down) * speed, (w - s) * speed);
		}
	}
}


export {
	PlayerController
}