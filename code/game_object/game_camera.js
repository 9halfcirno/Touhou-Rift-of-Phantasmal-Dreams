import { GameObject } from "./game_object.js";
import { Position } from "../position.js";
import * as THREE from "three";

class GameCamera extends GameObject {
    constructor(opts = {}) {
        let cam = new THREE.PerspectiveCamera(
            opts.fov || 64,
            opts.aspect || GAME_CONFIG.STAGE_ASPECT,
            opts.near || 0.1,
            opts.far || 1000
        );
        super({ object3d: cam, ...opts });

        this.three.camera = cam;
    }

    /**
     * 
     * @param {Number} [p=1] 插值，0~1
     */
    updateThreeData(p = 1) {
        p = p > 1 ? 1 : p;
        let object3d = this.three.object3d;
        if (!object3d) return;
        object3d.position.set(...this.tweenPosition(p))
    }
}

export { GameCamera}