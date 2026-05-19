import { Position } from "../position.js";

const Mou = {
    canvas: null,
    bind(canvas) {
        if (typeof canvas === "string") canvas = document.getElementById(canvas)
        this.canvas = canvas;
    },
    left: false,
    right: false,
    middle: false,
    wheel: {},
    movement: {
        x: 0,
        y: 0,
        z: 0
    },
    _lastPosition: {
        x: 0,
        y: 0
    },
    x: 0,
    y: 0,
    _wheelCallbacks: [],
    _buttonCallbacks: new Map(),
    onWheel(cb) {
        this._wheelCallbacks.push(cb);
    },
    offWheel(cb) {
        const index = this._wheelCallbacks.indexOf(cb);
        if (index !== -1) {
            this._wheelCallbacks.splice(index, 1);
        }
    },
    onLeftDown(cb) {
        this.onButton('leftDown', cb);
    },
    offLeftDown(cb) {
        this.offButton('leftDown', cb);
    },
    onLeftUp(cb) {
        this.onButton('leftUp', cb);
    },
    offLeftUp(cb) {
        this.offButton('leftUp', cb);
    },
    onRightDown(cb) {
        this.onButton('rightDown', cb);
    },
    offRightDown(cb) {
        this.offButton('rightDown', cb);
    },
    onRightUp(cb) {
        this.onButton('rightUp', cb);
    },
    offRightUp(cb) {
        this.offButton('rightUp', cb);
    },
    onButton(button, cb) {
        if (!this._buttonCallbacks.has(button)) {
            this._buttonCallbacks.set(button, []);
        }
        this._buttonCallbacks.get(button).push(cb);
    },
    offButton(button, cb) {
        if (!this._buttonCallbacks.has(button)) return;
        const arr = this._buttonCallbacks.get(button);
        const index = arr.indexOf(cb);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    },

    _raycaster: new THREE.Raycaster(),
    _intersectionPoint : new THREE.Vector3(),
    _mouse: new THREE.Vector2(),
    _inMapPos: new Position(),
    inMapPosition(camera, plane) {
        // 获取 canvas 相对于视口的位置
        const rect = this.canvas?.getBoundingClientRect() || {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight
        };

        // 精确计算归一化坐标
        this._mouse.x = (this.x / rect.width) * 2 - 1;
        this._mouse.y = -(this.y / rect.height) * 2 + 1;

        this._raycaster.setFromCamera(this._mouse, camera);

        if (plane.isMesh) {
            // 如果传入的是 Mesh
            const intersects = this._raycaster.intersectObject(plane);
            return intersects.length > 0 ? intersects[0].point : null;
        } else {
            // 如果传入的是 THREE.Plane
            let pos = this._raycaster.ray.intersectPlane(plane, this._intersectionPoint);
            if (pos) {
                this._inMapPos.set(pos.x, pos.y, -pos.z);
                // let thPos = new Position();
                // thPos.x = pos.x;
                // thPos.y = pos.y;
                // thPos.z = -pos.z;                
                return this._inMapPos;//new THREE.Vector3(pos.x, pos.y, -pos.z)//pos//new TH.Position(pos.x, pos.z, pos.y);
            } else {
                return new Position();
                //return null;
            }
        }

    }
}

window.addEventListener("mousedown", event => {
    switch (event.button) {
        case 0:
            Mou.left = true;
            Mou._buttonCallbacks.get('leftDown')?.forEach(cb => cb(event));
            break;
        case 1:
            Mou.middle = true;
            break;
        case 2:
            Mou.right = true;
            Mou._buttonCallbacks.get('rightDown')?.forEach(cb => cb(event));
            break;
    }
})

window.addEventListener("mouseup", event => {
    switch (event.button) {
        case 0:
            Mou.left = false;
            Mou._buttonCallbacks.get('leftUp')?.forEach(cb => cb(event));
            break;
        case 1:
            Mou.middle = false;
            break;
        case 2:
            Mou.right = false;
            Mou._buttonCallbacks.get('rightUp')?.forEach(cb => cb(event));
            break;
    }
})

window.addEventListener("wheel", event => {
    Mou.wheel.x = event.deltaX;
    Mou.wheel.y = event.deltaY;
    Mou.wheel.z = event.deltaZ;
    Mou._wheelCallbacks.forEach(cb => {
        cb(Mou.wheel);
    });
})

// window.addEventListener("mousemove", event => {
//     let [x, y] = [event.clientX, event.clientY];
//     Mou.movement.x = x - Mou._lastPosition.x;
//     Mou.movement.y = y - Mou._lastPosition.y;

//     Mou._lastPosition.x = x;
//     Mou._lastPosition.y = y;

//     Mou.x = x;
//     Mou.y = y;
// })

window.addEventListener("mousemove", event => {
    // 1. 获取 Canvas 在页面上的实际位置和缩放后的尺寸
    const rect = Mou.canvas?.getBoundingClientRect() || {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
    };

    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;
    // 更新 movement (也需要按比例缩放，否则灵敏度会变)
    Mou.movement.x = x - Mou._lastPosition.x;
    Mou.movement.y = y - Mou._lastPosition.y;

    // 更新状态
    Mou._lastPosition.x = x;
    Mou._lastPosition.y = y;
    Mou.x = x;
    Mou.y = y;
});

export { Mou as MouseInput }