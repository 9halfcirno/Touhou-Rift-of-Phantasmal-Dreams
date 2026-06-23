import { System } from '../ecs/System.js';
import type { SystemUpdateContext } from '../core/types.js';
import { DisplayData } from '@/components/DisplayComponent.js';
import { TextureLoader } from '@/graphics/TextureLoader.js';
import { Texture } from '@/graphics/Texture.js';

export class DisplaySystem extends System {
	constructor() {
		super({
			name: 'DisplaySystem',
			requireComponents: ["th:display"],
			priority: 1,
		});
	}

	override update({ entities }: SystemUpdateContext): void {
		for (const entity of entities) {
			let com = entity.getComponent("th:display");
			if (!com!.data.needUpdate) {
				continue;
			}

			let { texture: tex, material: mat } = com!.data as DisplayData;
			let oldTex = entity.texture!.thid;
			if (tex !== oldTex) {
				entity.texture = TextureLoader.get(tex) as Texture;
			}
			if (mat !== entity.three.material?.type) {
				// TODO
			}
			com!.data.needUpdate = false;
		}
	}
}

System.register('th:system=display_system', DisplaySystem);
