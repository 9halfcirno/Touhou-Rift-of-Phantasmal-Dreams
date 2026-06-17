/**
 * 桶导出
 *
 * 命名空间 "th" 保留为游戏主命名空间。
 */
// --- 前置库 -----------------------------------
import '@pixi/layout';
import '@pixi/layout/devtools'

// ─── 核心引擎 ───────────────────────────────────
export { Game } from './core/Game.js';
export { GameScene } from './core/GameScene.js';
export { Config } from './core/Config.js';
export { TickSystem } from './core/TickSystem.js';
export { RenderSystem } from './core/RenderSystem.js';
export type { GameConfigData } from './core/Config.js';

// ─── 类型 ───────────────────────────────────────
export type {
  ParsedTHID,
  ComponentType,
  ComponentTypeMap,
  EntityDefinition,
  GameMapDefinition,
  SplicingBlock,
  RuntimeConfig,
  SystemUpdateContext,
  CollisionResult,
  CollisionShape,
} from './core/types.js';
export type {
  HitboxData,
  HitboxCircle,
  HitboxBox,
} from './components/HitboxComponent.js';
export type { HealthData } from './components/HealthyComponent.js';

// ─── 资源 ───────────────────────────────────────
export { THID } from './resources/THID.js';
export { Texture } from './graphics/Texture.js';
export { TextureLoader, setRunPath } from './graphics/TextureLoader.js';

// ─── 工具 ───────────────────────────────────────
export { uuid } from './utils/uuid.ts';

// ─── 数学 ───────────────────────────────────────
export { Position, Vector2, Vector3 } from './math/Position.js';
export { SAT } from './math/SAT.js';
export type { SATResult, Shape } from './math/SAT.js';

// ─── 管理器 ─────────────────────────────────────
export { THREEManager } from './managers/THREEManager.js';

// ─── 游戏对象 ─────────────────────────────────
export { GameObject, GameObject2D, GameCamera } from './objects/index.js';

// --- UI相关 ---------------------------------
export {
  UILayer,
  UIStack,
 } from "./ui/index.js"

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
  BulletComponent,
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
export { KeyboardInput, MouseInput, PointerInput, InputLayer } from './input/index.js';

// ─── 副作用注册 ──────────────────────────────
import './components/index.js';
import './systems/index.js';
