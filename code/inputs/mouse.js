const Mou = {
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
    y: 0
}

window.addEventListener("mousedown", event => {
    switch (event.button) {
        case 0:
            Mou.left = true;
            break;
        case 1:
            Mou.middle = true;
            break;
        case 2:
            Mou.right = true;
            break;
    }
})

window.addEventListener("mouseup", event => {
    switch (event.button) {
        case 0:
            Mou.left = false;
            break;
        case 1:
            Mou.middle = false;
            break;
        case 2:
            Mou.right = false;
            break;
    }
})

window.addEventListener("wheel", event => {
    Mou.wheel.x = event.deltaX;
    Mou.wheel.y = event.deltaY;
    Mou.wheel.z = event.deltaZ; 
})

window.addEventListener("mousemove", event => {
    let [x, y] = [event.clientX, event.clientY];
    Mou.movement.x = x - Mou._lastPosition.x;
    Mou.movement.y = y - Mou._lastPosition.y;

    Mou._lastPosition.x = x;
    Mou._lastPosition.y = y;
})


export {Mou as MouseInput}