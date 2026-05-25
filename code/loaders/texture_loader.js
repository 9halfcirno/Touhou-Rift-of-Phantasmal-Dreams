import * as THREE from "three"
import { ID } from "../parser_thid.js"
import { Texture } from "../game_texture/texture.js";

const TextureLoader = {
	cache: new Map(), // 维护[url: THREE.Texture实例]的映射，也充当纹理池
	three: {
		textureLoader: new THREE.TextureLoader()
	},
	/**
	 * 
	 * @param {String} thid 一个type=texture的thid
	 * @returns 解析后的纹理url
	 */
	_parseTextureUrl(thid) {
		if (!thid) return;
		let a = ID.parse(thid);
		if (a.type !== "texture") throw new Error(`[Texture] 错误的thid类型: ${thid}`);
		// 解析url
		let url = `${GAME_CONFIG.RUN_PATH}/assets/textures`;
		url += "/" + a.id;
		url += ".png";
		return url;
	},
	/**
	 * 加载纹理的方法，可用await
	 * @param {String} thid 纹理的thid
	 * @param {{ useCache: boolean; }} [opts] 额外选项
	 * @return {Promise<Texture>}
	*/
	load(thid, opts = { useCache: true }) {
		let url = this._parseTextureUrl(thid);
		if (!url) return;

		let self = this;
		// 用textureLoader加载
		return new Promise((resolve, reject) => {
			if (self.cache.has(url) && opts.useCache) resolve(self.cache.get(url));
			self.three.textureLoader.load(url, (tex) => {
				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				tex.name = thid;
				tex.userData.thid = thid; // 保存thid以便后续管理器使用
				tex.userData.isOriginal = true; // 标记为原始纹理，禁止修改
				tex.userData.pixelsPerUnit = opts.pixelsPerUnit || 16; // 保存尺寸
				self.cache.set(url, tex) // 为后续最快加载，不论是否useCache，都保持缓存，同时作为管理器对纹理的引用
				resolve(new Texture(tex))
			}, () => { }, reject)
		})
	},
	/**
	 * 
	 * @param {String} thid 纹理的thid
	 * @param {{ async: boolean; shared: boolean }} opts 额外选项
	 * @returns {Promise<Texture>|Texture} 根据opts.async决定返回Promise还是直接返回纹理实例
	 */
	get(thid, opts = { async: false, shared: false }) {
		if (!thid) return;

		if (!opts.async) {
			let url = this._parseTextureUrl(thid);
			let org = this.cache.get(url); // 直接从纹理池获取
			if (!org) throw new Error(`[Texture] 纹理: "${thid}"尚未加载`)
			return new Texture(opts.shared ? org : org.clone()) // 防止修改原纹理
		} else {
			return this.load(thid).then(tex => opts.shared ? tex : new Texture(tex.three.texture.clone())) // 异步加载后同样处理共享与否
		}

	},
	dispose(thid) {
		let url = this._parseTextureUrl(thid);
		this.cache.get(url)?.dispose?.();
	}
}

export {
	TextureLoader
}