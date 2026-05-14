import * as TH from "./module_all.js"


globalThis.GAME_CONFIG = { // 总配置
    RUN_PATH: document.location.href.slice(0, document.location.href.lastIndexOf("/")),
    CANVAS_ID: "game-canvas",
    STAGE_ASPECT: window.innerWidth / window.innerHeight,
    // STAGE_ASPECT: 16 / 9,
    STAGE_WIDTH: Math.min(window.innerWidth),
    STAGE_HEIGHT: Math.min(window.innerWidth * (9 / 16), window.innerHeight)
}
const maxWidth = window.innerWidth;
const maxHeight = window.innerHeight;
const windowAspect = maxWidth / maxHeight;

if (windowAspect > GAME_CONFIG.STAGE_ASPECT) {
    GAME_CONFIG.STAGE_HEIGHT = maxHeight;
    GAME_CONFIG.STAGE_WIDTH = maxHeight * GAME_CONFIG.STAGE_ASPECT;
} else {
    GAME_CONFIG.STAGE_WIDTH = maxWidth;
    GAME_CONFIG.STAGE_HEIGHT = maxWidth / GAME_CONFIG.STAGE_ASPECT;
}


console.log("游戏配置:", GAME_CONFIG)

export default class Game {
    constructor(config = {}) {
        this.scene = new TH.GameScene({
            width: GAME_CONFIG.STAGE_WIDTH,
            height: GAME_CONFIG.STAGE_HEIGHT,
            canvasId: GAME_CONFIG.CANVAS_ID
        });

        TH.MouseInput.bind(this.scene.domElement)
        this.TickSystem = new TH.TickSystem();

        this._tickFunc = [];

        this.TickSystem.update = () => {
            this.tick();
        }

        this.render = () => {
            this.scene.render({ progress: this.TickSystem.tickP });
            requestAnimationFrame(this.render);
        }

    }

    startTick() {
        this.TickSystem.startTick();
    }

    tick() {
        this.scene.update();
        TH.System.updateAll({ frame: this.TickSystem.frame });
        for (let index = 0; index < this._tickFunc.length; index++) {
            const f = this._tickFunc[index];
            f?.({ frame: this.TickSystem.frame });
        }
    }

    addTickCallback(f) {
        this._tickFunc.push(f);
    }

    startRender() {
        this.render();
    }

    exit() {

    }

    _preventWebDefaultAction() {
        document.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });
    }

}