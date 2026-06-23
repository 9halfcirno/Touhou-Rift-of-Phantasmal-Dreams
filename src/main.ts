/**
 * 游戏启动入口（Vite dev 模式）
 *
 * 迁移自 code/index.js 的完整初始化逻辑。
 */
import * as TH from './index.js';
import * as THREE from 'three';
import * as PIXI from "pixi.js";
import { InputLayer } from './input/InputLayer.js';
import { Button } from '@pixi/ui';

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
let uiInput = new InputLayer("ui-debug", {
	modal: true,
	blockKey: "all"
});
game.InputStack.push(debugInput)

debugInput.mouse.onWheel((wheel) => {
	if (game.scene.currentMap?.camera === game.scene.camera) {
		TH.Config.camera_distance += wheel.deltaY * 0.01;
	}
});

// ─── 主初始化流程 ──────────────────────────────

async function init() {
	await game.init();
	// 1. 启用 debug 模式（Grid + OrbitControls）
	await game.$debug({
		console: true,
		// fpsAndTps: true,
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
	await TH.TextureLoader.load('th:texture=entity.reimu');
	await TH.TextureLoader.load('th:texture=bullet.小玉');
	await TH.TextureLoader.load('th:texture=entity.fairy');
	await TH.TextureLoader.load('th:texture=reimu');

	// 4. 注册实体定义
	await TH.Entity.register('th:entity=bullet.ball');
	await TH.Entity.register('th:entity=character.reimu');
	await TH.Entity.register('th:entity=enemy.fairy');

	// 5. 创建玩家实体
	const entity = game.scene.currentMap!.entityManager.createEntity(
		'th:entity=character.reimu',
	);
	game.scene.currentMap!.addEntity(entity);

	// 6. 创建敌人实体
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			const enemy = game.scene.currentMap!.entityManager.createEntity(
				'th:entity=enemy.fairy',
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
	debugUpdates.push(game.$addDebugItem("Render", () => {
		let str = `delta ${game.RenderSystem.renderDelta.toFixed(3)}s - fps ${game.RenderSystem.fps}`
		return str;
	}));
	debugUpdates.push(game.$addDebugItem("Tps", () => {
		return game.TickSystem.tps;
	}))
	debugUpdates.push(game.$addDebugItem("mouse screen", () => {
		return `${game.InputStack.bottom.mouse.x}, ${game.InputStack.bottom.mouse.y}`;
	}));
	debugUpdates.push(game.$addDebugItem("UIStack", () => {
		const top = game.UIStack.top;
		if (top) {
			return `${game.UIStack.layerCount} 层 | 栈顶: ${top.name}`;
		}
		return `${game.UIStack.layerCount} 层 | 栈顶: 无`;
	}));
	debugUpdates.push(game.$addDebugItem("InputStack", () => {
		const top = game.InputStack.top;
		if (top) {
			return `${game.InputStack.layerCount} 层 | 栈顶: ${top.name}`;
		}
		return `${game.InputStack.layerCount} 层 | 栈顶: 无`;
	}));

	// ─── HUD 层 ─────────────────────────────────────
	let tex = await (TH.TextureLoader.get("th:texture=entity/reimu"));

	// ─── HUD 层（非 modal，输入可穿透到下层）─────────────────
	const hudLayer = new TH.UILayer(game.ui.pixi.app.stage, 'hud', {
		input: { modal: false },
		layout: {
			backgroundColor: 0xffffff,
			borderRadius: 8,
			alignItems: "center"
		}
	});
	game.UIStack.push(hudLayer);
	let icon = new PIXI.Sprite(tex!.toPIXI());
	// icon.scale.set(3);
	icon.layout = {
		width: 20,
		height: 20
	}

	// hudLayer.add(icon);

	let btn = new Button(icon);
	hudLayer.add(btn.view!);
	btn.onPress.connect(() => {
		console.log("icon pressed!");

	})


	const container = new PIXI.Container({
		layout: {
			position: "relative",
			width: "100%",
			height: "60%",
			justifyContent: 'center',
			flexDirection: 'row',
			alignContent: 'center',
			flexWrap: 'wrap',
			gap: 4,
		},
	});

	hudLayer.add(container);

	// 7. 调试球（红色小球跟随鼠标）
	const debugSphere = new THREE.Mesh(
		new THREE.SphereGeometry(0.1),
		new THREE.MeshBasicMaterial({ color: 0xff0000 }),
	);
	game.scene.three.scene.add(debugSphere);

	// 8. Q 键切换地图
	debugInput.keyboard.onKey('q', (k) => {
		if (k.down) {
			game.scene.switchToGameMap(
				mainMap === game.scene.currentMap ? sebMap : mainMap,
			);
			game.scene.currentMap?.addEntity(entity)
		}
	});

	// 9. Z 键扣血
	debugInput.keyboard.onKey('z', (k) => {
		entity.addComponent(TH.Component.create("th:damage", {
			value: 1
		}))
		console.log('z pressed - hp:');
	});

	// 10. R 键移除地图
	debugInput.keyboard.onKey('r', () => {
		if (mainMap !== game.scene.currentMap) {
			game.scene.removeGameMap(mainMap);
			mainMap.destory();
		}
	});

	debugInput.keyboard.onKey("t", () => {
		entity.addComponent(TH.Component.create("th:display", {
			texture: "th:texture=bullet.小玉"
		}));
	})

	// game.ui.pixi.app.renderer.removeAllListeners();

	debugInput.keyboard.onKey("1", (k) => {
		if (k.down)
			game.InputStack.push(uiInput);
	})

	// debugInput.keyboard.onKey("all", (k) => {
	// 	game.storage.write(`key.${k.name}`, Date.now().toString())
	// })

	uiInput.keyboard.onKey("2", (k) => {
		if (k.down)
			game.InputStack.pop();
	})

	

	game.setting.onChange("display.resolution", (c) => {
		game.scene.renderer.resolution = c.value as number;
	})


	// 11. Tick 回调：更新 debug 信息
	game.afterTick(() => {
		const point = game.InputStack.bottom.mouse.positionInMap(game.scene.camera, mainMap)
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
