import * as PIXI from "pixi.js";

export class UIBase<T extends unknown> {
	pixi: {
		object: T 
	};

	constructor(pixiObj: T) {
		this.pixi = {
			object: pixiObj
		}
	}
}