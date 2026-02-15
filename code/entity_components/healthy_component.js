import { Component } from "./component";

class HealthyComponent extends Component {
    constructor(data) {
        super(data);
        this.maxHp = data.maxHp || Infinity;
        this.hp = data.hp || data.maxHp;
    }

    get value() {
        return this.hp;
    }

    set value(v) {
        if (v > this.maxHp) v = this.maxHp;
        this.hp = v;
    }
}

export { HealthyComponent };