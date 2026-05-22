import { System } from "./system.js";
import { Config } from "../config.js";

class PlayerControlsSystem extends System {
    constructor() {
        super({
            name: "PlayerControlsSystem",
            requireComponents: ["th:player_controls", "th:speed"],
            priority: 1
        })
    }

    update({ entities, game, world }) {
        let Key = game.KeyboardInput;

        // 角色移动
        // 2. 处理角色移动
        let w = Key.key("w").down, a = Key.key("a").down;
        let s = Key.key("s").down, d = Key.key("d").down;
        //let down = Key.key("Shift").down, fly = Key.key(" ").down;
        for (const entity of entities) {
            let speed = (entity.getComponentValue("th:speed") || 0);
            entity.moveBy((d - a) * speed, 0, (w - s) * speed);

            if (game.KeyboardInput.key(" ").down) {
                entity.faceTo(TH.MouseInput.inMapPosition(game.scene.currentCamera, debug.main.three.ground));
                entity.step(5)
            }

            if (game.MouseInput.left) {
                let mousePos = TH.MouseInput.inMapPosition(game.scene.currentCamera, world.three.ground);
                let e = world.entityManager.createEntity("th:entity=bullet/ball", {
                    position: entity.position,
                    rotation: new TH.Vector2(1, 0),
                    frame: world.frame,
                });
                e.faceTo(mousePos);
                world.addObject(e);
            }

        }

        let allPos = [...entities].map(e => e.position.toTHREE());
        let pos = getCenterPosition(allPos).toArray();
        
        let tilt = Config["object2d_tilt"];
        let dis = Config["camera_distance"] + getCameraDistance(allPos, world.camera.three.camera, 1);
        const toPos = [
            pos[0],
            pos[2] + Math.cos(tilt) * dis,
            -pos[1] + Math.sin(tilt) * dis
        ];

        // 4. 执行你喜欢的缓动逻辑，更新【当前逻辑位置】
        // 这里的计算基于固定逻辑频率，手感恒定
        const lerpFactor = Config["camera_follow_speed"] / 16;
        const current = world.camera.position.toArray();

        world.camera.setPosition(...current.map((p, i) => {
            return p + (toPos[i] - p) * lerpFactor;
        }));
        world.camera.three.camera.rotation.set(Config["object2d_tilt"] - Math.PI / 2, 0, 0);

    }

}

/**
 * 获取多个 THREE.Vector3 的中心点（几何中心）
 * @param {THREE.Vector3[]} points
 * @param {THREE.Vector3} [target] 可选，复用输出对象避免GC
 * @returns {THREE.Vector3}
 */
function getCenterPosition(points, target = new THREE.Vector3()) {
    target.set(0, 0, 0);

    if (!points || points.length === 0) {
        return target;
    }

    for (const p of points) {
        target.add(p);
    }

    target.divideScalar(points.length);

    return target;
}
/**
 * 计算让相机刚好看到所有点所需的距离
 * 
 * @param {THREE.Vector3[]} points
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} padding 额外边距倍率（默认1.2）
 * @returns {number}
 */
function getCameraDistance(points, camera, padding = 1.2) {
    if (!points.length) return 0;

    const box = new THREE.Box3().setFromPoints(points);

    const size = new THREE.Vector3();
    box.getSize(size);

    const width = Math.max(size.x, 1);
    const height = Math.max(size.y, 1);

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect;

    // 垂直方向需要的距离
    const distanceV = height / 2 / Math.tan(fov / 2);

    // 水平方向需要的距离
    const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
    const distanceH = width / 2 / Math.tan(horizontalFov / 2);

    return Math.max(distanceV, distanceH) * padding;
}

System.registerSystem("th:system=player_controls_system", PlayerControlsSystem)

export { PlayerControlsSystem };