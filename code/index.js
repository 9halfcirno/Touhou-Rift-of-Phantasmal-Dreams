import * as TH from "./module_all.js"
import * as THREE from "three";

import {
	default as Stats
} from "three/addons/libs/stats.module.js";
import { MMDLoader } from "three/addons/loaders/MMDLoader.js";
globalThis.TH = TH;

import Game from "./Game.js";

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


const game = new Game();

globalThis.debug = {};

game.scene.$debug()


document.getElementById("game").append(game.scene.domElement);


debug.main = new TH.GameSplicingMap("th:map=main");
await debug.main._createMap()
debug.main.$debug()
game.scene.addGameMap(debug.main)
game.scene.switchToGameMap("th:map=main")



await TH.TextureLoader.load("th:texture=entity/reimu")
await TH.TextureLoader.load("th:texture=a")
await TH.EntityManager.registerEntity("th:entity=bullet/ball");
await TH.EntityManager.registerEntity("th:entity=character/reimu");
await TH.TextureLoader.load("th:texture=entity/fairy")
await TH.EntityManager.registerEntity("th:entity=enemy/fairy");

// const model = await loadMMD(`${GAME_CONFIG.RUN_PATH}/assets/models/mmd/cirno/cirno.pmx`);

let entity = TH.EntityManager.createEntity("th:entity=character/reimu")//new TH.Entity("th:entity=character/reimu")
// entity.three.mesh = model;
// model.scale.set(0.4, 0.4, 0.4)
debug.entity = entity;

let e2 = TH.EntityManager.createEntity("th:entity=enemy/fairy")
debug.main.addObject(entity)
debug.main.addObject(e2)

let ctrl = new TH.PlayerController(entity, game.scene.three.camera)


game.addTickCallback(() => {	
	ctrl.update();
	statsTps.update();
	if (TH.MouseInput.left) {
		let mousePos = TH.MouseInput.inMapPosition(game.scene.currentCamera, debug.main.three.ground);
		let j = Math.random() * 2 - 1;
		let e = TH.EntityManager.createEntity("th:entity=bullet/ball", {
			position: entity.position,
			rotation: new TH.Vector2(1, 0),
			frame: game.TickSystem.frame
		});
		// entity.moveTo(...mousePos)
		e.faceTo(mousePos)
		//e._disposeThree();
		debug.main.addObject(e);
	}
	debugdiv.innerHTML = `player x: ${entity.position.x}, y: ${entity.position.y}, z: ${entity.position.z}
</br>player hp: ${entity.getComponentValue("th:hp")}
</br>entity count: ${TH.EntityManager.getAllEntities().length}
</br>frame: ${game.TickSystem.frame}
</br>tickDelta: ${game.TickSystem.tickDelta.toFixed(3)}s
</br>renderDelta: ${game.TickSystem.renderDelta.toFixed(3)}s
</br>mouse screen pos:  ${TH.MouseInput.x}, ${TH.MouseInput.y}
</br>mouse map pos: ${TH.MouseInput.inMapPosition(game.scene.currentCamera, debug.main.three.ground).toArray().map(v => v.toFixed(4)).join()}
`;
})

function render() {
	ctrl.onRender({
		progress: game.TickSystem.tickP
	});
	statsFps.update();
	requestAnimationFrame(render)
}


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

// // 调试球
const debugSphere = new THREE.Mesh(
	new THREE.SphereGeometry(0.1),
	new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
game.scene.three.scene.add(debugSphere);

window.addEventListener('mousemove', () => {
	const point = TH.MouseInput.inMapPosition(game.scene.three.camera, debug.main.three.ground);
	if (point) {
		debugSphere.position.set(point.x, point.y, -point.z); // 点击哪里，小红球就跳到哪里
	}
});

render()

game.startTick();

game.startRender();