/**
 * 游戏启动入口（Vite dev 模式）
 *
 * 迁移自 code/index.js 的完整初始化逻辑。
 */
import * as TH from './index.js';
import * as THREE from 'three';
import * as PIXI from "pixi.js";
import { InputLayer } from './input/InputLayer.js';

// ─── 窗口配置 ───────────────────────────────────

const RUN_PATH = ''; // Vite dev 下根路径为空
const STAGE_ASPECT = 16 / 9;
const maxWidth = window.innerWidth;
const maxHeight = window.innerHeight;
let stageWidth: number, stageHeight: number;

if (maxWidth / maxHeight > STAGE_ASPECT) {
	stageHeight = maxHeight;
	stageWidth = maxHeight * STAGE_ASPECT;
} else {
	stageWidth = maxWidth;
	stageHeight = maxWidth / STAGE_ASPECT;
}

// ─── 创建游戏实例 ──────────────────────────────

const game = new TH.Game({
	width: stageWidth,
	height: stageHeight,
	runPath: RUN_PATH,
});


document.getElementById('game')!.append(game.domElement);


// ─── Debug 辅助 ──────────────────────────────────

const debugDiv = document.getElementById('debug')!;

// ─── 鼠标滚轮调整相机距离 ─────────────────────

let debugInput = new InputLayer("main-debug")
game.InputStack.push(debugInput)

debugInput.mouse.onWheel((wheel) => {
	if (game.scene.currentMap?.camera === game.scene.camera) {
		TH.Config.camera_distance += wheel.y * 0.01;
	}
});

// ─── 主初始化流程 ──────────────────────────────

async function init() {
	await game.init();
	// 1. 启用 debug 模式（Grid + OrbitControls）
	await game.$debug({
		console: true,
		fpsAndTps: true,
		scene: true
	});

	// 2. 加载地图
	const mainMap = new TH.GameSplicingMap('th:map=main');
	const sebMap = new TH.GameSplicingMap('th:map=seb');

	await mainMap.init();
	await sebMap.init();

	game.scene.addGameMap(mainMap);
	game.scene.addGameMap(sebMap);

	// 3. 加载纹理
	await TH.TextureLoader.load('th:texture=entity/reimu');
	await TH.TextureLoader.load('th:texture=bullet/小玉');
	await TH.TextureLoader.load('th:texture=entity/fairy');

	// 4. 注册实体定义
	await TH.Entity.register('th:entity=bullet/ball');
	await TH.Entity.register('th:entity=character/reimu');
	await TH.Entity.register('th:entity=enemy/fairy');

	// 5. 创建玩家实体
	const entity = game.scene.currentMap!.entityManager.createEntity(
		'th:entity=character/reimu',
	);
	game.scene.currentMap!.addEntity(entity);

	// 6. 创建敌人实体
	const enemy = game.scene.currentMap!.entityManager.createEntity(
		'th:entity=enemy/fairy',
	);
	mainMap.addObject(enemy);

	enemy.position.set(4, 0, 4);

	let tex = await (TH.TextureLoader.get("th:texture=entity/reimu"));

	let uiLayer = new TH.UILayer(game.ui.pixi.app.stage);
	uiLayer.display();
	let icon = new PIXI.Sprite(tex!.toPIXI(
		game.scene.three.renderer,
		game.ui.pixi.app.renderer,
	));
	icon.scale.set(3);

	// console.log(icon);

	uiLayer.pixi.group.addChild(
		icon
	)

	// 7. 调试球（红色小球跟随鼠标）
	const debugSphere = new THREE.Mesh(
		new THREE.SphereGeometry(0.1),
		new THREE.MeshBasicMaterial({ color: 0xff0000 }),
	);
	game.scene.three.scene.add(debugSphere);

	// 8. Q 键切换地图
	debugInput.keyboard.onKey('q', (k) => {
		if (k.down)
			game.scene.switchToGameMap(
				mainMap === game.scene.currentMap ? sebMap : mainMap,
			);		
	});

	// 9. Z 键扣血
	debugInput.keyboard.onKey('z', (k) => {
		if (k.down) return;
		entity.addComponent(TH.Component.create("th:damage", {
			value: 1
		}))
		if (!entity.isAlive) debugger;
		console.log('z pressed - hp:');
	});

	// 10. R 键移除地图
	debugInput.keyboard.onKey('r', () => {
		if (mainMap !== game.scene.currentMap) {
			game.scene.removeGameMap(mainMap);
			mainMap.destory();
		}
	});

	// game.ui.pixi.app.renderer.removeAllListeners();
	
	debugInput.pointer.on("pointerdown", (w) => {
		if (!w) return;
		const clonedEvent = new PointerEvent(w.type, w);

		// 2. 把复印件分发给 Pixi 喵
		const isSuccess = game.ui.pixi.app.renderer.events.domElement.dispatchEvent(clonedEvent);

		// console.log(w, isSuccess);
	})

	// 11. Tick 回调：更新 debug 信息
	game.addTickCallback(() => {
		const point = TH.MouseInput.inMapPosition(
			game.scene.camera,
			game.scene.currentMap || mainMap,
		);
		if (point) {
			debugSphere.position.set(point.x, point.y, point.z);
		}

		const pos = entity.position;
		debugDiv.innerHTML = [
			`player x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`,
			`player hp: ${entity.getComponent('th:hp')?.data?.hp || 0}`,
			`entity count: ${game.scene.currentMap!.entityManager.getAllEntities().length}`,
			`frame: ${game.scene.currentMap!.frame}`,
			`renderDelta: ${game.RenderSystem.renderDelta.toFixed(3)}s`,
			`mouse screen: ${TH.MouseInput.x}, ${TH.MouseInput.y}`,
		].join('<br>');
	});

	// 13. 启动
	game.run();
	console.log('☯️ 东方幻梦裂隙 ~Touhou Rift of Phantasmal Dreams~');
}

init().catch(console.error);
