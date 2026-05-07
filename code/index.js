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
	STAGE_ASPECT: 16 / 9,
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
	TH.System.updateAll();
	debugdiv.innerHTML = `player x: ${entity.position.x}, y: ${entity.position.y}, z: ${entity.position.z}
</br>player hp: ${entity.getComponentValue("th:hp")}
</br>entity count: ${TH.Entity.getAllEntities().length}
</br>frame: ${THSystem.frame}
</br>tickDelta: ${THSystem.tickDelta.toFixed(3)}s
</br>renderDelta: ${THSystem.renderDelta.toFixed(3)}s
</br>mouse screen pos:  ${TH.MouseInput.x}, ${TH.MouseInput.y}
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

TH.MouseInput.onRightDown(() => {
	console.log(`鼠标canvas位置: ${TH.MouseInput.x}, ${TH.MouseInput.y}\n鼠标游戏位置:`, getPointOnRotatedPlane(TH.MouseInput, scene.three.camera, new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)));
	entity.setPosition(...getPointOnRotatedPlane(TH.MouseInput, scene.three.camera, new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)));
})

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _intersectionPoint = new THREE.Vector3();

function getPointOnRotatedPlane(MouseInput, camera, planeMeshOrMathPlane) {
	// 获取 canvas 相对于视口的位置
	const rect = scene.domElement.getBoundingClientRect();

	// 精确计算归一化坐标
	_mouse.x = ((MouseInput.x - rect.left) / rect.width) * 2 - 1;
	_mouse.y = -((MouseInput.y - rect.top) / rect.height) * 2 + 1;

	_raycaster.setFromCamera(_mouse, scene.currentCamera);

	if (planeMeshOrMathPlane.isMesh) {
		// 如果传入的是 Mesh
		const intersects = _raycaster.intersectObject(planeMeshOrMathPlane);
		return intersects.length > 0 ? intersects[0].point : null;
	} else {
		// 如果传入的是 THREE.Plane
		let pos = _raycaster.ray.intersectPlane(planeMeshOrMathPlane, _intersectionPoint);
		if (pos) {
			let thPos = new TH.Position();
			thPos.x = pos.x;
			thPos.y = pos.y;
			thPos.z = -pos.z;
			return thPos;//new THREE.Vector3(pos.x, pos.y, -pos.z)//pos//new TH.Position(pos.x, pos.z, pos.y);
		} else {
			return null;
		}
	}
}

// // 调试球
const debugSphere = new THREE.Mesh(
	new THREE.SphereGeometry(0.1),
	new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.three.scene.add(debugSphere);

window.addEventListener('mousemove', () => {
	const point = getPointOnRotatedPlane(TH.MouseInput, scene.three.camera, new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
	if (point) {
		debugSphere.position.set(point.x, point.y, -point.z); // 点击哪里，小红球就跳到哪里
	}
});