import { Component } from "./component.js";

const SHAPE = {
    CIRCLE: "circle", // 圆形
    BOX: "box",       // 矩形
    CUSTOM: "custom"  // 自定义
}

class HitboxComponent extends Component {
    constructor(data) {
        super("th:hitbox", data);
        this.shape = data.shape;
        if (data.shape === SHAPE.CIRCLE) { // 圆形
            this.r = data.r;

        } else if (data.shape === SHAPE.BOX) { // 矩形
            this.width = data.width;
            this.height = data.height

        } else if (data.shape === SHAPE.CUSTOM) { // 自定义
            this.vertexs = data.vertexs;
        }
    }

    get value() {
        let self = this;
        return {
            shape: self.shape,
            ...self
        }
    }

    set value(data) {}
}

Component.registerComponent("th:hitbox", HitboxComponent)

export { HitboxComponent }