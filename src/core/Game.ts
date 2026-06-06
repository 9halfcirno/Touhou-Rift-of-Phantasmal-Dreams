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
import { Config } from './Config.js';
import { GameUI } from './GameUI.js';

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
	readonly domElement: HTMLDivElement;
	private _inited: boolean = false;

	private _tickCallbacks: Array<(ctx: { frame: number; game: Game }) => void> = [];
	private _renderCallbacks: Array<(ctx: { frame: number; progress: number }) => void> = [];

	constructor(public config: {
		width: number;
		height: number;
		canvasId: string;
		runPath: string;
	}) {
		// 注入运行路径
		setRunPath(config.runPath);

		this.scene = new GameScene({
			width: config.width,
			height: config.height,
			canvasId: config.canvasId,
		});
		this.ui = new GameUI();

		this.InputStack = new InputStack(this.scene.domElement);

		MouseInput.bind(this.scene.domElement);

		this.TickSystem = new TickSystem();
		this.RenderSystem = new RenderSystem();

		this.domElement = document.createElement('div');
		this.domElement.id = `THGame:${Date.now()}`;
		// this.domElement.style.position = "relative"
		this.domElement.append(this.scene.domElement);


		this._bindEvents();
	}

	async init() {
		if (this._inited) {
			console.error(`[Game] 已经初始化, 无需再次调用该方法`)
		}
		await this.ui.init({
			width: this.config.width,
			height: this.config.height,
		})
		this.domElement.append(this.ui.domElement as HTMLElement);


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
		for (const f of this._tickCallbacks) {
			f?.({ frame: this.TickSystem.frame, game: this });
		}
	}

	addTickCallback(f: (ctx: { frame: number; game: Game }) => void): void {
		this._tickCallbacks.push(f);
	}

	startRender(): void {
		this.RenderSystem.startRender();
	}

	private render(): void {
		this.scene.render({ progress: this.TickSystem.tickP });
		this.ui.render();
		for (const f of this._renderCallbacks) {
			f?.({ frame: this.RenderSystem.frame, progress: this.TickSystem.tickP });
		}
	}

	addRenderCallback(f: (ctx: { frame: number; progress: number }) => void): void {
		this._renderCallbacks.push(f);
	}

	exit(): void {
		this.TickSystem.stopTick();
		this.RenderSystem.stopRender();
	}

	private _bindEvents(): void {
		document.addEventListener('contextmenu', (event) => event.preventDefault());
		window.addEventListener("resize", () => {
			this.scene.updateSize({
				aspect: Config["game_aspect"],
				maxWidth: window.innerWidth,
				maxHeight: window.innerHeight
			});
			this.ui.updateSize({
				aspect: Config["game_aspect"],
				maxWidth: window.innerWidth,
				maxHeight: window.innerHeight
			});
		})
	}
}
