import * as THREE from 'three';
import { THID } from '../protocol/THID.js';
import { Texture } from './Texture.js';
import type { RuntimeConfig } from '../core/types.js';

/**
 * 纹理加载器
 *
 * 单例对象，维护 thid → THREE.Texture 缓存映射。
 * 支持同步获取（需预加载）和异步加载。
 *
 * 迁移自 code/loaders/texture_loader.js
 *
 * 注意：依赖全局 GAME_CONFIG.RUN_PATH，需要在 Game 初始化时注入。
 */

/** 纹理加载器运行时上下文（由 Game 初始化时注入） */
let _runPath = '';

/** 设置运行时路径 */
export function setRunPath(path: string): void {
  _runPath = path;
}

export const TextureLoader = {
  /** thid/url → Texture 缓存池 */
  cache: new Map<string, Texture>(),

  /** Three.js 原生加载器 */
  three: {
    textureLoader: new THREE.TextureLoader(),
  },

  /**
   * 解析纹理 thid → 文件 URL
   */
  _parseTextureUrl(thid: string): string | undefined {
    if (!thid) return undefined;
    const a = THID.parse(thid);
    if (a.type !== 'texture') {
      throw new Error(`[Texture] 错误的thid类型: ${thid}`);
    }
    let url = a.id.replace(".", "/");
    return `${_runPath}/assets/textures/${url}.png`;
  },

  /**
   * 异步加载纹理
   *
   * @param thid 纹理的 thid（如 "th:texture=entity/reimu"）
   * @param opts 选项
   * @returns Texture 实例
   */
  load(
    thid: string,
    opts: { useCache?: boolean; pixelsPerUnit?: number } = {},
  ): Promise<Texture> {
    const url = this._parseTextureUrl(thid);
    if (!url) return Promise.reject(new Error(`无效thid: ${thid}`));

    const self = this;

    return new Promise((resolve, reject) => {
      if (self.cache.has(url) && opts.useCache !== false) {
        resolve(new Texture(self.cache.get(url)!));
        return;
      }

      self.three.textureLoader.load(
        url,
        (tex) => {
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.name = thid;
          tex.userData = {
            thid,
            isOriginal: true,
            pixelsPerUnit: opts.pixelsPerUnit ?? 16,
          };
          let texture = new Texture(tex);
          self.cache.set(url, texture);
          resolve(texture);
        },
        undefined,
        reject,
      );
    });
  },

  /**
   * 获取纹理（需预先 load）
   *
   * @param thid 纹理 thid
   * @param opts.async 是否异步加载
   * @param opts.shared 是否共享原纹理引用（false 则 clone 一份）
   */
  get(
    thid: string,
    opts: { async?: boolean; shared?: boolean } = {
      shared: false // 默认不共享纹理对象
    },
  ): Texture | Promise<Texture> | undefined {
    if (!thid) return undefined;

    if (!opts.async) {
      const url = this._parseTextureUrl(thid);
      if (!url) return undefined;
      const org = this.cache.get(url);
      if (!org) throw new Error(`[Texture] 纹理: "${thid}"尚未加载, 请尝试使用load方法或传入{ async: true }`);
      return opts.shared ? org : new Texture(org.three.texture.clone());
    }

    return this.load(thid).then(
      (tex) => (opts.shared ? tex : new Texture(tex.three.texture.clone())),
    );
  },

  /** 释放纹理 */
  dispose(thid: string): void {
    const url = this._parseTextureUrl(thid);
    if (url) {
      this.cache.get(url)?.dispose();
    }
  },
};
