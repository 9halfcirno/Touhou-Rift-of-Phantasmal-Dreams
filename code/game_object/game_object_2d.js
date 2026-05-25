import { GameObject } from "./game_object.js";
import * as THREE from "three";
import { Config } from "../config.js";
import { Texture } from "../game_texture/texture.js";

class GameObject2D extends GameObject {
    constructor(params = {}) {
        let geo = params.geometry || GameObject2D.SharedPlaneGeometry;
        let mat = params.material;

        let mesh = new THREE.Mesh(geo, mat);

        super({ mesh, ...params })
        this.three.geometry = geo;
        this.three.material = mat;

        this._texture = null;


        this._resizeMeshByTexture();
    }

    setPosition(...args) {
        super.setPosition(...args);
        this._fixThreePosition();
    }

    updateThreeData(p = 1) {
        if (this.three.destory) return;

        super.updateThreeData(p);
        this._fixThreePosition();
        this.three.object3d.rotation.set(Config["object2d_tilt"], 0, 0); // 2D对象只需要倾斜角度
    }

    _resizeMeshByTexture() { // 应该考虑repeat
        if (this.three.destory) return;
        if (!this.texture) return;
        
        let tex = this.texture;

        const unit = tex.pixelsPerUnit; // 16像素 = 1单位
        const width = tex.width * tex.repeat.x / unit;
        const height = tex.height * tex.repeat.y / unit;
        // 调整 mesh 的缩放
        this.three.object3d.scale.set(width, height, 1);
    }

    _fixThreePosition() { // 修正网格位置
        if (this.three.destory) return;

        if (this.texture) {
            let tex = this.texture;
            const height = tex.height * tex.repeat.y / tex.pixelsPerUnit;
            let tilt = Config["object2d_tilt"];
            this.three.object3d.position.y += Math.cos(tilt) * height / 2;
            this.three.object3d.position.z += Math.sin(tilt) * height / 2;
        }
    }

    get texture() {
        return this._texture;
    }

    set texture(tex) {
        if (this.three.destory) return; // 已销毁的对象不处理

        if (tex instanceof THREE.Texture) {
            this.three.material.map = tex;
        } else if (tex instanceof Texture) {
            this.three.material.map = tex.three.texture;
        }
        this._texture = tex;

        this._resizeMeshByTexture();
    }

    _disposeThree() {
        this.three.material.dispose();
        this.texture?.dispose();
        super._disposeThree();
    }
}

GameObject2D.SharedPlaneGeometry = new THREE.PlaneGeometry(1, 1);

export { GameObject2D }