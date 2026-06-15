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


// ─── 鼠标滚轮调整相机距离 ─────────────────────

let debugInput = new InputLayer("main-debug");
let uiInput = new InputLayer("ui-debug");
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
		scene: true,
		debugDiv: true
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
	await TH.TextureLoader.load('th:texture=reimu');

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
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			const enemy = game.scene.currentMap!.entityManager.createEntity(
				'th:entity=enemy/fairy',
			);
			mainMap.addObject(enemy);
			enemy.setPosition(i * 5, 0, j * 5);
			// enemy.setPosition(Math.random() * i + i * 0.2, 0, Math.random() * i + i * 0.2);
		}
	}

	// ─── Debug 条目（全部迁移到 game.$addDebugItem）─────────
	const debugUpdates: Array<() => void> = [];

	debugUpdates.push(game.$addDebugItem("player hp", () => {
		return entity.getComponent("th:hp")?.data.hp || 0;
	}));
	debugUpdates.push(game.$addDebugItem("player x", () => {
		return entity.position.x.toFixed(2);
	}));
	debugUpdates.push(game.$addDebugItem("player y", () => {
		return entity.position.y.toFixed(2);
	}));
	debugUpdates.push(game.$addDebugItem("player z", () => {
		return entity.position.z.toFixed(2);
	}));
	debugUpdates.push(game.$addDebugItem("entity count", () => {
		return game.scene.currentMap!.entityManager.getAllEntities().length;
	}));
	debugUpdates.push(game.$addDebugItem("frame", () => {
		return game.scene.currentMap!.frame;
	}));
	debugUpdates.push(game.$addDebugItem("renderDelta", () => {
		return game.RenderSystem.renderDelta.toFixed(3) + "s";
	}));
	debugUpdates.push(game.$addDebugItem("mouse screen", () => {
		return `${TH.MouseInput.x}, ${TH.MouseInput.y}`;
	}));
	debugUpdates.push(game.$addDebugItem("UIStack", () => {
		const top = game.UIStack.top;
		if (top) {
			return `${game.UIStack.layerCount} 层 | 栈顶: ${top.name}`;
		}
		return `${game.UIStack.layerCount} 层 | 栈顶: 无`;
	}));

	// ─── HUD 层 ─────────────────────────────────────
	let tex = await (TH.TextureLoader.get("th:texture=entity/reimu"));
	let reimuTex = await TH.TextureLoader.get("th:texture=reimu");

	// ─── HUD 层（非 modal，输入可穿透到下层）─────────────────
	const hudLayer = new TH.UILayer(game.ui.pixi.app.stage, 'hud', { input: { modal: false } });
	game.UIStack.push(hudLayer);
	let icon = new TH.UIImage(tex!.toPIXI());
	// icon.scale.set(3);

	hudLayer.add(icon);

	let reimu = new PIXI.Sprite(reimuTex!.toPIXI());
	reimu.position.set(hudLayer.pixi.group.width, 200)
	reimu.anchor.set(1, 1);
	hudLayer.add(reimu);

	// icon.on("pointerdown", (e) => {
	// 	console.log("icon clicked!");
	// })
	// icon.eventMode = "static";	

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

	debugInput.keyboard.onKey("1", (k) => {
		if (k.down)
			game.InputStack.push(uiInput);
	})

	uiInput.keyboard.onKey("2", (k, e) => {
		if (k.down)
			game.InputStack.pop();
	})

	uiInput.pointer.on("pointerdown", (w) => {
		if (!w) return;
		const clonedEvent = new PointerEvent(w.type, w);

		// 2. 把复印件分发给 Pixi 喵
		const isSuccess = game.ui.pixi.app.renderer.events.domElement.dispatchEvent(clonedEvent);

		// console.log(w, isSuccess);
	})

	// ─── UIStack 测试例 ──────────────────────────

	// 弹窗层（默认 modal，阻断下层输入，但不隐藏下层 UI）
	const popupLayer = new TH.UILayer(undefined, 'popup');
	const popupBg = new PIXI.Graphics();
	popupBg.rect(0, 0, 500, 120).fill({ color: 0x000000, alpha: 0.5 });
	popupLayer.add(popupBg);

	const popupText = new PIXI.Text({
		text: '弹窗层 (modal)\n3: 关闭弹窗  1: push InputLayer  2: pop InputLayer',
		style: { fill: 0xffffff, fontSize: 22 },
	});
	popupText.x = 20;
	popupText.y = 20;
	popupLayer.add(popupText);

	// 3: push 弹窗 → UIStack 栈顶，输入被阻断
	debugInput.keyboard.onKey('3', (k) => {
		if (k.down) game.UIStack.push(popupLayer);
	});

	// 4: pop 弹窗 → 下层（HUD / debugInput）恢复输入
	popupLayer.input.keyboard.onKey('4', (k) => {
		if (k.down) game.UIStack.pop();
	});

	// 11. Tick 回调：更新 debug 信息
	game.afterTick(() => {
		const point = TH.MouseInput.inMapPosition(
			game.scene.camera,
			game.scene.currentMap || mainMap,
		);
		if (point) {
			debugSphere.position.set(point.x, point.y, point.z);
		}
		for (const update of debugUpdates) {
			update();
		}
	});

	// 13. 启动
	game.run();
	console.log('☯️ 东方幻梦裂隙 ~Touhou Rift of Phantasmal Dreams~');
}

init().catch(console.error);
