import * as THREE from 'three';
import { System } from '../ecs/System.js';
import { Config } from '../core/Config.js';
import type { SystemUpdateContext } from '../core/types.js';

/**
 * 玩家操控系统 —— WASD 移动 + 鼠标射击 + 相机跟随
 *
 * 迁移自 code/entity_system/player_controls_system.js
 */
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

    const entityList = [...entities] as unknown as Array<{
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number };
      moveBy: (x: number, y: number, z: number) => void;
      getComponentValue: (type: string) => number | null;
      faceTo: (target: { x: number; y: number; z: number }) => void;
      step: (dis?: number) => void;
    }>;

    for (const entity of entityList) {
      const speed = entity.getComponentValue('th:speed') || 0;
      const dx = (d ? 1 : 0) - (a ? 1 : 0);
      const dz = (w ? 1 : 0) - (s ? 1 : 0);
      entity.moveBy(dx * speed, 0, dz * speed);

      if (input.keyboard.key(' ').down) {
        const mousePos = input.mouse.positionInMap(
          game.scene.camera,
          world,
        );
        if (mousePos) {
          entity.faceTo({ x: mousePos.x, y: mousePos.y, z: -mousePos.z });
          // entity.step(5);
          game.TickSystem.registerCallback(15, () => {
            entity.step(0.3)
          })
        }
      }

      if (input.pointer.isDown/*input.mouse.leftButton*/) {
        const mousePos = input.mouse.positionInMap(
          game.scene.camera,
          world,
        );
        if (mousePos) {
          const wm = world as {
            entityManager: { createEntity: (thid: string, params: Record<string, unknown>) => unknown };
            addObject: (obj: unknown) => void;
            frame: number;
          };
          const bullet = wm.entityManager.createEntity('th:entity=bullet/ball', {
            position: entity.position,
            rotation: new THREE.Vector2(1, 0),
            frame: wm.frame,
          });
          (bullet as { faceTo: (target: { x: number; y: number; z: number }) => void }).faceTo({
            x: mousePos.x,
            y: mousePos.y,
            z: -mousePos.z,
          });
          wm.addObject(bullet);
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
