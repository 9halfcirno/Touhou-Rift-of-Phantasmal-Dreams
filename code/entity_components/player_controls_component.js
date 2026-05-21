import { Component } from "./component.js";

class PlayerControlsComponent extends Component {
    constructor(data) {
        super("th:player_controls", data);
        this.controls = data || {};
    }

    get value() {
        return this.controls;
    }

    set value(controls) {
        this.controls = controls;
    }
}

Component.registerComponent("th:player_controls", PlayerControlsComponent);

export { PlayerControlsComponent };