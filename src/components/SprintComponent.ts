import { Component } from '../ecs/Component.js';

export interface SprintData {
	/** 冷却时间 */
	cooldown: number;
	/** 冲刺距离 */
	speed: number;
	/** 冲刺持续时间, 单位tick */
	time: number;
}

export class SprintComponent extends Component<SprintData> {
	constructor(data: SprintData) {
		super('th:sprint', data);
	}
}

Component.register('th:sprint', SprintComponent);