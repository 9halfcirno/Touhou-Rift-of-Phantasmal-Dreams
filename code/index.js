import * as TH from "./module_all.js"
import {
	default as Stats
} from "../libs/three.stats.js";
globalThis.TH = TH;

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

globalThis.scene = new TH.GameScene({
	width: GAME_CONFIG.STAGE_WIDTH,
	height: GAME_CONFIG.STAGE_HEIGHT,
	canvasId: GAME_CONFIG.CANVAS_ID
})

globalThis.debug = {};

scene.render()
scene.$debug()

TH.MouseInput.bind(scene.domElement)

document.getElementById("game").append(scene.domElement)

document.addEventListener('contextmenu', function (event) {
	event.preventDefault();
});


TH.system.update = () => {
	scene.update()
	ctrl.update();
	statsTps.update();
	TH.System.updateAll();
	if (TH.MouseInput.left) {
		let mousePos = TH.MouseInput.inMapPosition(scene.currentCamera, debug.main.three.ground);
		let j = Math.random() * 2 - 1;
		let e = new TH.Entity("th:entity=bullet/ball", {
			position: entity.position,
			rotation: new TH.Vector2(1, 0)
		});
		// entity.moveTo(...mousePos)
		e.faceTo(mousePos)
		debug.main.addObject(e);
	}
	debugdiv.innerHTML = `player x: ${entity.position.x}, y: ${entity.position.y}, z: ${entity.position.z}
</br>player hp: ${entity.getComponentValue("th:hp")}
</br>entity count: ${TH.Entity.getAllEntities().length}
</br>frame: ${THSystem.frame}
</br>tickDelta: ${THSystem.tickDelta.toFixed(3)}s
</br>renderDelta: ${THSystem.renderDelta.toFixed(3)}s
</br>mouse screen pos:  ${TH.MouseInput.x}, ${TH.MouseInput.y}
</br>mouse map pos: ${TH.MouseInput.inMapPosition(scene.currentCamera, debug.main.three.ground).toArray().map(v => v.toFixed(4)).join()}
`;

	// if (TH.MouseInput.left) {
	// 	// for (let i = 0; i < 10; i++) {
	// 	let j = Math.random() * 2 - 1;
	// 	let e = new TH.Entity("th:entity=bullet/ball", {
	// 		position: entity.position,
	// 		rotation: new TH.Vector3(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2)
	// 	});
	// 	debug.main.addObject(e);
	// 	// e._disposeThree();
	// 	// }
	// }
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
debug.main.$debug()
scene.addGameMap(debug.main)
scene.switchToGameMap("th:map=main")

await TH.TextureManager.load("th:texture=entity/reimu")
await TH.TextureManager.load("th:texture=a")
await TH.Entity.registerEntity("th:entity=bullet/ball");
await TH.Entity.registerEntity("th:entity=character/reimu");
await TH.TextureManager.load("th:texture=entity/fairy")
await TH.Entity.registerEntity("th:entity=enemy/fairy");
let entity = new TH.Entity("th:entity=character/reimu")
debug.entity = entity;

let e2 = new TH.Entity("th:entity=enemy/fairy")
debug.main.addObject(entity)
debug.main.addObject(e2)

let ctrl = new TH.PlayerController(entity.uuid, scene.three.camera)

render()

TH.system.startTick()

TH.KeyboardInput.onKey("z", () => {
	console.log("z pressed")
	entity.getComponent("th:hp").value -= 1;
})

TH.MouseInput.onWheel((wheel) => {
	TH.Config["camera_distance"] += wheel.y * 0.01;
})

TH.KeyboardInput.onKey("Tab", (tab) => {
	if (tab.repeat) return;
	ctrl.setTarget(ctrl.target === e2 ? entity : e2);
})
console.log(scene)

// // 调试球
const debugSphere = new THREE.Mesh(
	new THREE.SphereGeometry(0.1),
	new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.three.scene.add(debugSphere);

window.addEventListener('mousemove', () => {
	const point = TH.MouseInput.inMapPosition(scene.three.camera, debug.main.three.ground);
	if (point) {
		debugSphere.position.set(point.x, point.y, -point.z); // 点击哪里，小红球就跳到哪里
	}
});