import * as THREE from 'three';
import { System } from '../ecs/System.js';
import { Config } from '../core/Config.js';
import type { SystemUpdateContext } from '../core/types.js';
import { Entity } from '@/ecs/Entity.js';

const SPRINT_COOLDOWN = new WeakMap<Entity, { time: number; }>();

// 已严肃打表确定方向
const DIR = {
	"": null,
	w: 0,
	wa: 1.75,
	ws: null,
	wd: 0.25,
	was: 1.5,
	wad: 0,
	wsd: 0.5,
	wasd: null,
	a: 1.5,
	as: 1.25,
	ad: null,
	asd: 1,
	s: 1,
	sd: 0.75,
	d: 0.5,
}

export class PlayerControlsSystem extends System {
	constructor() {
		super({
			name: 'PlayerControlsSystem',
			requireComponents: ['th:player_controls', 'th:speed'],
			priority: 1,
		});
	}

	override update(ctx: SystemUpdateContext): void {
		const { entities, game, world } = ctx;
		const input = game.InputStack.bottom;

		const w = input.keyboard.key('w').down;
		const a = input.keyboard.key('a').down;
		const s = input.keyboard.key('s').down;
		const d = input.keyboard.key('d').down;

		for (const entity of entities) {
			const speed = entity.getComponentValue('th:speed') || 0;

			let dir = DIR[`${w ? "w" : ""}${a ? "a" : ""}${s ? "s" : ""}${d ? "d" : ""}`];

			if (dir !== null) {
				entity.rotation.x = Math.PI * dir;
				entity.step(speed);
			};

			if (entity.hasComponent("th:sprint")) {
				let sprint = entity.getComponent("th:sprint");
				if (input.keyboard.key(' ').down) {

					if (!SPRINT_COOLDOWN.has(entity)
						|| game.TickSystem.frame - SPRINT_COOLDOWN.get(entity)!.time > sprint!.data.cooldown) {

						SPRINT_COOLDOWN.set(entity, { time: game.TickSystem.frame })
					}
				} else {
					if (SPRINT_COOLDOWN.has(entity)
						&& game.TickSystem.frame - SPRINT_COOLDOWN.get(entity)!.time <= sprint!.data.time) {
						let { x, y, z } = entity.movementVector;
						let sum = (x + y + z) || 1;
						let speed = sprint!.data.speed;
						entity.step(speed);
					}
				}
			}

			if (input.mouse.button("left").down) {
				const mousePos = input.mouse.positionInMap(
					game.scene.camera,
					world,
				);
				if (mousePos) {
					const bullet = world.entityManager.createEntity('th:entity=bullet/ball', {
						position: entity.position,
						rotation: new THREE.Vector2(1, 0),
						frame: world.frame,
					});
					bullet.faceTo({
						x: mousePos.x,
						y: mousePos.y,
						z: -mousePos.z,
					});
					bullet.setComponent("th:bullet", {
						from: entity,
						damage: {
							value: 1,
							from: entity
						}
					})
					world.addObject(bullet);
				}
			}
		}

		// ─── 相机跟随 ─────────────────────────────
		const allEntities = [...entities] as unknown as Array<{
			position: { toTHREE: () => THREE.Vector3 };
		}>;
		const allPos = allEntities.map((e) => e.position.toTHREE());
		const pos = getCenterPosition(allPos).toArray();
		const tilt = Config.object2d_tilt;
		const cam = (world as { camera: { position: { x: number; y: number; z: number }; setPosition: (x: number, y: number, z: number) => void; three: { camera: THREE.PerspectiveCamera } } }).camera;
		const dis = Config.camera_distance + getCameraDistance(allPos, cam.three.camera, 1);

		const toPos = [
			pos[0]!,
			pos[2]! + Math.cos(tilt) * dis,
			-pos[1]! + Math.sin(tilt) * dis,
		];

		const lerpFactor = Config.camera_follow_speed / 16;
		const current = [cam.position.x, cam.position.y, cam.position.z];

		cam.setPosition(
			current[0]! + (toPos[0] - current[0]!) * lerpFactor,
			current[1]! + (toPos[1] - current[1]!) * lerpFactor,
			current[2]! + (toPos[2] - current[2]!) * lerpFactor,
		);
		cam.three.camera.rotation.set(Config.object2d_tilt - Math.PI / 2, 0, 0);
	}
}

// ─── 辅助函数 ─────────────────────────────────────

function getCenterPosition(points: THREE.Vector3[], target = new THREE.Vector3()): THREE.Vector3 {
	target.set(0, 0, 0);
	if (points.length === 0) return target;
	for (const p of points) target.add(p);
	target.divideScalar(points.length);
	return target;
}

function getCameraDistance(
	points: THREE.Vector3[],
	camera: THREE.PerspectiveCamera,
	padding = 1.2,
): number {
	if (points.length === 0) return 0;

	const box = new THREE.Box3().setFromPoints(points);
	const size = new THREE.Vector3();
	box.getSize(size);

	const width = Math.max(size.x, 1);
	const height = Math.max(size.y, 1);
	const fov = THREE.MathUtils.degToRad(camera.fov);
	const aspect = camera.aspect;

	const distanceV = height / 2 / Math.tan(fov / 2);
	const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
	const distanceH = width / 2 / Math.tan(horizontalFov / 2);

	return Math.max(distanceV, distanceH) * padding;
}

System.register('th:system=player_controls_system', PlayerControlsSystem);
