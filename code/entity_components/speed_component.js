import { Component } from "./component.js";

class SpeedComponent extends Component {
    constructor(data) {
        super(data);
        this.speed = data.speed;
    }

    get value() {
        return this.speed;
    }

    set value(v) {
        this.speed = v;
    }
}

export { SpeedComponent };