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


            const pos = entity.position.toTHREE().toArray();
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
            const current = world.camera.position.toArray();

            world.camera.setPosition(...current.map((p, i) => {
                return p + (toPos[i] - p) * lerpFactor;
            }));
            world.camera.three.camera.rotation.set(Config["object2d_tilt"] - Math.PI / 2, 0, 0);

        }


    }



}

System.registerSystem("th:system=player_controls_system", PlayerControlsSystem)

export { PlayerControlsSystem };