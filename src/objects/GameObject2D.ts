import * as THREE from 'three';
import { GameObject } from './GameObject.js';
import { Config } from '../core/Config.js';
import { Texture } from '../graphics/Texture.js';
import type { Position } from '../math/Position.js';

/**
 * 2D 游戏对象（始终面朝相机的平面网格）
 *
 * 使用共享 PlaneGeometry，根据纹理自适应缩放。
 * 通过 object2d_tilt 实现倾斜效果。
 *
 * 迁移自 code/game_object/game_object_2d.js
 */
export class GameObject2D extends GameObject {
	/** 纹理（可能为 null，由子类延迟设置） */
	protected _texture: Texture | null = null;
	static SharedPlaneGeometry: THREE.BufferGeometry<THREE.NormalBufferAttributes> | undefined;

	constructor(params: {
		geometry?: THREE.BufferGeometry;
		material?: THREE.Material;
		mesh?: THREE.Mesh;
		position?: Position;
		rotation?: THREE.Vector2;
	} = {}) {
		const geo = params.geometry ?? GameObject2D.SharedPlaneGeometry;
		const mat = params.material;
		const mesh = params.mesh ?? new THREE.Mesh(geo, mat);

		super({ mesh, position: params.position, rotation: params.rotation });

		this.three.geometry = geo;
		this.three.material = mat;

		this._resizeMeshByTexture();
	}

	// ─── 坐标覆写 ─────────────────────────────────

	override setPosition(x: number, y: number, z: number): void {
		super.setPosition(x, y, z);
		this._fixThreePosition();
	}

	override updateThreeData(p = 1): void {
		if (this.three.destory) return;

		super.updateThreeData(p);
		this._fixThreePosition();

		// 2D 对象只需要倾斜角度
		if (this.three.object3d) {
			this.three.object3d.rotation.set(Config.object2d_tilt, 0, 0);
		}
	}

	// ─── 纹理 ─────────────────────────────────────

	get texture(): Texture | null {
		return this._texture;
	}

	set texture(tex: Texture | THREE.Texture | null) {
		if (this.three.destory) return;

		if (tex instanceof THREE.Texture) {
			if (this.three.material) {
				(this.three.material as THREE.MeshLambertMaterial).map = tex;
			}
		} else if (tex instanceof Texture) {
			if (this.three.material) {
				(this.three.material as THREE.MeshLambertMaterial).map = tex.three.texture;
			}
		}
		this._texture = tex instanceof THREE.Texture ? new Texture(tex) : tex;

		this._resizeMeshByTexture();
	}

	// ─── 内部方法 ─────────────────────────────────

	/**
	 * 根据纹理尺寸缩放网格
	 */
	private _resizeMeshByTexture(): void {
		if (this.three.destory || !this._texture || !this.three.object3d) return;

		const tex = this._texture;
		const unit = tex.pixelsPerUnit;
		const width = tex.width * tex.repeat.x / unit;
		const height = tex.height * tex.repeat.y / unit;

		this.three.object3d.scale.set(width, height, 1);
	}

	/**
	 * 修正网格位置（使底部贴地而非中心）
	 */
	private _fixThreePosition(): void {
		if (this.three.destory || !this._texture || !this.three.object3d) return;

		const tex = this._texture;
		const height = tex.height * tex.repeat.y / tex.pixelsPerUnit;
		const tilt = Config.object2d_tilt;

		this.three.object3d.position.y += Math.cos(tilt) * height / 2;
		this.three.object3d.position.z += Math.sin(tilt) * height / 2;
	}

	static override readonly SharedBoxMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>;


	// ─── 销毁 ─────────────────────────────────────

	override _disposeThree(): void {
		this.three.material?.dispose();
		this._texture?.dispose();
		super._disposeThree();
	}
}

GameObject2D.SharedPlaneGeometry = new THREE.PlaneGeometry(1, 1);
GameObject2D.SharedPlaneGeometry.userData.shared = true;