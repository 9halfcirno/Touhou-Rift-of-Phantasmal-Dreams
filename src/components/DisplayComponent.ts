import { Component } from "@/ecs";

export interface DisplayData {
	/** 显示尺寸 */
	size: number;
	/** 使用纹理, 以THID表示 */
	texture: string;
	/** 使用的THREE对应材质名 */
	material: string;
	/** 是否需要更新显示标志 */
	needUpdate: boolean 
}

/**
 * 标记需要更新材质的组件
 */
export class DisplayComponent extends Component<DisplayData> {
	constructor(data: DisplayData) {
		super('th:display', Object.assign({
			size: 1,
			texture: "th:texture=null",
			material: "MeshBasicMaterial",
			needUpdate: true
		}, data));
	}
}

Component.register('th:display', DisplayComponent);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
	interface ComponentTypeMap {
		'th:display': DisplayData;
	}
}