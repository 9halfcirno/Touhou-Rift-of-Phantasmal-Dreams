import * as TH from "./module_all.js"
import {
	default as Stats
} from "../libs/three.stats.js";

let statsTps = new Stats();
statsTps.setMode(0);
statsTps.domElement.style.left = window.innerWidth - 80 + 'px';
//statsTps.domElement.style.bottom = '0px';
document.body.append(statsTps.domElement);
let statsFps = new Stats();
statsFps.setMode(0);
//statsFps.domElement.style.bottom = '0px';
document.body.append(statsFps.domElement);
const debugdiv = document.getElementById("debug")


globalThis.GAME_CONFIG = { // 总配置
	RUN_PATH: document.location.href.slice(0, document.location.href.lastIndexOf("/")),
	WIDTH: Math.min(window.innerWidth),
	HEIGHT: Math.min(window.innerWidth * (9 / 16), window.innerHeight)
}

console.log("游戏配置:", GAME_CONFIG)

globalThis.scene = new TH.GameScene({
	width: GAME_CONFIG.WIDTH,
	height: GAME_CONFIG.HEIGHT,
})

globalThis.debug = {};

scene.render()
scene.$debug()
document.getElementById("game").append(scene.domElement)

document.addEventListener('contextmenu', function (event) {
	event.preventDefault();
});


TH.system.update = () => {
	scene.update()
	ctrl.update();
	statsTps.update();
	debugdiv.innerHTML = `player x: ${entity.position.x}, y: ${entity.position.y}, z: ${entity.position.z}`
}

function render() {
	ctrl.onRender({
		progress: TH.system.tickP
	});
	scene.render({
		progress: TH.system.tickP
	})
	statsFps.update();
	requestAnimationFrame(render)
}

debug.main = new TH.GameSplicingMap("th:map=main");
await debug.main._createMap()
scene.addGameMap(debug.main)
scene.switchToGameMap("th:map=main")

await TH.TextureManager.load("th:texture=entity/reimu")
await TH.Entity.registerEntity("th:entity=character/reimu");
await TH.TextureManager.load("th:texture=entity/fairy")
await TH.Entity.registerEntity("th:entity=enemy/fairy");
let entity = new TH.Entity("th:entity=character/reimu")
let e2 = new TH.Entity("th:entity=enemy/fairy")
debug.main.addObject(entity)
debug.main.addObject(e2)

let ctrl = new TH.PlayerController(entity.uuid, scene.three.camera)

render()

TH.system.startTick()

let a = () => {
	entity.die();
	console.log(entity)
	TH.KeyboardInput.offKey("x", a);
}

TH.KeyboardInput.onKey("x", a);

TH.KeyboardInput.onKey("z", () => {

})