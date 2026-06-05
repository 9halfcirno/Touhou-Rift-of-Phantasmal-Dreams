/**
 * 桶导出 —— 替代原 code/module_all.js
 *
 * 当前（第三阶段）已完成全引擎迁移。
 * 命名空间 "th" 保留为游戏主命名空间。
 */

// ─── 核心引擎 ───────────────────────────────────
export { Game } from './core/Game.js';
export { GameScene } from './core/GameScene.js';
export { Config } from './core/Config.js';
export { TickSystem } from './core/TickSystem.js';
export { RenderSystem } from './core/RenderSystem.js';
export { Ticker } from './core/Ticker.js';
export type { GameConfigData } from './core/Config.js';

// ─── 类型 ───────────────────────────────────────
export type {
  ParsedTHID,
  ComponentType,
  ComponentTypeMap,
  HitboxData,
  HitboxCircle,
  HitboxBox,
  HealthData,
  EntityDefinition,
  GameMapDefinition,
  SplicingBlock,
  RuntimeConfig,
  SystemUpdateContext,
  CollisionResult,
  CollisionShape,
} from './core/types.js';

// ─── 资源 ───────────────────────────────────────
export { THID } from './resources/THID.js';
export { Texture } from './graphics/Texture.js';
export { TextureLoader, setRunPath } from './graphics/TextureLoader.js';

// ─── 工具 ───────────────────────────────────────
export { util } from './utils/utils.js';

// ─── 数学 ───────────────────────────────────────
export { Position, Vector2, Vector3 } from './math/Position.js';
export { SAT } from './math/SAT.js';
export type { SATResult, Shape } from './math/SAT.js';

// ─── 管理器 ─────────────────────────────────────
export { THREEManager } from './managers/THREEManager.js';

// ─── 游戏对象 ─────────────────────────────────
export { GameObject, GameObject2D, GameCamera } from './objects/index.js';

// ─── ECS 框架 ─────────────────────────────────
export {
  Component,
  System,
  Entity,
  EntityQuery,
  EntityManager,
  SystemManager,
} from './ecs/index.js';

// ─── 组件 ───────────────────────────────────────
export {
  HealthyComponent,
  SpeedComponent,
  HitboxComponent,
  MaxLifeTimeComponent,
  FamilyComponent,
  PlayerControlsComponent,
} from './components/index.js';

// ─── 系统 ───────────────────────────────────────
export {
  MovementSystem,
  BulletMovementSystem,
  MaxLifeTimeSystem,
  HealthySystem,
  CollisionSystem,
  PlayerControlsSystem,
} from './systems/index.js';

// ─── 地图 ───────────────────────────────────────
export { GameMap, GameSplicingMap } from './map/index.js';

// ─── 输入 ───────────────────────────────────────
export { KeyboardInput, MouseInput } from './input/index.js';

// ─── 副作用注册 ──────────────────────────────
import './components/index.js';
import './systems/index.js';
