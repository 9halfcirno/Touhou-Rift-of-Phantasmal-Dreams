import * as THREE from 'three';

/**
 * Three.js 对象管理器
 *
 * 维护 Map<uuid, Object3D>，将对象加入/移出 THREE.Group。
 * 迁移自 code/managers/three_manager.js
 */
export class THREEManager {
  /** uuid → Object3D */
  private _objects = new Map<string, THREE.Object3D>();

  /** 所有被管理对象的父级 Group */
  readonly three: { group: THREE.Group };

  constructor() {
    this.three = { group: new THREE.Group() };
    this.three.group.castShadow = true;
    this.three.group.receiveShadow = true;
  }

  add(obj: THREE.Object3D): void {
    this._objects.set(obj.uuid, obj);
    this.three.group.add(obj);
  }

  remove(obj: THREE.Object3D): void {
    this._objects.delete(obj.uuid);
    this.three.group.remove(obj);
  }

  clear(): void {
    this._objects.clear();
    this.three.group.clear();
  }
}
