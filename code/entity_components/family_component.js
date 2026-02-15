import { Component } from "./component.js";

class FamilyComponent extends Component {
    constructor(data) {
        super("th:family", data);
            
            this.family = data;
        
        
    }

    get value() {
        return this.family;
    }

    set value(v) {
        this.family = v;
    }
}
Component.registerComponent("th:family", FamilyComponent);

export { FamilyComponent };