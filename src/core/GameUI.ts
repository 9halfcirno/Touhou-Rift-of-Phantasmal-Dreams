import * as PIXI from "pixi.js";

export class GameUI {
	pixi = {
		app: new PIXI.Application()
	};
	public domElement: HTMLCanvasElement | null = null;

	constructor() {

	}

	async init(opts: {
		width: number,
		height: number,
	}) {
		await this.pixi.app.init({
			width: opts.width,
			height: opts.height,
			backgroundAlpha: 0
		})
		this.domElement = this.pixi.app.canvas;
		this.domElement.style.position = "absolute";

		this.pixi.app.stage.addChild(new PIXI.Text({
			text: "hello",
			
		}))
	}

	render() {
		this.pixi.app.render();
	}

	updateSize(opts: {
		maxWidth: number,
		maxHeight: number,
		aspect: number
	}) {
		const maxWidth = opts.maxWidth || window.innerWidth;
		const maxHeight = opts.maxHeight || window.innerHeight;
		const stageAspect = opts.aspect || 16 / 9;

		let stageWidth: number, stageHeight: number;
		if (maxWidth / maxHeight > stageAspect) {
			stageHeight = maxHeight;
			stageWidth = maxHeight * stageAspect;
		} else {
			stageWidth = maxWidth;
			stageHeight = maxWidth / stageAspect;
		}

		this.pixi.app.stage.setSize( stageWidth, stageHeight);
	}
}