export class THEvent extends Event {
	from: Object | null = null; // 事件来源对象 
	/**
	 * 
	 * @param id 事件的thid
	 * @param data 事件的数据
	 */
	constructor(id: string, data: {
		from?: Object;
		event: Record<string, any>
	}) {
		super(id, data.event);
		this.from = data.from || null;
	}
}
