import * as TH from "./module_all.js"
import * as THREE from "three";
import * as PIXI from "../libs/pixi/dist/pixi.mjs";

import Stats from "three/addons/libs/stats.module.js";

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


globalThis.game = new Game();

globalThis.debug = {};

game.scene.$debug()
// document.getElementById("game").append(game.scene.domElement);
document.getElementById("game").append(game.domElement)


debug.main = new TH.GameSplicingMap("th:map=main");
await debug.main.init()

debug.seb = new TH.GameSplicingMap("th:map=seb")
await debug.seb.init()

debug.main.$debug()
game.scene.addGameMap(debug.main)
game.scene.addGameMap(debug.seb)
// game.scene.switchToGameMap("th:map=seb")


await TH.TextureLoader.load("th:texture=characters")
await TH.TextureLoader.load("th:texture=entity/reimu")
await TH.TextureLoader.load("th:texture=bullet/小玉")
await TH.EntityManager.registerEntity("th:entity=bullet/ball");
await TH.EntityManager.registerEntity("th:entity=character/reimu");
await TH.TextureLoader.load("th:texture=entity/fairy")
await TH.EntityManager.registerEntity("th:entity=enemy/fairy");

let entity = game.scene.currentMap.entityManager.createEntity("th:entity=character/reimu")//new TH.Entity("th:entity=character/reimu")
// // entity.three.mesh = model;
// // model.scale.set(0.4, 0.4, 0.4)
debug.entity = entity;

let e2 = game.scene.currentMap.entityManager.createEntity("th:entity=enemy/fairy")
game.scene.currentMap.addEntity(entity)
game.scene.currentMap.addObject(e2)

TH.KeyboardInput.onKey("q", () => {
	game.scene.switchToGameMap(debug.main === game.scene.currentMap ? debug.seb : debug.main)
})


game.addTickCallback(() => {	
	// ctrl.update();
	statsTps.update();
	
	const point = TH.MouseInput.inMapPosition(game.scene.currentCamera, debug.main.three.ground);
	if (point) {
		debugSphere.position.set(point.x, point.y, -point.z); // 点击哪里，小红球就跳到哪里
	}
	debugdiv.innerHTML = `player x: ${entity.position.x}, y: ${entity.position.y}, z: ${entity.position.z}
</br>player hp: ${entity.getComponentValue("th:hp")}
</br>entity count: ${game.scene.currentMap.entityManager.getAllEntities().length}
</br>frame: ${game.scene.currentMap.frame}
</br>renderDelta: ${game.RenderSystem.renderDelta.toFixed(3)}s
</br>mouse screen pos:  ${TH.MouseInput.x}, ${TH.MouseInput.y}
</br>mouse map pos: ${TH.MouseInput.inMapPosition(game.scene.currentCamera, debug.main.three.ground).toArray().map(v => v.toFixed(4)).join()}
`;
})

game.addRenderCallback(() => {
	statsFps.update();
})

TH.KeyboardInput.onKey(" ", (e) => {
	entity.faceTo(TH.MouseInput.inMapPosition(game.scene.currentCamera, debug.main.three.ground));
	entity.step(5)
})

TH.KeyboardInput.onKey("r", () => {
	game.scene.removeGameMap(debug.main)
})


TH.KeyboardInput.onKey("z", () => {
	console.log("z pressed")
	entity.getComponent("th:hp").value -= 1;
})

TH.MouseInput.onWheel((wheel) => {
	if (game.scene.three.camera === game.scene.currentCamera) TH.Config["camera_distance"] += wheel.y * 0.01;
})

// // 调试球
const debugSphere = new THREE.Mesh(
	new THREE.SphereGeometry(0.1),
	new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
game.scene.three.scene.add(debugSphere);

game.startTick();

game.startRender();

// const scene = game.scene.three.scene;
// const renderer = game.scene.three.renderer;

// // 平面
// const plane = new THREE.Mesh(
// 	new THREE.PlaneGeometry(10, 10),
// 	new THREE.MeshBasicMaterial({
// 		color: 0xffffff,
// 		side: THREE.DoubleSide,
// 		wireframe: true
// 	})
// );

// scene.add(plane);

// // Raycaster
// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

// // 点击事件
// renderer.domElement.addEventListener("pointerdown", (event) => {

// 	const rect = renderer.domElement.getBoundingClientRect();

// 	// 屏幕坐标 -> NDC
// 	mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
// 	mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

// 	// 发射射线
// 	raycaster.setFromCamera(mouse, game.scene.currentCamera);

// 	// 检测平面
// 	const intersects = raycaster.intersectObject(plane);

// 	if (intersects.length === 0) return;

// 	const hit = intersects[0];

// 	// 创建小球
// 	const sphere = new THREE.Mesh(
// 		new THREE.SphereGeometry(0.15, 16, 16),
// 		new THREE.MeshBasicMaterial({
// 			color: 0xff0000
// 		})
// 	);

// 	// 放到点击位置
// 	sphere.position.copy(hit.point);

// 	// 加入场景
// 	scene.add(sphere);

// 	console.log("uv:", hit.uv);
// });
