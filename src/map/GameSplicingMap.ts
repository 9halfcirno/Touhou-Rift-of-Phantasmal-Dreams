import * as THREE from 'three';
import { GameMap } from './GameMap.js';
import { TextureLoader } from '../graphics/TextureLoader.js';
import { Texture } from '../graphics/Texture.js';

/**
 * 拼接地图（由多块纹理块拼接而成）
 */
export class GameSplicingMap extends GameMap {
  constructor(id: string) {
    super(id);
    const floor = new THREE.Group();
    floor.name = `GameMap_${id}_floor`;
    (this.three as unknown as Record<string, THREE.Group>).floor = floor;
    this.three.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.three.group?.add(floor);
  }

  override async init(): Promise<void> {
    await super.init();
    await this._createMap();
  }

  private async _createMap(): Promise<void> {
    const data = this.definition;
    if (!data || data.type !== 'splicing') {
      throw new Error('GameSplicingMap 数据必须为 "splicing" 类型');
    }

    const floor = (this.three as unknown as Record<string, THREE.Group>).floor;

    for (const block of data.data) {
      const geo = new THREE.PlaneGeometry(block.size[0], block.size[1]);
      const mat = new THREE.MeshLambertMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.5,
      });

      const result = TextureLoader.get(block.texture, { async: true });
      const tex = result instanceof Promise ? await result : result;
      if (tex instanceof Texture) {
        mat.map = tex.three.texture;
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;

      const [x, y] = block.position;
      mesh.position.set(x + block.size[0] / 2, y + block.size[1] / 2, 0);
      floor.add(mesh);
    }
  }
}
