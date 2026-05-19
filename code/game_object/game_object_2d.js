import { GameObject } from "./game_object.js";
import * as THREE from "three";
import { Config } from "../config.js";

class GameObject2D extends GameObject {
    constructor(params = {}) {
        let geo = GameObject2D.SharedPlaneGeometry;
        let mat = params.material;

        let mesh = new THREE.Mesh(geo, mat);

        super({ mesh, ...params })
        this.three.geometry = geo;
        this.three.material = mat;


        this._resizeMeshByTexture();

        this.texture = this.three.material.map; // 保存引用		

    }

    setPosition(...args) {
        super.setPosition(...args);
        this._fixThreePosition();
    }

    updateThreeData(p = 1) {
        if (this.three.destory) return;

        super.updateThreeData(p);
        this._fixThreePosition();
        this.three.mesh.rotation.set(Config["object2d_tilt"], 0, 0); // 2D对象只需要倾斜角度
    }

    _resizeMeshByTexture() { // 应该考虑repeat
        if (this.three.destory) return;
        
        let tex = this.three.material?.map;
        if (!tex || !tex.image) return;
        const img = tex.image;
        const unit = tex.userData.pixelsPerUnit; // 16像素 = 1单位
        const width = img.width * tex.repeat.x / unit;
        const height = img.height * tex.repeat.y / unit;
        // 调整 mesh 的缩放
        this.three.mesh.scale.set(width, height, 1);
    }

    _fixThreePosition() { // 修正网格位置
        if (this.three.destory) return;

        if (this.three.material?.map?.image) {
            let tex = this.three.material.map;
            const height = tex.image.height * tex.repeat.y / tex.userData.pixelsPerUnit;
            let tilt = Config["object2d_tilt"];
            this.three.mesh.position.y += Math.cos(tilt) * height / 2;
            this.three.mesh.position.z += Math.sin(tilt) * height / 2;
        }
    }

    _disposeThree() {
        this.three.material.dispose();
        super._disposeThree();
    }
}

GameObject2D.SharedPlaneGeometry = new THREE.PlaneGeometry(1, 1);

export { GameObject2D }