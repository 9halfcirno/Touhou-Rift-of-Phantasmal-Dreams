import { GameCamera } from "@/objects";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/Addons.js";

export class GameSceneRenderer {
	readonly renderer: THREE.WebGLRenderer;
	readonly composer: EffectComposer;
	private renderPass: RenderPass;

	resolution: number = 1;

	private _scene: THREE.Scene;
	private _camera: THREE.Camera;

	domElement: HTMLCanvasElement;

	renderMode: "normal" | "composer" = "normal";
	constructor(scene: THREE.Scene, camera: THREE.Camera | GameCamera) {
		if (camera instanceof GameCamera) camera = camera.three.camera;


		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		this.renderer.setClearColor(0x000000);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.domElement = this.renderer.domElement;

		this.composer = new EffectComposer(this.renderer);
		this.renderPass = new RenderPass(scene, camera)
		this.composer.addPass(this.renderPass);
		this._camera = camera;
		this._scene = scene;
	}

	setSize(w: number, h: number, resolution: number = this.resolution) {
		this.composer.setSize(w * resolution, h * resolution);

		this.renderer.setSize(w * resolution, h * resolution, false);
		this.renderer.domElement.style.width = "100%";
		this.renderer.domElement.style.height = "100%";
	}

	get camera(): THREE.Camera { return this._camera }

	set camera(cam: THREE.Camera | GameCamera) {
		if (cam instanceof GameCamera) cam = cam.three.camera;
		this._camera = cam;
		this.renderPass.camera = cam;
	}

	get scene() { return this._scene }

	set scene(scene: THREE.Scene) {
		this._scene = scene;
		this.renderPass.scene = scene;
	}


	render(delta?: number) {
		if (this.renderMode === "composer") {
			this.composer.render(delta);
		} else if (this.renderMode === "normal") {
			this.renderer.render(this.scene, this.camera);
		}
	}
}