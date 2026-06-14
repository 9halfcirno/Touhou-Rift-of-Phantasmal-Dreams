import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GameMap } from '../map/GameMap.js';
import { Config } from './Config.js';
import { type Game } from './Game.js';
import { GameCamera } from '@/objects/GameCamera.js';

/**
 * 游戏场景（Three.js 渲染管理层）
 *
 * 管理 Three.js 的 Scene / Camera / Renderer / Light，
 * 以及多个 GameMap 的挂载和切换。
 *
 * 迁移自 code/game_scene.js
 */
export class GameScene {
	readonly three: {
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		ambLight: THREE.AmbientLight;
		dirLight: THREE.DirectionalLight;
	};

	readonly domElement: HTMLCanvasElement;

	readonly game: Game;

	/** 游戏地图集合 */
	private gameMaps = new Map<string, GameMap>();

	/** 当前激活的地图 */
	currentMap: GameMap | null = null;

	/** 当前使用的摄像机 */
	camera: GameCamera;

	/** 默认摄像机, 在没有地图的时候使用该相机 */
	defaultCamera: GameCamera;

	/** Debug 相关 */
	private debug: Record<string, any> | null = null;

	constructor(args: { width: number; height: number; game: Game }) {
		const scene = new THREE.Scene();

		const renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setSize(args.width, args.height);
		renderer.setClearColor(0x000000);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;

		this.defaultCamera = new GameCamera({
			aspect: Config["game_aspect"],
		});
		this.camera = this.defaultCamera;

		this.domElement = renderer.domElement;
		this.domElement.id = `${args.game.domElement.id}-scene-canvas`;
		this.domElement.style.position = "absolute";
		this.game = args.game;

		// 灯光
		const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
		scene.add(ambLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 2);
		dirLight.position.copy(this.defaultCamera.three.camera.position);
		const { x: cx, y: cy, z: cz } = this.defaultCamera.three.camera.position;
		const a = Math.PI / 2 - Config.object2d_tilt;
		dirLight.target.position.set(cx, cy - Math.sin(a), cz - Math.cos(a));
		scene.add(dirLight);
		scene.add(dirLight.target);

		this.three = {
			scene,
			camera: this.defaultCamera.three.camera,
			renderer,
			ambLight,
			dirLight
		};

		if (Config.enable_shadows) {
			this.setupShadows();
		}
	}

	// ─── 阴影 ─────────────────────────────────────

	setupShadows(): void {
		const dl = this.three.dirLight;
		dl.castShadow = true;
		dl.shadow.camera.near = 0.1;
		dl.shadow.camera.far = 120;
		dl.shadow.camera.left = -60;
		dl.shadow.camera.right = 60;
		dl.shadow.camera.top = 60;
		dl.shadow.camera.bottom = -60;
		dl.shadow.bias = -0.001;
		dl.shadow.mapSize.width = 2048;
		dl.shadow.mapSize.height = 2048;
	}

	removeShadows(): void {
		this.three.dirLight.castShadow = false;
	}

	private _updateLightPosition(): void {
		const dl = this.three.dirLight;
		const cam = this.camera;
		dl.position.copy(cam.position);

		const { x: cx, y: cy, z: cz } = cam.position;
		const a = Math.PI / 2 - Config.object2d_tilt;
		dl.target.position.set(cx, cy - Math.sin(a), cz - Math.cos(a));

		if (dl.castShadow) {
			dl.shadow.camera.position.copy(dl.position);
			dl.shadow.camera.lookAt(dl.target.position);
			dl.shadow.camera.updateProjectionMatrix();
		}
	}

	updateSize(opts: {
		width: number,
		height: number,
		aspect: number
	}) {

		this.refreshThreeArgs({ aspect: opts.aspect, width: opts.width, height: opts.height });
	}

	// ─── Debug ────────────────────────────────────

	$debug(): void {
		this.debug = {
			grid: new THREE.GridHelper(16, 16),
			axes: new THREE.AxesHelper(10),
			camera: new THREE.PerspectiveCamera(60, this.three.camera.aspect, 0.1, 1000),
			controls: new OrbitControls(new THREE.PerspectiveCamera(), this.domElement),
		};

		this.three.scene.add(this.debug.grid);

		this.debug.camera = new GameCamera(new THREE.PerspectiveCamera(
			60,
			this.three.camera.aspect,
			0.1,
			1000,
		));
		this.debug.camera.three.camera.position.set(5, 5, 5)
		this.debug.controls = new OrbitControls(this.debug.camera.three.camera, this.domElement);
		this.debug.controls.enabled = false;
		this.game.InputStack.bottom.keyboard.onKey("F1", (e) => {
			if (!e.down) return;
			this.camera = (this.camera === this.debug!.camera ? this.currentMap!.camera : this.debug!.camera);
			this.debug!.controls.enabled = !this.debug!.controls.enabled;
		})
		this.game.afterRender(() => {
			this.debug?.controls?.update();
		})
		this.debug.camera.position.set(2, 2, 2);
	}

	refreshThreeArgs(args: { aspect?: number; width: number; height: number }): void {
		this.camera.three.camera.aspect = args.aspect ?? args.width / args.height;
		this.camera.three.camera.updateProjectionMatrix();
		this.three.renderer.setSize(args.width, args.height);
	}

	// ─── 渲染 ─────────────────────────────────────

	render(opts: { progress?: number } = {}): void {
		this.currentMap?.tweenThree(opts.progress ?? 1);
		this._updateLightPosition();
		this.three.renderer.render(this.three.scene, this.camera.three.camera || this.defaultCamera.three.camera);
	}

	// ─── 逻辑更新 ─────────────────────────────────

	update(ctx: { frame: number; game: Game }): void {
		this.currentMap?.update(ctx);
	}

	// ─── GameMap 管理 ─────────────────────────────

	addGameMap(map: GameMap): void {
		this.gameMaps.set(map.id, map);

		if (this.currentMap) {
			map._exitScene();
		} else {
			this.switchToGameMap(map);
		}

		this.three.scene.add(map.three.group!);
	}

	switchToGameMap(map: GameMap | string): void {
		if (typeof map === 'string') {
			const found = this.gameMaps.get(map);
			if (!found) {
				console.warn(`[GameScene] 尝试切换到不存在的 GameMap: "${map}"`);
				return;
			}
			map = found;
		}

		if (map === this.currentMap) return;

		if (map.three.destory) {
			throw new Error(`无法切换为一个已经被销毁的GameMap`)
		};

		this.currentMap?._exitScene();
		this.currentMap = map;
		map._enterScene();
		this.camera = map.camera || this.defaultCamera;
	}

	removeGameMap(map: GameMap): void {
		if (map === this.currentMap) {
			throw new Error('无法移除当前载入的地图');
		}

		const found = this.gameMaps.get(map.id);
		if (!found) return;

		this.gameMaps.delete(map.id);
		if (this.camera === found.camera) {
			this.camera = this.defaultCamera;
		}
		found._exitScene();
		this.three.scene.remove(found.three.group!);
	}
}
