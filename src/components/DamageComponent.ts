import { Component } from "@/ecs";

export interface Damage {
	/** 伤害数值 */
	value: number;
	/** 伤害来源, null视为莫名收到的伤害 */
	from?: string | null;
	/** 伤害目标 */
	target?: string | null;
	/** 伤害类型 */
	type?: string | null;
}

export class DamageComponent extends Component<Damage> {
	constructor(data: Damage) {
		super('th:damage', data ?? {
			value: 0,
			from: null,
			target: null,
			type: null
		});
	}

	get value(): Damage {
		return this.data as Damage;
	}

	set value(v: number) {
		this.data.value = v;
	}
}

Component.register('th:damage', DamageComponent);

// ─── Module Augmentation: 向 ComponentTypeMap 注入本组件类型 ──
declare module '../core/types.js' {
	interface ComponentTypeMap {
		'th:damage': Damage;
	}
}