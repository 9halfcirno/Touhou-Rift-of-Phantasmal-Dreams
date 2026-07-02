import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { LayoutStyles } from "@pixi/layout";
import { UIStack } from "@/ui";

export class GameUI {
	pixi = {
		app: new PIXI.Application()
	};
	private _orgWidth: number;
	private _orgHeight: number;
	public domElement: HTMLCanvasElement;
	readonly stack: UIStack;

	constructor(opts: {
		width: number,
		height: number,
		game: Game,
		canvas: HTMLCanvasElement
	}) {
		this._orgWidth = opts.width;
		this._orgHeight = opts.height;
		this.domElement = opts.canvas;
		this.domElement.id = `${opts.game.domElement.id}-ui-scene`;
		this.domElement.style.position = "absolute";
		// this.domElement.style.pointerEvents = "none";

		this.stack = new UIStack(this.pixi.app.stage, opts.game.InputStack);
	}

	async init(game: Game, opts: {
		layout?: LayoutStyles
	} = {}) {
		await this.pixi.app.init({
			canvas: this.domElement,
			preference: "webgl",
			width: this._orgWidth,
			height: this._orgHeight,
			backgroundAlpha: 0,
			autoDensity: true,
			clearBeforeRender: false,
			resolution: window.devicePixelRatio
		})

		// this.pixi.app.renderer.layout.enableDebug(true);

		this.pixi.app.stage.layout = opts.layout || {};
		// this.pixi.app.stage.layout = { debug: true, debugDrawPadding: true }


		this.pixi.app.renderer.events.autoPreventDefault = true;
	}

	render() {
		this.pixi.app.renderer.render({ container: this.pixi.app.stage });
	}

	updateSize(opts: {
		width: number,
		height: number,
		aspect: number
	}) {

		this.pixi.app.stage.layout = {
			width: opts.width,
			height: opts.height
		}
		if (this.pixi.app.renderer) {
			this.pixi.app.renderer.resize(opts.width, opts.height);
		}
	}
}