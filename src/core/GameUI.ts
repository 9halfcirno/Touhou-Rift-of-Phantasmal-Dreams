import * as PIXI from "pixi.js";
import { Game } from "./Game";

export class GameUI {
	pixi = {
		app: new PIXI.Application()
	};
	private _orgWidth: number;
	private _orgHeight: number;
	public domElement: HTMLCanvasElement;

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
		this.domElement.style.pointerEvents = "none";
	}

	async init(game: Game) {
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


		this.pixi.app.renderer.events.autoPreventDefault = false;
	}

	render() {
		this.pixi.app.renderer.render({ container: this.pixi.app.stage });
	}

	updateSize(opts: {
		width: number,
		height: number,
		aspect: number
	}) {


		const scale = opts.width / this._orgWidth;		

		this.pixi.app.stage.scale.set(scale);
		if (this.pixi.app.renderer) {
			this.pixi.app.renderer.resize(opts.width, opts.height);
		}
	}
}