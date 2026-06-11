import * as PIXI from "pixi.js";

export class UILayer {
	pixi = {
		group: new PIXI.Container()
	}
	stage: PIXI.Container;
	constructor(stage: PIXI.Container) {
		this.stage = stage;
	}

	display() {
		this.pixi.group.visible = true;
		if (!this.pixi.group.parent) {
			this.stage.addChild(this.pixi.group);
		}
	}

	remove() {
		this.pixi.group.removeFromParent();
	}
}