import { Sprite, Texture } from "pixi.js";
import { UIBase } from "./base";

export class UIButton extends UIBase<Sprite> {
	constructor(opts: {
		texture: Texture
	}) {
		let sprite = new Sprite(opts.texture);

		super(sprite)
	}
}