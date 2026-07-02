import * as THREE from 'three';
import type { TextureLoader } from './TextureLoader.js';
import * as PIXI from 'pixi.js';

import { uuid } from "@/utils/uuid.ts";

/**
 * 纹理包装类
 *
 * 封装 THREE.Texture，提供像素/单位换算等游戏层抽象。
 * 迁移自 code/game_texture/texture.js
 */
export class Texture {
	readonly uuid = uuid();
	readonly three: { texture: THREE.Texture };

	readonly thid;

	/** 每单位像素数（默认 16） */
	pixelsPerUnit: number;
	pixi: { texture?: PIXI.Texture; } = { texture: undefined };
	destoryed: boolean = false;

	constructor(tex: THREE.Texture | Texture | string) {
		this.three = { texture: undefined! };

		if (tex instanceof THREE.Texture) {
			this.three.texture = tex;
		} else if (tex instanceof Texture) {
			this.three.texture = tex.three.texture;
		} else if (typeof tex === 'string') {
			// 延迟加载：需要 TextureLoader（循环导入保护）
			// 实际使用中不会走这里，TextureLoader.get() 会直接返回实例
			throw new Error('[Texture] 字符串参数需要通过 TextureLoader.get() 加载');
		} else {
			throw new Error('[Texture] 错误的纹理参数');
		}

		this.pixelsPerUnit =
			(this.three.texture.userData?.pixelsPerUnit as number) || 16;
		this.thid = this.three.texture.userData.thid;
	}

	/** 纹理宽度（像素） */
	get width(): number {
		return this.three.texture.image?.width ?? 0;
	}

	/** 纹理高度（像素） */
	get height(): number {
		return this.three.texture.image?.height ?? 0;
	}

	/** UV 重复 */
	get repeat(): THREE.Vector2 {
		return this.three.texture.repeat;
	}

	set repeat(value: THREE.Vector2) {
		this.three.texture.repeat.copy(value);
	}

	/** UV 偏移 */
	get offset(): THREE.Vector2 {
		return this.three.texture.offset;
	}

	set offset(value: THREE.Vector2) {
		this.three.texture.offset.copy(value);
	}

	/** 原始图片 */
	get source(): HTMLImageElement | HTMLCanvasElement | undefined {
		return this.three.texture.image;
	}

	get needUpdate() { return this.three.texture.needsUpdate };
	set needUpdate(b: boolean) {
		this.three.texture.needsUpdate = b;
		b && this.pixi.texture?.update();
	}

	toPIXI(): PIXI.Texture {
		if (this.pixi.texture) return this.pixi.texture;

		let image = this.three.texture.image;

		let pixiTex = PIXI.Texture.from(image);
		pixiTex.source.scaleMode = "nearest";

		this.pixi.texture = pixiTex
		return pixiTex;
	}

	disposePIXI() {
		if (this.pixi.texture) {
			this.pixi.texture.destroy(true);
			this.pixi.texture = undefined;
		}
	}

	dispose(): void {
		this.disposePIXI();
		this.three.texture.dispose();
		this.destoryed = true;
	}
}
