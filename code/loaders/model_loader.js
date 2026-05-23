import * as THREE from "three"
import { ID } from "./parser_thid.js"
import { MMDLoader } from "../../libs/three-0.171.0/examples/jsm/Addons.js"

const ModelManager = {
    cache: new Map(), // 维护[url: THREE.Geometry实例]的映射
    three: {
    },
    _parseModelUrl(thid) {
    },
    // 加载纹理的方法，可用await
    load(thid, opts = { useCache: true }) {
        let url = this._parseTextureUrl(thid);
        if (!url) return;

        let self = this;
        return new Promise((resolve, reject) => {
            
        })
    },
    async get(thid) {

    },
    dispose(thid) {

    }
}

ModelManager.Loaders = {
    MMDLoader: new MMDLoader()
}

export {
    ModelManager
}