import * as THREE from 'three';

/**
 * 鼠标输入状态容器（纯状态 + 射线检测，无 DOM 副作用）
 *
 * 由 InputStack 驱动更新，业务层不应直接使用。
 * 业务层应使用 InputLayer API。
 */

export interface WheelState {
  x: number;
  y: number;
  z: number;
}

export const MouseInput = {
  canvas: null as HTMLCanvasElement | null,

  // ─── 按钮状态 ────────────────────────────────
  left: false,
  right: false,
  middle: false,

  // ─── 滚轮 ────────────────────────────────────
  wheel: { x: 0, y: 0, z: 0 } as WheelState,

  // ─── 坐标 ────────────────────────────────────
  x: 0,
  y: 0,
  movement: { x: 0, y: 0 },

  _lastPosition: { x: 0, y: 0 },

  /** 绑定 canvas（用于坐标换算） */
  bind(canvas: HTMLCanvasElement | string): void {
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas) as HTMLCanvasElement;
    }
    this.canvas = canvas;
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
      this._intersectionPoint.set(pos.x, pos.y, pos.z);
      return this._intersectionPoint;
    }
    return null;
  },

  // ─── 由 InputStack 调用的内部方法 ──────────────

  _onMouseDown(event: MouseEvent): void {
    switch (event.button) {
      case 0: this.left = true; break;
      case 1: this.middle = true; break;
      case 2: this.right = true; break;
    }
  },

  _onMouseUp(event: MouseEvent): void {
    switch (event.button) {
      case 0: this.left = false; break;
      case 1: this.middle = false; break;
      case 2: this.right = false; break;
    }
  },

  _onWheel(event: WheelEvent): void {
    this.wheel.x = event.deltaX;
    this.wheel.y = event.deltaY;
    this.wheel.z = event.deltaZ;
  },

  _onMouseMove(event: MouseEvent): void {
    const rect = this.canvas?.getBoundingClientRect() || {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;

    this.movement.x = x - this._lastPosition.x;
    this.movement.y = y - this._lastPosition.y;

    this._lastPosition.x = x;
    this._lastPosition.y = y;
    this.x = x;
    this.y = y;
  },
};
