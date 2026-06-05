import * as THREE from 'three';
import type { Position } from '../math/Position.js';

/**
 * 鼠标输入管理器（单例）
 *
 * 维护按钮状态、坐标、滚轮回调、射线检测。
 * 迁移自 code/inputs/mouse.js
 */

interface WheelState {
  x: number;
  y: number;
  z: number;
}

type WheelCallback = (wheel: WheelState) => void;

export const MouseInput = {
  canvas: null as HTMLCanvasElement | null,

  left: false,
  right: false,
  middle: false,

  wheel: { x: 0, y: 0, z: 0 } as WheelState,

  movement: { x: 0, y: 0, z: 0 },

  _lastPosition: { x: 0, y: 0 },

  x: 0,
  y: 0,

  _wheelCallbacks: [] as WheelCallback[],
  _buttonCallbacks: new Map<string, Array<(event: MouseEvent) => void>>(),

  /** 绑定 canvas（用于坐标换算） */
  bind(canvas: HTMLCanvasElement | string): void {
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas) as HTMLCanvasElement;
    }
    this.canvas = canvas;
  },

  // ─── 滚轮 ────────────────────────────────────

  onWheel(cb: WheelCallback): void {
    this._wheelCallbacks.push(cb);
  },

  offWheel(cb: WheelCallback): void {
    const index = this._wheelCallbacks.indexOf(cb);
    if (index !== -1) {
      this._wheelCallbacks.splice(index, 1);
    }
  },

  // ─── 按钮 ────────────────────────────────────

  onButton(button: string, cb: (event: MouseEvent) => void): void {
    if (!this._buttonCallbacks.has(button)) {
      this._buttonCallbacks.set(button, []);
    }
    this._buttonCallbacks.get(button)!.push(cb);
  },

  offButton(button: string, cb: (event: MouseEvent) => void): void {
    const arr = this._buttonCallbacks.get(button);
    if (!arr) return;
    const index = arr.indexOf(cb);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  },

  // ─── 射线检测 ────────────────────────────────

  _raycaster: new THREE.Raycaster(),
  _intersectionPoint: new THREE.Vector3(),
  _mouse: new THREE.Vector2(),

  /**
   * 计算鼠标在地图平面上的投影位置
   */
  inMapPosition(
    camera: THREE.PerspectiveCamera,
    plane: THREE.Plane | THREE.Mesh,
  ): THREE.Vector3 | null {
    const rect = this.canvas?.getBoundingClientRect() || {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this._mouse.x = (this.x / rect.width) * 2 - 1;
    this._mouse.y = -(this.y / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, camera);

    // Mesh 检测
    if (plane instanceof THREE.Mesh) {
      const intersects = this._raycaster.intersectObject(plane);
      return intersects.length > 0 ? intersects[0]!.point : null;
    }

    // Plane 检测
    const pos = this._raycaster.ray.intersectPlane(plane, this._intersectionPoint);
    if (pos) {
      // 匹配原始行为：Z 取反（GameCamera 坐标系的 quirks）
      this._intersectionPoint.set(pos.x, pos.y, pos.z);
      return this._intersectionPoint;
    }
    return null;
  },
};

// ─── 全局事件绑定 ────────────────────────────────

window.addEventListener('mousedown', (event) => {
  switch (event.button) {
    case 0:
      MouseInput.left = true;
      MouseInput._buttonCallbacks.get('leftDown')?.forEach((cb) => cb(event));
      break;
    case 1:
      MouseInput.middle = true;
      break;
    case 2:
      MouseInput.right = true;
      MouseInput._buttonCallbacks.get('rightDown')?.forEach((cb) => cb(event));
      break;
  }
});

window.addEventListener('mouseup', (event) => {
  switch (event.button) {
    case 0:
      MouseInput.left = false;
      MouseInput._buttonCallbacks.get('leftUp')?.forEach((cb) => cb(event));
      break;
    case 1:
      MouseInput.middle = false;
      break;
    case 2:
      MouseInput.right = false;
      MouseInput._buttonCallbacks.get('rightUp')?.forEach((cb) => cb(event));
      break;
  }
});

window.addEventListener('wheel', (event) => {
  MouseInput.wheel.x = event.deltaX;
  MouseInput.wheel.y = event.deltaY;
  MouseInput.wheel.z = event.deltaZ;
  MouseInput._wheelCallbacks.forEach((cb) => cb(MouseInput.wheel));
});

window.addEventListener('mousemove', (event) => {
  const rect = MouseInput.canvas?.getBoundingClientRect() || {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const x = event.clientX - rect.x;
  const y = event.clientY - rect.y;

  MouseInput.movement.x = x - MouseInput._lastPosition.x;
  MouseInput.movement.y = y - MouseInput._lastPosition.y;

  MouseInput._lastPosition.x = x;
  MouseInput._lastPosition.y = y;
  MouseInput.x = x;
  MouseInput.y = y;
});
