class Controller {
	constructor(obj) {
		this.target = obj;
	}
	
	update() {
		throw new Error("Controller子类必须实现该方法")
	}
}

export {
	Controller
}