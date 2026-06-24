import { GameScene } from './GameScene.js';
import { TickSystem } from './TickSystem.js';
import { RenderSystem } from './RenderSystem.js';
import { KeyboardInput } from '../input/KeyboardInput.js';
import { MouseInput } from '../input/MouseInput.js';
import { setRunPath } from '../graphics/TextureLoader.js';

// 副作用：注册所有组件和系统
import '../components/index.js';
import '../systems/index.js';
import { InputStack } from '@/input/InputStack.js';
import { UIStack } from '@/ui/UIStack.js';
import { Config } from '../configs/Config.js';
import { GameUI } from './GameUI.js';
import eruda from 'eruda';
import { Storage } from '@/storage/Storage.js';
import { Setting } from './Setting.js';

/**
 * 游戏入口类
 *
 * 整合 Scene、Tick、Render、输入。
 * 迁移自 code/Game.js
 */
export class Game {
	readonly scene: GameScene;
	readonly ui: GameUI;
	readonly TickSystem: TickSystem;
	readonly RenderSystem: RenderSystem;
	readonly KeyboardInput = KeyboardInput;
	readonly MouseInput = MouseInput;
	readonly InputStack: InputStack;
	readonly UIStack: UIStack;
	readonly storage: Storage = new Storage();
	readonly setting: Setting = new Setting(this.storage);
	readonly domElement: HTMLDivElement;
	private _inited: boolean = false;

	private _afterTickCallbacks: Array<(ctx: { frame: number; game: Game }) => void> = [];
	private _afterRenderCallbacks: Array<(ctx: { frame: number; progress: number }) => void> = [];

	constructor(public config: {
		width: number;
		height: number;
		runPath: string;
	}) {
		// 注入运行路径
		setRunPath(config.runPath);

		this.domElement = document.createElement('div');
		let domId = `THGame-${Date.now()}`;
		this.domElement.id = domId;
		this.domElement.style.position = "relative";

		this.scene = new GameScene({
			width: config.width,
			height: config.height,
			game: this
		});


		let uiCanvas = document.createElement("canvas");
		this.ui = new GameUI({
			width: this.config.width,
			height: this.config.height,
			game: this,
			canvas: uiCanvas
		});
		this.domElement.append(this.scene.domElement, this.ui.domElement);


		this.InputStack = new InputStack(this.domElement);
		this.UIStack = new UIStack(this.ui.pixi.app.stage, this.InputStack);

		MouseInput.bind(this.domElement);

		this.TickSystem = new TickSystem();
		this.RenderSystem = new RenderSystem();


		this._bindEvents();
		// this.updateGameSize();
	}

	async init() {
		if (this._inited) {
			console.error(`[Game] 已经初始化, 无需再次调用该方法`)
		}
		await this.ui.init(this)
		this.domElement.append(this.ui.domElement as HTMLElement);

		await this.storage.init();
		await this.setting.load();

		this.updateGameSize();

		// 注入更新回调
		this.TickSystem.update = () => this.tick();
		this.RenderSystem.update = () => this.render();

		this._inited = true;
	}

	run(): void {
		if (!this._inited) {
			throw new Error(`[Game] 尚未初始化, 请先调用 game.init()`)
		}
		this.startRender();
		this.startTick();
	}

	startTick(): void {
		this.TickSystem.startTick();
	}

	private tick(): void {
		this.scene.update({ frame: this.TickSystem.frame, game: this });
		for (const f of this._afterTickCallbacks) {
			f?.({ frame: this.TickSystem.frame, game: this });
		}
	}

	afterTick(f: (ctx: { frame: number; game: Game }) => void): void {
		this._afterTickCallbacks.push(f);
	}

	startRender(): void {
		this.RenderSystem.startRender();
	}

	private render(): void {
		this.scene.render({ progress: this.TickSystem.tickP });
		this.ui.render();
		for (const f of this._afterRenderCallbacks) {
			f?.({ frame: this.RenderSystem.frame, progress: this.TickSystem.tickP });
		}
	}

	afterRender(f: (ctx: { frame: number; progress: number }) => void): void {
		this._afterRenderCallbacks.push(f);
	}

	exit(): void {
		this.TickSystem.stopTick();
		this.RenderSystem.stopRender();
	}

	private _bindEvents(): void {
		document.addEventListener('contextmenu', (event) => event.preventDefault());
		window.addEventListener("resize", () => {
			this.updateGameSize();
		})
		this.setting.onChange("window.full_screen", (s) => {
			if (s.value === true) {
				this.domElement.requestFullscreen();
			} else document.exitFullscreen();
		})
	}

	private updateGameSize() {
		const maxWidth = window.innerWidth;
		const maxHeight = window.innerHeight;
		let stageAspect = this.setting.get("window.aspect") || "window";
		if (stageAspect === "window" || this.setting.get("window.full_screen"))
			stageAspect = window.innerWidth / window.innerHeight;
		else stageAspect = stageAspect as number;

		let stageWidth: number, stageHeight: number;
		if (maxWidth / maxHeight > stageAspect) {
			stageHeight = maxHeight;
			stageWidth = maxHeight * stageAspect;
		} else {
			stageWidth = maxWidth;
			stageHeight = maxWidth / stageAspect;
		}

		this.scene.updateSize({
			aspect: stageAspect,
			width: stageWidth,
			height: stageHeight
		});
		this.ui.updateSize({
			aspect: stageAspect,
			width: stageWidth,
			height: stageHeight
		});

		this.domElement.style.width = `${stageWidth}px`;
		this.domElement.style.height = `${stageHeight}px`;
	}

	async $debug(opts: {
		scene?: boolean;
		console?: boolean;
		fpsAndTps?: boolean;
		debugDiv?: boolean;
	} = {}) {
		if (opts.console && window.navigator.platform !== "Win32") await import("eruda").then(() => eruda.init())
		opts.scene && this.scene.$debug();
		
		if (opts.debugDiv) {
			let debugDiv = document.createElement("div");
			debugDiv.id = `${this.domElement.id}-debug`;
			debugDiv.style.position = 'absolute';
			debugDiv.style.bottom = "0";
			debugDiv.style.left = "0";
			debugDiv.style.opacity = "0.7";
			debugDiv.style.fontSize = `16%`;
			debugDiv.style.backgroundColor = "white";
			debugDiv.style.padding = "5px";
			this.domElement.append(debugDiv);
		}

		if (opts.fpsAndTps) {

			// ─── Stats 面板 ──────────────────────────────────

			import("three/examples/jsm/libs/stats.module.js").then((mod) => {
				let Stats = mod.default
				const statsTps = new Stats();
				statsTps.showPanel(0);
				statsTps.dom.style.cssText = `position:fixed;top:0;right:0;left:auto;z-index:10000`;
				this.domElement.append(statsTps.dom);

				const statsFps = new Stats();
				statsFps.showPanel(0);
				statsFps.dom.style.cssText = 'position:fixed;top:0;left:0;z-index:10000';
				this.domElement.append(statsFps.dom);
				this.afterRender(() => {
					statsFps.update();
				});
				this.afterTick(() => {
					statsTps.update();
				})
			})
		}
	}

	$addDebugItem(name: string, func: (game?: Game) => string | number | boolean): () => void {
		let span = document.createElement("span");
		span.style.whiteSpace = "pre-warp";
		span.style.display = "block";

		let div = document.querySelector(`#${this.domElement.id}-debug`);
		if (div) {
			div.append(span);
		}

		const update = () => {
			let str = func(this);

			span.innerHTML = `${name}: ${str}`;
		}
		update();
		return update;
	}
}
